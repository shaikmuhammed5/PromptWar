"use client";

import { useEffect, useRef, useState } from "react";
import {
  Gamepad2,
  MessageCircle,
  Mic,
  Send,
  Square,
  Swords,
  Volume2,
} from "lucide-react";
import { CrisisBanner } from "@/components/CrisisBanner";
import { Card, Chip, ErrorNote, PrimaryButton, SectionTitle } from "@/components/ui";
import {
  CHAT_MODES,
  DISTRACT_GAMES,
  ROLEPLAY_PERSONAS,
} from "@/lib/ai/prompts";
import {
  HARD_LIMIT,
  WRAP_UP_AFTER,
  canSend,
  countUserTurns,
  historyWindow,
  minutesElapsed,
  rideProgress,
  sessionStage,
} from "@/lib/chat-session";
import { assessCrisis, type CrisisAssessment } from "@/lib/crisis";
import { listen, speak, type Listener } from "@/lib/speech";
import type { RehearsalScoreResult } from "@/lib/schemas";

import type { ChatMode, ChatTurn, Profile } from "@/lib/types";

const SCENARIOS: readonly string[] = [
  "A party where everyone is drinking",
  "An old friend offering, one on one",
  "A family function with pressure to join",
  "After a brutal day at work",
  "Payday, with money in hand",
];

const MODE_ICONS = {
  talk: MessageCircle,
  practice: Swords,
  distract: Gamepad2,
} as const;

const OPENERS: Readonly<Record<ChatMode, string>> = {
  talk: "Tell me about today.",
  practice: "Start whenever you are ready — I will play them.",
  distract: "Let's go. First move is mine.",
};

type Setup = {
  readonly mode: ChatMode;
  readonly scenario?: string;
  readonly persona?: string;
  readonly game?: string;
  readonly startedAt: number;
};

/**
 * Saathi — the companion chat.
 *
 * Three modes, each with a recovery job: a guided debrief, a refusal rehearsal
 * with a sparring partner, and a genuinely playful distraction for riding out an
 * urge. What it is deliberately not is an open-ended AI friend — sessions have a
 * shape, enforced by a turn counter rather than by asking the model nicely, and
 * every ending points at a person.
 */
