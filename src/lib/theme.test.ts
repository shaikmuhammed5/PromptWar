import { describe, expect, test } from "vitest";
import {
  DEFAULT_THEME,
  THEME_INIT_SCRIPT,
  THEME_KEY,
  getThemeServerSnapshot,
  isTheme,
} from "./theme";

describe("theme defaults", () => {
  test("light is the default — the cream canvas is what a first-time user meets", () => {
    expect(DEFAULT_THEME).toBe("light");
  });

  test("the server always renders light, so markup matches the boot script", () => {
    expect(getThemeServerSnapshot()).toBe("light");
  });
});

describe("isTheme", () => {
  test("accepts the two real themes", () => {
    expect(isTheme("light")).toBe(true);
    expect(isTheme("dark")).toBe(true);
  });

  test("rejects anything else, including a stale stored value", () => {
    expect(isTheme("system")).toBe(false);
    expect(isTheme("")).toBe(false);
    expect(isTheme(null)).toBe(false);
  });
});

describe("THEME_INIT_SCRIPT", () => {
  test("reads the same storage key the app writes", () => {
    expect(THEME_INIT_SCRIPT).toContain(THEME_KEY);
  });

  test("is wrapped so a blocked localStorage cannot break first paint", () => {
    expect(THEME_INIT_SCRIPT).toContain("try");
    expect(THEME_INIT_SCRIPT).toContain("catch");
  });

  test("falls back to the default rather than leaving the attribute unset", () => {
    expect(THEME_INIT_SCRIPT).toContain(`"${DEFAULT_THEME}"`);
  });

  /** It runs blocking in <head>; anything heavy here delays the first paint. */
  test("stays small enough to inline", () => {
    expect(THEME_INIT_SCRIPT.length).toBeLessThan(400);
  });
});
