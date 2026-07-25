# Zync — Recovery & Prevention Companion

**Zync** syncs a person in recovery with a clear next action and with their people.
The trusted human they nominate is their **anchor**.
Tagline: **You are not alone.**

AI recovery companion for people facing substance use disorders and the caregivers holding them up.
GenAI at the core: every primary feature is a real Gemini call. No canned outputs, no mock data.

Why the naming matters: Zync is the tool, your anchor is the person. This is not a clinic app. Every screen speaks in
second person, every intervention is one tap, and the app never asks a person in crisis to explain themselves
in a text box. Crisis surfaces (SOS, breathing, helplines) use short plain-English sentences — readable
at the exact moment cognitive load is highest.

## Judging Alignment (why each feature exists)

| Requirement | Feature that satisfies it |
|---|---|
| Zero-typing interventions | 1-tap SOS → emoji craving scale → AI script, auto-spoken aloud |
| Multi-modal | Voice check-in (STT/TTS), image trigger journal (Gemini Vision), text chat |
| Personalized emergency scripts | SOS de-escalation script + refusal-script generator, both from user profile |
| Educational resources | AI education hub — lessons + quizzes per substance and recovery stage |
| Contextual safety tools | Risk score from check-in drives which tools surface (breathe, call thunai, helpline) |
| Caregiver support | Caregiver view: event feed + AI summary + "what to say right now" |

---

## Usage Flow

### First open (≤ 30 seconds, no typing required beyond name)
1. Landing: name **Zync**, tagline, two big buttons — **"I am recovering"** / **"I am a caregiver"**.
2. Recovering path → 4-tap onboarding, all chips, no free text:
   - Which substance? (alcohol / tobacco / cannabis / opioids / other)
   - Days since last use? (today / this week / 1 month+ / 6 months+)
   - What usually triggers you? (multi-select chips: stress, friends, night, loneliness, money, celebration)
   - Who is your anchor? (name + phone of one trusted person — the only typed field, and it is skippable)
3. Profile saved locally. Straight to Home.

### Home screen — the whole app is one thumb away
- **Giant red SOS button** occupying the top half. Reachable one-handed, works before any other setup.
- Below it: mood strip (voice check-in mic), Refusal Scripts, Trigger Journal (camera), Learn, Helplines.
- Sobriety streak counter + last check-in summary.

### Flow 1 — SOS (hero, zero typing)
1. Tap **SOS**.
2. Screen shows 5 large emoji faces: *how strong is the urge right now?* Tap one. **Total input so far: 2 taps.**
3. App builds a prompt server-side from: substance, streak, saved triggers, chosen craving level, time of day, anchor contact name.
4. Gemini streams a personalized de-escalation script — short second-person lines, present tense, one action at a time.
5. Script renders line by line AND is spoken aloud automatically via browser TTS. User does not have to read.
6. Under the script, three always-present buttons: **Call [their anchor]**, **Breathe with me** (4-7-8 animated timer), **Tele-MANAS 14416**.
7. Event logged to timeline → appears in caregiver feed.
8. If Gemini fails: fallback card with verified helplines + breathing timer still works. Never a dead end.

### Flow 2 — Voice check-in (multi-modal)
1. Tap mic. Speak freely: *"today was rough, saw the old crowd near the shop"*.
2. Web Speech API transcribes in-browser.
3. Transcript → Gemini → structured JSON: `{mood, riskScore 0-10, summary, triggersDetected[], toolsRecommended[]}`.
4. UI renders the recommended safety tools **contextually** — high risk surfaces SOS + call their anchor; low risk surfaces journaling + a lesson.
5. Check-in appended to history; streak and trend update.

### Flow 3 — Trigger journal (vision)
1. Tap camera. Snap or upload a photo of a place, situation, object.
2. Gemini Vision reads the scene → names likely environmental/emotional triggers and gives one concrete avoidance or coping move.
3. Trigger added to the user's profile so future SOS scripts get sharper. **This is the loop that makes the app personal.**

