import { describe, expect, test } from "vitest";
import {
  checkInAnalysisSchema,
  journalRequestSchema,
  sosRequestSchema,
} from "./schemas";

const profile = {
  name: "Arun",
  substance: "alcohol",
  streak: "week",
  triggers: ["Stress"],
  anchorName: "Amma",
  anchorPhone: "9876543210",
};

describe("sosRequestSchema", () => {
  test("accepts a craving level inside 1-5", () => {
    expect(sosRequestSchema.parse({ profile, cravingLevel: 3 }).cravingLevel).toBe(3);
  });

  test("rejects a craving level outside the scale", () => {
    expect(() => sosRequestSchema.parse({ profile, cravingLevel: 9 })).toThrow();
  });

  test("rejects an unknown substance", () => {
    expect(() =>
      sosRequestSchema.parse({
        profile: { ...profile, substance: "caffeine" },
        cravingLevel: 1,
      }),
    ).toThrow();
  });
});

describe("journalRequestSchema", () => {
  test("rejects a MIME type outside the image allow-list", () => {
    expect(() =>
      journalRequestSchema.parse({
        profile,
        mimeType: "application/pdf",
        imageBase64: "abc",
      }),
    ).toThrow();
  });

  test("accepts an allowed image type", () => {
    const parsed = journalRequestSchema.parse({
      profile,
      mimeType: "image/png",
      imageBase64: "abc",
    });

    expect(parsed.mimeType).toBe("image/png");
  });
});

describe("checkInAnalysisSchema", () => {
  test("defaults the optional arrays so the UI never maps over undefined", () => {
    const parsed = checkInAnalysisSchema.parse({
      mood: "low",
      riskScore: 6,
      summary: "You are carrying a lot today.",
    });

    expect(parsed.triggersDetected).toEqual([]);
    expect(parsed.toolsRecommended).toEqual([]);
  });

  test("rejects a risk score above the 0-10 rubric", () => {
    expect(() =>
      checkInAnalysisSchema.parse({ mood: "low", riskScore: 44, summary: "x" }),
    ).toThrow();
  });
});
