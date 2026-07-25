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
import type { Lesson } from "@/lib/schemas";
import type { Profile } from "@/lib/types";

const TOPICS: readonly string[] = [
  "What withdrawal is doing to my body",
  "Why relapse is information, not failure",
  "Telling my family without a fight",
  "Rebuilding sleep after quitting",
  "Handling the first sober celebration",
  "Money I get back, month by month",
];

/** Lessons are generated per person and stage, not served from a content table. */
export function Learn({ profile }: { profile: Profile }) {
  const [topic, setTopic] = useState("");
  const [answers, setAnswers] = useState<Readonly<Record<number, number>>>({});
  const {
    data: lesson,
    loading,
    error,
    run,
  } = useAiRequest<Lesson>("/api/ai/learn", "Could not write the lesson just now.");

  function load(chosen: string) {
    setTopic(chosen);
    setAnswers({});
    void run({ profile, topic: chosen });
  }

  return (
    <section className="grid gap-5">
      <Card>
        <SectionTitle
          title="Understand what is happening to you"
          subtitle="Written for your substance and your stage, not copied from a pamphlet."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {TOPICS.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={topic === option}
              onClick={() => load(option)}
            />
          ))}
        </div>
        {loading ? (
          <div className="mt-4">
            <Spinner label="Writing your lesson…" />
          </div>
        ) : null}
        {error ? (
          <div className="mt-4">
            <ErrorNote message={error} />
          </div>
        ) : null}
      </Card>

      {lesson ? (
        <>
          <Card>
            <h3 className="text-xl font-bold">{lesson.title}</h3>
            <div className="mt-3 whitespace-pre-wrap text-base leading-relaxed">
              {lesson.body}
            </div>
            <div className="mt-4">
              <PrimaryButton tone="quiet" onClick={() => speak(lesson.body)}>
                <span className="flex items-center justify-center gap-2">
                  <Volume2 aria-hidden size={20} /> Read this to me
                </span>
              </PrimaryButton>
            </div>
          </Card>

          {lesson.quiz.map((question, questionIndex) => {
            const chosen = answers[questionIndex];
            const answered = chosen !== undefined;
            return (
              <Card key={questionIndex}>
                <p className="font-semibold">{question.question}</p>
                <div className="mt-3 grid gap-2">
                  {question.options.map((option, optionIndex) => {
                    const isAnswer = optionIndex === question.answerIndex;
                    const isChosen = chosen === optionIndex;
                    const style = !answered
                      ? "border-border bg-surface-2"
                      : isAnswer
                        ? "border-safe bg-safe/15"
                        : isChosen
                          ? "border-danger bg-danger/15"
                          : "border-border bg-surface-2 opacity-60";
                    return (
                      <button
                        key={optionIndex}
                        type="button"
                        disabled={answered}
                        onClick={() =>
                          setAnswers((current) => ({
                            ...current,
                            [questionIndex]: optionIndex,
                          }))
                        }
                        className={`min-h-14 rounded-xl border px-4 py-3 text-left ${style}`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                {answered ? (
                  <p className="mt-3 text-sm text-muted">{question.explanation}</p>
                ) : null}
              </Card>
            );
          })}
        </>
      ) : null}
    </section>
  );
}
