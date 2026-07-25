"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Camera,
  Mic,
  MessageSquareQuote,
  Phone,
  ShieldAlert,
  Wind,
} from "lucide-react";
import { Breathe } from "@/components/Breathe";
import { Caregiver } from "@/components/Caregiver";
import { CheckIn } from "@/components/CheckIn";
import { Helplines } from "@/components/Helplines";
import { Journal } from "@/components/Journal";
import { Learn } from "@/components/Learn";
import { Onboarding } from "@/components/Onboarding";
import { Refusal } from "@/components/Refusal";
import { SosFlow } from "@/components/SosFlow";
import { Card } from "@/components/ui";
import { hrefFor, viewForTool, viewFromParam, type View } from "@/lib/navigation";
import type { CheckInAnalysis } from "@/lib/schemas";
import { loadState, newId, saveState } from "@/lib/store";
import { EMPTY_STATE, STREAK_LABELS, type AppState, type Profile } from "@/lib/types";

const TABS: readonly { view: View; Icon: typeof Mic; label: string }[] = [
  { view: "checkin", Icon: Mic, label: "Check in" },
  { view: "refusal", Icon: MessageSquareQuote, label: "Say no" },
  { view: "journal", Icon: Camera, label: "Triggers" },
  { view: "learn", Icon: BookOpen, label: "Learn" },
  { view: "helplines", Icon: Phone, label: "Helplines" },
];

