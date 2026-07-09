# DeenQuest Backend

A Go **modular monolith**: one deployable binary, organized as independent feature
modules on top of a small shared platform. If you are new here, read this file,
then open [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## The one rule

> **Everything that belongs to a feature lives in that feature's folder.**

Want to understand the learning agent? Open `internal/learning/` — its data
types, business logic, MongoDB code, Kafka consumers, HTTP handlers, and routes
are all there. No jumping between four layer folders.

## Layout

```
backend/
├── cmd/api/main.go        # entry point (~25 lines): load config → app.New → Run
│
├── internal/app/          # ⚙️  COMPOSITION ROOT — how everything fits together
│   ├── app.go             #    App lifecycle: New() + Run() + graceful shutdown
│   ├── infra.go           #    connects MongoDB, Redis, Kafka, Gemini, Expo, JWT
│   ├── modules.go         #    builds every module + cross-module wiring
│   ├── workers.go         #    ALL background workers (Kafka consumers, crons)
│   ├── http.go            #    middleware + mounts every module's routes
│   └── seed.go            #    startup data seeding
│
├── internal/              # 📦 FEATURE MODULES (one folder = one feature)
│   ├── auth/              #    signup/login, JWT issuing
│   ├── user/              #    user entity, profiles, account management
│   ├── progress/          #    streaks, daily tasks, levels, rewards, recitation, admin CRUD
│   ├── quran/             #    surah reading + audio (AlQuran API client, Redis cache)
│   ├── learning/          #    🤖 Learning Agent (see below)
│   │   └── model/         #    shared learning types (events, learner state)
│   ├── notification/      #    push tokens, Expo delivery, notification job log
│   │   └── smart/         #    rules engine: daily-task reminders, streak savers
│   ├── reflection/        #    reflection journal + AI companion
│   ├── knowledge/         #    Q&A over curated FAQ entries
│   ├── scheduling/        #    prayer-aware study plan
│   │   └── prayer/        #    prayer-time calculation
│   └── moderation/        #    content safety checks
│
└── internal/platform/     # 🧰 SHARED TOOLBOX (reusable, feature-agnostic)
    ├── config/  logger/  cache/    (Redis)  kafka/  gemini/  ollama/
    ├── push/    (Expo)   jwt/      bcrypt/
    └── middleware/  response/  validator/
```

**Dependency direction (never violated):**
`cmd → app → feature modules → platform`. Modules may import each other's
public types (e.g. `learning` reads `progress` data), but `platform` never
imports a module, and no module imports `app`.

## Anatomy of a module

Every module follows the same file naming, so once you know one, you know all:

| File                  | Role                                              |
| --------------------- | ------------------------------------------------- |
| `entity.go` / `*.go`  | domain types and business rules                   |
| `repository.go`       | storage interface the service depends on          |
| `mongo_*.go`          | MongoDB implementation of that interface          |
| `service.go`          | the feature's use-cases (business logic)          |
| `handler.go`          | HTTP handlers (parse request → service → respond) |
| `routes.go`           | the module's endpoints, registered on app groups  |

## How a request flows

```
HTTP request → app/http.go middleware → module routes.go → handler.go
            → service.go → repository (Mongo) → response
```

## How the Kafka pipeline flows (Learning Agent)

```
user acts (task/lesson/recitation)
  → progress service emits BehaviorEvent ──► Kafka topic "learning.events"
                                                │
      ┌─────────────────────────────────────────┼──────────────────────────┐
      ▼ consumer group                          ▼ consumer group           ▼ consumer group
learning/state_service.go               learning/mistakes_service.go   learning/ai_service.go
(mastery, streak risk — deterministic)  (mistake notebook)             (Gemini copy — optional)
```

Each consumer group reads the same topic independently — one slow consumer
never blocks the others. All consumers are started in `app/workers.go`.

## Run it

```bash
go run ./cmd/api            # needs MongoDB; Kafka/Redis/Gemini are optional
go test ./...
go build ./...
```

Optional integrations degrade gracefully: no Redis → no rate limit/cache; no
Kafka → events are dropped with a warning; no `GEMINI_API_KEY` → AI features
fall back to deterministic behavior.

## Adding a new feature (checklist)

1. Create `internal/<feature>/` with `service.go`, `handler.go`, `routes.go`
   (plus `entity.go`, `repository.go`, `mongo_repository.go` if it stores data).
2. Construct it in `app/modules.go` (add fields to `Modules`).
3. Mount its routes in `app/http.go`.
4. If it has background work, start it in `app/workers.go`.

That's it — four files to touch outside your module, all in `internal/app/`.
