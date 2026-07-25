import { GoogleGenAI } from "@google/genai";
import type { ZodType } from "zod";

/**
 * Tracks the current Flash model. Pinning an explicit version (gemini-2.5-flash)
 * broke here with a 404 — that version is closed to new API keys — so the alias
 * is deliberate: it keeps working as Google rotates the underlying model.
 */
export const MODEL = "gemini-flash-latest";

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
 * Retries once — models occasionally emit a stray trailing comma.
 */
export async function generateJson<T>(args: {
  system: string;
  parts: readonly Part[];
  schema: ZodType<T>;
}): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await gemini().models.generateContent({
        model: MODEL,
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
    }
  }
  throw lastError;
}

/** Token stream for the SOS script — the user starts reading before it finishes. */
export async function* generateTextStream(args: {
  system: string;
  prompt: string;
}): AsyncGenerator<string> {
  const stream = await gemini().models.generateContentStream({
    model: MODEL,
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
}
