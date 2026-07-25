"use client";

import { useState } from "react";
import { Card, Chip, ErrorNote, PrimaryButton, SectionTitle, Spinner } from "@/components/ui";
import { speak } from "@/lib/speech";
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
  const [scripts, setScripts] = useState<RefusalScripts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate(chosen: string) {
    setScenario(chosen);
    setLoading(true);
    setError("");
    setScripts(null);
    try {
      const response = await fetch("/api/ai/refusal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, scenario: chosen }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "Could not write the scripts.");
      setScripts(body as RefusalScripts);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not write the scripts now.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid gap-5">
      <Card>
        <SectionTitle
          title="What will you say?"
          subtitle="Pick where you are headed. Thunai writes lines you can actually say out loud."
        />
        <div className="grid gap-3">
          {SCENARIOS.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={scenario === option}
              onClick={() => void generate(option)}
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

      {scripts
        ? scripts.scripts.map((script, index) => (
            <Card key={index}>
              <p className="text-xl font-semibold leading-relaxed">“{script.line}”</p>
              <p className="mt-2 text-sm text-muted">{script.why}</p>
              <div className="mt-4">
                <PrimaryButton tone="quiet" onClick={() => speak(script.line)}>
                  🔊 Hear it out loud
                </PrimaryButton>
              </div>
            </Card>
          ))
        : null}
    </section>
  );
}
