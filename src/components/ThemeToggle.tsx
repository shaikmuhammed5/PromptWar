"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import {
  getThemeServerSnapshot,
  getThemeSnapshot,
  setTheme,
  subscribeToTheme,
  type Theme,
} from "@/lib/theme";

/**
 * Light and dark, chosen explicitly.
 *
 * Sized as a real target rather than a tucked-away icon: someone reaching for
 * this at 2am is doing so precisely because the screen is hurting their eyes.
 */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  // The boot script already set the attribute; this just reads it reactively.
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
  }

  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
  const Icon = theme === "dark" ? Sun : Moon;

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        title={label}
        className="pressable flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] border border-hairline bg-surface-1 text-ink-muted hover:border-ink-subtle"
      >
        <Icon aria-hidden size={18} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className="pressable t-body-sm flex min-h-12 items-center gap-3 rounded-[8px] px-3 text-left font-medium text-ink-muted transition hover:bg-surface-1"
    >
      <Icon aria-hidden size={18} />
      {theme === "dark" ? "Light theme" : "Dark theme"}
    </button>
  );
}
