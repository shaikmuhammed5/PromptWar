"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { CrisisBanner } from "@/components/CrisisBanner";
import { assessCrisis, escalateForRisk, type CrisisAssessment } from "@/lib/crisis";
import { Card, ErrorNote, PrimaryButton, SectionTitle, Spinner } from "@/components/ui";
import { listen, type Listener } from "@/lib/speech";
import { useAiRequest } from "@/lib/use-ai-request";
import type { CheckInAnalysis } from "@/lib/schemas";
import type { Profile } from "@/lib/types";

const TOOL_LABELS: Readonly<Record<string, string>> = {
  sos: "Open SOS now",
  breathe: "Breathe with me",
  "call-anchor": "Call your anchor",
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
  const {
    data: analysis,
    loading: analysing,
    error: aiError,
    run,
    reset,
  } = useAiRequest<CheckInAnalysis>("/api/ai/checkin", "Could not analyse that just now.");
  const [crisis, setCrisis] = useState<CrisisAssessment>({ level: "none", reason: "" });
  const [speechError, setSpeechError] = useState("");
  const listenerRef = useRef<Listener | null>(null);

  useEffect(() => () => listenerRef.current?.stop(), []);

  function startListening() {
    setSpeechError("");
    reset();
    setCrisis({ level: "none", reason: "" });
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
        setSpeechError(message);
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
      setSpeechError("Nothing was captured. Try again, or write it instead.");
      return;
    }

    // Deterministic first: this must fire even if the model call never lands.
    setSpeechError("");
    setCrisis(assessCrisis(trimmed));

    const result = await run({ profile, transcript: trimmed });
    if (!result) return;

    setCrisis((current) => escalateForRisk(current, result.riskScore));
    onAnalysed(trimmed, result);
  }

  const error = speechError || aiError;

  const tone = analysis ? riskTone(analysis.riskScore) : null;

  return (
    <section className="grid gap-5">
      <CrisisBanner assessment={crisis} />

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
          {listening ? (
            <Square aria-hidden size={44} strokeWidth={1.75} />
          ) : (
            <Mic aria-hidden size={44} strokeWidth={1.75} />
          )}
          {listening ? "Listening — tap to finish" : "Tap and speak"}
        </button>

        {/*
          The typed path is always present, never gated on speech being broken.
          Dictation depends on a remote service, a microphone, and a permission
          prompt — three things that fail routinely — and the check-in is too
          important to lose when any of them does. Speech fills this box in, so
          both routes end in the same place.
        */}
        <div className="mt-4 grid gap-3">
          <label className="grid gap-2 text-sm text-muted">
            Or write it — same analysis either way. Speaking fills this in.
            <textarea
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              rows={3}
              placeholder="Today was rough, I nearly went into the bar near work…"
              className="rounded-xl border border-border bg-surface-2 p-4 text-base italic text-foreground"
            />
          </label>
          <PrimaryButton
            onClick={() => void analyse(transcript)}
            disabled={analysing || !transcript.trim()}
          >
            {analysing ? "Reading it…" : "Analyse this"}
          </PrimaryButton>
        </div>

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
