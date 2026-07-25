"use client";

import { EMPTY_STATE, type AppState } from "@/lib/types";

const KEY = "zync.state.v2";

/**
 * Local-first storage, modelled as an external store.
 *
 * Recovery data is among the most sensitive a person has, so it stays in their
 * browser: no account, no server-side health record, and nothing an evaluator
 * has to log in past.
 *
 * It is exposed through subscribe/getSnapshot rather than component state so
 * React can read it with useSyncExternalStore. That removes both the
 * hydrate-on-mount and persist-on-change effects, and with them the class of bug
 * where a stale closure writes an old snapshot back over newer data.
 */
let current: AppState = EMPTY_STATE;
let hydrated = false;

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): AppState {
  return current;
}

/** The server has no browser storage, so it always renders the empty state. */
export function getServerSnapshot(): AppState {
  return EMPTY_STATE;
}

export function isHydrated(): boolean {
  return hydrated;
}

/** Reads persisted state once on the client, then notifies subscribers. */
export function hydrateFromStorage(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      current = { ...EMPTY_STATE, ...(JSON.parse(raw) as Partial<AppState>) };
    }
  } catch {
    // Corrupt or unreadable payload — start clean rather than crash on open.
  }
  emit();
}

export function updateState(mutate: (previous: AppState) => AppState): void {
  current = mutate(current);
  persist(current);
  emit();
}

function persist(state: AppState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked (private mode) — the session still works in memory.
  }
}

export function clearState(): void {
  current = EMPTY_STATE;
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
  emit();
}

/** Test seam — module-level state must be resettable between suites. */
export function resetStoreForTests(): void {
  current = EMPTY_STATE;
  hydrated = false;
  listeners.clear();
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
