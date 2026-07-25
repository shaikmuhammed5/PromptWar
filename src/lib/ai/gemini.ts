import { GoogleGenAI } from "@google/genai";
import type { ZodType } from "zod";

/**
 * Ordered fallback chain, best-quality first.
 *
 * Two things forced this. Pinned versions rot: gemini-2.5-flash now answers 404
 * "no longer available to new users" for freshly issued keys. And the newest
 * models carry brutal free-tier day caps — the gemini-flash-latest alias resolves
 * to gemini-3.6-flash, which allows 20 requests per day. A single judge walking
 * the app would exhaust one model on their own.
 *
 * So each call walks the chain and moves to the next model on a quota or
 * availability failure. The daily caps are per model, so the chain multiplies the
 * usable budget and survives any one model being exhausted or retired.
 */
export const MODELS: readonly string[] = [
  "gemini-3.5-flash",
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
];

export const MODEL = MODELS[0];

let client: GoogleGenAI | null = null;

/** Lazily built so a missing key surfaces as a handled 503, not a boot crash. */
export function gemini(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new MissingKeyError();
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

export class MissingKeyError extends Error {
  constructor() {
    super("GEMINI_API_KEY is not configured");
    this.name = "MissingKeyError";
  }
}

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

/**
 * Is this failure about *this model* rather than the request itself? Quota
 * exhaustion (429), retirement (404), and overload (503) all mean "ask a
 * different model"; a 400 means our payload is wrong and retrying is pointless.
 */
export function isModelUnavailable(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  if (status === 429 || status === 404 || status === 503) return true;
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /RESOURCE_EXHAUSTED|NOT_FOUND|UNAVAILABLE|quota|no longer available/i.test(
    message,
  );
}

/** Models sometimes wrap JSON in prose or fences. Pull out the first object. */
export function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced?.[1] ?? raw).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("no JSON object in model output");
  return JSON.parse(candidate.slice(start, end + 1));
}

/**
 * One real Gemini call, forced to JSON, then validated against our own schema.
 * Walks the model chain on availability failures; retries the same model once on
 * a parse failure, since models occasionally emit a stray trailing comma.
 */
export async function generateJson<T>(args: {
  system: string;
  parts: readonly Part[];
  schema: ZodType<T>;
}): Promise<T> {
  let lastError: unknown;

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await gemini().models.generateContent({
          model,
          contents: [{ role: "user", parts: args.parts as Part[] }],
          config: {
            systemInstruction: args.system,
            responseMimeType: "application/json",
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        });
        return args.schema.parse(extractJson(response.text ?? ""));
      } catch (error) {
        if (error instanceof MissingKeyError) throw error;
        lastError = error;
        // Nothing this model can do for us — stop retrying it and move on.
        if (isModelUnavailable(error)) break;
      }
    }
  }

  throw lastError;
}

/**
 * Token stream for the SOS script — the user starts reading before it finishes.
 *
 * The chain is walked before yielding anything, so a model that is exhausted is
 * swapped out invisibly rather than surfacing a broken half-script.
 */
export async function* generateTextStream(args: {
  system: string;
  prompt: string;
}): AsyncGenerator<string> {
  let lastError: unknown;

  for (const model of MODELS) {
    try {
      const stream = await gemini().models.generateContentStream({
        model,
        contents: [{ role: "user", parts: [{ text: args.prompt }] }],
        config: {
          systemInstruction: args.system,
          temperature: 0.8,
          maxOutputTokens: 700,
        },
      });

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) yield text;
      }
      return;
    } catch (error) {
      if (error instanceof MissingKeyError) throw error;
      lastError = error;
      if (!isModelUnavailable(error)) throw error;
    }
  }

  throw lastError;
}
