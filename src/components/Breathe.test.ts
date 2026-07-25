import { describe, expect, test } from "vitest";
import { phaseAt } from "./Breathe";

describe("phaseAt — 4-7-8 pacing", () => {
  test("opens on the inhale with the full count", () => {
    expect(phaseAt(0)).toEqual({
      phase: { label: "Breathe in", seconds: 4 },
      remaining: 4,
    });
  });

  test("counts down within a phase", () => {
    expect(phaseAt(3).remaining).toBe(1);
  });

  test("moves to the hold exactly when the inhale ends", () => {
    expect(phaseAt(4).phase.label).toBe("Hold");
    expect(phaseAt(4).remaining).toBe(7);
  });

  test("moves to the exhale after the hold", () => {
    expect(phaseAt(11).phase.label).toBe("Breathe out");
    expect(phaseAt(11).remaining).toBe(8);
  });

  test("wraps to a fresh inhale after a full cycle", () => {
    expect(phaseAt(19)).toEqual({
      phase: { label: "Breathe in", seconds: 4 },
      remaining: 4,
    });
  });

  test("stays correct many cycles in", () => {
    expect(phaseAt(19 * 5 + 4).phase.label).toBe("Hold");
  });

  /** The old implementation flashed a zero between phases; this cannot. */
  test("never shows a zero countdown", () => {
    for (let second = 0; second < 60; second++) {
      expect(phaseAt(second).remaining).toBeGreaterThan(0);
    }
  });
});
