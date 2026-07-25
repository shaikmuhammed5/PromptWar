"use client";

import type { ReactNode } from "react";
import {
  BookOpen,
  Camera,
  Home,
  Mic,
  MessageSquareQuote,
  Phone,
  ShieldAlert,
  Wind,
} from "lucide-react";
import type { View } from "@/lib/navigation";

export const TABS: readonly { view: View; Icon: typeof Mic; label: string }[] = [
  { view: "checkin", Icon: Mic, label: "Check in" },
  { view: "refusal", Icon: MessageSquareQuote, label: "Say no" },
  { view: "journal", Icon: Camera, label: "Triggers" },
  { view: "learn", Icon: BookOpen, label: "Learn" },
  { view: "helplines", Icon: Phone, label: "Helplines" },
];

const NAV = [{ view: "home" as View, Icon: Home, label: "Home" }, ...TABS];

/**
 * Two layouts, one tree. Mobile keeps the thumb-first single column with a
 * floating SOS; from `md` upward a persistent rail carries SOS and the whole
 * navigation, so nothing on desktop is more than one click away.
 */
export function AppShell({
  name,
  view,
  onNavigate,
  onBack,
  children,
}: {
  name: string;
  view: View;
  onNavigate: (view: View) => void;
  onBack: () => void;
  children: ReactNode;
}) {
  const greeting = name ? `Hello, ${name}` : "Hello";

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-8 px-5 pb-28 pt-6 md:pb-8">
      <aside className="hidden w-60 shrink-0 md:block">
        <div className="sticky top-6 grid gap-4">
          <div>
            <p className="text-sm text-muted">{greeting}</p>
            <h1 className="text-2xl font-black">
              Zync<span className="text-accent">.</span>
            </h1>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("sos")}
            className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-danger font-bold text-white"
          >
            <ShieldAlert aria-hidden size={22} /> I need help now
          </button>
          <nav className="grid gap-1">
            {NAV.map((item) => (
              <button
                key={item.view}
                type="button"
                onClick={() => onNavigate(item.view)}
                aria-current={view === item.view ? "page" : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition ${
                  view === item.view
                    ? "bg-surface-2 text-foreground"
                    : "text-muted hover:bg-surface"
                }`}
              >
                <item.Icon aria-hidden size={18} className="text-accent" />
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onNavigate("breathe")}
              className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-muted transition hover:bg-surface"
            >
              <Wind aria-hidden size={18} className="text-accent" /> Breathe
            </button>
          </nav>
          <button
            type="button"
            onClick={() => onNavigate("caregiver")}
            className="min-h-12 rounded-xl border border-border px-4 text-sm font-semibold"
          >
            Caregiver view
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="mb-6 flex items-start justify-between gap-4 md:hidden">
          <div>
            <p className="text-sm text-muted">{greeting}</p>
            <h1 className="text-2xl font-black">
              Zync<span className="text-accent">.</span>
            </h1>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("caregiver")}
            className="min-h-12 rounded-xl border border-border px-4 text-sm font-semibold"
          >
            Caregiver view
          </button>
        </header>

        {children}

        {view !== "home" ? (
          <>
            <button
              type="button"
              onClick={onBack}
              className="mt-6 min-h-14 w-full rounded-xl border border-border py-3 font-semibold"
            >
              Back
            </button>
            {/* SOS stays one tap away from every screen on mobile. */}
            <button
              type="button"
              onClick={() => onNavigate("sos")}
              aria-label="Emergency help now"
              className="fixed bottom-5 right-5 flex h-16 w-16 items-center justify-center rounded-full bg-danger text-white shadow-xl md:hidden"
            >
              <ShieldAlert aria-hidden size={28} strokeWidth={2} />
            </button>
          </>
        ) : null}
      </main>
    </div>
  );
}
