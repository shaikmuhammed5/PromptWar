import { generateJson } from "@/lib/ai/gemini";
import { caregiverPrompt, caregiverSystem } from "@/lib/ai/prompts";
import { handleAiRoute } from "@/lib/api";
import { caregiverGuidanceSchema, caregiverRequestSchema } from "@/lib/schemas";
import { SUBSTANCE_LABELS } from "@/lib/types";

export const runtime = "nodejs";

/** Reads the event pattern and tells the caregiver what to say, and what not to. */
export async function POST(request: Request): Promise<Response> {
  return handleAiRoute(request, caregiverRequestSchema, (input) =>
    generateJson({
      system: caregiverSystem(),
      parts: [
        {
          text: caregiverPrompt({
            patientName: input.patientName,
            substanceLabel: SUBSTANCE_LABELS[input.substance],
            events: input.recentEvents,
          }),
        },
      ],
      schema: caregiverGuidanceSchema,
    }),
  );
}
