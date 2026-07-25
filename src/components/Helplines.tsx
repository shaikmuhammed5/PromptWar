"use client";

import { HELPLINES } from "@/lib/helplines";
import { Card, SectionTitle } from "@/components/ui";

/**
 * The rail. Real verified numbers, no model call, works when everything else
 * fails. Every error state in the app links back here.
 */
export function Helplines({ compact = false }: { compact?: boolean }) {
  return (
    <section aria-labelledby="helplines-heading">
      {!compact ? (
        <SectionTitle
          title="Talk to a human"
          subtitle="Free, confidential, and answered by trained people."
        />
      ) : (
        <h3 id="helplines-heading" className="mb-2 text-sm font-semibold text-muted">
          Reach a human now
        </h3>
      )}
      <ul className="grid gap-3">
        {HELPLINES.map((line) => (
          <li key={line.number}>
            <a
              href={`tel:${line.number.replace(/[^0-9+]/g, "")}`}
              className="block rounded-xl border border-border bg-surface-2 p-4 transition hover:border-accent"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-semibold">{line.name}</span>
                <span className="text-lg font-bold text-accent">{line.number}</span>
              </span>
              <span className="mt-1 block text-sm text-muted">{line.detail}</span>
            </a>
          </li>
        ))}
      </ul>
      {!compact ? (
        <Card className="mt-4">
          <p className="text-sm text-muted">
            Zync is a companion, not a doctor. If someone has stopped breathing, is
            unconscious, or has taken far more than usual, call{" "}
            <a href="tel:112" className="font-semibold text-danger underline">
              112
            </a>{" "}
            first.
          </p>
        </Card>
      ) : null}
    </section>
  );
}
