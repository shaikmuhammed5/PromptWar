"use client";

import { ShieldAlert, Wind } from "lucide-react";
import { TABS } from "@/components/AppShell";
import { Card } from "@/components/ui";
import type { View } from "@/lib/navigation";
import { STREAK_LABELS, type AppState } from "@/lib/types";

/**
 * Home is dominated by one button on purpose. Everything else is secondary to
 * being able to reach help without reading the screen.
 */
export function HomeDashboard({
  state,
  onNavigate,
}: {
  state: AppState;
  onNavigate: (view: View) => void;
}) {
  const profile = state.profile;
  const lastCheckIn = state.checkIns[0];
  if (!profile) return null;

  return (
    <div className="grid gap-5">
      <button
        type="button"
        onClick={() => onNavigate("sos")}
        className="pressable sos-pulse flex min-h-56 w-full flex-col items-center justify-center gap-3 rounded-[16px] bg-emergency text-white md:min-h-44"
      >
        <ShieldAlert aria-hidden size={56} strokeWidth={1.75} />
        <span className="t-display-md">I need help now</span>
        <span className="t-body-sm opacity-90">One tap. No typing.</span>
      </button>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="t-caption uppercase tracking-wide text-ink-subtle">Where you are</p>
            <p className="t-card-title mt-1">{STREAK_LABELS[profile.streak]}</p>
          </div>
          <div className="text-right">
            <p className="t-caption uppercase tracking-wide text-ink-subtle">Urges outlasted</p>
            <p className="t-card-title mt-1 tabular-nums">{state.sosEvents.length}</p>
          </div>
        </div>
        {lastCheckIn ? (
          <p className="mt-4 border-t border-hairline pt-4 text-sm text-ink-muted">
            Last check-in: {lastCheckIn.summary}
          </p>
        ) : null}
      </Card>

      {/* The rail replaces this grid from md upward. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:hidden">
        {TABS.map((tab) => (
          <button
            key={tab.view}
            type="button"
            onClick={() => onNavigate(tab.view)}
            className="pressable flex min-h-24 flex-col items-center justify-center gap-2 rounded-[12px] border border-hairline bg-surface-1 hover:border-ink-subtle"
          >
            <tab.Icon aria-hidden size={22} strokeWidth={1.75} className="text-ink-muted" />
            <span className="t-body-sm font-medium">{tab.label}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => onNavigate("breathe")}
          className="pressable flex min-h-24 flex-col items-center justify-center gap-2 rounded-[12px] border border-hairline bg-surface-1 hover:border-ink-subtle"
        >
          <Wind aria-hidden size={22} strokeWidth={1.75} className="text-ink-muted" />
          <span className="t-body-sm font-medium">Breathe</span>
        </button>
      </div>
    </div>
  );
}
