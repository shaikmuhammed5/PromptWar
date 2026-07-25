import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { MissingKeyError } from "@/lib/ai/gemini";
import { allowRequest, clientKey } from "@/lib/rate-limit";

/**
 * Every AI route shares this shell: rate limit, validate, run, and fail in a way
 * the UI can degrade from. Error bodies never echo the model output or the
 * user's health details.
 */
export async function handleAiRoute<TInput, TOutput>(
  request: Request,
  schema: ZodType<TInput>,
  run: (input: TInput) => Promise<TOutput>,
): Promise<NextResponse> {
  if (!allowRequest(clientKey(request))) {
    return NextResponse.json(
      { error: "Too many requests. Wait a minute, then try again." },
      { status: 429 },
    );
  }

  let input: TInput;
  try {
    input = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    return NextResponse.json(await run(input));
  } catch (error) {
    return NextResponse.json(aiErrorBody(error), { status: aiErrorStatus(error) });
  }
}

export function aiErrorStatus(error: unknown): number {
  return error instanceof MissingKeyError ? 503 : 502;
}

export function aiErrorBody(error: unknown): { error: string } {
  console.error("[thunai] ai route failed:", errorLabel(error));
  return {
    error:
      error instanceof MissingKeyError
        ? "The AI service is not configured on this deployment."
        : "Could not reach the AI service just now.",
  };
}

/** Log a type label only — check-in transcripts must never reach the logs. */
function errorLabel(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return "unknown error";
}
