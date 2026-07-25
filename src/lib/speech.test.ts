import { describe, expect, test } from "vitest";
import { describeSpeechError, stripMarkup } from "./speech";

describe("describeSpeechError", () => {
  test("stays silent when the user stopped the recording themselves", () => {
    expect(describeSpeechError("aborted", true)).toBeNull();
  });

  test("stays silent on no-speech once something was already heard", () => {
    expect(describeSpeechError("no-speech", true)).toBeNull();
  });

  test("explains silence when nothing at all was captured", () => {
    expect(describeSpeechError("no-speech", false)).toMatch(/did not catch/i);
  });

  test("names a blocked microphone and where to unblock it", () => {
    expect(describeSpeechError("not-allowed", false)).toMatch(/address bar/i);
  });

  test("names the browsers that disable the speech service", () => {
    const message = describeSpeechError("network", false);

    expect(message).toMatch(/internet/i);
    expect(message).toMatch(/Brave/);
  });

  test("names a missing microphone", () => {
    expect(describeSpeechError("audio-capture", false)).toMatch(/No microphone/i);
  });

  test("surfaces an unrecognised code rather than hiding it", () => {
    expect(describeSpeechError("some-new-code", false)).toContain("some-new-code");
  });
});

describe("stripMarkup", () => {
  test("removes characters a speech synthesiser would pronounce", () => {
    expect(stripMarkup("**Step 1** — _breathe_")).toBe("Step 1 — breathe");
  });

  test("collapses the whitespace left behind", () => {
    expect(stripMarkup("one\n\n\ntwo")).toBe("one two");
  });
});
