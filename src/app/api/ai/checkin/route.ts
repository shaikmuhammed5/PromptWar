import { generateJson } from "@/lib/ai/gemini";
import { checkInPrompt, checkInSystem } from "@/lib/ai/prompts";
import { handleAiRoute } from "@/lib/api";
import { checkInAnalysisSchema, checkInRequestSchema } from "@/lib/schemas";

export const runtime = "nodejs";

/** Spoken check-in in, structured risk read-out back. Drives which tools show. */
export async function POST(request: Request): Promise<Response> {
  return handleAiRoute(request, checkInRequestSchema, (input) =>
    generateJson({
      system: checkInSystem(),
      parts: [{ text: checkInPrompt(input.profile, input.transcript) }],
      schema: checkInAnalysisSchema,
    }),
  );
}
