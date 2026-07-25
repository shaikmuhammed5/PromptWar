import { generateJson } from "@/lib/ai/gemini";
import { REHEARSAL_SCORE_SYSTEM, rehearsalScorePrompt } from "@/lib/ai/prompts";
import { handleAiRoute } from "@/lib/api";
import { rehearsalScoreRequestSchema, rehearsalScoreSchema } from "@/lib/schemas";

export const runtime = "nodejs";

/**
 * Scores a completed refusal rehearsal — the Learnium session-scoring mechanic,
 * pointed at prevention. Coaching, never judgement.
 */
export async function POST(request: Request): Promise<Response> {
  return handleAiRoute(request, rehearsalScoreRequestSchema, (input) =>
    generateJson({
      system: REHEARSAL_SCORE_SYSTEM,
      parts: [
        {
          text: rehearsalScorePrompt({
            scenario: input.scenario,
            persona: input.persona,
            transcript: input.history
              .map((turn) => `${turn.role === "user" ? "Them" : "Pressurer"}: ${turn.text}`)
              .join("\n"),
          }),
        },
      ],
      schema: rehearsalScoreSchema,
    }),
  );
}
