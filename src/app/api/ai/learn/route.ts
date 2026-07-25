import { cacheKey, withCache } from "@/lib/ai/cache";
import { generateJson } from "@/lib/ai/gemini";
import { learnPrompt, learnSystem } from "@/lib/ai/prompts";
import { handleAiRoute } from "@/lib/api";
import { learnRequestSchema, lessonSchema } from "@/lib/schemas";

export const runtime = "nodejs";

/**
 * Lessons are generated per substance and stage, not pulled from a content table.
 * The same three inputs always yield an equivalent lesson, so the result is
 * cached — a second view costs no latency and no quota.
 */
export async function POST(request: Request): Promise<Response> {
  return handleAiRoute(request, learnRequestSchema, (input) =>
    withCache(
      cacheKey(["learn", input.profile.substance, input.profile.streak, input.topic]),
      () =>
        generateJson({
          system: learnSystem(),
          parts: [{ text: learnPrompt(input.profile, input.topic) }],
          schema: lessonSchema,
        }),
    ),
  );
}