### Flow 4 — Refusal scripts (prevention)
1. Tap a scenario chip: party / old friend offering / family function / work stress / payday.
2. Gemini generates 3 short scripts the user can actually say out loud, in their register, with a polite exit line.
3. Tap speaker to hear it → rehearse. Tap save → it lives in Home for quick recall.

### Flow 5 — Learn (education)
1. Pick a topic card (what withdrawal does to the body, relapse is not failure, talking to family, rebuilding sleep).
2. Gemini generates a short lesson tuned to the user's substance and stage + a 3-question quiz.
3. Answer quiz → AI explains why, in plain language.

### Flow 6 — Caregiver view
1. Choose caregiver at landing, enter the person's share code.
2. See: streak, check-in trend, SOS events with timestamps and craving levels.
3. **"What do I say right now?"** button → Gemini reads the recent event pattern → gives the caregiver a concrete script and, just as importantly, what *not* to say.

### Flow 7 — Helplines (always-on rail)
Verified real numbers (Tele-MANAS 14416, NIMHANS, national de-addiction helpline). Static, real, works with zero network AI.
Every AI failure state in every flow degrades to this screen.

---

## Scope for the 30-minute build

Cut for time — build these in order, deploy after each:
- **Must ship:** SOS flow (streaming + TTS), voice check-in, refusal scripts, helplines rail, onboarding.
- **If time:** trigger journal (vision), Learn, caregiver view.
- **Cut:** Postgres/Prisma, NextAuth. Profile + history in `localStorage` — real user state, no fake data, and no login wall between evaluators and every feature.

## Stack

- **Next.js 15 (App Router, TS strict)** — one repo, one Vercel deploy
- **Gemini Flash (gemini-flash-latest)** via `@google/genai`, server-side route handlers only (key never reaches client) — text, vision, streaming
- **Web Speech API** — STT + TTS in-browser, keyless → zero-typing + accessibility
- **localStorage** for profile, check-ins, SOS events (no auth wall for evaluators)
- **Zod** at every API boundary

## Security

- Gemini key in server env only; every model call inside a route handler
- Zod validation on all request bodies; in-memory rate limit on AI routes
- No health content in server logs; sanitized error responses
- No third-party analytics on health screens

## Disqualification Guards

- Every demo path hits Gemini live — no mocks anywhere
- No login = evaluators reach every feature instantly (no credential blocker)
- Independent workflows: SOS, check-in, refusal, vision, learn each call Gemini separately — one failure never sinks the demo
- Fallback UI on model error still gives real value (helplines + breathing)

## GenAI Services Declaration (for submission)

- **Google Gemini Flash (gemini-flash-latest)** — SOS de-escalation scripts (streaming), voice check-in analysis (structured JSON), refusal scripts, lessons + quizzes, caregiver guidance. Location: `src/lib/ai/*` and all routes under `src/app/api/ai/`.
- **Gemini Flash Vision** (image parts, same model) — trigger journal photo analysis. Location: `src/app/api/ai/journal/route.ts`.
- **Web Speech API** (browser-native) — speech-to-text for check-ins, text-to-speech for reading scripts aloud. Location: `src/lib/speech.ts`.

---

# Phase 2 — "Saathi" Companion Chat (PROPOSED, awaiting approval)

A personalised, multi-turn AI chat companion — the feature Learnium/Traineon already proved
the patterns for. But this is a recovery app, and the research review was blunt about
parasocial dependency in exactly this population. So the design rule is:

> **Every chat mode has a recovery job. There is no open-ended "AI friend" mode.**

The fun is real — games, banter, roleplay — but each one is a clinically defensible tool
(distraction during urges is CBT urge-surfing; roleplay is skills rehearsal; talk is a
guided debrief), and the companion actively hands the user back to humans.

## Learnium DNA → Zync mapping

| Learnium (Traineon) pattern | Zync adaptation |
|---|---|
| Persona system prompt per roleplay scenario | Companion persona built live from the user's profile (substance, streak, triggers, anchor name) |
| WS token streaming with reconnect | HTTP streaming (same as SOS route) — no WS infra needed on Vercel |
| Postgres checkpointer for conversation state | localStorage chat slice, sliding window of last ~20 turns sent per request |
| Scoring via structured output on session end | Roleplay rehearsal scored on end: what worked, what to strengthen, one line to practice |
| Personas CRUD + assignment | Fixed mode cards (talk / practice / distract) — no builder needed for hackathon |

