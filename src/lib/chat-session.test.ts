import { describe, expect, test } from "vitest";
import {
  HARD_LIMIT,
  HISTORY_WINDOW,
  WRAP_UP_AFTER,
  canSend,
  countUserTurns,
  historyWindow,
  minutesElapsed,
  rideProgress,
  sessionStage,
  stageFor,
} from "./chat-session";
import type { ChatTurn } from "@/lib/types";

function turns(userCount: number): ChatTurn[] {
  const list: ChatTurn[] = [];
  for (let i = 0; i < userCount; i++) {
    list.push({ role: "user", text: `u${i}`, at: i });
    list.push({ role: "assistant", text: `a${i}`, at: i });
  }
  return list;
}

describe("countUserTurns", () => {
  test("counts only what the user said", () => {
    expect(countUserTurns(turns(3))).toBe(3);
  });

  test("is zero for a fresh session", () => {
    expect(countUserTurns([])).toBe(0);
  });
});

describe("stageFor — the dependency guardrail", () => {
  test("stays open through ordinary conversation", () => {
    expect(stageFor(0)).toBe("open");
    expect(stageFor(WRAP_UP_AFTER - 1)).toBe("open");
  });

  test("begins wrapping up at the threshold", () => {
    expect(stageFor(WRAP_UP_AFTER)).toBe("wrapping");
  });

  test("closes at the hard limit", () => {
    expect(stageFor(HARD_LIMIT)).toBe("closing");
  });

  test("stays closed past the limit — it never reopens", () => {
    expect(stageFor(HARD_LIMIT + 50)).toBe("closing");
  });

  test("the wrap-up point comes before the hard limit", () => {
    expect(WRAP_UP_AFTER).toBeLessThan(HARD_LIMIT);
  });
});

describe("canSend", () => {
  test("allows sending while wrapping up, so the user is not cut off mid-thought", () => {
    expect(canSend(turns(WRAP_UP_AFTER))).toBe(true);
  });

  test("stops accepting input at the hard limit", () => {
    expect(canSend(turns(HARD_LIMIT))).toBe(false);
  });
});

describe("historyWindow", () => {
  test("sends everything while the session is short", () => {
    const short = turns(3);
    expect(historyWindow(short)).toHaveLength(short.length);
  });

  test("caps a long session to the window", () => {
    expect(historyWindow(turns(40))).toHaveLength(HISTORY_WINDOW);
  });

  test("keeps the most recent turns, not the oldest", () => {
    const window = historyWindow(turns(40));
    expect(window[window.length - 1].text).toBe("a39");
  });
});

describe("minutesElapsed", () => {
  test("counts whole minutes", () => {
    expect(minutesElapsed(0, 5 * 60_000)).toBe(5);
  });

  test("never returns a negative for a clock that jumped backwards", () => {
    expect(minutesElapsed(10_000, 0)).toBe(0);
  });
});

describe("rideProgress", () => {
  test("starts at zero", () => {
    expect(rideProgress(0, 0)).toBe(0);
  });

  test("is half way at ten minutes", () => {
    expect(rideProgress(0, 10 * 60_000)).toBeCloseTo(0.5);
  });

  test("caps at one so the bar cannot overflow", () => {
    expect(rideProgress(0, 90 * 60_000)).toBe(1);
  });
});

describe("sessionStage", () => {
  test("reads the stage straight off a turn list", () => {
    expect(sessionStage(turns(WRAP_UP_AFTER))).toBe("wrapping");
  });
});
