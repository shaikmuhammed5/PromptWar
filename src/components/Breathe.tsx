"use client";

import { useEffect, useState } from "react";

type Phase = { readonly label: string; readonly seconds: number };

const PHASES: readonly Phase[] = [
  { label: "Breathe in", seconds: 4 },
  { label: "Hold", seconds: 7 },
  { label: "Breathe out", seconds: 8 },
];

/**
 * 4-7-8 pacing. Deliberately has no AI in it: when the model or the network is
 * down, this still gives a person in crisis something that works.
 */
export function Breathe({ onClose }: { onClose: () => void }) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [remaining, setRemaining] = useState(PHASES[0].seconds);

  // One timer per phase; when it runs out, advance and reset the count.
  useEffect(() => {
    if (remaining <= 0) {
      const next = (phaseIndex + 1) % PHASES.length;
      setPhaseIndex(next);
      setRemaining(PHASES[next].seconds);
      return;
    }
    const timer = setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, phaseIndex]);

  const phase = PHASES[phaseIndex];

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-surface p-8">
      <div
        aria-hidden
        className="breathe-orb flex h-40 w-40 items-center justify-center rounded-full bg-accent/25"
      >
        <div className="h-24 w-24 rounded-full bg-accent/60" />
      </div>
      <p role="status" aria-live="polite" className="text-center">
        <span className="block text-3xl font-bold">{phase.label}</span>
        <span className="mt-1 block text-5xl font-black tabular-nums text-accent">
          {remaining}
        </span>
      </p>
      <p className="text-center text-sm text-muted">
        Follow the circle. Four in, hold seven, out for eight. Three rounds is enough to
        drop your heart rate.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="min-h-12 rounded-xl border border-border px-6 py-2 font-semibold"
      >
        Done
      </button>
    </div>
  );
}
