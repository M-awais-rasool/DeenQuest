# The Learning Agent — How It Works (Simple Guide)

This doc explains the **Learning Agent** in plain words: what it does, how it is
triggered step by step, and why it is built to be fast and cheap at scale.

---

## 1. What is it? (one paragraph)

DeenQuest used to treat every learner the same. The Learning Agent makes the app
**personal**: it quietly watches what each learner does (answers, time spent,
recitations, app opens), keeps a little "report card" for them, and figures out
**what they should do next** — revise a weak letter, move to the next level, or
come back after being away. The thinking is 100% plain rules (predictable and
free). On top, an **optional** Gemini AI writes one friendly sentence of
encouragement. If the AI is turned off, learning still works exactly the same.

Think of it like a **personal Qaida tutor** sitting next to each learner.

---

## 2. The 4 moving parts

| Part | Job | Where |
|---|---|---|
| **Events** | "Something happened" messages (answered wrong, finished a level…) | `domain/learning/event.go` |
| **StateUpdater** | Reads each event and updates the learner's report card | `application/learning/state_service.go` + `engine_state.go` |
| **Recommender** | Looks at the report card and picks the next best action | `recommender.go` + `engine_decision.go` |
| **AI layer (optional)** | Writes one motivational line for big moments | `ai_service.go` + `infrastructure/gemini` |

They talk through **Kafka** (a message pipe). Each part is an independent
"listener" on the same pipe, so they never block each other — and we can add new
listeners later without touching anything.

The "report card" is one MongoDB document per user called **`LearnerState`**:

```
weak letters: [ت, ث]      strong letters: [ا, ب]
learning speed: 0.7        engagement: 0.8        dropout risk: 0.1
segment: "active"          per-letter mastery + when each is due for revision
```

---

## 3. The big picture (one diagram)

```
 PHONE (Expo app)                          BACKEND (Go)
 ───────────────                           ────────────
 user answers,                POST /events
 finishes lessons   ───────────────────────►  publish to Kafka topic
 (batched, async)                              "learning.events"
                                                     │
   server also publishes completion/recitation  ─────┤
   events directly (reliable, can't be faked)        │
                                                     ▼
                          ┌──────────── same topic, 3 independent readers ───────────┐
                          ▼                          ▼                               ▼
                  StateUpdater                 (pattern sweep, every 15m)        AI layer
                  updates report card          re-checks idle/over-due users     writes 1 line
                          │                          │  (cron, not events)       of encouragement
                          ▼                          ▼                               │
                    MongoDB: learner_states + recommendations  ◄─────────────────────┘
                          ▲
   GET /learning/recommendations ── phone shows "Recommended for you" card
   GET /learning/state          ── phone shows progress / motivation
```

---

## 4. Step by step — what happens when a learner does something

### Example A: "Ali keeps getting the letter ت wrong"

1. **Ali taps the wrong answer** on a ت question.
   The app calls `track.answer(false, { skill_tags: ["ت"] })`.
2. The app **batches** this with other events and sends them once to
   `POST /api/v1/events` (it does not wait for a reply — zero lag for Ali).
3. The backend **publishes** the event to Kafka, *keyed by Ali's user id* (so all
   of Ali's events stay in order).
4. The **StateUpdater** reads the event and updates Ali's report card:
   - ت mastery drops (e.g. 0.5 → 0.3 → 0.18 after a few misses).
   - ت is added to **weak letters**.
   - ت is marked **"due for revision now"** (spaced-repetition resets it).
   - Ali's **segment** may flip to `"weak"`.
5. Later Ali opens the Home screen. The app calls
   `GET /api/v1/learning/recommendations`.
6. The **Recommender** sees: "ت is weak AND due → recommend revising the level
   that teaches ت (Level 1)." Ali sees a card:
   > **Revision — Revise: The First Letters**
   > "Mastery of ت is 18% and revision is due"
7. (If AI is on) Gemini adds a warm line like:
   > "Great effort! Let's give ت a little more love — you've got this."

**Result:** Ali is gently guided back to exactly what he's struggling with —
automatically, with no human setting it up.

### Example B: "Sara is doing great"

1. Sara answers several letters correctly → mastery rises above 80%.
2. Those letters move to **strong letters**; her segment becomes `"improving"`.
3. The Recommender skips revision and recommends **the next level**:
   > **Next up — Continue: More Letters!**
   > "Strong recent accuracy — ready for the next step"

### Example C: "Omar disappeared for 4 days"

Omar isn't tapping anything, so **no events arrive**. How do we notice?

1. The **pattern sweep** (a timer that runs every 15 minutes) wakes up.
2. It asks Mongo for **only** the users who need attention: "anyone idle 3+ days
   who isn't already marked inactive, OR anyone with a revision now due." Omar
   matches the first rule.
3. It marks Omar `"inactive"`, bumps his **dropout risk**, and creates a
   **"Welcome back"** recommendation. If a notifier is wired, it can also send a
   gentle push.

This is the important idea: **recommendations are based on patterns over time,
not single taps.** One wrong answer doesn't spam Omar — a *trend* does.

---

## 5. The two kinds of triggers (easy summary)

| Trigger | Fired by | Example |
|---|---|---|
| **Event trigger** (instant) | A learner action | answered wrong, finished a level, recited an ayah |
| **Time trigger** (scheduled) | The 15-minute cron sweep | "you've been away", "this letter is due for review again" |

Event triggers keep the report card fresh in near real-time.
Time triggers catch the things that happen *because time passed*.

---

## 6. Which events exist?

Sent by the **app** (`/events`): `answer_correct`, `answer_wrong`, `hint_used`,
`task_started`, `task_completed`, `task_abandoned`, `time_spent`, `session_start`.

