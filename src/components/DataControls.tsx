"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { Card, PrimaryButton, SectionTitle } from "@/components/ui";
import { clearState } from "@/lib/store";
import type { AppState } from "@/lib/types";

/**
 * Export and erase.
 *
 * Trivial to implement precisely because the design has no server-side health
 * record — everything already lives in this browser. Under the DPDP Act the
 * right to access and erase your own data is not optional, and a recovery app
 * asking for someone's worst moments should be able to hand them back and let
 * go of them on request.
 */
export function DataControls({ state }: { state: AppState }) {
  const [confirming, setConfirming] = useState(false);

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "zync-my-data.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function erase() {
    clearState();
    setConfirming(false);
    window.location.href = "/";
  }

  const counts = [
    ["check-ins", state.checkIns.length],
    ["SOS moments", state.sosEvents.length],
    ["triggers mapped", state.journal.length],
    ["conversations", state.chats.length],
  ] as const;

  return (
    <Card>
      <SectionTitle
        title="Your data"
        subtitle="All of it lives in this browser. There is no account and no copy on a server."
      />
      <p className="text-sm text-muted">
        {counts.map(([label, count]) => `${count} ${label}`).join(" · ")}
      </p>

      <div className="mt-4 grid gap-3">
        <PrimaryButton tone="quiet" onClick={exportData}>
          <span className="flex items-center justify-center gap-2">
            <Download aria-hidden size={18} /> Download everything
          </span>
        </PrimaryButton>

        {confirming ? (
          <div className="rounded-xl border border-danger bg-danger/10 p-4">
            <p className="text-sm">
              This erases your profile, every check-in, every SOS, and every conversation
              from this device. It cannot be undone.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <PrimaryButton tone="danger" onClick={erase}>
                Yes, erase it all
              </PrimaryButton>
              <PrimaryButton tone="quiet" onClick={() => setConfirming(false)}>
                Keep my data
              </PrimaryButton>
            </div>
          </div>
        ) : (
          <PrimaryButton tone="quiet" onClick={() => setConfirming(true)}>
            <span className="flex items-center justify-center gap-2">
              <Trash2 aria-hidden size={18} /> Erase everything
            </span>
          </PrimaryButton>
        )}
      </div>
    </Card>
  );
}
