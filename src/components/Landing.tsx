"use client";

import { Helplines } from "@/components/Helplines";
import { ThemeToggle } from "@/components/ThemeToggle";

/** The two doors: the person in recovery, and the person holding them up. */
export function Landing({
  onRecovering,
  onCaregiver,
}: {
  onRecovering: () => void;
  onCaregiver: () => void;
}) {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-10 px-5 py-10 md:flex-row md:items-center">
      <div className="absolute right-5 top-5">
        <ThemeToggle compact />
      </div>
      <div className="md:flex-1">
        <h1 className="t-display">
          Zync<span className="text-fin">.</span>
        </h1>
        <p className="t-subhead mt-4 text-ink-muted">You are not alone.</p>
        <p className="t-body-lg mt-6 max-w-md text-ink-muted">
          A companion for the moment the urge hits. One tap reaches help. No forms, no
          typing, no waiting room.
        </p>
        <div className="mt-10 grid gap-4">
          <button
            type="button"
            onClick={onRecovering}
            className="pressable t-button min-h-[3.5rem] rounded-[8px] bg-ink px-6 text-on-primary"
          >
            I am recovering
          </button>
          <button
            type="button"
            onClick={onCaregiver}
            className="pressable t-button min-h-[3.5rem] rounded-[8px] border border-hairline bg-surface-1 px-6 hover:border-ink-subtle"
          >
            I am caring for someone
          </button>
        </div>
      </div>
      {/* The helplines are on the first screen deliberately: someone may arrive
          here already in crisis and must not have to navigate to reach a human. */}
      <div className="md:w-80 md:shrink-0">
        <Helplines compact />
      </div>
    </main>
  );
}
