# DeenQuest — Roadmap: Future Features, Improvements & Agents

This document captures where DeenQuest can go next: features that genuinely help
learners, new **agents** to build, and platform improvements that make the app
more **useful, intuitive, and accessible** so more people can adopt and benefit
from it.

It builds on the architecture already in place — an event-driven backend where
each "agent" is an independent Kafka consumer with a **deterministic, rule-based
core** and an **optional AI layer** (currently Gemini). New agents should follow
the same pattern: predictable logic first, AI only as enhancement.

---

## Guiding principles

1. **Deterministic core, optional AI.** Every agent must work correctly with the
   AI turned off. AI adds warmth and explanations, never the decision.
2. **Religious accuracy & humility.** Anything that touches Quran, Hadith, or
   rulings must use vetted sources, cite them, and defer to scholars. Never
   improvise rulings. (See [AI & content safety](#ai--content-safety-guardrails).)
3. **Privacy by default.** Learner data stays minimal, exportable, and deletable.
   On-device where possible.
4. **Accessible to everyone.** Low literacy, low connectivity, older devices,
   screen readers, and many languages are first-class, not afterthoughts.
5. **Loosely coupled.** New agents subscribe to the existing event stream; adding
   one never requires touching the others.

---

## 1. Near-term user-facing features

### Learning
- **Daily Review screen** — a dedicated "review" surface powered by the Learning
  Agent's spaced-repetition `due` skills. One tap → practice exactly what's due.
  *(The data already exists; this just surfaces it.)*
- **Placement / skip-ahead** — a short adaptive check at onboarding so returning
  or advanced users don't start from Alif. Removes early boredom → better
  retention.
- **Per-skill mastery map** — let learners see their own strong/weak letters
  (the `learner_states.skills` data) as a friendly progress map.
- **Mistake notebook** — auto-collect a learner's wrong answers so they can
  revisit them deliberately.
- **Multi-course expansion** — Tajweed rules, Duas & Adhkar, short Surah
  memorization (Hifz), Seerah stories for kids. The level/lesson/skill model
  already supports this; mostly content + a few new lesson components.

### Engagement & motivation
- **Streak freeze / repair** — a forgivable miss (earned or purchasable with XP)
  so one bad day doesn't wipe weeks of effort. Huge for long-term retention.
- **Weekly goals & leagues** — opt-in Duolingo-style leagues / cohorts for
  friendly competition; gentle, non-toxic framing.
- **Shareable certificates & milestones** — completing a course or a 30-day
  streak generates a beautiful shareable card → organic growth.
- **Smart reminder timing** — learn each user's best time-of-day and remind then,
  anchored around prayer times (see Scheduling Agent).

### Accessibility & reach
- **Offline mode** — downloadable lessons + queued events that sync later.
  Critical for low-connectivity regions where many learners are.
- **Localization + RTL** — Urdu, Arabic, Bahasa, Turkish, French, Hausa, etc.,
  with full right-to-left support. The single biggest unlock for global adoption.
- **Audio-first / low-literacy mode** — large type, voice prompts, icon-driven
  navigation, so non-readers and children can learn independently.
- **Full a11y pass** — screen-reader labels, dynamic font scaling, high-contrast
  & color-blind-safe palettes, a haptics toggle, captions on audio.
- **Prayer times, Qibla & Hijri calendar** — small but high-value daily-use
  utilities that keep the app open and habitual.

### Community & family
- **Family / kids accounts** — one guardian, multiple child profiles, with
  weekly progress summaries (see Parent/Teacher Agent).
- **Class / mosque cohorts** — a teacher creates a group, assigns levels, sees
  group progress. Drives institutional adoption.
- **Friends & gentle nudges** — add friends, cheer streaks, no public shaming.

---

## 2. Agents to build

Each agent is an independent reactor on the event stream. The table is a summary;
details follow.

| Agent | What it does | User benefit | Builds on |
|---|---|---|---|
| **Engagement Agent** | Personalized, well-timed re-engagement nudges | Comes back at the right moment, never spammed | Existing `intelligent/` + Learning Agent dropout-risk |
| **Pronunciation / Tajweed Coach** | Per-letter articulation + tajweed feedback & drills | Actually improves recitation | `recitation_service` + Whisper |
| **Curriculum Agent** | Finds content gaps from aggregate weak areas | Better lessons, faster fixes | Learning Agent `learner_states` |
| **Reflection Companion** | Kind responses to daily reflections + relevant ayah/hadith | Feels heard; deeper spiritual habit | Daily tasks + Gemini |
| **Q&A / Knowledge Agent (RAG)** | Answers basic questions from vetted sources, with citations | Safe, accessible answers | New knowledge base + Gemini |
| **Scheduling / Prayer-aware Agent** | Plans study around salah & best time-of-day | Fits the Islamic daily rhythm | Prayer-times + Learning Agent |
| **Onboarding / Placement Agent** | Adaptive start point for new users | No boredom, instant relevance | Learning Agent engine |
| **Parent / Teacher Agent** | Weekly progress reports & alerts | Accountability, family adoption | Learning Agent stats |
| **Safety / Moderation Agent** | Screens any user-generated text | Safe, respectful community | New, gates community features |

### Engagement Agent
**Purpose:** turn the existing template notifications into a genuinely smart
re-engagement system. **How:** consumes the same behavior events + reads
`learner_states` (engagement, dropout risk, best active hours); deterministic
rules pick *who*, *when*, and *which* message; Gemini optionally personalizes the
copy (still Arabic-correct). **Benefit:** users get a nudge at the moment they're
most likely to act, about the exact thing they were learning — and inactive users
get win-back messages before they churn.

### Pronunciation / Tajweed Coach Agent
**Purpose:** move recitation feedback from "score" to "coaching." **How:** extend
`recitation_service` to report per-letter makhraj (articulation point) issues and
common tajweed rule violations; deterministic scoring decides the drill, Gemini
explains *how* to fix it in simple words. **Benefit:** learners actually correct
their recitation instead of just seeing a number — the #1 reason people seek a
human teacher.

### Curriculum Agent (admin-facing)
**Purpose:** help content authors with data. **How:** aggregates weak areas
across all learners (which letters/levels cause the most failures, where people
drop off) and surfaces it on the admin **Learning Agent** page; can draft revision
lessons for review. **Benefit:** the curriculum continuously improves where real
learners actually struggle.

### Reflection Companion Agent
**Purpose:** make the daily reflection task feel alive. **How:** when a user
writes a reflection, an optional Gemini response offers gentle encouragement and a
*relevant, vetted* ayah/hadith (retrieved, not invented). Deterministic filters
keep it safe and on-tone; never gives rulings. **Benefit:** the habit becomes
emotionally rewarding, not a checkbox.

### Q&A / Knowledge Agent (RAG)
**Purpose:** let users ask basic questions ("what breaks wudu?", "meaning of this
ayah") and get **safe** answers. **How:** retrieval-augmented generation over a
**curated, scholar-reviewed** corpus (Quran translations, authentic hadith
collections, vetted explanations) with hard guardrails: cite every source, refuse
fatwa-style questions, and always show a "for rulings, consult a qualified
scholar" note. **Benefit:** accessible, trustworthy answers — with humility built
in. *(Highest sensitivity; ship only with scholarly review.)*

### Scheduling / Prayer-aware Agent
**Purpose:** fit learning into an Islamic day. **How:** uses the user's location/
timezone + prayer times to suggest study slots ("a quick review after Fajr?") and
to time reminders so they never clash with salah. **Benefit:** the app respects
and reinforces the daily rhythm of worship.

### Onboarding / Placement Agent
**Purpose:** start every learner in the right place. **How:** a 60-second adaptive
check feeds the Learning Agent engine to pre-seed skill mastery and choose the
starting level. **Benefit:** advanced users aren't bored, beginners aren't
overwhelmed — both stick around.

### Parent / Teacher Agent
**Purpose:** bring families and classes in. **How:** rolls up per-learner stats
into weekly summaries and "needs attention" alerts for guardians/teachers.
**Benefit:** accountability and visibility, which drive both retention and
word-of-mouth growth in families and madrasahs.

### Safety / Moderation Agent
**Purpose:** keep any user-generated content (reflections shared publicly,
community posts) respectful and safe. **How:** deterministic filters + an AI
classifier gate content before it's visible. **Benefit:** a community people trust
enough to invite their kids into. *(Prerequisite for shipping social features.)*

---

## 3. Platform & infrastructure improvements

- **Event-id dedup** — make event processing effectively exactly-once so a rare
  reprocessed event can't skew mastery. (Currently at-least-once; tolerable but
  worth hardening.)
- **Event replay / backfill** — persist a raw `learning_events` log so the agent
  can be re-run after engine changes or for new agents.
- **A/B testing for recommendations** — try recommendation strategies and measure
  retention impact, not guesswork.
- **Feature flags** — ship agents/features gradually and safely.
- **Observability** — Prometheus/Grafana metrics + alerts; the admin Learning
  Agent page is a start, extend it with time-series and per-segment trends.
- **Cost controls for AI** — caching, batching, and per-user rate limits so the
  optional AI layer stays cheap at scale.
- **Test coverage & load tests** — especially around the event pipeline and
  recommendation engine.

---

## 4. AI & content safety guardrails

Because DeenQuest deals with religious content, every AI-touching feature must:

- **Ground in vetted sources** — Quran text/translations and authentic hadith
  from reviewed collections; never let the model invent verses or rulings.
- **Cite sources** and make them tappable.
- **Refuse fatwa-style questions** and direct users to qualified scholars.
- **Keep Arabic in Arabic script** (pure, never romanized) per the app's content
  rule.
- **Stay deterministic where it matters** — scoring, progression, and rewards are
  always rule-based; AI only generates explanations, encouragement, and copy.
- **Be reviewable** — log AI outputs for spot-checking; allow admins to disable
  the AI layer instantly (already supported: unset the API key).

---

## 5. Suggested prioritization

**Phase 1 — surface what we already compute (quick wins, high impact)**
Daily Review screen · per-skill mastery map · streak freeze · Engagement Agent ·
Onboarding/Placement Agent.

**Phase 2 — reach & accessibility**
Localization + RTL · offline mode · audio-first/low-literacy mode · prayer times &
scheduling agent · full a11y pass.

**Phase 3 — depth & community**
Pronunciation/Tajweed Coach · Reflection Companion · Parent/Teacher Agent ·
family/kids accounts · cohorts.

**Phase 4 — knowledge & scale (highest sensitivity)**
Q&A/Knowledge Agent (RAG) with scholarly review · Safety/Moderation Agent ·
A/B testing · observability & cost controls.

---

*Have an idea or want to pick something up? Open an issue describing the user
problem first, then the smallest agent/feature that solves it — deterministic
core before AI.*