export function Chat({
  profile,
  onSessionLogged,
  onRehearsalScored,
}: {
  profile: Profile;
  onSessionLogged: (session: {
    mode: ChatMode;
    startedAt: number;
    turns: readonly ChatTurn[];
    scenario?: string;
    game?: string;
  }) => void;
  onRehearsalScored: (score: {
    scenario: string;
    worked: readonly string[];
    strengthen: string;
    pocketLine: string;
  }) => void;
}) {
  const [setup, setSetup] = useState<Setup | null>(null);
  const [turns, setTurns] = useState<readonly ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [crisis, setCrisis] = useState<CrisisAssessment>({ level: "none", reason: "" });
  const [score, setScore] = useState<RehearsalScoreResult | null>(null);
  const [scoring, setScoring] = useState(false);
  const [listening, setListening] = useState(false);
  const [minutes, setMinutes] = useState(0);

  const listenerRef = useRef<Listener | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      listenerRef.current?.stop();
      abortRef.current?.abort();
    };
  }, []);

  // "Ride it out" is honest about the twenty-minute crest, so it has to tick.
  useEffect(() => {
    if (setup?.mode !== "distract") return;
    const started = setup.startedAt;
    const timer = setInterval(() => setMinutes(minutesElapsed(started, Date.now())), 15_000);
    return () => clearInterval(timer);
  }, [setup]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, streaming]);

  const userTurns = countUserTurns(turns);
  const stage = sessionStage(turns);
  const sendable = canSend(turns);

  function begin(next: Omit<Setup, "startedAt">) {
    const started: Setup = { ...next, startedAt: Date.now() };
    setSetup(started);
    setTurns([]);
    setScore(null);
    setError("");
    setCrisis({ level: "none", reason: "" });
    setMinutes(0);
    void send(OPENERS[next.mode], started, []);
  }

  /**
   * The opener is sent as a user turn so the model has something to answer, but
   * it is not shown in the thread — the conversation should look like the
   * companion spoke first.
   */
  async function send(text: string, active: Setup, existing: readonly ChatTurn[]) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const isOpener = existing.length === 0;
    const outgoing: ChatTurn = { role: "user", text: trimmed, at: Date.now() };
    const nextTurns = isOpener ? existing : [...existing, outgoing];

    if (!isOpener) {
      // Deterministic crisis check on every message the user sends, before the
      // model sees it — the same override the check-in uses.
      const detected = assessCrisis(trimmed);
      if (detected.level !== "none") setCrisis(detected);
      setTurns(nextTurns);
    }

    setDraft("");
    setStreaming(true);
    setError("");

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const history = isOpener
      ? [{ role: "user" as const, text: trimmed }]
      : historyWindow(nextTurns).map((turn) => ({ role: turn.role, text: turn.text }));

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          mode: active.mode,
          profile,
          history,
          scenario: active.scenario,
          persona: active.persona,
          game: active.game,
          userTurns: countUserTurns(nextTurns),
        }),
      });

      if (!response.ok || !response.body) {
        const problem = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(problem?.error ?? "Could not reach the AI service.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      const at = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        if (controller.signal.aborted) return;
        setTurns([...nextTurns, { role: "assistant", text: reply, at }]);
      }
    } catch (caught) {
      if (controller.signal.aborted) return;
      setError(caught instanceof Error ? caught.message : "Could not reach the AI service.");
    } finally {
      if (!controller.signal.aborted) setStreaming(false);
    }
  }

  function startDictation() {
    setListening(true);
    listenerRef.current = listen({
      onPartial: setDraft,
      onFinal: (text) => {
        setDraft(text);
        setListening(false);
      },
      onError: (message) => {
        setError(message);
        setListening(false);
      },
    });
  }

  async function endRehearsal() {
    if (!setup?.scenario || !setup.persona) return;
    setScoring(true);
    setError("");
    try {
      const response = await fetch("/api/ai/chat/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: setup.scenario,
          persona: setup.persona,
          history: turns.map((turn) => ({ role: turn.role, text: turn.text })),
        }),
      });
      if (!response.ok) {
        const problem = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(problem?.error ?? "Could not score the rehearsal.");
      }
      const result = (await response.json()) as RehearsalScoreResult;
      setScore(result);
      onRehearsalScored({ scenario: setup.scenario, ...result });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not score that now.");
    } finally {
      setScoring(false);
    }
  }

  function finish() {
    if (setup && turns.length > 0) {
      onSessionLogged({
        mode: setup.mode,
        startedAt: setup.startedAt,
        turns,
        scenario: setup.scenario,
        game: setup.game,
      });
    }
    abortRef.current?.abort();
    listenerRef.current?.stop();
    setSetup(null);
    setTurns([]);
    setScore(null);
    setDraft("");
    setError("");
  }

  if (!setup) {
    return (
      <ModePicker
        onStart={begin}
        scenarios={SCENARIOS}
        personas={ROLEPLAY_PERSONAS}
        games={DISTRACT_GAMES}
      />
    );
  }

  return (
    <section className="grid gap-4">
      <CrisisBanner assessment={crisis} />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">
              {CHAT_MODES.find((mode) => mode.id === setup.mode)?.title}
            </h2>
            <p className="text-sm text-ink-muted">
              {setup.scenario ?? setup.game ?? "Saathi is listening"}
            </p>
          </div>
          <button
            type="button"
            onClick={finish}
            className="min-h-12 rounded-[8px] border border-hairline px-4 text-sm font-semibold"
          >
            End session
          </button>
        </div>

        {setup.mode === "distract" ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-ink-muted">
              <span>{minutes} min ridden out</span>
              <span>urges usually crest by 20</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-safe transition-all"
                style={{ width: `${rideProgress(setup.startedAt, Date.now()) * 100}%` }}
              />
            </div>
          </div>
        ) : null}
      </Card>

      <div className="grid gap-3">
        {turns.map((turn, index) => (
          <div
            key={index}
            className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-[12px] px-4 py-3 text-base leading-relaxed ${
                turn.role === "user"
                  ? "bg-ink text-on-primary"
                  : turn.text.startsWith("Coach:")
                    ? "border border-fin/40 bg-fin/[0.08]"
                    : "border border-hairline bg-surface-1"
              }`}
            >
              {turn.text}
              {turn.role === "assistant" && !streaming ? (
                <button
                  type="button"
                  onClick={() => speak(turn.text)}
                  aria-label="Read this aloud"
                  className="mt-2 flex items-center gap-1 text-xs text-ink-muted"
                >
                  <Volume2 aria-hidden size={14} /> Read aloud
                </button>
              ) : null}
            </div>
          </div>
        ))}
        {streaming && turns[turns.length - 1]?.role !== "assistant" ? (
          <p className="text-sm text-ink-muted" role="status">
            Saathi is typing…
          </p>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {error ? <ErrorNote message={error} /> : null}

      {stage === "wrapping" && sendable ? (
        <p className="rounded-[8px] bg-surface-2 p-3 text-sm text-ink-muted">
          You have been here a while — {userTurns} of {HARD_LIMIT} messages. Zync is a
          bridge to people, not a replacement for them.
        </p>
      ) : null}

      {!sendable ? (
        <Card>
          <h3 className="font-bold">That is enough for now</h3>
          <p className="mt-2 text-sm text-ink-muted">
            This session has run its length on purpose. Talking to a person will do more
            than talking to me.{" "}
            {profile.anchorName
              ? `Could you message ${profile.anchorName}?`
              : "Could you message someone you trust?"}
          </p>
          <div className="mt-4 grid gap-3">
            {profile.anchorPhone ? (
              <a
                href={`tel:${profile.anchorPhone.replace(/[^0-9+]/g, "")}`}
                className="flex min-h-14 items-center justify-center rounded-[8px] bg-safe px-5 font-semibold text-white"
              >
                Call {profile.anchorName || "your anchor"}
              </a>
            ) : null}
            <PrimaryButton tone="secondary" onClick={finish}>
              Close this session
            </PrimaryButton>
          </div>
        </Card>
      ) : null}

      {setup.mode === "practice" && turns.length > 1 && !score ? (
        <PrimaryButton tone="secondary" onClick={() => void endRehearsal()} disabled={scoring}>
          {scoring ? "Scoring…" : "End rehearsal and score me"}
        </PrimaryButton>
      ) : null}

      {score ? (
        <Card>
          <h3 className="text-lg font-bold">How that went</h3>
          {score.worked.length ? (
            <ul className="mt-3 grid gap-2">
              {score.worked.map((item, index) => (
                <li key={index} className="rounded-[8px] bg-safe/[0.09] p-3 text-base">
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-4 text-sm text-ink-muted">{score.strengthen}</p>
          <div className="mt-4 rounded-[8px] border border-fin/40 bg-fin/[0.08] p-4">
            <h4 className="text-sm font-semibold text-fin">Keep this in your pocket</h4>
            <p className="mt-1 text-lg">“{score.pocketLine}”</p>
            <button
              type="button"
              onClick={() => speak(score.pocketLine)}
              className="mt-2 flex items-center gap-1 text-xs text-ink-muted"
            >
              <Volume2 aria-hidden size={14} /> Hear it
            </button>
          </div>
        </Card>
      ) : null}

      {sendable ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (setup) void send(draft, setup, turns);
          }}
          className="sticky bottom-4 flex gap-2 rounded-[12px] border border-hairline bg-surface-1 p-2"
        >
          <button
            type="button"
            onClick={listening ? () => listenerRef.current?.stop() : startDictation}
            aria-label={listening ? "Stop dictating" : "Dictate a message"}
            aria-pressed={listening}
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[8px] border ${
              listening ? "border-emergency bg-emergency/[0.09]" : "border-hairline bg-surface-2"
            }`}
          >
            {listening ? <Square aria-hidden size={20} /> : <Mic aria-hidden size={20} />}
          </button>
          <label className="sr-only" htmlFor="chat-draft">
            Your message
          </label>
          <input
            id="chat-draft"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={listening ? "Listening…" : "Say something…"}
            className="min-h-14 flex-1 rounded-[8px] border border-hairline bg-surface-2 px-4 text-base"
          />
          <button
            type="submit"
            disabled={streaming || !draft.trim()}
            aria-label="Send"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[8px] bg-ink text-on-primary disabled:opacity-40"
          >
            <Send aria-hidden size={20} />
          </button>
        </form>
      ) : null}
    </section>
  );
}

