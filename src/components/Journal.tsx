"use client";

import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { Card, ErrorNote, SectionTitle, Spinner } from "@/components/ui";
import { useAiRequest } from "@/lib/use-ai-request";
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
  const [localError, setLocalError] = useState("");
  const {
    data: analysis,
    loading,
    error,
    run,
  } = useAiRequest<JournalAnalysis>(
    "/api/ai/journal",
    "Could not read that photo just now.",
  );

  // Object URLs would leak; the preview is a data URL, but clear it on unmount.
  useEffect(() => () => setPreview(""), []);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setLocalError("");

    if (!isAllowed(file.type)) {
      setLocalError("Use a JPG, PNG, or WebP photo.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setLocalError("That photo is too large. Try one under 4MB.");
      return;
    }

    let imageBase64: string;
    try {
      imageBase64 = await readAsBase64(file);
    } catch {
      setLocalError("Could not read that image file.");
      return;
    }

    setPreview(`data:${file.type};base64,${imageBase64}`);
    const result = await run({ profile, mimeType: file.type, imageBase64 });
    if (result) onTriggersFound(result.triggers, result.advice);
  }

  const shown = localError || error;

  return (
    <section className="grid gap-5">
      <Card>
        <SectionTitle
          title="Show Zync the place"
          subtitle="A street, a room, a shop, a face in a crowd. Zync names what in it pulls at you."
        />
        <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border-2 border-dashed border-hairline bg-surface-2 p-6 text-center transition hover:border-ink">
          <Camera aria-hidden size={44} strokeWidth={1.75} className="text-fin" />
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
            className="mt-4 max-h-64 w-full rounded-[8px] object-cover"
          />
        ) : null}

        {loading ? (
          <div className="mt-4">
            <Spinner label="Zync is looking…" />
          </div>
        ) : null}
        {shown ? (
          <div className="mt-4">
            <ErrorNote message={shown} />
          </div>
        ) : null}
      </Card>

      {analysis ? (
        <Card>
          {analysis.triggers.length ? (
            <>
              <h3 className="text-sm font-semibold text-ink-muted">What Zync sees here</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {analysis.triggers.map((trigger) => (
                  <li
                    key={trigger}
                    className="rounded-full bg-fin/[0.12] px-3 py-1 text-sm font-medium text-ink"
                  >
                    {trigger}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <p className="mt-4 text-lg leading-relaxed">{analysis.advice}</p>
          {analysis.triggers.length ? (
            <p className="mt-3 text-sm text-ink-muted">
              Added to your triggers. Your SOS scripts will account for this from now on.
            </p>
          ) : null}
        </Card>
      ) : null}
    </section>
  );
}
