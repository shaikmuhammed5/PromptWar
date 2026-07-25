"use client";

import { useState } from "react";
import { Card, Chip, PrimaryButton, SectionTitle } from "@/components/ui";
import {
  STREAK_LABELS,
  SUBSTANCE_LABELS,
  TRIGGER_OPTIONS,
  type Profile,
  type StreakBand,
  type Substance,
} from "@/lib/types";

/**
 * Four taps to a usable profile. Everything is a chip except the trusted
 * contact, and even that is skippable — asking a person in crisis to fill a
 * form is how apps like this fail.
 */
export function Onboarding({ onDone }: { onDone: (profile: Profile) => void }) {
  const [step, setStep] = useState(0);
  const [substance, setSubstance] = useState<Substance | null>(null);
  const [streak, setStreak] = useState<StreakBand | null>(null);
  const [triggers, setTriggers] = useState<readonly string[]>([]);
  const [name, setName] = useState("");
  const [thunaiName, setThunaiName] = useState("");
  const [thunaiPhone, setThunaiPhone] = useState("");

  function toggleTrigger(trigger: string) {
    setTriggers((current) =>
      current.includes(trigger)
        ? current.filter((item) => item !== trigger)
        : [...current, trigger],
    );
  }

  function finish() {
    if (!substance || !streak) return;
    onDone({ name, substance, streak, triggers, thunaiName, thunaiPhone });
  }

  return (
    <main className="mx-auto w-full max-w-lg px-5 py-8">
      <p className="mb-6 text-sm text-muted">Step {step + 1} of 4</p>

      {step === 0 ? (
        <Card>
          <SectionTitle
            title="What are you stepping away from?"
            subtitle="This shapes everything Zync says to you. Nothing leaves your phone."
          />
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(SUBSTANCE_LABELS) as Substance[]).map((key) => (
              <Chip
                key={key}
                label={SUBSTANCE_LABELS[key]}
                selected={substance === key}
                onClick={() => {
                  setSubstance(key);
                  setStep(1);
                }}
              />
            ))}
          </div>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card>
          <SectionTitle
            title="How long have you been holding on?"
            subtitle="Day one counts as much as year one."
          />
          <div className="grid gap-3">
            {(Object.keys(STREAK_LABELS) as StreakBand[]).map((key) => (
              <Chip
                key={key}
                label={STREAK_LABELS[key]}
                selected={streak === key}
                onClick={() => {
                  setStreak(key);
                  setStep(2);
                }}
              />
            ))}
          </div>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card>
          <SectionTitle
            title="What usually pulls you back?"
            subtitle="Pick as many as fit. Zync will watch for these."
          />
          <div className="grid grid-cols-2 gap-3">
            {TRIGGER_OPTIONS.map((trigger) => (
              <Chip
                key={trigger}
                label={trigger}
                selected={triggers.includes(trigger)}
                onClick={() => toggleTrigger(trigger)}
              />
            ))}
          </div>
          <div className="mt-5">
            <PrimaryButton onClick={() => setStep(3)}>Next</PrimaryButton>
          </div>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card>
          <SectionTitle
            title="Who is your Thunai?"
            subtitle="One person you would call at 2am. Optional — you can add them later."
          />
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium">
              Your first name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Arun"
                className="min-h-14 rounded-xl border border-border bg-surface-2 px-4 text-base"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Their name
              <input
                value={thunaiName}
                onChange={(event) => setThunaiName(event.target.value)}
                placeholder="Amma"
                className="min-h-14 rounded-xl border border-border bg-surface-2 px-4 text-base"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Their phone
              <input
                value={thunaiPhone}
                onChange={(event) => setThunaiPhone(event.target.value)}
                inputMode="tel"
                placeholder="98xxxxxxxx"
                className="min-h-14 rounded-xl border border-border bg-surface-2 px-4 text-base"
              />
            </label>
            <PrimaryButton onClick={finish}>Enter Zync</PrimaryButton>
          </div>
        </Card>
      ) : null}

      {step > 0 ? (
        <button
          type="button"
          onClick={() => setStep((value) => value - 1)}
          className="mt-5 min-h-12 text-sm text-muted underline"
        >
          Back
        </button>
      ) : null}
    </main>
  );
}