Sent by the **server** automatically (reliable, can't be spoofed):
`lesson_completed`, `level_completed`, `recitation_scored` (this one even knows
*which letters* were mispronounced, from the voice score).

Each event carries `skill_tags` (e.g. `["ت"]`) so the agent knows **which skill**
to credit or penalize. Content is tagged in the seed data (e.g. the ت letter-hunt
lesson is tagged `["ت"]`).

---

## 7. How a recommendation is chosen (the rules)

The Recommender runs these rules in order and returns a short, ranked list:

1. **Weakest first:** for each weak letter that is *due*, recommend the level that
   teaches it. (Capped at 2 so revision never takes over.)
2. **Win back:** if the learner is `inactive`, add a "welcome back" card.
3. **Move forward:** recommend the next unlocked, unfinished level — unless they
   *just* did it (anti-repetition).

Everything is plain `if/else` and math — no AI, no randomness. Same input →
same output (we even have unit tests for it in `engine_test.go`).

**Spaced repetition (SM-2-lite):** when you get a letter right, its next review is
pushed further out (1 day → a few days → a week…). Get it wrong and it becomes due
immediately. This is how revision and new content stay balanced over time.

---

## 8. The optional AI layer (kept separate on purpose)

- It is a **separate listener** on the same events. It only reacts to a few "big
  moments" (finished a level, struggled on a recitation).
- It writes **one short sentence** and saves it on the learner's state. The app
  shows it under the recommendation card.
- It uses **Gemini 2.0 Flash** (cheap, fast) for the one-line copy.
- **If `GEMINI_API_KEY` is empty, this listener never starts** and nothing
  else changes. The learning brain is always the deterministic rules.

So AI is pure "icing" — never the cake.

---

## 9. Why it's fast and cheap at scale

Small, deliberate choices that keep latency low and bills small:

- **Non-blocking ingest:** the app's `/events` call publishes **async and in one
  batch** — the phone never waits for Kafka. Sub-millisecond from the user's view.
- **Per-user ordering, horizontal scale:** events are keyed by user id, so a
  user's events land on one Kafka partition (correct order, no lost updates) while
  different users spread across partitions/consumers. Add partitions to scale out.
- **Reads don't write:** `GET /recommendations` serves the **saved** list and only
  recomputes when the learner's state actually changed since last time. Polling the
  Home screen is therefore a cheap read, not a recompute-and-write every time.
- **The cron is O(work, not users):** the 15-minute sweep queries **only**
  candidates (idle users, or users with a review now due) using indexes
  (`next_due_at`, `segment+last_event_at`). 1 million calm users cost almost
  nothing; we only touch the few who need action.
- **Bounded storage:** old recommendations are deleted when replaced, so the
  `recommendations` collection stays tiny (just the active ones per user).
- **Tuned consumers:** behavior events are picked up promptly (`MinBytes=1`, short
  `MaxWait`) with batched offset commits to keep broker chatter down.
- **Graceful degradation:** if Kafka or the AI is down, core flows (lessons, XP,
  streaks) keep working — learning calls are fire-and-forget and nil-safe.

> Note on at-least-once delivery: on a rare crash an event could be reprocessed.
> Mastery is a smoothed average, so a duplicate barely moves it — acceptable for
> this use case. (A dedup-by-event-id step can be added later if needed.)

---

## 10. Try it yourself (end to end)

```bash
# 1. start infra + server
cd backend && docker-compose up -d        # Kafka, Zookeeper, Redis
make run                                   # you'll see the learning consumers + sweep start

# 2. log in and grab a token, then send a few "wrong" events for ت
curl -X POST localhost:8080/api/v1/events \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"events":[
        {"type":"answer_wrong","skill_tags":["ت"],"level_id":1},
        {"type":"answer_wrong","skill_tags":["ت"],"level_id":1},
        {"type":"answer_wrong","skill_tags":["ت"],"level_id":1}
      ]}'

# 3. see the report card update (weak_areas should include ت)
curl localhost:8080/api/v1/learning/state -H "Authorization: Bearer $TOKEN"

# 4. see the recommendation (a "revision" for the level that teaches ت)
curl localhost:8080/api/v1/learning/recommendations -H "Authorization: Bearer $TOKEN"
```

In MongoDB you can watch it live:
```js
db.learner_states.findOne({ user_id: "<id>" })   // skills, weak_areas, segment
db.recommendations.find({ user_id: "<id>", status: "active" })
```

Turn the AI on by setting `GEMINI_API_KEY` in `.env`; complete a level and the
recommendation/state will carry a `message` / `motivation` line. Unset it and
everything still works — that's the point.

---

## 11. File map (where to look)

```
backend/internal/
├── domain/learning/        entity.go (LearnerState), event.go, repository.go
├── application/learning/   publisher.go      → sends events
│                           state_service.go  → StateUpdater (consumer)
│                           engine_state.go   → pure rules: mastery, speed, segment
│                           recommender.go    → builds inputs, persists recs
│                           engine_decision.go→ pure rules: pick next action
│                           scheduler.go      → 15-min pattern sweep (cron)
│                           ai_service.go     → optional Gemini listener
│                           engine_test.go    → unit tests for the rules
├── infrastructure/
│   ├── gemini/client.go    Gemini REST client (gemini-2.0-flash)
│   └── persistence/mongo_learning_repository.go
└── interfaces/http/handler/events_handler.go, learning_handler.go
```

Frontend: `DeenQuestExpo/app/services/learningEvents.ts` (event queue),
`app/components/learning/NextBestActionCard.tsx` (the card on Home).
