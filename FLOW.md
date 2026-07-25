# Zync — Full User Flow

Walk this exactly as an evaluator would. **No login, no credentials, no setup.**
Use **Chrome or Edge** — speech recognition needs a browser that ships it (Brave and Firefox block it; the app degrades to typing, but you will not see the voice path).

---

## 0. Landing — `/`

Two doors, and the helplines are already on screen.

- **"I am recovering"** → onboarding
- **"I am caring for someone"** → caregiver view

> Verified numbers sit on the *first* screen deliberately. Someone may arrive already in crisis and must not have to navigate to reach a human.

**Try this first:** tap **"I am caring for someone"** on a fresh browser. It correctly reports that nobody is linked yet and offers a route to setup — rather than presenting a button that silently does nothing.

---

## 1. Onboarding — `/?v=onboarding`

Four steps, **chips only**.

1. What are you stepping away from? *(alcohol, tobacco, cannabis, opioids, gaming, other)*
2. How long have you been holding on? *(day one → six months+)*
3. What usually pulls you back? *(multi-select: stress, old friends, late nights, loneliness, money, celebrations, family conflict, boredom)*
4. Who is your **anchor**? — name and phone of one trusted person. **The only typed field, and it is skippable.**

Use your own number for the anchor; the call button uses `tel:` and will really dial.

---

## 2. Home — `/?v=home`

The SOS button occupies the top half. Everything else is secondary.

- Streak, SOS-moments-survived counter, and your last check-in summary
- **Mobile:** tool grid below, floating SOS on every other screen
- **Desktop:** persistent left rail carries SOS and full navigation

---

## 3. SOS — the hero path

**Count the taps: two. Zero typed characters.**

1. Tap **I need help now**
2. Tap a craving level — a **filling severity meter**, green → amber → red

Then:

- A personalised script **streams in** and is **read aloud automatically**
- It is built from your substance, streak, saved triggers, craving level, **and your local hour** (sent from the client — the server clock is UTC, so a 23:00 craving would otherwise get an afternoon script)
- Under it, always: **Call [your anchor]**, **Breathe with me**, **Tele-MANAS 14416**

**Try to break it:** pick a level, then immediately tap **Breathe with me** while it is still streaming. Speech must **not** start over the breathing timer. Same for **"I am steadier now"**. Both abort the request and silence TTS.

**Kill the network** (DevTools → Offline) and run SOS. You get an error card *plus* working helplines and breathing. Never a dead end.

---

## 4. Voice check-in — `/?v=checkin`

1. Tap the mic and speak — or **write in the box, which is always available**
2. Transcript appears live
3. Analysis returns mood, a **risk score 0–10**, and a summary

**The important part:** the tools rendered underneath are **chosen by that score.**

- Say something bleak → SOS and call-your-anchor surface
- Say something calm → journaling and a lesson surface

That is the contextual-safety-tools requirement working, and it is worth demonstrating deliberately with two contrasting check-ins.

### Crisis override — test this

Type or say: **"I took too much tonight"** or **"I don't want to wake up"**.

A crisis banner appears with emergency numbers **before the model responds, and regardless of what it returns**. It is deterministic (`src/lib/crisis.ts`), runs ahead of the AI, and cannot be suppressed by a hallucination, a quota failure, or an outage. Tuned to over-trigger on purpose.

---

## 5. Trigger journal (vision) — `/?v=journal`

1. Upload or photograph a bar, a liquor shop, a street — anything real
2. Gemini Vision names the triggers it can see and gives one concrete change
3. **Those triggers are written back into your profile**

**Now run SOS again.** The new triggers appear in the script. This loop is the strongest thing in the build: what the camera finds changes what the crisis script says.

---

## 6. Say no — `/?v=refusal`

Tap a scenario → three lines you can actually say out loud, light → firm, each with a speaker button to rehearse.

*Tap the same scenario twice — the second is instant. It is cached.*

---

## 7. Learn — `/?v=learn`

Tap a topic → a lesson written for **your** substance and **your** stage, plus a quiz that explains why each answer is right.

*Measured cache effect: **28.4s cold, 0.068s warm**, and the repeat costs no quota.*

---

## 8. Caregiver view — `/?v=caregiver`

Two tabs.

**Right now** — stats, the event feed from everything above, and **"Ask Zync"**: what to say word-for-word, and what to hold back.

**Family training (CRAFT)** — four modules. This is the clinically strongest feature in the app:

| Module | What it does |
|---|---|
| **Map the pattern** | Functional analysis — triggers, what using does for them, what it costs, where you have leverage |
| **Reward the sober days** | What to reinforce, how, and what to withdraw gently — with the safety limit stated each time |
| **Say it without a fight** | You type the sentence you want to say. It gets rewritten to land instead of starting a row |
| **Stop softening the fall** | Finds enabling behaviour without shaming, and always names something protective to keep doing |

**Worth testing:** the *communication* module. Type something raw — *"You promised you would stop and you lied to me again"* — and watch it come back as an "I" statement with the accusation removed and the door left open.

CRAFT **works with no linked patient**, because a caregiver usually seeks help before the person they support does. Pick the substance yourself and it runs.

---

## 9. Helplines — `/?v=helplines`

Real, verified, no AI: **112**, **NMBA 14446**, **Tele-MANAS 14416**, **KIRAN 1800-599-0019**, **MANAS 1933**.

---

## 10. Routing

- Every screen has a URL. Navigate a few, then use **browser back** or the **phone swipe-back gesture** — it steps back through screens rather than exiting the app
- Reload on any screen and you stay put
- `/?v=bogus` falls back to landing rather than rendering nothing

## 11. Responsive

Resize the window across the `md` breakpoint. Mobile is single-column and thumb-first with a floating SOS; desktop gains a persistent navigation rail and a wider content column. Same tree, no duplicate implementation.

---

## Verify the engineering

```bash
npm run lint     # clean
npm test         # 108 tests
npm run build    # green
```

## One caveat worth knowing

The Gemini **free tier caps some models at 20 requests per day**. The app walks a four-model fallback chain to survive that, but a thorough evaluation can still exhaust it. **Enable billing on the Google Cloud project** before submitting — Flash costs a fraction of a cent per call, and it removes the cap entirely.
