import { cacheKey, withCache } from "@/lib/ai/cache";
import { generateJson } from "@/lib/ai/gemini";
import { refusalPrompt, refusalSystem } from "@/lib/ai/prompts";
import { handleAiRoute } from "@/lib/api";
import { refusalRequestSchema, refusalScriptsSchema } from "@/lib/schemas";

export const runtime = "nodejs";

/**
 * Words to say out loud when someone offers. Prevention, not crisis — so unlike
 * the SOS script this does not depend on the moment, and is safe to cache.
 */
export async function POST(request: Request): Promise<Response> {
  return handleAiRoute(request, refusalRequestSchema, (input) =>
    withCache(
      cacheKey(["refusal", input.profile.substance, input.scenario]),
      () =>
        generateJson({
          system: refusalSystem(),
          parts: [{ text: refusalPrompt(input.profile, input.scenario) }],
          schema: refusalScriptsSchema,
        }),
    ),
  );
}
