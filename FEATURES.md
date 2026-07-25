# Zync — Feature Sheet

Every row below runs against a live Google Gemini call or is deterministic code.
There is no mock data, no hardcoded output, and no login between an evaluator and any feature.

---

## AI features

| # | Feature | Where | What the user does | What the AI does | Model mode |
|---|---|---|---|---|---|
| 1 | **SOS de-escalation script** | `/?v=sos` | Tap SOS, tap a craving level. **2 taps, zero typing** | Builds a prompt from substance, streak, saved triggers, craving level and the user's local hour; writes a 4–6 step script for the next 60 seconds | **Streaming text** |
| 2 | **Voice check-in → risk analysis** | `/?v=checkin` | Speak, or write | Returns `{mood, riskScore 0–10, summary, triggersDetected[], toolsRecommended[]}`. **The risk score decides which safety tools render** | Structured JSON |
| 3 | **Trigger journal** | `/?v=journal` | Photograph a real place | Names the environmental triggers visible in the image and one concrete change. **Writes them back into the profile**, so later SOS scripts are sharper | **Vision** (inline image) |
| 4 | **Refusal scripts** | `/?v=refusal` | Tap a scenario | Three lines the user can actually say out loud, light → firm, each speakable via TTS | Structured JSON (cached) |
| 5 | **Learn** | `/?v=learn` | Tap a topic | A lesson written for that substance and stage, plus a 2-question quiz with explanations | Structured JSON (cached) |
| 6 | **Caregiver guidance** | `/?v=caregiver` | Tap "Ask Zync" | Reads the event log; returns what to say word-for-word, and what to hold back | Structured JSON |
| 7 | **CRAFT family training** | `/?v=caregiver` → Family training | Pick a module, describe the situation | Four evidence-based modules — map the pattern, reward sober days, rewrite the sentence, stop softening the fall | Structured JSON |

## Non-AI features (deliberately)

| # | Feature | Why it has no AI in it |
|---|---|---|
| 8 | **Crisis override** | Overdose and self-harm language escalates to emergency numbers **before** the model is called and **regardless** of what it returns. A hallucination, a quota failure, or an outage cannot suppress it. Tuned to over-trigger. |
| 9 | **Helpline directory** | Real verified numbers — 112, NMBA 14446, Tele-MANAS 14416, KIRAN, MANAS 1933. Works with zero network AI. Every failure state falls back here. |
| 10 | **4-7-8 breathing** | Works when the model, the network, or the quota is gone. |
| 11 | **Four-tap onboarding** | Chips only. The one typed field (trusted contact) is skippable. |

---

## The connected workflow

```
                    ┌─────────────── Voice check-in ───────────────┐
                    │         (speech → risk score 0-10)           │
                    ▼                                              ▼
            riskScore ≥ 7                                    riskScore < 4
                    │                                              │
                    ▼                                              ▼
              SOS flow ──▶ streamed script ──▶ read aloud    Journal / Learn / Refusal
                    │                                              │
                    ▼                                              ▼
              event logged                              vision finds triggers
                    │                                              │
                    └──────────▶ Caregiver view ◀──────────────────┘
                                       │                    writes back to profile
                                       ▼                           │
                            CRAFT training modules                 ▼
                                                          sharper SOS scripts next time

  Any AI failure, at any node ──▶ breathing timer + verified helplines (no AI required)
```

The write-back loop is the part that compounds: what the camera finds changes what the crisis script says.

---

## Gen AI services declaration

**Google Gemini** via the official `@google/genai` SDK. **All calls are server-side only** — the API key never reaches the browser.

| Location | Purpose | Mode |
|---|---|---|
| `src/lib/ai/gemini.ts` | Client, model fallback chain, JSON extraction | core |
| `src/lib/ai/prompts.ts` | All system instructions and prompt builders (pure functions, unit-tested) | core |
| `src/lib/ai/cache.ts` | TTL cache for non-time-sensitive generations | core |
| `src/app/api/ai/sos/route.ts` | De-escalation script | streaming text |
| `src/app/api/ai/checkin/route.ts` | Risk analysis | structured JSON |
| `src/app/api/ai/journal/route.ts` | Photo → triggers | **vision** |
| `src/app/api/ai/refusal/route.ts` | Refusal scripts | structured JSON |
| `src/app/api/ai/learn/route.ts` | Lesson + quiz | structured JSON |
| `src/app/api/ai/caregiver/route.ts` | Caregiver guidance | structured JSON |
| `src/app/api/ai/craft/route.ts` | CRAFT modules | structured JSON |
| `src/lib/speech.ts` | **Web Speech API** — browser-native STT and TTS | browser |

**Model resilience.** Calls walk an ordered chain — `gemini-3.5-flash` → `gemini-flash-lite-latest` → `gemini-3.1-flash-lite` → `gemini-3-flash-preview` — advancing on quota exhaustion (429), model retirement (404), or overload (503). This exists because pinned versions rot (`gemini-2.5-flash` now returns *"no longer available to new users"*) and free-tier day caps are as low as 20 requests per model. A 400 fails fast, since retrying a malformed payload elsewhere is pointless.

---

## Engineering

| Area | Detail |
|---|---|
| **Stack** | Next.js 16 (App Router, TypeScript strict), Tailwind v4, Zod, Vitest, lucide-react |
| **Validation** | Zod on every request body **and** every model response. A malformed generation is a handled error, never a broken screen |
| **Rate limiting** | Fixed-window, keyed on the platform-trusted IP (`x-real-ip`, else the rightmost forwarded hop — the leftmost is client-forgeable) |
| **Caching** | Lessons and refusal scripts cached by input. Measured: **28.4s cold → 0.068s warm**, and no quota spent on the repeat |
| **Privacy** | No database, no account. Profiles, transcripts and events live in the user's own browser. There is no health record to breach |
| **Logging** | Errors log a type label only — transcripts never reach the logs |
| **Routing** | Every screen is URL-addressable, so browser back and phone swipe-back work correctly |
| **Responsive** | Mobile: single column, thumb-reachable SOS, floating emergency button. `md`+: persistent navigation rail, wider content column |
| **Accessibility** | Targets ≥56px (SOS is 224px), zero-typing paths throughout, TTS on every generated script, `aria-live` on streaming regions, visible focus rings, `prefers-reduced-motion` honoured |
| **Quality gates** | ESLint clean, `tsc --noEmit` clean, **108 tests** passing, production build green |

## Clinical safety

- Never diagnoses, never discusses doses, and **refuses to opine on whether stopping abruptly is safe** — unsupervised alcohol and opioid withdrawal can kill.
- **Person-first language enforced** in the prompt: never "addict", never "clean/dirty".
- **Anti-dependency by design** — the model may not claim feelings, memory, or a relationship, and points users toward their anchor, a counsellor, or a helpline rather than back at itself. Digital mental-health tools measurably worsen isolation when users attach to them.
- **CRAFT** engages roughly **64%** of treatment-resistant users into care, against ~23% for confrontational intervention and ~13–17% for twelve-step facilitation, while reducing the caregiver's own depression and anxiety.
- Positioned as a **triage layer in front of India's existing safety net**, not a replacement for it.
