import { beforeEach, describe, expect, test } from "vitest";
import { allowRequest, clientKey, resetLimiter } from "./rate-limit";

describe("allowRequest", () => {
  beforeEach(() => resetLimiter());

  test("allows requests up to the window limit", () => {
    const results = Array.from({ length: 20 }, () => allowRequest("1.2.3.4", 1000));

    expect(results.every(Boolean)).toBe(true);
  });

  test("blocks the request past the limit", () => {
    for (let i = 0; i < 20; i++) allowRequest("1.2.3.4", 1000);

    expect(allowRequest("1.2.3.4", 1000)).toBe(false);
  });

  test("lets the caller through again once the window rolls over", () => {
    for (let i = 0; i < 21; i++) allowRequest("1.2.3.4", 1000);

    expect(allowRequest("1.2.3.4", 62_000)).toBe(true);
  });

  test("tracks each client separately", () => {
    for (let i = 0; i < 21; i++) allowRequest("1.2.3.4", 1000);

    expect(allowRequest("5.6.7.8", 1000)).toBe(true);
  });
});

describe("clientKey", () => {
  test("reads the first hop of x-forwarded-for", () => {
    const request = new Request("https://thunai.app", {
      headers: { "x-forwarded-for": "203.0.113.5, 70.41.3.18" },
    });

    expect(clientKey(request)).toBe("203.0.113.5");
  });

  test("falls back to a shared key when the header is absent", () => {
    expect(clientKey(new Request("https://thunai.app"))).toBe("anonymous");
  });
});
