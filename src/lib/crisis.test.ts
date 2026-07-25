import { describe, expect, test } from "vitest";
import { assessCrisis, escalateForRisk } from "./crisis";

describe("assessCrisis — medical emergency", () => {
  test("catches an overdose in progress", () => {
    expect(assessCrisis("i think he overdosed, help").level).toBe("emergency");
  });

  test("catches someone not breathing", () => {
    expect(assessCrisis("she is not breathing").level).toBe("emergency");
  });

  test("catches an unresponsive person", () => {
    expect(assessCrisis("my brother passed out and won't wake up").level).toBe(
      "emergency",
    );
  });

  test("catches taking far too much", () => {
    expect(assessCrisis("I took too much tonight").level).toBe("emergency");
  });
});

describe("assessCrisis — self-harm and suicidal intent", () => {
  test("catches explicit intent", () => {
    expect(assessCrisis("I want to kill myself").level).toBe("urgent");
  });

  test("catches the indirect phrasing people actually use", () => {
    expect(assessCrisis("everyone would be better off without me").level).toBe("urgent");
  });

  test("catches not wanting to wake up", () => {
    expect(assessCrisis("some days I don't want to wake up").level).toBe("urgent");
  });

  test("catches self-harm", () => {
    expect(assessCrisis("I've been cutting myself again").level).toBe("urgent");
  });

  test("ranks a medical emergency above self-harm wording", () => {
    expect(assessCrisis("I overdosed and I want to die").level).toBe("emergency");
  });
});

describe("assessCrisis — ordinary distress is not a crisis", () => {
  test("a hard day does not escalate", () => {
    expect(assessCrisis("today was rough, I nearly went into the bar").level).toBe(
      "none",
    );
  });

  test("a craving does not escalate", () => {
    expect(assessCrisis("the urge is really strong right now").level).toBe("none");
  });

  test("grief about the past does not escalate", () => {
    expect(assessCrisis("I feel like I wasted years of my life").level).toBe("none");
  });
});

describe("escalateForRisk", () => {
  test("treats a top-of-rubric score as urgent even with no matching phrase", () => {
    expect(escalateForRisk({ level: "none", reason: "" }, 9).level).toBe("urgent");
  });

  test("leaves a moderate score alone", () => {
    expect(escalateForRisk({ level: "none", reason: "" }, 6).level).toBe("none");
  });

  test("never downgrades an emergency already detected", () => {
    const emergency = { level: "emergency", reason: "x" } as const;

    expect(escalateForRisk(emergency, 1).level).toBe("emergency");
  });
});
