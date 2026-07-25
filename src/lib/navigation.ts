"use client";

/**
 * Views are addressable, not component state.
 *
 * Holding the current screen in useState meant the browser recorded no history:
 * back (and the phone's swipe-back gesture) left the app entirely, mid-crisis,
 * instead of stepping back one screen. Every view now lives in the `v` query
 * parameter, so navigation is real history the platform already knows how to
 * undo — and a screen can be linked to or reloaded without losing your place.
 */
export const VIEWS = [
  "landing",
  "onboarding",
  "home",
  "sos",
  "checkin",
  "refusal",
  "journal",
  "learn",
  "helplines",
  "breathe",
  "caregiver",
  "craft",
] as const;

export type View = (typeof VIEWS)[number];

export function isView(value: string | null): value is View {
  return value !== null && (VIEWS as readonly string[]).includes(value);
}

/** Unknown or absent `v` falls back to the landing screen rather than erroring. */
export function viewFromParam(value: string | null): View {
  return isView(value) ? value : "landing";
}

export function hrefFor(view: View): string {
  return view === "landing" ? "/" : `/?v=${view}`;
}

/** Tool ids the check-in analysis may return, mapped to the screen they open. */
const TOOL_ROUTES: Readonly<Record<string, View>> = {
  sos: "sos",
  breathe: "breathe",
  helpline: "helplines",
  "call-anchor": "helplines",
  journal: "journal",
  refusal: "refusal",
  learn: "learn",
};

export function viewForTool(tool: string): View {
  return TOOL_ROUTES[tool] ?? "home";
}
