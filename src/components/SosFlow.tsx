"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Breathe } from "@/components/Breathe";
import { Helplines } from "@/components/Helplines";
import { Card, ErrorNote, PrimaryButton, Spinner } from "@/components/ui";
import { speak, stopSpeaking } from "@/lib/speech";
import type { Profile } from "@/lib/types";

const CRAVING_FACES = [
  { level: 1, face: "🙂", label: "A faint pull" },
  { level: 2, face: "😕", label: "Nagging at me" },
  { level: 3, face: "😣", label: "Hard to ignore" },
  { level: 4, face: "😖", label: "Very strong" },
  { level: 5, face: "😰", label: "About to use" },
] as const;

type Stage = "scale" | "script";

/**
 * The hero flow, and the whole reason the app exists: two taps from panic to a
 * personalised script that is spoken aloud. No typing, no menus, no reading
 * required — a person mid-craving can follow it with their eyes closed.
 */
export function SosFlow({
  profile,
  onLogged,
  onExit,
}: {
  profile: Profile;
  onLogged: (cravingLevel: number, script: string) => void;
  onExit: () => void;
}) {
  const [stage, setStage] = useState<Stage>("scale");
  const [cravingLevel, setCravingLevel] = useState(0);
  const [script, setScript] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [breathing, setBreathing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  /** Leaving the flow must also silence it — TTS outliving the screen is jarring. */
  const abandon = useCallback(() => {
    abortRef.current?.abort();
    stopSpeaking();
  }, []);

  useEffect(() => abandon, [abandon]);

  async function requestScript(level: number) {
    setCravingLevel(level);
    setStage("script");
    setStreaming(true);
    setError("");
    setScript("");

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/ai/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          profile,
          cravingLevel: level,
          // The script references time of day, so it must be the user's clock.
          hour: new Date().getHours(),
        }),
      });

      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Could not reach the AI service.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setScript(full);
      }

      // Abandoned mid-stream: log nothing, and above all do not start talking.
      if (controller.signal.aborted) return;

      // Speak once the full script exists, so the voice is not chopped mid-word.
      if (full.trim()) speak(full);
      onLogged(level, full);
    } catch (caught) {
      if (controller.signal.aborted) return;
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not reach the AI service just now.",
      );
    } finally {
      if (!controller.signal.aborted) setStreaming(false);
    }
  }

  if (breathing) {
    return (
      <main className="mx-auto w-full max-w-lg px-5 py-8">
        <Breathe onClose={() => setBreathing(false)} />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg px-5 py-8">
      {stage === "scale" ? (
        <Card>
          <h1 className="text-3xl font-black">How strong is it right now?</h1>
          <p className="mt-2 text-muted">
            One tap. That is all Zync needs. Nee thaniya illa.
          </p>
          <div className="mt-6 grid gap-3">
            {CRAVING_FACES.map((option) => (
              <button
                key={option.level}
                type="button"
                onClick={() => requestScript(option.level)}
                className="flex min-h-20 items-center gap-4 rounded-2xl border border-border bg-surface-2 px-5 text-left transition hover:border-accent"
              >
                <span aria-hidden className="text-4xl">
                  {option.face}
                </span>
                <span className="text-lg font-semibold">{option.label}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              abandon();
              onExit();
            }}
            className="mt-6 min-h-12 w-full text-sm text-muted underline"
          >
            Go back
          </button>
        </Card>
      ) : null}

      {stage === "script" ? (
        <div className="grid gap-5">
          <Card>
            <h1 className="text-2xl font-black">Do this with me</h1>
            {streaming && !script ? (
              <div className="mt-4">
                <Spinner label="Zync is writing your steps…" />
              </div>
            ) : null}

            {script ? (
              <div
                aria-live="polite"
                className="mt-4 whitespace-pre-wrap text-lg leading-relaxed"
              >
                {script}
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 grid gap-3">
                <ErrorNote message={error} />
                <p className="text-sm text-muted">
                  The steps below still work without any AI. Start with breathing.
                </p>
              </div>
            ) : null}

            {script && !streaming ? (
              <div className="mt-5 grid gap-3">
                <PrimaryButton tone="quiet" onClick={() => speak(script)}>
                  🔊 Read it to me again
                </PrimaryButton>
              </div>
            ) : null}
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-bold">Right now, you can also</h2>
            <div className="grid gap-3">
              {profile.thunaiPhone ? (
                <a
                  href={`tel:${profile.thunaiPhone.replace(/[^0-9+]/g, "")}`}
                  className="flex min-h-14 items-center justify-center rounded-xl bg-safe px-5 font-semibold text-[#05230f]"
                >
                  📞 Call {profile.thunaiName || "your Thunai"}
                </a>
              ) : null}
              <PrimaryButton
                tone="quiet"
                onClick={() => {
                  abandon();
                  setBreathing(true);
                }}
              >
                🫁 Breathe with me
              </PrimaryButton>
              <a
                href="tel:14416"
                className="flex min-h-14 items-center justify-center rounded-xl border border-border bg-surface-2 px-5 font-semibold"
              >
                ☎️ Tele-MANAS 14416
              </a>
            </div>
          </Card>

          {error ? <Helplines compact /> : null}

          <button
            type="button"
            onClick={() => {
              abandon();
              onExit();
            }}
            className="min-h-14 w-full rounded-xl border border-border py-3 font-semibold"
          >
            I am steadier now
          </button>
          <p className="text-center text-xs text-muted">
            Craving logged at level {cravingLevel} of 5. Your caregiver view will show
            this.
          </p>
        </div>
      ) : null}
    </main>
  );
}
