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
8. [Background processing](#8-background-processing)
9. [Optional integrations & graceful degradation](#9-optional-integrations)
10. [Design decisions](#10-design-decisions)

---

## 1. History

The backend has gone through three shapes:

1. **Four microservices** behind an API gateway — too much overhead for one
   team: 4 deployments, duplicated `pkg/` code, network hops for every call.
2. **Layered DDD monolith** — one binary with four horizontal layers
   (`domain/`, `application/`, `infrastructure/`, `interfaces/`). Better, but a
   single feature was smeared across four folders and `main.go` grew into a
   300-line wiring file.
3. **Modular monolith** (current) — one binary, organized *vertically* by
   feature. Same business logic, same endpoints, same MongoDB collections as
   before; only the code organization changed.

In July 2026 the experimental Learning Agent suite (event pipeline, learner
state, recommendations, mistake notebook, reflection journal, Q&A, study plan,
weekly report) was removed from the product; the modular structure made that a
clean folder-level deletion.

## 2. The core idea

> Organize code by **what it does** (feature), not by **what kind of code it
> is** (layer).

Understanding the notification system used to mean reading four places:

```
internal/domain/notification/        (entities)
internal/application/notification/   (services)
internal/infrastructure/persistence/ (Mongo repos, mixed with 8 other repos)
internal/interfaces/http/handler/    (handler, mixed with 11 other handlers)
```

Now it is one place:

```
internal/notification/               (everything: types, service, Mongo, HTTP)
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
| `infra.go`   | `Infra` struct: MongoDB, Redis, Gemini, Expo, JWT                     |
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
| `notification`       | push-token registry, Expo delivery, `notification.send` job consumer + job log |
| `notification/smart` | rules engine evaluated by cron: daily-task reminders, streak savers   |

### internal/platform (shared toolbox)

`config`, `logger`, `cache` (Redis), `kafka` (producer/consumer wrappers),
`gemini` (used by the recitation coach), `ollama` (unused, kept for future
experiments), `push` (Expo), `jwt`, `bcrypt`, `middleware`, `response`,
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
`progress/recitation_service.go`, `progress/arabic_matcher.go`,
`notification/jobs_consumer.go`, etc.

## 5. Dependency rules

```
cmd/api  →  app  →  feature modules  →  platform
```

1. **`platform` never imports a module.** It is the bottom of the stack.
2. **No module imports `app`.** Wiring flows downward only.
3. **Modules may import other modules' public API** when the business requires
   it (e.g. `auth` uses the `user` repository; `notification/smart` uses the
   notification sender). Keep these edges few and visible — they are
   documented by the imports themselves.
4. **No cycles** — enforced by the Go compiler. If two modules ever need each
   other, extract the shared types into a leaf subpackage both can import.

## 6. Cross-module communication

Two patterns are used, in order of preference:

1. **Consumer-defined interfaces** — a module that *optionally* uses another
   declares a small local interface instead of importing the provider:
   `smart.PushSender` (satisfied by `notification.Service`),
   `progress.RecitationCoach` (satisfied by `gemini.Client`). The wiring
   happens in `app/modules.go` — grep for `Set` there to see every optional
   edge.

2. **Kafka events** — for asynchronous work the producer and consumers only
   share a topic name and payload type. The one active topic is
   `notification.send` (see [kafka-explained.md](kafka-explained.md)).

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

## 9. Optional integrations

Every external dependency except MongoDB degrades gracefully:

| Missing | Effect |
| ------- | ------ |
| Redis | no response caching, no rate limiting (warning logged) |
| Kafka | the notification consumer logs read errors; API keeps serving |
| `GEMINI_API_KEY` | recitation coach falls back to deterministic tips |
| Expo token | pushes skipped and logged |

`Infra.Gemini` and `Infra.Redis` are nil when unavailable — nil-checks at the
wiring site (`modules.go`), not scattered through business logic.

## 10. Design decisions

- **Why a monolith at all?** One team, one deployment, no network hops,
  ~30MB RSS. Module boundaries keep a future extraction cheap: a module's
  folder is the candidate service.
- **Why package-by-feature over layers?** The unit of change is a feature.
  Layered packages optimize for "show me all repositories", which nobody asks;
  feature packages optimize for "show me everything about notifications",
  which everybody asks. It also makes removing a feature a folder deletion —
  proven when the Learning Agent suite was retired.
- **Why is wiring centralized in `app`?** So modules stay constructor-injected
  and testable, and there is exactly one file to read to understand runtime
  composition. No DI framework needed at this size.
- **Why do repos live inside modules?** A module owns its MongoDB collections.
  The old central `persistence/` package made every module's storage everyone's
  business and hid which collections belonged to whom.
