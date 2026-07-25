import { z } from "zod";

const substance = z.enum([
  "alcohol",
  "tobacco",
  "cannabis",
  "opioids",
  "gaming",
  "other",
]);

const streak = z.enum(["today", "week", "month", "sixMonths"]);

export const profileSchema = z.object({
  name: z.string().trim().max(40).default(""),
  substance,
  streak,
  triggers: z.array(z.string().trim().max(40)).max(12).default([]),
  anchorName: z.string().trim().max(40).default(""),
  anchorPhone: z.string().trim().max(20).default(""),
});

export const sosRequestSchema = z.object({
  profile: profileSchema,
  cravingLevel: z.number().int().min(1).max(5),
  /** The user's local hour — the server's clock is the wrong one to reason from. */
  hour: z.number().int().min(0).max(23).default(new Date().getHours()),
});

export const checkInRequestSchema = z.object({
  profile: profileSchema,
  transcript: z.string().trim().min(1).max(2000),
});

export const refusalRequestSchema = z.object({
  profile: profileSchema,
  scenario: z.string().trim().min(1).max(80),
});

export const journalRequestSchema = z.object({
  profile: profileSchema,
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  /** Base64 image payload without the data-url prefix. ~6MB ceiling. */
  imageBase64: z.string().min(1).max(8_000_000),
});

export const learnRequestSchema = z.object({
  profile: profileSchema,
  topic: z.string().trim().min(1).max(120),
});

export const caregiverRequestSchema = z.object({
  patientName: z.string().trim().max(40).default(""),
  substance,
  recentEvents: z
    .array(
      z.object({
        kind: z.enum(["sos", "checkin"]),
        at: z.number(),
        detail: z.string().max(400),
      }),
    )
    .max(30),
});

/** Model output contracts — the model is asked for JSON, we still validate it. */
export const checkInAnalysisSchema = z.object({
  mood: z.string().max(40),
  riskScore: z.number().min(0).max(10),
  summary: z.string().max(400),
  triggersDetected: z.array(z.string().max(60)).max(8).default([]),
  /**
   * Constrained to ids the UI can actually route. An unknown value would render
   * a button that silently dumps the user on the home screen, so it is dropped.
   */
  toolsRecommended: z
    .array(
      z
        .enum(["sos", "breathe", "call-anchor", "helpline", "journal", "refusal", "learn"])
        .catch("breathe"),
    )
    .max(6)
    .default([]),
});

export const refusalScriptsSchema = z.object({
  scripts: z
    .array(
      z.object({
        line: z.string().max(300),
        why: z.string().max(200),
      }),
    )
    .min(1)
    .max(4),
});

export const journalAnalysisSchema = z.object({
  triggers: z.array(z.string().max(60)).max(6).default([]),
  advice: z.string().max(600),
});

export const lessonSchema = z.object({
  title: z.string().max(120),
  body: z.string().max(2500),
  quiz: z
    .array(
      z.object({
        question: z.string().max(240),
        options: z.array(z.string().max(160)).min(2).max(4),
        answerIndex: z.number().int().min(0).max(3),
        explanation: z.string().max(400),
      }),
    )
    .max(3)
    .default([]),
});

export const caregiverGuidanceSchema = z.object({
  situation: z.string().max(400),
  say: z.array(z.string().max(240)).max(4).default([]),
  avoid: z.array(z.string().max(240)).max(4).default([]),
});

export type CheckInAnalysis = z.infer<typeof checkInAnalysisSchema>;
export type RefusalScripts = z.infer<typeof refusalScriptsSchema>;
export type JournalAnalysis = z.infer<typeof journalAnalysisSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type CaregiverGuidance = z.infer<typeof caregiverGuidanceSchema>;
