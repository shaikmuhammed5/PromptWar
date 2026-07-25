/**
 * Deterministic crisis detection.
 *
 * The safety instructions in the system prompt are guidance a model can drift
 * from; this is a rule that cannot. If a check-in contains signals of overdose,
 * self-harm, or intent to die, the UI escalates to emergency numbers regardless
 * of what the model decided the risk score was. It runs before and independently
 * of the AI, so a wrong generation, a quota failure, or an outage cannot suppress
 * the escalation.
 *
 * Deliberately tuned to over-trigger. A false positive costs someone a phone
 * number they did not need; a false negative costs considerably more.
 */
export type CrisisLevel = "none" | "urgent" | "emergency";

export type CrisisAssessment = {
  readonly level: CrisisLevel;
  readonly reason: string;
};

/** Medical emergency — someone may be dying now. */
const EMERGENCY_PATTERNS: readonly RegExp[] = [
  /\b(overdos(e|ed|ing)|od'?ed)\b/i,
  /\b(not|isn'?t|stopped)\s+breathing\b/i,
  /\b(unconscious|unresponsive|passed out|collapsed|blacked out)\b/i,
  /\b(seizure|convulsion|fitting)\b/i,
  /\btook (too much|way more|the whole)\b/i,
  /\b(turning blue|blue lips)\b/i,
];

/** Self-harm or suicidal intent — needs a human now, not a coping exercise. */
const URGENT_PATTERNS: readonly RegExp[] = [
  /\b(kill myself|killing myself|end my life|ending it all|take my (own )?life)\b/i,
  /\b(suicide|suicidal)\b/i,
  /\bdon'?t want to (be here|live|wake up)\b/i,
  /\b(better off (dead|without me))\b/i,
  // "cutting" doubles the consonant, so the suffix cannot be a bare optional group.
  /\b(hurt(ing)?|harm(ing)?|cut(ting)?|burn(ing)?)\s+myself\b/i,
  /\bself[-\s]?harm(ing)?\b/i,
  /\bno (point|reason) (in )?(living|going on)\b/i,
  /\bwant to die\b/i,
];

export function assessCrisis(text: string): CrisisAssessment {
  if (EMERGENCY_PATTERNS.some((pattern) => pattern.test(text))) {
    return {
      level: "emergency",
      reason: "This sounds like a medical emergency.",
    };
  }
  if (URGENT_PATTERNS.some((pattern) => pattern.test(text))) {
    return {
      level: "urgent",
      reason: "What you just said matters, and it needs a person, not an app.",
    };
  }
  return { level: "none", reason: "" };
}

/**
 * A risk score at the top of the rubric is treated as urgent even when no phrase
 * matched — the model may have read distress the patterns above cannot express.
 */
export function escalateForRisk(
  assessment: CrisisAssessment,
  riskScore: number,
): CrisisAssessment {
  if (assessment.level !== "none") return assessment;
  if (riskScore >= 9) {
    return {
      level: "urgent",
      reason: "This is a very high-risk moment. Please bring in a person.",
    };
  }
  return assessment;
}
