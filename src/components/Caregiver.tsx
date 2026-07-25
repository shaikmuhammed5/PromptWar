"use client";

import { useState } from "react";
import { Card, ErrorNote, PrimaryButton, SectionTitle, Spinner } from "@/components/ui";
import { Helplines } from "@/components/Helplines";
import type { CaregiverGuidance } from "@/lib/schemas";
import type { AppState } from "@/lib/types";

function timeAgo(at: number): string {
  const minutes = Math.round((Date.now() - at) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/**
 * The caregiver's half of the product. Reads the same local event log the
 * recovering person generates, then asks Gemini the question caregivers
 * actually have at 11pm: what do I say right now, and what will make it worse.
 */
export function Caregiver({ state, onExit }: { state: AppState; onExit: () => void }) {
  const [guidance, setGuidance] = useState<CaregiverGuidance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const events = [
    ...state.sosEvents.map((event) => ({
      kind: "sos" as const,
      at: event.at,
      detail: `Craving level ${event.cravingLevel} of 5 — used the SOS flow`,
    })),
    ...state.checkIns.map((checkIn) => ({
      kind: "checkin" as const,
      at: checkIn.at,
      // Trimmed to the server's cap so a long AI summary cannot 400 the request.
      detail: `Mood ${checkIn.mood}, risk ${checkIn.riskScore}/10 — ${checkIn.summary}`.slice(
        0,
        400,
      ),
    })),
  ].sort((a, b) => b.at - a.at);

  const linked = state.profile !== null;

  async function askGemini() {
    if (!state.profile) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ai/caregiver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: state.profile.name,
          substance: state.profile.substance,
          recentEvents: events.slice(0, 20),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "Could not get guidance.");
      setGuidance(body as CaregiverGuidance);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not get guidance just now.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-lg px-5 py-8">
      <div className="grid gap-5">
        <Card>
          <SectionTitle
            title="Caregiver view"
            subtitle={
              state.profile
                ? `Supporting ${state.profile.name || "someone"} · ${events.length} events logged`
                : "No one linked on this device yet."
            }
          />
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-surface-2 p-3">
              <p className="text-2xl font-black text-danger">{state.sosEvents.length}</p>
              <p className="text-xs text-muted">SOS moments</p>
            </div>
            <div className="rounded-xl bg-surface-2 p-3">
              <p className="text-2xl font-black text-accent">{state.checkIns.length}</p>
              <p className="text-xs text-muted">Check-ins</p>
            </div>
            <div className="rounded-xl bg-surface-2 p-3">
              <p className="text-2xl font-black text-safe">{state.journal.length}</p>
              <p className="text-xs text-muted">Triggers mapped</p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 font-bold">What do I say right now?</h3>
          <p className="mb-4 text-sm text-muted">
            {linked
              ? "Zync reads the pattern in the events below and gives you words — including the ones to hold back."
              : "No one is linked on this device yet. Open the recovery side first, finish the four-tap setup, then come back — Zync needs someone to read before it can advise you."}
          </p>
          <PrimaryButton onClick={() => void askGemini()} disabled={loading || !linked}>
            {loading ? "Thinking…" : linked ? "Ask Zync" : "Nobody linked yet"}
          </PrimaryButton>
          {!linked ? (
            <div className="mt-3">
              <PrimaryButton tone="quiet" onClick={onExit}>
                Set up the recovery side
              </PrimaryButton>
            </div>
          ) : null}
          {loading ? (
            <div className="mt-4">
              <Spinner label="Reading the last few days…" />
            </div>
          ) : null}
          {error ? (
            <div className="mt-4">
              <ErrorNote message={error} />
            </div>
          ) : null}
        </Card>

        {guidance ? (
          <Card>
            <p className="text-lg leading-relaxed">{guidance.situation}</p>
            {guidance.say.length ? (
              <div className="mt-5">
                <h4 className="text-sm font-semibold text-safe">Say this</h4>
                <ul className="mt-2 grid gap-2">
                  {guidance.say.map((line, index) => (
                    <li key={index} className="rounded-xl bg-safe/12 p-3 text-base">
                      “{line}”
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {guidance.avoid.length ? (
              <div className="mt-5">
                <h4 className="text-sm font-semibold text-danger">Hold this back</h4>
                <ul className="mt-2 grid gap-2">
                  {guidance.avoid.map((line, index) => (
                    <li key={index} className="rounded-xl bg-danger/12 p-3 text-base">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Card>
        ) : null}

        <Card>
          <h3 className="mb-3 font-bold">Recent activity</h3>
          {events.length ? (
            <ul className="grid gap-3">
              {events.slice(0, 12).map((event, index) => (
                <li key={index} className="rounded-xl bg-surface-2 p-3">
                  <p className="flex items-center justify-between gap-3 text-sm">
                    <span
                      className={`font-bold ${
                        event.kind === "sos" ? "text-danger" : "text-accent"
                      }`}
                    >
                      {event.kind === "sos" ? "SOS" : "Check-in"}
                    </span>
                    <span className="text-muted">{timeAgo(event.at)}</span>
                  </p>
                  <p className="mt-1 text-sm">{event.detail}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">
              Nothing logged yet on this device. Switch to the recovery view, run an SOS
              or a check-in, then come back — the events appear here.
            </p>
          )}
        </Card>

        <Helplines compact />

        <button
          type="button"
          onClick={onExit}
          className="min-h-14 w-full rounded-xl border border-border py-3 font-semibold"
        >
          Back
        </button>
      </div>
    </main>
  );
}
