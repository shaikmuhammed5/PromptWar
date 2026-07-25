"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { Card, ErrorNote, SectionTitle, Spinner } from "@/components/ui";
import type { JournalAnalysis } from "@/lib/schemas";
import type { Profile } from "@/lib/types";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_BYTES = 4_500_000;

type AllowedMime = (typeof ALLOWED)[number];

function isAllowed(type: string): type is AllowedMime {
  return (ALLOWED as readonly string[]).includes(type);
}

/** Base64 without the data-url prefix — that is what the vision API expects. */
function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}

/**
 * Gemini Vision on a photo from the person's real environment. What it finds is
 * written back into their trigger list, so future SOS scripts get sharper —
 * this is the loop that makes the personalisation compound.
 */
export function Journal({
  profile,
  onTriggersFound,
}: {
  profile: Profile;
  onTriggersFound: (triggers: readonly string[], advice: string) => void;
}) {
  const [preview, setPreview] = useState("");
  const [analysis, setAnalysis] = useState<JournalAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!isAllowed(file.type)) {
      setError("Use a JPG, PNG, or WebP photo.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That photo is too large. Try one under 4MB.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);
    try {
      const imageBase64 = await readAsBase64(file);
      setPreview(`data:${file.type};base64,${imageBase64}`);
      const response = await fetch("/api/ai/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, mimeType: file.type, imageBase64 }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "Could not read that photo.");
      const result = body as JournalAnalysis;
      setAnalysis(result);
      onTriggersFound(result.triggers, result.advice);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not read that photo now.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid gap-5">
      <Card>
        <SectionTitle
          title="Show Zync the place"
          subtitle="A street, a room, a shop, a face in a crowd. Zync names what in it pulls at you."
        />
        <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface-2 p-6 text-center transition hover:border-accent">
          <Camera aria-hidden size={44} strokeWidth={1.75} className="text-accent" />
          <span className="font-semibold">Take or choose a photo</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="sr-only"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
        </label>

        {preview ? (
          // Data-url preview of a just-picked local file; next/image adds nothing here.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="The photo you shared with Zync"
            className="mt-4 max-h-64 w-full rounded-xl object-cover"
          />
        ) : null}

        {loading ? (
          <div className="mt-4">
            <Spinner label="Zync is looking…" />
          </div>
        ) : null}
        {error ? (
          <div className="mt-4">
            <ErrorNote message={error} />
          </div>
        ) : null}
      </Card>

      {analysis ? (
        <Card>
          {analysis.triggers.length ? (
            <>
              <h3 className="text-sm font-semibold text-muted">What Zync sees here</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {analysis.triggers.map((trigger) => (
                  <li
                    key={trigger}
                    className="rounded-full bg-accent/20 px-3 py-1 text-sm font-medium text-[#ffddab]"
                  >
                    {trigger}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <p className="mt-4 text-lg leading-relaxed">{analysis.advice}</p>
          {analysis.triggers.length ? (
            <p className="mt-3 text-sm text-muted">
              Added to your triggers. Your SOS scripts will account for this from now on.
            </p>
          ) : null}
        </Card>
      ) : null}
    </section>
  );
}
