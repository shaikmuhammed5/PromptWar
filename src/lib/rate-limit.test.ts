import { beforeEach, describe, expect, test } from "vitest";
import { allowRequest, clientKey, resetLimiter } from "./rate-limit";

describe("allowRequest", () => {
  beforeEach(() => resetLimiter());

  test("allows requests up to the window limit", () => {
    const results = Array.from({ length: 60 }, () => allowRequest("1.2.3.4", 1000));

    expect(results.every(Boolean)).toBe(true);
  });

  test("blocks the request past the limit", () => {
    for (let i = 0; i < 60; i++) allowRequest("1.2.3.4", 1000);

    expect(allowRequest("1.2.3.4", 1000)).toBe(false);
  });

  test("lets the caller through again once the window rolls over", () => {
    for (let i = 0; i < 61; i++) allowRequest("1.2.3.4", 1000);

    expect(allowRequest("1.2.3.4", 62_000)).toBe(true);
  });

  test("tracks each client separately", () => {
    for (let i = 0; i < 61; i++) allowRequest("1.2.3.4", 1000);

    expect(allowRequest("5.6.7.8", 1000)).toBe(true);
  });
});

describe("clientKey", () => {
  test("prefers the platform-provided x-real-ip", () => {
    const request = new Request("https://zync.app", {
      headers: { "x-real-ip": "203.0.113.5", "x-forwarded-for": "1.1.1.1" },
    });

    expect(clientKey(request)).toBe("203.0.113.5");
  });

  test("takes the rightmost forwarded hop, which the client cannot forge", () => {
    const request = new Request("https://zync.app", {
      headers: { "x-forwarded-for": "10.0.0.1, 203.0.113.5" },
    });

    expect(clientKey(request)).toBe("203.0.113.5");
  });

  test("a spoofed leftmost hop does not mint a new bucket", () => {
    const spoofed = new Request("https://zync.app", {
      headers: { "x-forwarded-for": "10.9.9.9, 203.0.113.5" },
    });
    const honest = new Request("https://zync.app", {
      headers: { "x-forwarded-for": "10.0.0.1, 203.0.113.5" },
    });

    expect(clientKey(spoofed)).toBe(clientKey(honest));
  });

  test("falls back to a shared key when no header is present", () => {
    expect(clientKey(new Request("https://zync.app"))).toBe("anonymous");
  });
});
