import { describe, expect, test } from "vitest";
import { extractJson } from "./gemini";

describe("extractJson", () => {
  test("parses a bare JSON object", () => {
    expect(extractJson('{"riskScore": 7}')).toEqual({ riskScore: 7 });
  });

  test("unwraps a fenced json block", () => {
    const raw = '```json\n{"mood": "low", "riskScore": 6}\n```';

    expect(extractJson(raw)).toEqual({ mood: "low", riskScore: 6 });
  });

  test("unwraps a fenced block with no language tag", () => {
    expect(extractJson('```\n{"ok": true}\n```')).toEqual({ ok: true });
  });

  test("ignores prose the model wrapped around the object", () => {
    const raw = 'Here is the analysis you asked for:\n{"mood": "steady"}\nHope that helps.';

    expect(extractJson(raw)).toEqual({ mood: "steady" });
  });

  test("keeps nested objects intact", () => {
    const raw = '{"quiz": [{"question": "q", "options": ["a", "b"]}]}';

    expect(extractJson(raw)).toEqual({
      quiz: [{ question: "q", options: ["a", "b"] }],
    });
  });

  test("throws when there is no object to find", () => {
    expect(() => extractJson("I cannot help with that.")).toThrow(/no JSON object/);
  });
});
