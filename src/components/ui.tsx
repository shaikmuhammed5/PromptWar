"use client";

import type { ReactNode } from "react";

/**
 * Depth is a surface change, not a shadow.
 *
 * Cards lift off the warm canvas onto a cleaner surface with a hairline border.
 * There are no drop shadows anywhere in this system — the surface shift and the
 * hairline carry the whole hierarchy, which keeps the interface calm and reads
 * identically in light and dark.
 */
export function Card({
  children,
  className = "",
  tone = "raised",
}: {
  children: ReactNode;
  className?: string;
  tone?: "raised" | "tinted";
}) {
  const tones = {
    raised: "bg-surface-1 border-hairline",
    tinted: "bg-surface-2 border-hairline-soft",
  } as const;
  return (
    <div className={`rounded-[12px] border p-6 ${tones[tone]} ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-5">
      <h2 className="t-card-title">{title}</h2>
      {subtitle ? <p className="t-body-sm mt-2 text-ink-muted">{subtitle}</p> : null}
    </header>
  );
}

/** Selectable option. Selected state lifts onto the primary, never a tint alone. */
export function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`pressable t-body-sm min-h-[3.25rem] rounded-[8px] border px-4 py-3 text-left font-medium ${
        selected
          ? "border-ink bg-ink text-on-primary"
          : "border-hairline bg-surface-1 text-ink hover:border-ink-subtle"
      }`}
    >
      {label}
    </button>
  );
}

/**
 * Charcoal is the system primary. Emergency red is reserved for the SOS control
 * and never used to decorate — it is the one thing that must be found without
 * being read.
 */
export function PrimaryButton({
  children,
  onClick,
  disabled,
  tone = "primary",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "primary" | "secondary" | "emergency" | "safe";
  type?: "button" | "submit";
}) {
  const tones = {
    primary: "bg-ink text-on-primary border-ink",
    secondary: "bg-surface-1 text-ink border-hairline hover:border-ink-subtle",
    emergency: "bg-emergency text-white border-emergency",
    safe: "bg-safe text-white border-safe",
  } as const;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`pressable t-button min-h-[2.75rem] w-full rounded-[8px] border px-[18px] py-[10px] disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <p role="status" className="t-body-sm flex items-center gap-3 text-ink-muted">
      <span
        aria-hidden
        className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-subtle border-t-transparent"
      />
      {label}
    </p>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="t-body-sm rounded-[8px] border border-emergency/30 bg-emergency/[0.07] p-3 text-ink"
    >
      {message}
    </p>
  );
}
