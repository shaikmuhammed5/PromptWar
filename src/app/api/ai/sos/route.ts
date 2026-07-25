import { generateTextStream } from "@/lib/ai/gemini";
import { SOS_SYSTEM, sosPrompt } from "@/lib/ai/prompts";
import { aiErrorBody, aiErrorStatus } from "@/lib/api";
import { allowRequest, clientKey } from "@/lib/rate-limit";
import { sosRequestSchema } from "@/lib/schemas";

export const runtime = "nodejs";

/**
 * Streams the de-escalation script as plain text. Streaming is the point: the
 * first grounding step reaches a person mid-craving in about a second instead
 * of after the whole script is generated.
 */
export async function POST(request: Request): Promise<Response> {
  if (!allowRequest(clientKey(request))) {
    return Response.json({ error: "Too many requests." }, { status: 429 });
  }

  let input;
  try {
    input = sosRequestSchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const encoder = new TextEncoder();

  try {
    const tokens = generateTextStream({
      system: SOS_SYSTEM,
      prompt: sosPrompt(input.profile, input.cravingLevel, input.hour),
    });

    // Pull the first token before responding so an upstream failure still maps
    // to a real status code the client can fall back from.
    const first = await tokens.next();
    if (first.done) throw new Error("empty model stream");

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(encoder.encode(first.value));
        try {
          for await (const token of tokens) {
            controller.enqueue(encoder.encode(token));
          }
        } catch {
          controller.enqueue(
            encoder.encode("\n\n(The connection dropped. The steps above still hold.)"),
          );
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return Response.json(aiErrorBody(error), { status: aiErrorStatus(error) });
  }
}
