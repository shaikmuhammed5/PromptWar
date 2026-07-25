"use client";

export type Theme = "light" | "dark";

export const THEME_KEY = "zync.theme";

/**
 * Light is the default, not the OS preference.
 *
 * The cream canvas is the app's character, so it is what a first-time user
 * meets. Dark is a deliberate choice someone makes — usually because they are
 * opening this at night — and once made it sticks, rather than the interface
 * changing underneath them when their phone crosses sunset mid-session.
 */
export const DEFAULT_THEME: Theme = "light";

export function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark";
}

export function readStoredTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    return isTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/**
 * The theme is an external store, like the app state, so React reads it with
 * useSyncExternalStore rather than mirroring it into component state inside an
 * effect. The DOM attribute stays the single source of truth.
 */
const listeners = new Set<() => void>();

export function subscribeToTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getThemeSnapshot(): Theme {
  if (typeof document === "undefined") return DEFAULT_THEME;
  const attribute = document.documentElement.dataset.theme;
  return isTheme(attribute ?? null) ? (attribute as Theme) : DEFAULT_THEME;
}

export function getThemeServerSnapshot(): Theme {
  return DEFAULT_THEME;
}

export function setTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Blocked storage (private mode) — the choice still holds for this session.
  }
  for (const listener of listeners) listener();
}

/**
 * Runs before first paint to stop a dark-theme user being flashed a full-screen
 * cream field. Inlined as a blocking script, so it is deliberately tiny.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");document.documentElement.dataset.theme=(t==="dark"||t==="light")?t:"${DEFAULT_THEME}"}catch(e){document.documentElement.dataset.theme="${DEFAULT_THEME}"}})()`;
