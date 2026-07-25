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

const craftModuleId = z.enum([
  "functional-analysis",
  "positive-reinforcement",
  "communication",
  "enabling",
]);

export const craftRequestSchema = z.object({
  moduleId: craftModuleId,
  substance,
  situation: z.string().trim().min(1).max(1500),
});

/**
 * Each CRAFT module returns a different shape, so the response is a union of
 * optional sections and the UI renders whichever arrived. Keeping one schema
 * avoids four near-identical route handlers.
 */
export const craftResponseSchema = z.object({
  heading: z.string().max(160),
  // communication
  rewrite: z.string().max(800).optional(),
  why: z.string().max(500).optional(),
  practice: z.string().max(300).optional(),
  avoid: z.array(z.string().max(240)).max(4).optional(),
  // functional analysis
  triggers: z.array(z.string().max(160)).max(6).optional(),
  shortTermPayoff: z.array(z.string().max(200)).max(5).optional(),
  longTermCost: z.array(z.string().max(200)).max(5).optional(),
  leverage: z.array(z.string().max(240)).max(4).optional(),
  // reinforcement
  rewardThese: z.array(z.string().max(200)).max(5).optional(),
  howToReward: z.array(z.string().max(240)).max(5).optional(),
  withdrawGently: z.array(z.string().max(240)).max(5).optional(),
  // enabling
  likelyEnabling: z.array(z.string().max(240)).max(5).optional(),
  insteadTry: z.array(z.string().max(240)).max(5).optional(),
  keepDoing: z.array(z.string().max(240)).max(4).optional(),
  nextStep: z.string().max(400).optional(),
});

export type CraftResponse = z.infer<typeof craftResponseSchema>;

const chatMode = z.enum(["talk", "practice", "distract"]);

const chatTurn = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().trim().min(1).max(4000),
});

export const chatRequestSchema = z.object({
  mode: chatMode,
  profile: profileSchema,
  /** Only the tail of the conversation travels; the rest stays in the browser. */
  history: z.array(chatTurn).min(1).max(24),
  scenario: z.string().trim().max(120).optional(),
  persona: z.string().trim().max(120).optional(),
  game: z.string().trim().max(60).optional(),
  /** Derived from a turn counter on the client and re-derived on the server. */
  userTurns: z.number().int().min(0).max(500),
});

export const rehearsalScoreRequestSchema = z.object({
  scenario: z.string().trim().min(1).max(120),
  persona: z.string().trim().min(1).max(120),
  history: z.array(chatTurn).min(1).max(60),
});

export const rehearsalScoreSchema = z.object({
  worked: z.array(z.string().max(300)).max(3).default([]),
  strengthen: z.string().max(400),
  pocketLine: z.string().max(240),
});

export type RehearsalScoreResult = z.infer<typeof rehearsalScoreSchema>;
