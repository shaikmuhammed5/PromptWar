import { beforeEach, describe, expect, test, vi } from "vitest";
import { resetLimiter } from "@/lib/rate-limit";

/**
 * Route-level tests with the model mocked.
 *
 * The point is the contract around the model, not the model itself: bad input is
 * rejected before a paid call is made, a missing key degrades to a handled 503
 * rather than a stack trace, upstream failures never leak their detail to the
 * client, and the limiter actually limits.
 */
const generateJson = vi.fn();
const generateTextStream = vi.fn();
const generateChatStream = vi.fn();

class MissingKeyError extends Error {
  constructor() {
    super("GEMINI_API_KEY is not configured");
    this.name = "MissingKeyError";
  }
}

vi.mock("@/lib/ai/gemini", () => ({
  generateJson: (...args: unknown[]) => generateJson(...args),
  generateTextStream: (...args: unknown[]) => generateTextStream(...args),
  generateChatStream: (...args: unknown[]) => generateChatStream(...args),
  MissingKeyError,
  MODEL: "test-model",
  MODELS: ["test-model"],
}));

const { POST: checkin } = await import("./checkin/route");
const { POST: sos } = await import("./sos/route");
const { POST: craft } = await import("./craft/route");
const { POST: journal } = await import("./journal/route");
const { POST: chat } = await import("./chat/route");

const profile = {
  name: "Arun",
  substance: "alcohol",
  streak: "week",
  triggers: ["Stress"],
  anchorName: "Amma",
  anchorPhone: "9876543210",
};

function post(body: unknown, ip = "203.0.113.5"): Request {
  return new Request("https://zync.app/api/ai/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": ip },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  resetLimiter();
  generateJson.mockReset();
  generateTextStream.mockReset();
  generateChatStream.mockReset();
});

/**
 * The dependency guardrail is a server concern. The client sends its turn count,
 * but the stage that shapes the prompt is recomputed here — a guardrail a caller
 * can switch off is not a guardrail.
 */
describe("companion chat", () => {
  const history = [{ role: "user" as const, text: "hello" }];

  function chatBody(extra: Record<string, unknown> = {}) {
    return { mode: "talk", profile, history, userTurns: 1, ...extra };
  }

  test("streams a reply", async () => {
    generateChatStream.mockReturnValueOnce(
      (async function* () {
        yield "I hear ";
        yield "you.";
      })(),
    );

    const response = await chat(post(chatBody()));

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("I hear you.");
  });

  test("rejects an unknown mode", async () => {
    const response = await chat(post(chatBody({ mode: "therapy" })));

    expect(response.status).toBe(400);
    expect(generateChatStream).not.toHaveBeenCalled();
  });

  test("rejects an empty history", async () => {
    expect((await chat(post(chatBody({ history: [] })))).status).toBe(400);
  });

  test("caps how much history a caller may send", async () => {
    const flood = Array.from({ length: 100 }, () => ({ role: "user" as const, text: "x" }));

    expect((await chat(post(chatBody({ history: flood })))).status).toBe(400);
  });

  test("a long session gets the closing instruction, not the open one", async () => {
    generateChatStream.mockReturnValueOnce(
      (async function* () {
        yield "take care";
      })(),
    );

    await chat(post(chatBody({ userTurns: 25 })));

    const system = generateChatStream.mock.calls[0][0].system as string;
    expect(system).toMatch(/session is ending now/i);
  });

  test("an ordinary session gets no wind-down instruction", async () => {
    generateChatStream.mockReturnValueOnce(
      (async function* () {
        yield "go on";
      })(),
    );

    await chat(post(chatBody({ userTurns: 2 })));

    const system = generateChatStream.mock.calls[0][0].system as string;
    expect(system).not.toMatch(/session is ending now/i);
  });

  test("roleplay mode carries the two-push limit into the prompt", async () => {
    generateChatStream.mockReturnValueOnce(
      (async function* () {
        yield "go on, one won't hurt";
      })(),
    );

    await chat(
      post(
        chatBody({
          mode: "practice",
          scenario: "A party where everyone is drinking",
          persona: "An old friend who used with you",
        }),
      ),
    );

    const system = generateChatStream.mock.calls[0][0].system as string;
    expect(system).toMatch(/at most TWICE/);
    expect(system).toMatch(/BREAK CHARACTER/);
  });

  test("distraction mode is told not to raise recovery itself", async () => {
    generateChatStream.mockReturnValueOnce(
      (async function* () {
        yield "Is it an animal?";
      })(),
    );

    await chat(post(chatBody({ mode: "distract", game: "Twenty questions" })));

    const system = generateChatStream.mock.calls[0][0].system as string;
    expect(system).toMatch(/Do NOT discuss substances/);
  });

  test("an upstream failure does not leak detail", async () => {
    generateChatStream.mockImplementationOnce(() => {
      throw Object.assign(new Error("project 999 quota"), { status: 429 });
    });

    const response = await chat(post(chatBody()));
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(502);
    expect(body.error).not.toMatch(/999/);
  });
});

