"use client";

import { Helplines } from "@/components/Helplines";

/** The two doors: the person in recovery, and the person holding them up. */
export function Landing({
  onRecovering,
  onCaregiver,
}: {
  onRecovering: () => void;
  onCaregiver: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-10 px-5 py-10 md:flex-row md:items-center">
      <div className="md:flex-1">
        <h1 className="text-6xl font-black tracking-tight md:text-7xl">
          Zync<span className="text-accent">.</span>
        </h1>
        <p className="mt-3 text-2xl font-semibold text-accent">You are not alone.</p>
        <p className="mt-6 text-base leading-relaxed">
          A companion for the moment the urge hits. One tap reaches help. No forms, no
          typing, no waiting room.
        </p>
        <div className="mt-10 grid gap-4">
          <button
            type="button"
            onClick={onRecovering}
            className="min-h-20 rounded-2xl bg-accent px-6 text-xl font-bold text-[#221503]"
          >
            I am recovering
          </button>
          <button
            type="button"
            onClick={onCaregiver}
            className="min-h-20 rounded-2xl border border-border bg-surface px-6 text-xl font-bold"
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
