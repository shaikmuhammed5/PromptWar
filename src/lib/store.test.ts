import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  getServerSnapshot,
  getSnapshot,
  resetStoreForTests,
  subscribe,
  updateState,
} from "./store";
import { EMPTY_STATE } from "@/lib/types";

describe("store", () => {
  beforeEach(() => resetStoreForTests());

  test("starts empty", () => {
    expect(getSnapshot()).toEqual(EMPTY_STATE);
  });

  test("the server snapshot is always empty, since there is no browser storage", () => {
    updateState((previous) => ({ ...previous, checkIns: [] }));

    expect(getServerSnapshot()).toEqual(EMPTY_STATE);
  });

  test("returns a new snapshot object after a write, so React sees the change", () => {
    const before = getSnapshot();
    updateState((previous) => ({ ...previous, sosEvents: [] }));

    expect(getSnapshot()).not.toBe(before);
  });

  test("notifies subscribers on write", () => {
    const listener = vi.fn();
    subscribe(listener);

    updateState((previous) => previous);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("stops notifying after unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    unsubscribe();

    updateState((previous) => previous);

    expect(listener).not.toHaveBeenCalled();
  });

  /**
   * The bug this guards: two AI calls in flight, each built from the snapshot it
   * captured at render. Value-based updates let the second erase the first.
   */
  test("concurrent writes compose instead of overwriting each other", () => {
    updateState((previous) => ({
      ...previous,
      checkIns: [
        {
          id: "c1",
          at: 1,
          transcript: "t",
          mood: "low",
          riskScore: 5,
          summary: "s",
          triggersDetected: [],
          toolsRecommended: [],
        },
      ],
    }));

    updateState((previous) => ({
      ...previous,
      sosEvents: [{ id: "s1", at: 2, cravingLevel: 4, script: "x" }],
    }));

    const state = getSnapshot();
    expect(state.checkIns).toHaveLength(1);
    expect(state.sosEvents).toHaveLength(1);
  });
});
