"use client";

import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { Card, ErrorNote, PrimaryButton, SectionTitle, Spinner } from "@/components/ui";
import { CRAFT_MODULES, type CraftModuleId } from "@/lib/ai/prompts";
import { useAiRequest } from "@/lib/use-ai-request";
import type { CraftResponse } from "@/lib/schemas";
import type { Substance } from "@/lib/types";

function List({
  title,
  items,
  tone = "neutral",
}: {
  title: string;
  items: readonly string[] | undefined;
  tone?: "neutral" | "good" | "bad";
}) {
  if (!items?.length) return null;
  const tones = {
    neutral: "bg-surface-2",
    good: "bg-safe/[0.09]",
    bad: "bg-emergency/[0.07]",
  } as const;
  return (
    <div className="mt-5">
      <h4 className="text-sm font-semibold text-ink-muted">{title}</h4>
      <ul className="mt-2 grid gap-2">
        {items.map((item, index) => (
          <li key={index} className={`rounded-[8px] p-3 text-base ${tones[tone]}`}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * CRAFT training for the caregiver.
 *
 * This is the evidence-based half of family support: rather than telling a
 * caregiver to detach or to confront, it teaches them to change what their own
 * behaviour rewards. Every module is a live model call against their real
 * situation — the point is coaching on their words, not a leaflet.
 */
export function Craft({ substance }: { substance: Substance }) {
  const [moduleId, setModuleId] = useState<CraftModuleId | null>(null);
  const [situation, setSituation] = useState("");
  const {
    data: result,
    loading,
    error,
    run,
    reset,
  } = useAiRequest<CraftResponse>("/api/ai/craft", "Could not build your coaching.");

  const active = CRAFT_MODULES.find((module) => module.id === moduleId);

  function coach() {
    if (!moduleId || !situation.trim()) return;
    void run({ moduleId, substance, situation: situation.trim() });
  }

  return (
    <section className="grid gap-5">
      <Card>
        <SectionTitle
          title="Family training"
          subtitle="CRAFT — the approach that gets more people into treatment than confrontation does, by changing what you do rather than what you demand."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {CRAFT_MODULES.map((module) => (
            <button
              key={module.id}
              type="button"
              onClick={() => {
                setModuleId(module.id);
                reset();
              }}
              aria-pressed={moduleId === module.id}
              className={`rounded-[12px] border p-4 text-left transition ${
                moduleId === module.id
                  ? "border-ink bg-fin/[0.08]"
                  : "border-hairline bg-surface-2 hover:border-ink-subtle"
              }`}
            >
              <span className="flex items-center gap-2 font-bold">
                <GraduationCap aria-hidden size={18} className="text-fin" />
                {module.title}
              </span>
              <span className="mt-1 block text-sm text-ink-muted">{module.blurb}</span>
            </button>
          ))}
        </div>
      </Card>

      {active ? (
        <Card>
          <h3 className="font-bold">{active.title}</h3>
          <label className="mt-3 grid gap-2 text-sm font-medium">
            {moduleId === "communication"
              ? "What do you want to say to them? Type it exactly as you would say it."
              : "Describe what has been happening. Concrete beats tidy."}
            <textarea
              value={situation}
              onChange={(event) => setSituation(event.target.value)}
              rows={4}
              placeholder={
                moduleId === "communication"
                  ? "You promised you would stop and you lied to me again…"
                  : "He drinks after work most days. It got worse after he lost the job in March…"
              }
              className="rounded-[8px] border border-hairline bg-surface-2 p-4 text-base"
            />
          </label>
          <div className="mt-4">
            <PrimaryButton onClick={coach} disabled={loading || !situation.trim()}>
              {loading ? "Working…" : "Coach me through this"}
            </PrimaryButton>
          </div>
          {loading ? (
            <div className="mt-4">
              <Spinner label="Thinking it through with you…" />
            </div>
          ) : null}
          {error ? (
            <div className="mt-4">
              <ErrorNote message={error} />
            </div>
          ) : null}
        </Card>
      ) : null}

      {result ? (
        <Card>
          <h3 className="text-xl font-bold">{result.heading}</h3>

          {result.rewrite ? (
            <div className="mt-4 rounded-[8px] bg-safe/[0.09] p-4">
              <h4 className="text-sm font-semibold text-safe">Say it like this</h4>
              <p className="mt-2 text-lg leading-relaxed">“{result.rewrite}”</p>
            </div>
          ) : null}
          {result.why ? <p className="mt-3 text-sm text-ink-muted">{result.why}</p> : null}

          <List title="Triggers to watch" items={result.triggers} />
          <List title="What using does for them" items={result.shortTermPayoff} />
          <List title="What it costs them" items={result.longTermCost} tone="bad" />
          <List title="Where you have leverage" items={result.leverage} tone="good" />

          <List title="Reward these" items={result.rewardThese} tone="good" />
          <List title="How to reward" items={result.howToReward} />
          <List title="Withdraw gently during use" items={result.withdrawGently} tone="bad" />

          <List title="This may be enabling" items={result.likelyEnabling} tone="bad" />
          <List title="Try instead" items={result.insteadTry} tone="good" />
          <List title="Keep doing this" items={result.keepDoing} tone="good" />

          <List title="Avoid these phrasings" items={result.avoid} tone="bad" />

          {result.practice ? (
            <p className="mt-5 rounded-[8px] bg-surface-2 p-3 text-sm">{result.practice}</p>
          ) : null}
          {result.nextStep ? (
            <div className="mt-5 rounded-[8px] border border-fin/40 bg-fin/[0.08] p-4">
              <h4 className="text-sm font-semibold text-fin">Start here</h4>
              <p className="mt-1 text-base">{result.nextStep}</p>
            </div>
          ) : null}
        </Card>
      ) : null}
    </section>
  );
}
