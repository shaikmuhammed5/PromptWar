import { describe, expect, test } from "vitest";
import { MODELS, isModelUnavailable } from "./gemini";

describe("isModelUnavailable", () => {
  test("treats a quota exhaustion as a reason to try the next model", () => {
    const error = Object.assign(new Error("RESOURCE_EXHAUSTED"), { status: 429 });

    expect(isModelUnavailable(error)).toBe(true);
  });

  test("recognises the retired-model 404 by message alone", () => {
    const error = new Error(
      "This model models/gemini-2.5-flash is no longer available to new users.",
    );

    expect(isModelUnavailable(error)).toBe(true);
  });

  test("recognises a transient overload", () => {
    expect(isModelUnavailable(Object.assign(new Error("x"), { status: 503 }))).toBe(true);
  });

  test("does not blame the model for a malformed request", () => {
    const error = Object.assign(new Error("Invalid JSON payload"), { status: 400 });

    expect(isModelUnavailable(error)).toBe(false);
  });

  test("does not treat a schema parse failure as a model outage", () => {
    expect(isModelUnavailable(new Error("no JSON object in model output"))).toBe(false);
  });
});

describe("MODELS", () => {
  test("has more than one entry, or the fallback buys nothing", () => {
    expect(MODELS.length).toBeGreaterThan(1);
  });

  test("lists no duplicates, which would waste a retry on a dead model", () => {
    expect(new Set(MODELS).size).toBe(MODELS.length);
  });

  test("excludes versions known to be closed to new API keys", () => {
    expect(MODELS).not.toContain("gemini-2.5-flash");
    expect(MODELS).not.toContain("gemini-2.5-flash-lite");
  });
});
