import { generateJson } from "@/lib/ai/gemini";
import { learnPrompt, learnSystem } from "@/lib/ai/prompts";
import { handleAiRoute } from "@/lib/api";
import { learnRequestSchema, lessonSchema } from "@/lib/schemas";

export const runtime = "nodejs";

/** Lessons are generated per substance and stage, not pulled from a content table. */
export async function POST(request: Request): Promise<Response> {
  return handleAiRoute(request, learnRequestSchema, (input) =>
    generateJson({
      system: learnSystem(),
      parts: [{ text: learnPrompt(input.profile, input.topic) }],
      schema: lessonSchema,
    }),
  );
}