describe("input validation happens before the model is called", () => {
  test("rejects an unknown substance", async () => {
    const response = await checkin(
      post({ profile: { ...profile, substance: "caffeine" }, transcript: "hi" }),
    );

    expect(response.status).toBe(400);
    expect(generateJson).not.toHaveBeenCalled();
  });

  test("rejects an empty transcript", async () => {
    const response = await checkin(post({ profile, transcript: "" }));

    expect(response.status).toBe(400);
    expect(generateJson).not.toHaveBeenCalled();
  });

  test("rejects a craving level off the scale", async () => {
    const response = await sos(post({ profile, cravingLevel: 99 }));

    expect(response.status).toBe(400);
    expect(generateTextStream).not.toHaveBeenCalled();
  });

  test("rejects a non-image mime type on the vision route", async () => {
    const response = await journal(
      post({ profile, mimeType: "application/pdf", imageBase64: "abc" }),
    );

    expect(response.status).toBe(400);
    expect(generateJson).not.toHaveBeenCalled();
  });

  test("rejects an unknown CRAFT module", async () => {
    const response = await craft(
      post({ moduleId: "hypnosis", substance: "alcohol", situation: "x" }),
    );

    expect(response.status).toBe(400);
  });

  test("rejects a malformed body without throwing", async () => {
    const request = new Request("https://zync.app/api/ai/checkin", {
      method: "POST",
      headers: { "x-real-ip": "203.0.113.9" },
      body: "not json",
    });

    expect((await checkin(request)).status).toBe(400);
  });
});

describe("failures degrade instead of leaking", () => {
  test("a missing API key is a handled 503", async () => {
    generateJson.mockRejectedValueOnce(new MissingKeyError());

    const response = await checkin(post({ profile, transcript: "rough day" }));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "The AI service is not configured on this deployment.",
    });
  });

  test("an upstream failure becomes a 502 with no internal detail", async () => {
    generateJson.mockRejectedValueOnce(new Error("quota project 12345 exhausted"));

    const response = await checkin(post({ profile, transcript: "rough day" }));
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(502);
    expect(body.error).not.toMatch(/quota|12345/);
  });

  test("an empty model stream fails cleanly rather than returning half a script", async () => {
    generateTextStream.mockReturnValueOnce(
      (async function* () {})() as AsyncGenerator<string>,
    );

    const response = await sos(post({ profile, cravingLevel: 3 }));

    expect(response.status).toBe(502);
  });
});

describe("happy paths", () => {
  test("returns the validated analysis", async () => {
    generateJson.mockResolvedValueOnce({
      mood: "anxious",
      riskScore: 7,
      summary: "You had a hard day.",
      triggersDetected: ["Stress"],
      toolsRecommended: ["breathe"],
    });

    const response = await checkin(post({ profile, transcript: "rough day" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ riskScore: 7 });
  });

  test("the SOS route streams text back", async () => {
    generateTextStream.mockReturnValueOnce(
      (async function* () {
        yield "Arun, ";
        yield "breathe.";
      })(),
    );

    const response = await sos(post({ profile, cravingLevel: 4 }));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/plain");
    expect(await response.text()).toBe("Arun, breathe.");
  });

  test("the SOS route never caches a personalised crisis script", async () => {
    generateTextStream.mockReturnValueOnce(
      (async function* () {
        yield "x";
      })(),
    );

    const response = await sos(post({ profile, cravingLevel: 1 }));

    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("rate limiting", () => {
  test("blocks a caller past the window and does not call the model", async () => {
    generateJson.mockResolvedValue({
      mood: "ok",
      riskScore: 1,
      summary: "s",
      triggersDetected: [],
      toolsRecommended: [],
    });

    for (let i = 0; i < 60; i++) {
      await checkin(post({ profile, transcript: "hello" }, "198.51.100.7"));
    }
    generateJson.mockClear();

    const blocked = await checkin(post({ profile, transcript: "hello" }, "198.51.100.7"));

    expect(blocked.status).toBe(429);
    expect(generateJson).not.toHaveBeenCalled();
  });

  test("one client's limit does not affect another", async () => {
    for (let i = 0; i < 61; i++) {
      await checkin(post({ profile, transcript: "hello" }, "198.51.100.8"));
    }

    generateJson.mockResolvedValueOnce({
      mood: "ok",
      riskScore: 1,
      summary: "s",
      triggersDetected: [],
      toolsRecommended: [],
    });
    const other = await checkin(post({ profile, transcript: "hello" }, "198.51.100.9"));

    expect(other.status).toBe(200);
  });
});
