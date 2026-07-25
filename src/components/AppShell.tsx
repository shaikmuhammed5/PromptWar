"use client";

import type { ReactNode } from "react";
import {
  BookOpen,
  Camera,
  Home,
  MessageCircle,
  Mic,
  MessageSquareQuote,
  Phone,
  ShieldAlert,
  Wind,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { View } from "@/lib/navigation";

export const TABS: readonly { view: View; Icon: typeof Mic; label: string }[] = [
  { view: "chat", Icon: MessageCircle, label: "Saathi" },
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
            <p className="text-sm text-ink-muted">{greeting}</p>
            <h1 className="t-card-title">Zync</h1>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("sos")}
            className="pressable t-button flex min-h-14 items-center justify-center gap-2 rounded-[8px] bg-emergency text-white"
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
                className={`t-body-sm flex min-h-12 items-center gap-3 rounded-[8px] px-3 text-left font-medium transition ${
                  view === item.view
                    ? "bg-surface-2 text-ink"
                    : "text-ink-muted hover:bg-surface-1"
                }`}
              >
                <item.Icon aria-hidden size={18} className="text-fin" />
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onNavigate("breathe")}
              className="t-body-sm flex min-h-12 items-center gap-3 rounded-[8px] px-3 text-left font-medium text-ink-muted transition hover:bg-surface-1"
            >
              <Wind aria-hidden size={18} /> Breathe
            </button>
            <ThemeToggle />
          </nav>
          <button
            type="button"
            onClick={() => onNavigate("caregiver")}
            className="pressable t-body-sm min-h-12 rounded-[8px] border border-hairline px-4 font-medium hover:border-ink-subtle"
          >
            Caregiver view
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="mb-6 flex items-start justify-between gap-4 md:hidden">
          <div>
            <p className="text-sm text-ink-muted">{greeting}</p>
            <h1 className="t-card-title">Zync</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <button
              type="button"
              onClick={() => onNavigate("caregiver")}
              className="pressable t-body-sm min-h-12 rounded-[8px] border border-hairline px-4 font-medium hover:border-ink-subtle"
            >
              Caregiver view
            </button>
          </div>
        </header>

        {children}

        {view !== "home" ? (
          <>
            <button
              type="button"
              onClick={onBack}
              className="pressable t-button mt-8 min-h-12 w-full rounded-[8px] border border-hairline py-3 hover:border-ink-subtle"
            >
              Back
            </button>
            {/* SOS stays one tap away from every screen on mobile. */}
            <button
              type="button"
              onClick={() => onNavigate("sos")}
              aria-label="Emergency help now"
              className="pressable fixed bottom-5 right-5 flex h-16 w-16 items-center justify-center rounded-full bg-emergency text-white md:hidden"
            >
              <ShieldAlert aria-hidden size={28} strokeWidth={2} />
            </button>
          </>
        ) : null}
      </main>
    </div>
  );
}
