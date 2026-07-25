"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import type { CheckInAnalysis } from "@/lib/schemas";
import { loadState, newId, saveState } from "@/lib/store";
import { EMPTY_STATE, STREAK_LABELS, type AppState, type Profile } from "@/lib/types";

type View =
  | "landing"
  | "onboarding"
  | "home"
  | "sos"
  | "checkin"
  | "refusal"
  | "journal"
  | "learn"
  | "helplines"
  | "breathe"
  | "caregiver";

const TABS: readonly { view: View; icon: string; label: string }[] = [
  { view: "checkin", icon: "🎙️", label: "Check in" },
  { view: "refusal", icon: "🗣️", label: "Say no" },
  { view: "journal", icon: "📷", label: "Triggers" },
  { view: "learn", icon: "📚", label: "Learn" },
  { view: "helplines", icon: "☎️", label: "Helplines" },
];

export default function Page() {
  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [view, setView] = useState<View>("landing");
  const [hydrated, setHydrated] = useState(false);

  // Local-first: state lives in the browser, so it loads after mount.
  useEffect(() => {
    const stored = loadState();
    setState(stored);
    setView(stored.profile ? "home" : "landing");
    setHydrated(true);
  }, []);

  const update = useCallback((next: AppState) => {
    setState(next);
    saveState(next);
  }, []);

  const profile = state.profile;

  const handleOnboarded = useCallback(
    (created: Profile) => {
      update({ ...state, profile: created });
      setView("home");
    },
    [state, update],
  );

  const handleSosLogged = useCallback(
    (cravingLevel: number, script: string) => {
      update({
        ...state,
        sosEvents: [
          { id: newId(), at: Date.now(), cravingLevel, script },
          ...state.sosEvents,
        ],
      });
    },
    [state, update],
  );

  const handleCheckIn = useCallback(
    (transcript: string, analysis: CheckInAnalysis) => {
      update({
        ...state,
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
          ...state.checkIns,
        ],
      });
    },
    [state, update],
  );

  /** Vision findings feed straight back into the profile that writes SOS scripts. */
  const handleTriggersFound = useCallback(
    (triggers: readonly string[], advice: string) => {
      if (!state.profile) return;
      const merged = Array.from(new Set([...state.profile.triggers, ...triggers]));
      update({
        ...state,
        profile: { ...state.profile, triggers: merged },
        journal: [{ id: newId(), at: Date.now(), triggers, advice }, ...state.journal],
      });
    },
    [state, update],
  );

  const openTool = useCallback((tool: string) => {
    const routes: Readonly<Record<string, View>> = {
      sos: "sos",
      breathe: "breathe",
      helpline: "helplines",
      "call-thunai": "helplines",
      journal: "journal",
      refusal: "refusal",
      learn: "learn",
    };
    setView(routes[tool] ?? "home");
  }, []);

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
        <p className="mt-3 text-2xl font-semibold text-accent">நீ தனியா இல்ல</p>
        <p className="mt-1 text-lg text-muted">Nee thaniya illa — you are not alone.</p>
        <p className="mt-6 text-base leading-relaxed">
          A companion for the moment the urge hits. One tap reaches help. No forms, no
          typing, no waiting room.
        </p>
        <div className="mt-10 grid gap-4">
          <button
            type="button"
            onClick={() => setView(profile ? "home" : "onboarding")}
            className="min-h-20 rounded-2xl bg-accent px-6 text-xl font-bold text-[#221503]"
          >
            I am recovering
          </button>
          <button
            type="button"
            onClick={() => setView("caregiver")}
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
    return (
      <Caregiver state={state} onExit={() => setView(profile ? "home" : "landing")} />
    );
  }

  if (!profile) {
    return <Onboarding onDone={handleOnboarded} />;
  }

  if (view === "sos") {
    return (
      <SosFlow
        profile={profile}
        onLogged={handleSosLogged}
        onExit={() => setView("home")}
      />
    );
  }

  if (view === "breathe") {
    return (
      <main className="mx-auto w-full max-w-lg px-5 py-8">
        <Breathe onClose={() => setView("home")} />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg px-5 pb-28 pt-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            {profile.name ? `Vanakkam, ${profile.name}` : "Vanakkam"}
          </p>
          <h1 className="text-2xl font-black">
            Zync<span className="text-accent">.</span>
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setView("caregiver")}
          className="min-h-12 rounded-xl border border-border px-4 text-sm font-semibold"
        >
          Caregiver view
        </button>
      </header>

      {view === "home" ? (
        <div className="grid gap-5">
          <button
            type="button"
            onClick={() => setView("sos")}
            className="sos-pulse flex min-h-56 w-full flex-col items-center justify-center gap-2 rounded-3xl bg-danger text-white"
          >
            <span aria-hidden className="text-6xl">
              🆘
            </span>
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
                onClick={() => setView(tab.view)}
                className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-surface transition hover:border-accent"
              >
                <span aria-hidden className="text-3xl">
                  {tab.icon}
                </span>
                <span className="text-sm font-semibold">{tab.label}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setView("breathe")}
              className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-surface transition hover:border-accent"
            >
              <span aria-hidden className="text-3xl">
                🫁
              </span>
              <span className="text-sm font-semibold">Breathe</span>
            </button>
          </div>
        </div>
      ) : null}

      {view === "checkin" ? (
        <CheckIn profile={profile} onAnalysed={handleCheckIn} onOpenTool={openTool} />
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
            onClick={() => setView("home")}
            className="mt-6 min-h-14 w-full rounded-xl border border-border py-3 font-semibold"
          >
            Back home
          </button>
          {/* SOS stays one tap away from every screen. */}
          <button
            type="button"
            onClick={() => setView("sos")}
            aria-label="Emergency help now"
            className="fixed bottom-5 right-5 flex h-16 w-16 items-center justify-center rounded-full bg-danger text-2xl font-black text-white shadow-xl"
          >
            🆘
          </button>
        </>
      ) : null}
    </main>
  );
}
