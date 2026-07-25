"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";
import {
  Card,
  Chip,
  ErrorNote,
  PrimaryButton,
  SectionTitle,
  Spinner,
} from "@/components/ui";
import { speak } from "@/lib/speech";
import { useAiRequest } from "@/lib/use-ai-request";
import type { RefusalScripts } from "@/lib/schemas";
import type { Profile } from "@/lib/types";

const SCENARIOS: readonly string[] = [
  "A party where everyone is drinking",
  "An old friend offering, one on one",
  "A family function with pressure to join",
  "After a brutal day at work",
  "Payday, with money in hand",
  "A wedding or celebration",
];

/** Prevention side of the app: the exact words to say, rehearsed out loud. */
export function Refusal({ profile }: { profile: Profile }) {
  const [scenario, setScenario] = useState("");
  const { data, loading, error, run } = useAiRequest<RefusalScripts>(
    "/api/ai/refusal",
    "Could not write the scripts just now.",
  );

  function generate(chosen: string) {
    setScenario(chosen);
    void run({ profile, scenario: chosen });
  }

  return (
    <section className="grid gap-5">
      <Card>
        <SectionTitle
          title="What will you say?"
          subtitle="Pick where you are headed. Zync writes lines you can actually say out loud."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {SCENARIOS.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={scenario === option}
              onClick={() => generate(option)}
            />
          ))}
        </div>
        {loading ? (
          <div className="mt-4">
            <Spinner label="Writing your lines…" />
          </div>
        ) : null}
        {error ? (
          <div className="mt-4">
            <ErrorNote message={error} />
          </div>
        ) : null}
      </Card>

      {data?.scripts.map((script, index) => (
        <Card key={index}>
          <p className="text-xl font-semibold leading-relaxed">“{script.line}”</p>
          <p className="mt-2 text-sm text-ink-muted">{script.why}</p>
          <div className="mt-4">
            <PrimaryButton tone="secondary" onClick={() => speak(script.line)}>
              <span className="flex items-center justify-center gap-2">
                <Volume2 aria-hidden size={20} /> Hear it out loud
              </span>
            </PrimaryButton>
          </div>
        </Card>
      ))}
    </section>
  );
}
