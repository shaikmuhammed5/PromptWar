# Zync — AI Recovery & Prevention Companion

> **You are not alone.**

**Zync** syncs a person in recovery with the two things they lose hold of mid-craving: a clear next
action, and their people. That is the whole product thesis — not a clinic portal, not a habit tracker,
but a companion that arrives in the exact minute a craving peaks, when cognitive load is highest and
typing a paragraph into a chat box is impossible.

The one person a user nominates as their 2am contact is their **anchor**. Zync is the app; your
anchor is the human it puts you back in touch with.

Built for **Build with AI: PromptWars** — Recovery and Prevention Platform challenge.

**No login. No demo credentials needed. Every feature is reachable in one tap from the landing page.**

---

## Why it looks the way it does

A person mid-craving cannot compose a prompt. So Zync's hero path takes **two taps and zero typed
characters**: tap SOS, tap the face that matches the urge, and a personalised de-escalation script
streams in and is *read aloud automatically*. They never have to read it. Everything else in the app
follows the same rule — chips, voice, and a camera instead of text fields.

---

## Features (every one is a live Gemini call)

| Feature | What it does | Model use |
|---|---|---|
| **SOS** | 2 taps → streamed, spoken de-escalation script built from substance, streak, triggers, craving level, and time of day | Gemini Flash (gemini-flash-latest), **streaming** |
| **Voice check-in** | Speak freely → transcript → structured `{mood, riskScore, triggers, tools}` → **risk score decides which safety tools appear** | Gemini Flash (gemini-flash-latest), JSON mode |
| **Trigger journal** | Photograph a real place → Gemini names what in it pulls at you → **triggers written back into the profile**, so future SOS scripts get sharper | Gemini Flash (gemini-flash-latest) **Vision** |
| **Refusal scripts** | Pick a scenario → 3 lines you can actually say out loud, each speakable via TTS | Gemini Flash (gemini-flash-latest), JSON mode |
| **Learn** | Lesson + quiz generated for *your* substance and *your* stage — not a content table | Gemini Flash (gemini-flash-latest), JSON mode |
| **Caregiver view** | Reads the event log and answers the 11pm question: what do I say, and what will make it worse | Gemini Flash (gemini-flash-latest), JSON mode |
| **Breathe** | 4-7-8 paced breathing | No AI — works when everything else is down |
| **Helplines** | Tele-MANAS 14416, KIRAN, NIMHANS, 112 — real verified numbers | No AI — the fallback rail |

### The connected workflow (not six isolated demos)

```
Voice check-in ──riskScore≥7──▶ SOS flow ──▶ script + TTS ──▶ event logged
      │                                                            │
      └── low risk ──▶ Journal / Learn / Refusal                    ▼
                              │                            Caregiver view
                              └── vision finds triggers ──▶ profile updated
                                                            ──▶ sharper SOS scripts
```

Each surface calls Gemini independently, so one failing endpoint never sinks the demo — and every
failure state falls back to the breathing timer and real helplines, which need no network AI at all.

---

## Gen AI services used, and where

**Google Gemini Flash (gemini-flash-latest)** via the official `@google/genai` SDK. All calls are **server-side only** —
the API key never reaches the browser.

| Location | Service | Mode |
|---|---|---|
| `src/lib/ai/gemini.ts` | Gemini Flash (gemini-flash-latest) client, JSON generation + streaming helpers | core |
| `src/lib/ai/prompts.ts` | All system instructions and prompt builders (pure functions, unit-tested) | core |
| `src/app/api/ai/sos/route.ts` | De-escalation script | **streaming text** |
| `src/app/api/ai/checkin/route.ts` | Risk analysis of a spoken check-in | structured JSON |
| `src/app/api/ai/journal/route.ts` | Photo → environmental triggers | **vision (inline image)** |
| `src/app/api/ai/refusal/route.ts` | Refusal scripts | structured JSON |
| `src/app/api/ai/learn/route.ts` | Lesson + quiz | structured JSON |
| `src/app/api/ai/caregiver/route.ts` | Caregiver guidance | structured JSON |
| `src/lib/speech.ts` | **Web Speech API** — browser-native STT (check-ins) and TTS (reading scripts aloud) | browser |

Every model response is validated with Zod before it reaches the UI (`src/lib/schemas.ts`), so a
malformed generation surfaces as a handled error rather than a broken screen.

---

## Run it locally

```bash
npm install
cp .env.example .env.local     # then paste your key
npm run dev                    # http://localhost:3000
```

`.env.local`:

```
GEMINI_API_KEY=your_key_here
```

Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

```bash
npm test          # unit tests
npm run build     # production build
```

---

## Security

- **Key isolation** — `GEMINI_API_KEY` is read only inside route handlers; no `NEXT_PUBLIC_` exposure.
- **Input validation** — every API route parses its body with Zod before doing anything (`src/lib/schemas.ts`), including a size ceiling and a MIME allow-list on image uploads.
- **Output validation** — model output is parsed and schema-checked, never trusted or rendered raw.
- **Rate limiting** — fixed-window limiter on all AI routes (`src/lib/rate-limit.ts`).
- **No health data on the server** — profiles, transcripts, and events live in the user's own browser (`localStorage`). There is no database and no account, so there is no health record to breach.
- **Sanitised logging** — errors log a type label only; transcripts and check-in content never reach the logs.
- **Clinical safety rail** — the shared system prompt forbids diagnosis and dosage advice and forces escalation to 112 / Tele-MANAS 14416 on any sign of medical emergency.

## Accessibility

- Every interactive target is **≥56px tall**; the SOS button is 224px.
- **Zero-typing paths** throughout — chips, voice, camera. Text inputs are optional everywhere.
- Voice output on every generated script for users who cannot read the screen.
- `aria-live` on streaming and status regions, `aria-pressed` on toggles, visible focus rings, semantic landmarks.
- `prefers-reduced-motion` honoured — the SOS pulse and breathing orb stop for vestibular sensitivity.
- Speech unsupported? Every voice surface degrades to an equivalent typed path.
- High-contrast dark palette; plain-English crisis copy, short sentences, no clinical jargon.

## Testing

```bash
npm test
```

Vitest covers the pure logic worth protecting: prompt builders (profile context, safety framing,
craving-level wording), the model-output JSON extractor against fenced and prose-wrapped responses,
rate-limit window behaviour, and every Zod boundary schema.

## Tech

Next.js 15 (App Router, TypeScript strict) · Gemini Flash (gemini-flash-latest) · Web Speech API · Tailwind v4 · Zod ·
Vitest · deployed on Vercel.

---

*Zync is a companion, not a clinician. In an emergency call 112. For mental health support in India,
Tele-MANAS is 14416, free and 24x7.*
