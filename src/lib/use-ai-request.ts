"use client";

import { useCallback, useRef, useState } from "react";

/**
 * One AI request, with the parts every caller was hand-rolling.
 *
 * Six components each repeated the same loading/error/fetch dance, and each
 * repeated the same two bugs with it: reading the body before checking the
 * status (so a non-JSON error surfaced a raw SyntaxError to the user), and no
 * guard against an earlier response landing after a later one — tap two topic
 * chips quickly and the first result would overwrite the second.
 *
 * The sequence counter fixes the race for everyone: only the newest request may
 * write state, and an abandoned one is dropped silently.
 */
export type AiRequest<TResult> = {
  readonly data: TResult | null;
  readonly loading: boolean;
  readonly error: string;
  readonly run: (body: unknown) => Promise<TResult | null>;
  readonly reset: () => void;
};

export function useAiRequest<TResult>(
  endpoint: string,
  fallbackMessage = "Could not reach the AI service just now.",
): AiRequest<TResult> {
  const [data, setData] = useState<TResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sequence = useRef(0);

  const reset = useCallback(() => {
    sequence.current += 1;
    setData(null);
    setError("");
    setLoading(false);
  }, []);

  const run = useCallback(
    async (body: unknown): Promise<TResult | null> => {
      const ticket = ++sequence.current;
      setLoading(true);
      setError("");
      setData(null);

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        // Status first: an error page is not guaranteed to be JSON.
        if (!response.ok) {
          const problem = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(problem?.error ?? fallbackMessage);
        }

        const result = (await response.json()) as TResult;
        if (ticket !== sequence.current) return null;
        setData(result);
        return result;
      } catch (caught) {
        if (ticket !== sequence.current) return null;
        setError(caught instanceof Error ? caught.message : fallbackMessage);
        return null;
      } finally {
        if (ticket === sequence.current) setLoading(false);
      }
    },
    [endpoint, fallbackMessage],
  );

  return { data, loading, error, run, reset };
}
