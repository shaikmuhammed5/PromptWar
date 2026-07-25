"use client";

import { useEffect, useState } from "react";

type Phase = { readonly label: string; readonly seconds: number };

const PHASES: readonly Phase[] = [
  { label: "Breathe in", seconds: 4 },
  { label: "Hold", seconds: 7 },
  { label: "Breathe out", seconds: 8 },
];

const CYCLE_SECONDS = PHASES.reduce((total, phase) => total + phase.seconds, 0);

/**
 * Where in the 4-7-8 cycle a given elapsed second falls. Deriving this from one
 * counter keeps the phase and the countdown from ever disagreeing, and means the
 * timer never has to write one piece of state from another.
 */
export function phaseAt(elapsedSeconds: number): { phase: Phase; remaining: number } {
  let offset = elapsedSeconds % CYCLE_SECONDS;
  for (const phase of PHASES) {
    if (offset < phase.seconds) {
      return { phase, remaining: phase.seconds - offset };
    }
    offset -= phase.seconds;
  }
  return { phase: PHASES[0], remaining: PHASES[0].seconds };
}

/**
 * 4-7-8 pacing. Deliberately has no AI in it: when the model or the network is
 * down, this still gives a person in crisis something that works.
 */
export function Breathe({ onClose }: { onClose: () => void }) {
  // A single ticking counter; phase and countdown are both derived from it.
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const { phase, remaining } = phaseAt(elapsed);

  return (
    <div className="flex flex-col items-center gap-7 rounded-[12px] border border-hairline bg-surface-1 p-8">
      <div
        aria-hidden
        className="breathe-orb flex h-40 w-40 items-center justify-center rounded-full bg-ink/[0.06]"
      >
        <div className="h-24 w-24 rounded-full bg-ink/[0.12]" />
      </div>
      <p role="status" aria-live="polite" className="text-center">
        <span className="t-headline block">{phase.label}</span>
        <span className="t-display-md mt-2 block tabular-nums">
          {remaining}
        </span>
      </p>
      <p className="t-body-sm max-w-xs text-center text-ink-muted">
        Follow the circle. Four in, hold seven, out for eight. Three rounds is enough to
        drop your heart rate.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="pressable t-button min-h-12 rounded-[8px] border border-hairline px-8 py-2 hover:border-ink-subtle"
      >
        Done
      </button>
    </div>
  );
}