function ZyncApp() {
  const router = useRouter();
  const params = useSearchParams();
  const view = viewFromParam(params.get("v"));

  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);

  // Local-first: state lives in the browser, so it loads after mount.
  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  /** Every move is real history, so back and swipe-back step through screens. */
  const go = useCallback(
    (next: View) => {
      router.push(hrefFor(next));
    },
    [router],
  );

  /**
   * Functional, never value-based. Two AI calls can be in flight at once (start
   * a check-in, hit the SOS button while it streams) and a snapshot-based
   * update would let the second write erase the first.
   */
  const update = useCallback((mutate: (previous: AppState) => AppState) => {
    setState(mutate);
  }, []);

  // Persist whatever the reducer settled on, not what a closure remembered.
  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  const profile = state.profile;

  const handleOnboarded = useCallback(
    (created: Profile) => {
      update((previous) => ({ ...previous, profile: created }));
      go("home");
    },
    [update, go],
  );

  const handleSosLogged = useCallback(
    (cravingLevel: number, script: string) => {
      update((previous) => ({
        ...previous,
        sosEvents: [
          { id: newId(), at: Date.now(), cravingLevel, script },
          ...previous.sosEvents,
        ],
      }));
    },
    [update],
  );

  const handleCheckIn = useCallback(
    (transcript: string, analysis: CheckInAnalysis) => {
      update((previous) => ({
        ...previous,
        checkIns: [
          {
            id: newId(),
            at: Date.now(),
            transcript,
            mood: analysis.mood,
            riskScore: analysis.riskScore,
            summary: analysis.summary,
            triggersDetected: analysis.triggersDetected,
            toolsRecommended: analysis.toolsRecommended,
          },
          ...previous.checkIns,
        ],
      }));
    },
    [update],
  );

  /** Vision findings feed straight back into the profile that writes SOS scripts. */
  const handleTriggersFound = useCallback(
    (triggers: readonly string[], advice: string) => {
      update((previous) => {
        if (!previous.profile) return previous;
        const merged = Array.from(new Set([...previous.profile.triggers, ...triggers]));
        return {
          ...previous,
          profile: { ...previous.profile, triggers: merged },
          journal: [
            { id: newId(), at: Date.now(), triggers, advice },
            ...previous.journal,
          ],
        };
      });
    },
    [update],
  );

  const lastCheckIn = useMemo(() => state.checkIns[0], [state.checkIns]);

  if (!hydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <p className="text-muted">Loading Zync…</p>
      </main>
    );
  }

  if (view === "landing") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-5 py-10">
        <h1 className="text-6xl font-black tracking-tight">
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
            onClick={() => go(profile ? "home" : "onboarding")}
            className="min-h-20 rounded-2xl bg-accent px-6 text-xl font-bold text-[#221503]"
          >
            I am recovering
          </button>
          <button
            type="button"
            onClick={() => go("caregiver")}
            className="min-h-20 rounded-2xl border border-border bg-surface px-6 text-xl font-bold"
          >
            I am caring for someone
          </button>
        </div>
        <div className="mt-10">
          <Helplines compact />
        </div>
      </main>
    );
  }

  if (view === "onboarding") {
    return <Onboarding onDone={handleOnboarded} />;
  }

  if (view === "caregiver") {
    return <Caregiver state={state} onExit={() => go(profile ? "home" : "landing")} />;
  }

  if (!profile) {
    return <Onboarding onDone={handleOnboarded} />;
  }

  if (view === "sos") {
    return (
      <SosFlow profile={profile} onLogged={handleSosLogged} onExit={() => go("home")} />
    );
  }

  if (view === "breathe") {
    return (
      <main className="mx-auto w-full max-w-lg px-5 py-8">
        <Breathe onClose={() => go("home")} />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg px-5 pb-28 pt-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            {profile.name ? `Hello, ${profile.name}` : "Hello"}
          </p>
          <h1 className="text-2xl font-black">
            Zync<span className="text-accent">.</span>
          </h1>
        </div>
        <button
          type="button"
          onClick={() => go("caregiver")}
          className="min-h-12 rounded-xl border border-border px-4 text-sm font-semibold"
        >
          Caregiver view
        </button>
      </header>

      {view === "home" ? (
        <div className="grid gap-5">
          <button
            type="button"
            onClick={() => go("sos")}
            className="sos-pulse flex min-h-56 w-full flex-col items-center justify-center gap-3 rounded-3xl bg-danger text-white"
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

          <div className="grid grid-cols-2 gap-3">
            {TABS.map((tab) => (
              <button
                key={tab.view}
                type="button"
                onClick={() => go(tab.view)}
                className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface transition hover:border-accent"
              >
                <tab.Icon
                  aria-hidden
                  size={26}
                  strokeWidth={1.75}
                  className="text-accent"
                />
                <span className="text-sm font-semibold">{tab.label}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => go("breathe")}
              className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface transition hover:border-accent"
            >
              <Wind aria-hidden size={26} strokeWidth={1.75} className="text-accent" />
              <span className="text-sm font-semibold">Breathe</span>
            </button>
          </div>
        </div>
      ) : null}

      {view === "checkin" ? (
        <CheckIn
          profile={profile}
          onAnalysed={handleCheckIn}
          onOpenTool={(tool) => go(viewForTool(tool))}
        />
      ) : null}
      {view === "refusal" ? <Refusal profile={profile} /> : null}
      {view === "journal" ? (
        <Journal profile={profile} onTriggersFound={handleTriggersFound} />
      ) : null}
      {view === "learn" ? <Learn profile={profile} /> : null}
      {view === "helplines" ? <Helplines /> : null}

      {view !== "home" ? (
        <>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-6 min-h-14 w-full rounded-xl border border-border py-3 font-semibold"
          >
            Back
          </button>
          {/* SOS stays one tap away from every screen. */}
          <button
            type="button"
            onClick={() => go("sos")}
            aria-label="Emergency help now"
            className="fixed bottom-5 right-5 flex h-16 w-16 items-center justify-center rounded-full bg-danger text-white shadow-xl"
          >
            <ShieldAlert aria-hidden size={28} strokeWidth={2} />
          </button>
        </>
      ) : null}
    </main>
  );
}

export default function Page() {
  // useSearchParams needs a Suspense boundary to keep the shell statically rendered.
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-5">
          <p className="text-muted">Loading Zync…</p>
        </main>
      }
    >
      <ZyncApp />
    </Suspense>
  );
}
