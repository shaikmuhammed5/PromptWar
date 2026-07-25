import { generateJson } from "@/lib/ai/gemini";
import { journalSystem } from "@/lib/ai/prompts";
import { profileContext } from "@/lib/ai/prompts";
import { handleAiRoute } from "@/lib/api";
import { journalAnalysisSchema, journalRequestSchema } from "@/lib/schemas";

export const runtime = "nodejs";

/** Gemini Vision reads a real photo of the person's environment for triggers. */
export async function POST(request: Request): Promise<Response> {
  return handleAiRoute(request, journalRequestSchema, (input) =>
    generateJson({
      system: journalSystem(),
      parts: [
        { text: `${profileContext(input.profile)}\n\nLook at this photo from their life.` },
        { inlineData: { mimeType: input.mimeType, data: input.imageBase64 } },
      ],
      schema: journalAnalysisSchema,
    }),
  );
}
