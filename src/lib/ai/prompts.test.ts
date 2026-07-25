import { describe, expect, test } from "vitest";
import { caregiverPrompt, checkInPrompt, profileContext, sosPrompt } from "./prompts";
import type { Profile } from "@/lib/types";

const profile: Profile = {
  name: "Arun",
  substance: "alcohol",
  streak: "week",
  triggers: ["Stress", "Old friends"],
  thunaiName: "Amma",
  thunaiPhone: "9876543210",
};

describe("profileContext", () => {
  test("includes the person's name, substance, streak, and triggers", () => {
    const context = profileContext(profile);

    expect(context).toContain("Arun");
    expect(context).toContain("Alcohol");
    expect(context).toContain("About a week");
    expect(context).toContain("Stress, Old friends");
    expect(context).toContain("Amma");
  });

  test("falls back to neutral wording when optional fields are blank", () => {
    const context = profileContext({
      ...profile,
      name: "",
      triggers: [],
      thunaiName: "",
    });

    expect(context).toContain("friend");
    expect(context).toContain("not recorded yet");
    expect(context).toContain("their trusted person");
  });
});

describe("sosPrompt", () => {
  test("describes the craving in words, not just a number", () => {
    const prompt = sosPrompt(profile, 5, 23);

    expect(prompt).toContain("overwhelming");
    expect(prompt).toContain("5 of 5");
    expect(prompt).toContain("23:00");
  });

  test("distinguishes a mild urge from a severe one", () => {
    const mild = sosPrompt(profile, 1, 9);
    const severe = sosPrompt(profile, 5, 9);

    expect(mild).toContain("faint pull");
    expect(severe).not.toContain("faint pull");
  });

  test("carries the person's triggers into the crisis prompt", () => {
    expect(sosPrompt(profile, 3, 14)).toContain("Old friends");
  });
});

describe("checkInPrompt", () => {
  test("quotes the transcript verbatim", () => {
    const prompt = checkInPrompt(profile, "saw the old crowd near the shop");

    expect(prompt).toContain("saw the old crowd near the shop");
    expect(prompt).toContain("Arun");
  });
});

describe("caregiverPrompt", () => {
  test("renders the event log newest first", () => {
    const prompt = caregiverPrompt({
      patientName: "Arun",
      substanceLabel: "Alcohol",
      events: [
        { kind: "sos", at: 2, detail: "Craving level 4 of 5" },
        { kind: "checkin", at: 1, detail: "Mood low, risk 6/10" },
      ],
    });

    expect(prompt).toContain("[sos] Craving level 4 of 5");
    expect(prompt.indexOf("[sos]")).toBeLessThan(prompt.indexOf("[checkin]"));
  });

  test("states plainly when there is no history yet", () => {
    const prompt = caregiverPrompt({
      patientName: "",
      substanceLabel: "Alcohol",
      events: [],
    });

    expect(prompt).toContain("No events logged yet");
    expect(prompt).toContain("their loved one");
  });
});
