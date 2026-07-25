"use client";

import { Suspense, useCallback, useEffect, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Breathe } from "@/components/Breathe";
import { Caregiver } from "@/components/Caregiver";
import { CheckIn } from "@/components/CheckIn";
import { Craft } from "@/components/Craft";
import { Helplines } from "@/components/Helplines";
import { HomeDashboard } from "@/components/HomeDashboard";
import { Journal } from "@/components/Journal";
import { Landing } from "@/components/Landing";
import { Learn } from "@/components/Learn";
import { Onboarding } from "@/components/Onboarding";
import { Refusal } from "@/components/Refusal";
import { SosFlow } from "@/components/SosFlow";
import { hrefFor, viewForTool, viewFromParam, type View } from "@/lib/navigation";
import type { CheckInAnalysis } from "@/lib/schemas";
import {
  getServerSnapshot,
  getSnapshot,
  hydrateFromStorage,
  isHydrated,
  newId,
  subscribe,
  updateState,
} from "@/lib/store";
import type { Profile } from "@/lib/types";

function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <p className="text-muted">Loading Zync…</p>
    </main>
  );
}

function ZyncApp() {
  const router = useRouter();
  const params = useSearchParams();
  const view = viewFromParam(params.get("v"));

  /**
   * The store lives outside React, so reading it needs no hydrate effect and
   * writing it needs no persist effect — and no stale closure can put an old
   * snapshot back over newer data.
   */
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(subscribe, isHydrated, () => false);

  useEffect(() => hydrateFromStorage(), []);

  /** Every move is real history, so back and swipe-back step through screens. */
  const go = useCallback(
    (next: View) => router.push(hrefFor(next)),
    [router],
  );

  const handleOnboarded = useCallback(
    (created: Profile) => {
      updateState((previous) => ({ ...previous, profile: created }));
      go("home");
    },
    [go],
  );

  const handleSosLogged = useCallback((cravingLevel: number, script: string) => {
    updateState((previous) => ({
      ...previous,
      sosEvents: [
        { id: newId(), at: Date.now(), cravingLevel, script },
        ...previous.sosEvents,
      ],
    }));
  }, []);

  const handleCheckIn = useCallback((transcript: string, analysis: CheckInAnalysis) => {
    updateState((previous) => ({
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
  }, []);

  /** Vision findings feed straight back into the profile that writes SOS scripts. */
  const handleTriggersFound = useCallback(
    (triggers: readonly string[], advice: string) => {
      updateState((previous) => {
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
    [],
  );

  const profile = state.profile;

  if (!hydrated) return <Loading />;

  if (view === "landing") {
    return (
      <Landing
        onRecovering={() => go(profile ? "home" : "onboarding")}
        onCaregiver={() => go("caregiver")}
      />
    );
  }

  if (view === "caregiver") {
    return <Caregiver state={state} onExit={() => go(profile ? "home" : "landing")} />;
  }

  // Everything below needs a profile; onboarding is the only way to get one.
  if (view === "onboarding" || !profile) {
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
    <AppShell
      name={profile.name}
      view={view}
      onNavigate={go}
      onBack={() => router.back()}
    >
      {view === "home" ? <HomeDashboard state={state} onNavigate={go} /> : null}
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
      {view === "craft" ? <Craft substance={profile.substance} /> : null}
    </AppShell>
  );
}

export default function Page() {
  // useSearchParams needs a Suspense boundary to keep the shell statically rendered.
  return (
    <Suspense fallback={<Loading />}>
      <ZyncApp />
    </Suspense>
  );
}
