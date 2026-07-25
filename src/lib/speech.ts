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
/**
 * Maps a SpeechRecognition error code to something a user can act on.
 *
 * Every code used to collapse into one vague sentence, which made a normal stop
 * look like a failure and hid the real cause (most often no internet reaching
 * the speech service, or a browser that ships the API but disables it).
 * Returning null means "not worth telling the user about".
 */
export function describeSpeechError(code: string, heardSomething: boolean): string | null {
  switch (code) {
    // Fired when the user taps stop, or when we abort on unmount. Not a failure.
    case "aborted":
      return null;
    case "no-speech":
      return heardSomething
        ? null
        : "I did not catch any speech. Check your mic is not muted, or type it instead.";
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone blocked. Allow mic access in the address bar, or type it instead.";
    case "audio-capture":
      return "No microphone found. Plug one in, or type it instead.";
    case "network":
      return "Speech recognition needs an internet connection, and some browsers (Brave, and Firefox) block it. Try Chrome or Edge, or type it instead — the analysis is identical.";
    case "language-not-supported":
      return "This browser does not support the selected speech language. Type it instead.";
    default:
      return `Speech recognition stopped (${code}). Type it instead — the analysis is identical.`;
  }
}

export function listen(args: {
  onPartial: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (message: string) => void;
}): Listener | null {
  const Ctor = recognitionCtor();
  if (!Ctor) {
    args.onError("This browser cannot listen. Type it instead, or use Chrome.");
    return null;
  }

  // getUserMedia and the speech API both require a secure context. Opening the
  // app over a plain-http LAN address is a common way to hit this.
  if (typeof window !== "undefined" && !window.isSecureContext) {
    args.onError(
      "The microphone needs a secure connection (https, or localhost). Type it instead.",
    );
    return null;
  }

  const recognition = new Ctor();
  recognition.lang = "en-IN";
  recognition.interimResults = true;
  recognition.continuous = true;

  let transcript = "";
  let stoppedByUser = false;
  let delivered = false;

  const deliver = () => {
    if (delivered) return;
    delivered = true;
    if (transcript.trim()) args.onFinal(transcript.trim());
  };

  recognition.onresult = (event) => {
    let text = "";
    for (let i = 0; i < event.results.length; i++) {
      text += event.results[i][0].transcript;
    }
    transcript = text;
    args.onPartial(text);
  };

  recognition.onerror = (event) => {
    const code = event.error ?? "unknown";
    // A stop the user asked for is never an error, whatever the browser calls it.
    if (stoppedByUser && (code === "aborted" || code === "no-speech")) return;
    const message = describeSpeechError(code, transcript.trim().length > 0);
    if (message) args.onError(message);
  };

  recognition.onend = () => deliver();

  try {
    recognition.start();
  } catch {
    // start() throws if called while already running; treat as already listening.
  }

  return {
    stop: () => {
      stoppedByUser = true;
      recognition.stop();
    },
  };
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
