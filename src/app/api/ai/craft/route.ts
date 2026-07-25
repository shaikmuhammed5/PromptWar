import { generateJson } from "@/lib/ai/gemini";
import { craftPrompt, craftSystem } from "@/lib/ai/prompts";
import { handleAiRoute } from "@/lib/api";
import { craftRequestSchema, craftResponseSchema } from "@/lib/schemas";
import { SUBSTANCE_LABELS } from "@/lib/types";

export const runtime = "nodejs";

/**
 * CRAFT coaching for caregivers — the family-facing half of the product.
 * Each module has its own system prompt and its own output shape.
 */
export async function POST(request: Request): Promise<Response> {
  return handleAiRoute(request, craftRequestSchema, (input) =>
    generateJson({
      system: craftSystem(input.moduleId),
      parts: [
        {
          text: craftPrompt({
            moduleId: input.moduleId,
            substanceLabel: SUBSTANCE_LABELS[input.substance],
            situation: input.situation,
          }),
        },
      ],
      schema: craftResponseSchema,
    }),
  );
}
