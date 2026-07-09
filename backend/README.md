# DeenQuest Backend

A Go **modular monolith**: one deployable binary, organized as independent feature
modules on top of a small shared platform. If you are new here, read this file,
then open [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## The one rule

> **Everything that belongs to a feature lives in that feature's folder.**

Want to understand notifications? Open `internal/notification/` — its data
types, business logic, MongoDB code, Kafka consumer, HTTP handlers, and routes
are all there. No jumping between four layer folders.

## Layout

```
backend/
├── cmd/api/main.go        # entry point (~25 lines): load config → app.New → Run
│
├── internal/app/          # ⚙️  COMPOSITION ROOT — how everything fits together
│   ├── app.go             #    App lifecycle: New() + Run() + graceful shutdown
│   ├── infra.go           #    connects MongoDB, Redis, Gemini, Expo, JWT
│   ├── modules.go         #    builds every module + cross-module wiring
│   ├── workers.go         #    ALL background workers (Kafka consumer, crons)
│   ├── http.go            #    middleware + mounts every module's routes
│   └── seed.go            #    startup data seeding
│
├── internal/              # 📦 FEATURE MODULES (one folder = one feature)
│   ├── auth/              #    signup/login, JWT issuing
│   ├── user/              #    user entity, profiles, account management
│   ├── progress/          #    streaks, daily tasks, levels, rewards, recitation, admin CRUD
│   ├── quran/             #    surah reading + audio (AlQuran API client, Redis cache)
│   └── notification/      #    push tokens, Expo delivery, notification job log
│       └── smart/         #    rules engine: daily-task reminders, streak savers
│
└── internal/platform/     # 🧰 SHARED TOOLBOX (reusable, feature-agnostic)
    ├── config/  logger/  cache/    (Redis)  kafka/  gemini/  ollama/
    ├── push/    (Expo)   jwt/      bcrypt/
    └── middleware/  response/  validator/
```

**Dependency direction (never violated):**
`cmd → app → feature modules → platform`. Modules may import each other's
public types, but `platform` never imports a module, and no module imports
`app`.

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

## Background workers

All started in `app/workers.go` (read it top to bottom to see everything that
runs outside a request):

1. **notification.send Kafka consumer** — delivers pushes via Expo, logs to the job log
2. **Job-log heartbeat** — daily ticker
3. **Smart notification cron** — every minute, evaluates `notification/smart`
   rules (daily-task reminders, streak savers) against all users

## Run it

```bash
go run ./cmd/api            # needs MongoDB; Kafka/Redis/Gemini are optional
make build                  # binary at build/deenquest-api
go test ./...
```

Optional integrations degrade gracefully: no Redis → no rate limit/cache; no
Kafka → the notification consumer just logs read errors; no `GEMINI_API_KEY` →
the recitation coach falls back to deterministic tips.

## Adding a new feature (checklist)

1. Create `internal/<feature>/` with `service.go`, `handler.go`, `routes.go`
   (plus `entity.go`, `repository.go`, `mongo_repository.go` if it stores data).
2. Construct it in `app/modules.go` (add fields to `Modules`).
3. Mount its routes in `app/http.go`.
4. If it has background work, start it in `app/workers.go`.

That's it — four files to touch outside your module, all in `internal/app/`.
