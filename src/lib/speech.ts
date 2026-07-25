"use client";

/**
 * Browser-native speech. Chosen over a cloud STT/TTS vendor deliberately: it
 * needs no key, adds no latency, and keeps spoken health content on-device.
 */

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type RecognitionCtor = new () => SpeechRecognitionLike;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechInputSupported(): boolean {
  return recognitionCtor() !== null;
}

export type Listener = { stop: () => void };

/**
 * Starts dictation. `onPartial` fires as the user speaks so they can see they
 * are being heard; `onFinal` fires once with the full transcript.
 */
export function listen(args: {
  onPartial: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (message: string) => void;
}): Listener | null {
  const Ctor = recognitionCtor();
  if (!Ctor) {
    args.onError("This browser cannot listen. Type instead, or use Chrome.");
    return null;
  }

  const recognition = new Ctor();
  recognition.lang = "en-IN";
  recognition.interimResults = true;
  recognition.continuous = true;

  let transcript = "";
  recognition.onresult = (event) => {
    let text = "";
    for (let i = 0; i < event.results.length; i++) {
      text += event.results[i][0].transcript;
    }
    transcript = text;
    args.onPartial(text);
  };
  recognition.onerror = (event) => {
    args.onError(
      event.error === "not-allowed"
        ? "Microphone blocked. Allow mic access, or type instead."
        : "Could not hear you clearly. Try again, or type instead.",
    );
  };
  recognition.onend = () => {
    if (transcript.trim()) args.onFinal(transcript.trim());
  };

  recognition.start();
  return { stop: () => recognition.stop() };
}

/** Reads a script aloud. The SOS flow depends on this — no reading required. */
export function speak(text: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(stripMarkup(text));
  utterance.lang = "en-IN";
  utterance.rate = 0.92;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

/** Spoken output should not pronounce asterisks and hashes. */
export function stripMarkup(text: string): string {
  return text
    .replace(/[*_#`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
