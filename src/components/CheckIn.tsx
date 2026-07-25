"use client";

import { useEffect, useRef, useState } from "react";
import { Card, ErrorNote, PrimaryButton, SectionTitle, Spinner } from "@/components/ui";
import { isSpeechInputSupported, listen, type Listener } from "@/lib/speech";
import type { CheckInAnalysis } from "@/lib/schemas";
import type { Profile } from "@/lib/types";

const TOOL_LABELS: Readonly<Record<string, string>> = {
  sos: "Open SOS now",
  breathe: "Breathe with me",
  "call-thunai": "Call your Thunai",
  helpline: "Talk to a helpline",
  journal: "Photograph the trigger",
  refusal: "Rehearse a refusal",
  learn: "Read something short",
};

function riskTone(score: number): { label: string; className: string } {
  if (score >= 7) return { label: "High risk", className: "bg-danger/20 text-[#ffc9cb]" };
  if (score >= 4)
    return { label: "Wobbling", className: "bg-accent/20 text-[#ffddab]" };
  return { label: "Steady", className: "bg-safe/20 text-[#b6f5cd]" };
}

/**
 * Speak, don't type. The transcript goes to Gemini, which returns a structured
 * risk read-out — and the risk score decides which safety tools appear. That
 * link is what makes the tools contextual rather than a fixed menu.
 */
export function CheckIn({
  profile,
  onAnalysed,
  onOpenTool,
}: {
  profile: Profile;
  onAnalysed: (transcript: string, analysis: CheckInAnalysis) => void;
  onOpenTool: (tool: string) => void;
}) {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [analysis, setAnalysis] = useState<CheckInAnalysis | null>(null);
  const [error, setError] = useState("");
  const listenerRef = useRef<Listener | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  useEffect(() => {
    setSpeechSupported(isSpeechInputSupported());
    return () => listenerRef.current?.stop();
  }, []);

  function startListening() {
    setError("");
    setAnalysis(null);
    setTranscript("");
    setListening(true);
    listenerRef.current = listen({
      onPartial: setTranscript,
      onFinal: (text) => {
        setTranscript(text);
        setListening(false);
        void analyse(text);
      },
      onError: (message) => {
        setError(message);
        setListening(false);
      },
    });
  }

  function stopListening() {
    listenerRef.current?.stop();
    setListening(false);
  }

  async function analyse(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Nothing was captured. Try again, or type it instead.");
      return;
    }
    setAnalysing(true);
    setError("");
    try {
      const response = await fetch("/api/ai/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, transcript: trimmed }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "Analysis failed.");
      const result = body as CheckInAnalysis;
      setAnalysis(result);
      onAnalysed(trimmed, result);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not analyse that just now.",
      );
    } finally {
      setAnalysing(false);
    }
  }

  const tone = analysis ? riskTone(analysis.riskScore) : null;

  return (
    <section className="grid gap-5">
      <Card>
        <SectionTitle
          title="How is today going?"
          subtitle="Press and talk. No typing, no right answer."
        />

        <button
          type="button"
          onClick={listening ? stopListening : startListening}
          aria-pressed={listening}
          className={`flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 text-lg font-bold transition ${
            listening
              ? "border-danger bg-danger/15 text-[#ffc9cb]"
              : "border-border bg-surface-2 hover:border-accent"
          }`}
        >
          <span aria-hidden className="text-5xl">
            {listening ? "⏹️" : "🎙️"}
          </span>
          {listening ? "Listening — tap to finish" : "Tap and speak"}
        </button>

        {transcript ? (
          <p className="mt-4 rounded-xl bg-surface-2 p-4 text-base italic">
            “{transcript}”
          </p>
        ) : null}

        {!speechSupported ? (
          <div className="mt-4 grid gap-3">
            <p className="text-sm text-muted">
              This browser cannot listen. Type it instead — the analysis is identical.
            </p>
            <textarea
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              rows={3}
              placeholder="Today was rough…"
              className="rounded-xl border border-border bg-surface-2 p-4 text-base"
            />
            <PrimaryButton
              onClick={() => void analyse(transcript)}
              disabled={analysing || !transcript.trim()}
            >
              Analyse this
            </PrimaryButton>
          </div>
        ) : null}

        {analysing ? (
          <div className="mt-4">
            <Spinner label="Zync is listening between the lines…" />
          </div>
        ) : null}
        {error ? (
          <div className="mt-4">
            <ErrorNote message={error} />
          </div>
        ) : null}
      </Card>

      {analysis && tone ? (
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${tone.className}`}>
              {tone.label} · {analysis.riskScore}/10
            </span>
            <span className="rounded-full bg-surface-2 px-3 py-1 text-sm capitalize">
              {analysis.mood}
            </span>
          </div>

          <p className="mt-4 text-lg leading-relaxed">{analysis.summary}</p>

          {analysis.triggersDetected.length ? (
            <p className="mt-3 text-sm text-muted">
              Triggers Zync heard: {analysis.triggersDetected.join(", ")}
            </p>
          ) : null}

          {analysis.toolsRecommended.length ? (
            <div className="mt-5">
              <h3 className="mb-3 text-sm font-semibold text-muted">
                Because of what you said, start here
              </h3>
              <div className="grid gap-3">
                {analysis.toolsRecommended.map((tool) => (
                  <PrimaryButton
                    key={tool}
                    tone={tool === "sos" ? "danger" : "quiet"}
                    onClick={() => onOpenTool(tool)}
                  >
                    {TOOL_LABELS[tool] ?? tool}
                  </PrimaryButton>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}
    </section>
  );
}
