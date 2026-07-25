import type { ChatTurn } from "@/lib/types";

/**
 * Session limits, enforced in code rather than trusted to the prompt.
 *
 * An always-available, always-agreeable companion is the exact failure mode the
 * research warns about for this population: measurable social withdrawal and
 * parasocial attachment. A model told to "wrap up eventually" will drift. A
 * counter will not. So the conversation has a shape it cannot exceed, and the
 * exit always points at a human.
 */
export const WRAP_UP_AFTER = 12;
export const HARD_LIMIT = 20;

/** How many messages of history travel to the server on each turn. */
export const HISTORY_WINDOW = 20;

export type SessionStage = "open" | "wrapping" | "closing";

export function countUserTurns(turns: readonly ChatTurn[]): number {
  return turns.filter((turn) => turn.role === "user").length;
}

export function stageFor(userTurns: number): SessionStage {
  if (userTurns >= HARD_LIMIT) return "closing";
  if (userTurns >= WRAP_UP_AFTER) return "wrapping";
  return "open";
}

export function sessionStage(turns: readonly ChatTurn[]): SessionStage {
  return stageFor(countUserTurns(turns));
}

/** At the hard limit the composer is disabled — the session is over, gently. */
export function canSend(turns: readonly ChatTurn[]): boolean {
  return sessionStage(turns) !== "closing";
}

/**
 * Only the tail of the conversation is sent. Keeps the request small and cheap,
 * and means a long session cannot slowly push the safety frame out of context.
 */
export function historyWindow(turns: readonly ChatTurn[]): readonly ChatTurn[] {
  return turns.slice(-HISTORY_WINDOW);
}

/** Minutes ridden out — what "Ride it out" actually logs as an outcome. */
export function minutesElapsed(startedAt: number, now: number): number {
  return Math.max(0, Math.floor((now - startedAt) / 60_000));
}

/**
 * Urges typically crest and fall within about twenty minutes. The distraction
 * mode is honest about that rather than pretending the game is the point.
 */
export const URGE_CREST_MINUTES = 20;

export function rideProgress(startedAt: number, now: number): number {
  const minutes = minutesElapsed(startedAt, now);
  return Math.min(1, minutes / URGE_CREST_MINUTES);
}
