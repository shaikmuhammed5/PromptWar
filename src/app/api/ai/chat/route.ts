import { generateChatStream } from "@/lib/ai/gemini";
import { distractSystem, practiceSystem, talkSystem } from "@/lib/ai/prompts";
import { aiErrorBody, aiErrorStatus } from "@/lib/api";
import { stageFor } from "@/lib/chat-session";
import { allowRequest, clientKey } from "@/lib/rate-limit";
import { chatRequestSchema } from "@/lib/schemas";
import type { z } from "zod";

export const runtime = "nodejs";

type ChatInput = z.infer<typeof chatRequestSchema>;

/**
 * The stage is recomputed here rather than trusted from the client. It governs
 * the dependency guardrail, and a guardrail a caller can switch off is not one.
 */
function systemFor(input: ChatInput): string {
  const stage = stageFor(input.userTurns);

  if (input.mode === "practice") {
    return practiceSystem({
      profile: input.profile,
      scenario: input.scenario ?? "Someone offering, one on one",
      persona: input.persona ?? "An old friend who used with you",
      stage,
    });
  }
  if (input.mode === "distract") {
    return distractSystem({
      profile: input.profile,
      game: input.game ?? "Twenty questions",
      stage,
    });
  }
  return talkSystem(input.profile, stage);
}

/** Streaming multi-turn companion chat. */
export async function POST(request: Request): Promise<Response> {
  if (!allowRequest(clientKey(request))) {
    return Response.json({ error: "Too many requests." }, { status: 429 });
  }

  let input: ChatInput;
  try {
    input = chatRequestSchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const encoder = new TextEncoder();

  try {
    const tokens = generateChatStream({
      system: systemFor(input),
      history: input.history,
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
          controller.enqueue(encoder.encode(" …"));
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