## The three modes

**1. Talk it out** — guided conversational debrief. CBT-flavoured active listening: reflects,
asks one question at a time, names cognitive distortions gently (catastrophising,
rationalisation), never lectures. Pulls profile context so it says "the old crowd near the
shop" not "your triggers". After ~12 turns it starts wrapping up and points to the anchor,
journal, or a helpline — the anti-dependency limit is in the product, not just the prompt.

**2. Practice the moment (roleplay rehearsal)** — the Learnium mechanic, aimed at prevention.
User picks a scenario (same six as refusal scripts) + who the AI plays (old friend, cousin at
a wedding, colleague). AI plays the pressurer with realistic-but-bounded pressure — it never
describes use approvingly, never escalates past two refusals, and if the user "accepts" in
roleplay the AI breaks character into coach mode: no shame, what happened, try again.
On "end rehearsal": structured scoring — 2 things that worked, 1 thing to strengthen, one
exact line to keep in the pocket. Static refusal scripts become live rehearsal → this is the
strongest problem-statement upgrade in the phase.

**3. Ride it out (distraction games)** — for the craving window that is not an SOS. 20
questions, word chains, "would you rather", quick trivia — genuinely playful, but framed
honestly: "urges crest and fall in about 20 minutes; let's be busy while this one falls."
Timer chip shows minutes survived. On exit: "the urge you just outlasted is logged" → feeds
the streak/events, visible to caregiver.

## Safety architecture (non-negotiable)

- `assessCrisis()` runs on **every inbound user message** before the model call — same
  deterministic override as check-in; crisis banner renders inside the chat thread.
- Companion prompt inherits the full SAFETY frame: no feelings/memory/relationship claims,
  person-first language, no dosage/withdrawal talk, escalation rules.
- **Session shape enforced in code, not vibes:** turn counter per session; gentle wrap-up
  nudge at ~12 turns, hard "let's pause — who could you tell about this?" card at ~20.
  Roleplay pressure capped at two pushes per refusal.
- Chat history stays in localStorage like everything else; sliding window only goes to the
  server, full history never leaves the browser.

## Build plan (≈ half a day)

1. `src/lib/ai/prompts.ts` — three mode system prompts + roleplay scoring prompt.
2. `/api/ai/chat` — streaming route, multi-turn contents array, Zod schema (mode, history
   window, profile), reuses model fallback chain + rate limiting. `/api/ai/chat/score` for
   rehearsal end (structured JSON).
3. Store: `chats` slice (per-mode sessions, capped), crisis check client-side pre-send.
4. `Chat.tsx` — mode cards → thread UI (streaming bubbles, mic input via existing speech
   lib, TTS replay per message), turn-limit cards, roleplay scenario picker + score card.
5. Nav: new "Saathi" tab (rail + home grid + `v=chat` view). Tests: prompts, turn-limit
   logic, chat route (mocked), roleplay-score schema.

## Also proposed in this phase (small, high-value)

| Add | Why | Cost |
|---|---|---|
| **PWA manifest + icons** | "Install to home screen" — real mobile-app feel, accessibility/judging optics | ~30 min |
| **Audio-multimodal check-in** | Send the actual recording to Gemini alongside the transcript — true tone analysis, honest multimodality (model hears flat/slurred/agitated) | ~1–2 h, feature-flagged so transcript path stays the fallback |
| **Export / delete my data** | One button each in a small settings card — DPDP-flavoured, trivially real since data is local | ~20 min |
| **Milestone moments** | At 7/30/90 days-equivalent streak bands, one generated personal note of recognition (cached) | ~30 min |

## Quota note

Chat is the hungriest feature yet (every turn = a model call). Fallback chain + cache help,
but **billing on the Gemini project moves from "recommended" to "required" before demo day.**
