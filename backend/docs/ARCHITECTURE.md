# DeenQuest Backend — Modular Monolith Architecture

> **Date**: 2026-07-10
> **Go Version**: 1.24
> **Framework**: Gin
> **Module**: `github.com/chawais/deenquest/backend`

Start with the [backend README](../README.md) for the quick tour; this document
explains the architecture in depth and the reasoning behind it.

---

## Table of Contents

1. [History: microservices → layered monolith → modular monolith](#1-history)
2. [The core idea: package by feature, not by layer](#2-the-core-idea)
3. [The three zones: cmd/app, modules, platform](#3-the-three-zones)
4. [Anatomy of a module](#4-anatomy-of-a-module)
5. [Dependency rules](#5-dependency-rules)
6. [Cross-module communication](#6-cross-module-communication)
7. [Request lifecycle](#7-request-lifecycle)
8. [Background processing (Kafka + crons)](#8-background-processing)
9. [Optional integrations & graceful degradation](#9-optional-integrations)
10. [Design decisions](#10-design-decisions)

---

## 1. History

The backend has gone through three shapes:

1. **Four microservices** behind an API gateway — too much overhead for one
   team: 4 deployments, duplicated `pkg/` code, network hops for every call.
2. **Layered DDD monolith** — one binary with four horizontal layers
   (`domain/`, `application/`, `infrastructure/`, `interfaces/`). Better, but a
   single feature was smeared across four folders, `main.go` grew into a
   300-line wiring file, and packages like `intelligent` and `worker` gave no
   hint of what they did.
3. **Modular monolith** (current) — one binary, organized *vertically* by
   feature. Same business logic, same endpoints, same MongoDB collections and
   Kafka topics as before; only the code organization changed.

## 2. The core idea

> Organize code by **what it does** (feature), not by **what kind of code it
> is** (layer).

Before, understanding the Learning Agent meant reading four places:

```
internal/domain/learning/            (entities)
internal/application/learning/       (services)
internal/infrastructure/persistence/ (Mongo repo, mixed with 8 other repos)
internal/interfaces/http/handler/    (handler, mixed with 11 other handlers)
```

Now it is one place:

```
internal/learning/                   (everything: types, engine, Mongo, HTTP)
```

Layers still exist *inside* each module — entities, repository interface,
Mongo implementation, service, handler are separate files — but they are
colocated, so the unit of understanding matches the unit of change.

## 3. The three zones

```
cmd/api/main.go     entry point: config.Load() → app.New(cfg) → app.Run()
internal/app/       composition root — the ONLY place that wires things together
internal/<feature>/ feature modules — all business capability lives here
internal/platform/  shared toolbox — feature-agnostic building blocks
```

### internal/app (composition root)

| File         | Responsibility                                                        |
| ------------ | --------------------------------------------------------------------- |
| `app.go`     | `App` lifecycle: `New()` builds, `Run()` serves + graceful shutdown   |
| `infra.go`   | `Infra` struct: MongoDB, Redis, Kafka producer, Gemini, Expo, JWT     |
| `modules.go` | `Modules` struct: constructs every module, does all cross-module wiring |
| `workers.go` | starts every background worker — the whole background surface in one file |
| `http.go`    | gin engine, global middleware, route-group setup, mounts module routes |
| `seed.go`    | admin user, daily tasks, levels, rewards seeding on boot              |

If you ever wonder "who talks to whom?" — read `modules.go` top to bottom.
If you wonder "what runs in the background?" — read `workers.go` top to bottom.

### Feature modules

| Module               | Capability                                                            |
| -------------------- | --------------------------------------------------------------------- |
| `auth`               | signup, login, JWT issuing, admin seeding                             |
| `user`               | user entity + Mongo repo (owned here), profile CRUD                   |
| `progress`           | streaks, XP, daily tasks, levels, rewards, recitation checks, admin CRUD, analytics |
| `quran`              | surah list/detail/audio via AlQuran API, Redis-cached                 |
| `learning`           | the event-driven Learning Agent (details in [learning-agent.md](learning-agent.md)) |
| `learning/model`     | learning's shared data types — see [§6](#6-cross-module-communication) |
| `notification`       | push-token registry, Expo delivery, `notification.send` job consumer + job log |
| `notification/smart` | rules engine evaluated by cron: daily-task reminders, streak savers   |
| `reflection`         | reflection journal, AI companion feedback, moderation hook            |
| `knowledge`          | Q&A over curated FAQ entries, optional AI phrasing                    |
| `scheduling`         | prayer-aware study plan (`scheduling/prayer` = prayer-time math)      |
| `moderation`         | content-safety classification used by reflection                     |

### internal/platform (shared toolbox)

`config`, `logger`, `cache` (Redis), `kafka` (producer/consumer wrappers),
`gemini`, `ollama`, `push` (Expo), `jwt`, `bcrypt`, `middleware`, `response`,
`validator`. These know **nothing** about features — they could be extracted
into a separate library without changes.

## 4. Anatomy of a module

Uniform file naming across all modules:

```
internal/<feature>/
├── entity.go            # domain types + invariants (business rules on data)
├── repository.go        # storage interface the service depends on
├── mongo_repository.go  # MongoDB implementation of that interface
├── service.go           # use-cases; depends on the interface, not on Mongo
├── handler.go           # HTTP: parse/validate request → service → respond
├── routes.go            # the module's endpoints (also serves as API docs)
└── *_test.go            # tests live with the code they test
```

Bigger modules add files with descriptive names instead of extra layers:
`learning/engine_state.go` (pure state evolution), `learning/engine_decision.go`
(pure recommender), `learning/engagement.go` (win-back notifier), etc.

## 5. Dependency rules

```
cmd/api  →  app  →  feature modules  →  platform
```

1. **`platform` never imports a module.** It is the bottom of the stack.
2. **No module imports `app`.** Wiring flows downward only.
3. **Modules may import other modules' public API** when the business requires
   it (e.g. `learning` reads `progress` level data; `auth` uses the `user`
   repository; `notification/smart` uses the notification sender). Keep these
   edges few and visible — they are documented by the imports themselves.
4. **No cycles** — enforced by the Go compiler. When two modules need each
   other, extract the shared types into a leaf subpackage (see next section).

## 6. Cross-module communication

Three patterns are used, in order of preference:

1. **Shared leaf package** — `progress` must *emit* learning events and *read*
   learner state, while `learning` must read progress levels. Direct imports in
   both directions would be a compile-time cycle. Solution:
   `internal/learning/model` holds learning's data types (`BehaviorEvent`,
   `LearnerState`, repository interfaces) and imports no module, so `progress`
   depends only on `learning/model` while `learning` depends on `progress`.
   No cycle.

2. **Consumer-defined interfaces** — a module that *optionally* uses another
   declares a small local interface instead of importing the provider:
   `progress.EventEmitter` (satisfied by `learning.Publisher`),
   `reflection.Moderator` (satisfied by `moderation.Service`),
   `learning.Generator` (satisfied by `gemini.Client`). The wiring happens in
   `app/modules.go` via `SetX(...)` calls — grep for `Set` there to see every
   optional edge.

3. **Kafka events** — for asynchronous work the producer and consumers only
   share the topic + payload type from `learning/model`. Producers never know
   who consumes.

## 7. Request lifecycle

```
HTTP request
  → app/http.go        global middleware: Recovery → RequestLogger → CORS → Gzip → RateLimit(Redis)
  → route group        public /api/v1 | JWT-authenticated | admin (JWT + AdminOnly)
  → <module>/routes.go endpoint definition
  → <module>/handler.go  bind/validate DTO
  → <module>/service.go  business logic
  → <module>/mongo_*.go  persistence
  → platform/response    uniform JSON envelope
```

## 8. Background processing

All started in `app/workers.go`; all stop via context cancellation on shutdown.

| # | Worker | Trigger | What it does |
|---|--------|---------|--------------|
| 1 | notification job consumer | Kafka `notification.send` | delivers pushes via Expo, logs to job log |
| 2 | job-log heartbeat | 24h ticker | records a daily-reset marker |
| 3 | smart notification cron | every minute | evaluates `notification/smart` rules for all users |
| 4 | learning state engine | Kafka `learning.events` (group `learning-state-group`) | deterministic mastery/streak updates |
| 5 | mistake notebook | Kafka `learning.events` (group `learning-mistakes-group`) | records wrong answers for review |
| 6 | AI copywriter (optional) | Kafka `learning.events` (group `learning-ai-group`) | Gemini motivational/feedback copy |
| 7 | learning pattern sweep | periodic | re-segments learners, sends win-back pushes |

Consumers 4–6 read the **same topic under different consumer groups**, so each
reactor processes every event independently — one slow consumer never blocks
the others, and each can be scaled or disabled on its own.

## 9. Optional integrations

Every external dependency except MongoDB degrades gracefully:

| Missing | Effect |
| ------- | ------ |
| Redis | no response caching, no rate limiting (warning logged) |
| Kafka | behavior events dropped with a warning; API keeps serving |
| `GEMINI_API_KEY` | all AI features fall back to deterministic behavior; AI consumer not started |
| Expo token | pushes skipped and logged |

`Infra.Gemini` and `Infra.Redis` are nil when unavailable — nil-checks at the
wiring site (`modules.go`, `workers.go`), not scattered through business logic.

## 10. Design decisions

- **Why a monolith at all?** One team, one deployment, no network hops,
  ~30MB RSS. Kafka already gives us the async decoupling that microservices
  would otherwise provide. Module boundaries keep a future extraction cheap:
  a module's folder is the candidate service.
- **Why package-by-feature over layers?** The unit of change is a feature.
  Layered packages optimize for "show me all repositories", which nobody asks;
  feature packages optimize for "show me everything about notifications",
  which everybody asks.
- **Why is wiring centralized in `app`?** So modules stay constructor-injected
  and testable, and there is exactly one file to read to understand runtime
  composition. No DI framework needed at this size.
- **Why `learning/model` instead of a global `domain/`?** Only learning's
  types are shared across modules today. A global shared-types package
  becomes a dumping ground; a per-module `model` subpackage keeps ownership
  clear and is only introduced where a cycle forces it.
- **Why do repos live inside modules?** A module owns its MongoDB collections.
  The old central `persistence/` package made every module's storage everyone's
  business and hid which collections belonged to whom.
