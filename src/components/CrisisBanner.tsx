"use client";

import { PhoneCall, TriangleAlert } from "lucide-react";
import type { CrisisAssessment } from "@/lib/crisis";

/**
 * Shown when the deterministic detector fires, above and independent of anything
 * the model said. It renders even if the AI call failed entirely, because the
 * numbers on it are the part that always has to work.
 */
export function CrisisBanner({ assessment }: { assessment: CrisisAssessment }) {
  if (assessment.level === "none") return null;

  const emergency = assessment.level === "emergency";
  const numbers = emergency
    ? [
        { label: "Call 112 now", number: "112" },
        { label: "NMBA helpline", number: "14446" },
      ]
    : [
        { label: "Tele-MANAS", number: "14416" },
        { label: "KIRAN", number: "1800-599-0019" },
        { label: "Emergency", number: "112" },
      ];

  return (
    <div
      role="alert"
      className={`rounded-[12px] border-2 p-5 ${
        emergency ? "border-emergency bg-emergency/[0.12]" : "border-ink bg-fin/[0.1]"
      }`}
    >
      <h2 className="flex items-center gap-2 text-lg font-black">
        <TriangleAlert aria-hidden size={22} />
        {emergency ? "Get help now" : "Please talk to someone"}
      </h2>
      <p className="mt-2 text-base leading-relaxed">{assessment.reason}</p>
      {emergency ? (
        <p className="mt-2 text-base font-semibold">
          If someone has stopped breathing or cannot be woken, call 112 before anything
          else. Stay with them.
        </p>
      ) : null}
      <div className="mt-4 grid gap-2">
        {numbers.map((entry) => (
          <a
            key={entry.number}
            href={`tel:${entry.number.replace(/[^0-9+]/g, "")}`}
            className="flex min-h-14 items-center justify-between rounded-[8px] bg-surface-1 px-4 font-semibold"
          >
            <span className="flex items-center gap-2">
              <PhoneCall aria-hidden size={18} /> {entry.label}
            </span>
            <span className="text-fin">{entry.number}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