function ModePicker({
  onStart,
  scenarios,
  personas,
  games,
}: {
  onStart: (setup: { mode: ChatMode; scenario?: string; persona?: string; game?: string }) => void;
  scenarios: readonly string[];
  personas: readonly string[];
  games: readonly string[];
}) {
  const [mode, setMode] = useState<ChatMode | null>(null);
  const [scenario, setScenario] = useState(scenarios[0]);
  const [persona, setPersona] = useState(personas[0]);
  const [game, setGame] = useState(games[0]);

  return (
    <section className="grid gap-5">
      <Card>
        <SectionTitle
          title="Saathi"
          subtitle="Someone to talk to, practise against, or play with. Every mode ends by pointing you back at people."
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {CHAT_MODES.map((option) => {
            const Icon = MODE_ICONS[option.id];
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setMode(option.id)}
                aria-pressed={mode === option.id}
                className={`rounded-[12px] border p-4 text-left transition ${
                  mode === option.id
                    ? "border-ink bg-fin/[0.08]"
                    : "border-hairline bg-surface-2 hover:border-ink-subtle"
                }`}
              >
                <Icon aria-hidden size={22} className="text-fin" />
                <span className="mt-2 block font-bold">{option.title}</span>
                <span className="mt-1 block text-sm text-ink-muted">{option.blurb}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {mode === "practice" ? (
        <Card>
          <h3 className="font-bold">What are you walking into?</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {scenarios.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={scenario === option}
                onClick={() => setScenario(option)}
              />
            ))}
          </div>
          <h3 className="mt-5 font-bold">Who should I be?</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {personas.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={persona === option}
                onClick={() => setPersona(option)}
              />
            ))}
          </div>
          <p className="mt-4 text-sm text-ink-muted">
            I will push back, but only twice — like most people actually do. If it stops
            being practice, I break character.
          </p>
        </Card>
      ) : null}

      {mode === "distract" ? (
        <Card>
          <h3 className="font-bold">Pick something to play</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {games.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={game === option}
                onClick={() => setGame(option)}
              />
            ))}
          </div>
          <p className="mt-4 text-sm text-ink-muted">
            No recovery talk unless you start it. The point is that your attention is
            somewhere else while the urge falls.
          </p>
        </Card>
      ) : null}

      {mode ? (
        <PrimaryButton
          onClick={() =>
            onStart({
              mode,
              scenario: mode === "practice" ? scenario : undefined,
              persona: mode === "practice" ? persona : undefined,
              game: mode === "distract" ? game : undefined,
            })
          }
        >
          Start
        </PrimaryButton>
      ) : null}

      <p className="text-center text-xs text-ink-muted">
        Sessions run to about {WRAP_UP_AFTER} messages before Saathi starts winding down.
        That limit is deliberate.
      </p>
    </section>
  );
}
