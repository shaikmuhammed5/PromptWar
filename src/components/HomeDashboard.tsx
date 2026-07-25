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
        className="sos-pulse flex min-h-56 w-full flex-col items-center justify-center gap-3 rounded-3xl bg-danger text-white md:min-h-40"
      >
        <ShieldAlert aria-hidden size={56} strokeWidth={1.75} />
        <span className="text-3xl font-black">I need help now</span>
        <span className="text-sm opacity-90">One tap. No typing.</span>
      </button>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Where you are</p>
            <p className="text-lg font-bold">{STREAK_LABELS[profile.streak]}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted">SOS moments survived</p>
            <p className="text-2xl font-black text-safe">{state.sosEvents.length}</p>
          </div>
        </div>
        {lastCheckIn ? (
          <p className="mt-4 border-t border-border pt-4 text-sm text-muted">
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
            className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface transition hover:border-accent"
          >
            <tab.Icon aria-hidden size={26} strokeWidth={1.75} className="text-accent" />
            <span className="text-sm font-semibold">{tab.label}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => onNavigate("breathe")}
          className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface transition hover:border-accent"
        >
          <Wind aria-hidden size={26} strokeWidth={1.75} className="text-accent" />
          <span className="text-sm font-semibold">Breathe</span>
        </button>
      </div>
    </div>
  );
}
