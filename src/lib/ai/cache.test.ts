import { beforeEach, describe, expect, test, vi } from "vitest";
import { cacheKey, cacheSize, clearCache, readCache, withCache, writeCache } from "./cache";

describe("cacheKey", () => {
  test("normalises case and padding so equivalent asks share an entry", () => {
    expect(cacheKey(["learn", "Alcohol", " Week "])).toBe(cacheKey(["learn", "alcohol", "week"]));
  });

  test("keeps different inputs apart", () => {
    expect(cacheKey(["learn", "alcohol"])).not.toBe(cacheKey(["learn", "tobacco"]));
  });
});

describe("cache", () => {
  beforeEach(() => clearCache());

  test("returns a stored value", () => {
    writeCache("k", { a: 1 });
    expect(readCache("k")).toEqual({ a: 1 });
  });

  test("misses on an unknown key", () => {
    expect(readCache("nope")).toBeNull();
  });

  test("expires an entry once its TTL passes", () => {
    writeCache("k", "v", 0, 1000);
    expect(readCache("k", 1001)).toBeNull();
  });

  test("still serves an entry inside its TTL", () => {
    writeCache("k", "v", 0, 1000);
    expect(readCache("k", 999)).toBe("v");
  });

  test("evicts rather than growing without bound", () => {
    for (let i = 0; i < 250; i++) writeCache(`k${i}`, i);
    expect(cacheSize()).toBeLessThanOrEqual(200);
  });
});

describe("withCache", () => {
  beforeEach(() => clearCache());

  test("only generates once for repeat asks", async () => {
    const produce = vi.fn().mockResolvedValue("lesson");

    await withCache("k", produce);
    await withCache("k", produce);

    expect(produce).toHaveBeenCalledTimes(1);
  });

  test("generates separately for different keys", async () => {
    const produce = vi.fn().mockResolvedValue("x");

    await withCache("a", produce);
    await withCache("b", produce);

    expect(produce).toHaveBeenCalledTimes(2);
  });

  test("does not cache a failure, so a transient error can be retried", async () => {
    const produce = vi
      .fn()
      .mockRejectedValueOnce(new Error("upstream down"))
      .mockResolvedValueOnce("recovered");

    await expect(withCache("k", produce)).rejects.toThrow("upstream down");
    await expect(withCache("k", produce)).resolves.toBe("recovered");
  });
});
