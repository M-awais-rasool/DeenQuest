# DeenQuest Backend — DDD Monolith Architecture

> **Date**: 2026-05-30  
> **Go Version**: 1.22  
> **Framework**: Gin  
> **Module**: `github.com/chawais/talent-flow/backend`

---

## Table of Contents

1. [Why a DDD Monolith?](#1-why-a-ddd-monolith)
2. [Architecture Overview](#2-architecture-overview)
3. [The Four Layers](#3-the-four-layers)
   - [Domain Layer](#31-domain-layer)
   - [Application Layer](#32-application-layer)
   - [Interfaces Layer](#33-interfaces-layer)
   - [Infrastructure Layer](#34-infrastructure-layer)
4. [Folder Structure Explained](#4-folder-structure-explained)
5. [Dependency Injection Flow](#5-dependency-injection-flow)
6. [Request Lifecycle](#6-request-lifecycle)
7. [Background Processing](#7-background-processing)
8. [Domain Boundaries](#8-domain-boundaries)
9. [Design Decisions](#9-design-decisions)

---

## 1. Why a DDD Monolith?

The original backend was built as four separate Go microservices connected through an API gateway:

```
gateway (port 8080)  →  auth-service (port 8081)
                      →  core-service (port 8082)
                      →  worker-service (port 8083)
```

Each service duplicated shared code (`pkg/`), required its own database connection, and introduced network latency for every request. The gateway was a thin reverse proxy adding no real value beyond JWT validation and rate limiting — both of which are trivially implemented as middleware.

### Migration Rationale

| Concern | Microservices (Before) | DDD Monolith (After) |
|---------|----------------------|---------------------|
| Deployment | 4 binaries to build and coordinate | 1 binary |
| Memory | ~100MB per service = ~400MB total | ~30MB total |
| Latency | Gateway → service → DB (2 network hops) | Handler → DB (0 network hops) |
| Code duplication | Each service had its own `pkg/` copy | Single source of truth |
| API Gateway | Reverse proxy + JWT + rate limiting | Direct Gin middleware |
| Development | Air hot-reload on 4 services | Single `go run ./cmd/api` |
| Debugging | Need to follow traces across services | Everything in one process |
| Business logic | Same as now | Identical — zero changes |

### What Stayed the Same

- **All API endpoints** — 21 routes, same paths, same methods, same response format
- **All business logic** — XP calculation, streak logic, task assignment, level progression, rewards, recitation scoring
- **All database schema** — Same MongoDB collections, same document structures, same seed data
- **All infrastructure** — Same Kafka topic, same Redis rate limiting, same Expo push API, same Whisper service

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        cmd/api/main.go                            │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                  DEPENDENCY INJECTION                        │  │
│  │  config → mongo → repos → services → handlers → router →   │  │
│  │  server + goroutines (consumer, schedulers)                 │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                          │                                        │
│                          ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                   GIN HTTP SERVER (port 8080)                │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │  │
│  │  │ Recovery │→│  Logger  │→│   CORS   │→│ Rate Limit │  │  │
│  │  │Middleware│  │Middleware│  │Middleware│  │ (Redis)    │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │  │
│  │                          │                                   │  │
│  │                          ▼                                   │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │              INTERFACES LAYER (handlers)                 │ │  │
│  │  │  AuthH  UserH  CoreH  RecitationH  NotificationH       │ │  │
│  │  └─────────────────────────┬───────────────────────────────┘ │  │
│  │                            │                                  │  │
│  │                            ▼                                  │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │              APPLICATION LAYER (services)                │ │  │
│  │  │  AuthSvc  UserSvc  CoreSvc  RecitationSvc  NotifSvc    │ │  │
│  │  │  IntelligentSvc  WorkerConsumer  WorkerScheduler       │ │  │
│  │  └─────────────────────────┬───────────────────────────────┘ │  │
│  │                            │                                  │  │
│  │                            ▼                                  │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │              DOMAIN LAYER (interfaces)                   │ │  │
│  │  │  UserRepo  CoreRepo  TokenRepo  LogRepo  JobLogRepo    │ │  │
│  │  └─────────────────────────┬───────────────────────────────┘ │  │
│  │                            │                                  │  │
│  │                            ▼                                  │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │           INFRASTRUCTURE LAYER (implementations)         │ │  │
│  │  │  MongoDB repos  Redis  Kafka  Expo  JWT  Bcrypt        │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              BACKGROUND GOROUTINES                            │  │
│  │  ┌─────────────────────┐  ┌──────────────────────────────┐   │  │
│  │  │ Kafka Consumer      │  │ Intelligent Notification     │   │  │
│  │  │ (notification.send) │  │ Cron (every 60s)            │   │  │
│  │  └─────────────────────┘  └──────────────────────────────┘   │  │
│  │  ┌─────────────────────┐                                     │  │
│  │  │ Worker Scheduler    │                                     │  │
│  │  │ (every 24h)         │                                     │  │
│  │  └─────────────────────┘                                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

The architecture follows **Robert C. Martin's Clean Architecture** adapted to Go idioms:

- **Dependency Rule**: Source code dependencies point **inward**. The domain layer knows nothing about the outside world. The application layer depends on domain interfaces. The infrastructure layer implements domain interfaces.
- **Dependency Inversion**: High-level modules (application services) do not depend on low-level modules (MongoDB, Redis, Kafka). Both depend on abstractions (interfaces defined in the domain layer).

---

## 3. The Four Layers

### 3.1 Domain Layer

**Location**: `internal/domain/`  
**Dependencies**: None (pure Go standard library only)  
**Purpose**: Business entities, value objects, repository interfaces, and domain errors.

This is the **innermost layer** with zero external dependencies. It defines:

- **Entities**: `User`, `DailyTask`, `Level`, `Reward`, `Progress`, `Streak`, `UserDailyTask`, `UserToken`, `NotificationRule`, `NotificationLog`
- **Value Objects**: `Block` (14 types), `Lesson`, `MiniGame`, `Message`, `RecitationResult`, `WordResult`
- **Enums**: `TaskCategory`, `Difficulty`, `CompletionType`, `CourseType`, `LessonType`, `ScreenType`, `RewardTrigger`, `Rarity`, `NotificationType`
- **Repository Interfaces**: `UserRepository`, `CoreRepository`, `TokenRepository`, `LogRepository`
- **Domain Errors**: `ErrNotFound`, `ErrDuplicateEmail`, `ErrAlreadyCompleted`, `ErrTokenExpired`

```go
// internal/domain/progress/entity.go
type Progress struct {
    UserID     string `bson:"user_id"`
    TotalXP    int    `bson:"total_xp"`
    Level      int    `bson:"level"`
    BarakahScore int  `bson:"barakah_score"`
}
```

```go
// internal/domain/progress/repository.go — interface only, no implementation
type CoreRepository interface {
    GetProgress(ctx context.Context, userID string) (*Progress, error)
    UpsertProgress(ctx context.Context, p *Progress) error
    GetDailyTasks(ctx context.Context) ([]DailyTask, error)
    // ... 20+ methods
}
```

**Seed Data**: The domain layer also owns seed data because it defines the domain objects being seeded:
- `seed_levels.go` — 20 Qaida levels + 12 Tajweed levels with full lesson structures
- `seed_tasks.go` — 10 daily task templates across 7 categories
- `seed_rewards.go` — 6 milestone rewards with rarity tiers

### 3.2 Application Layer

**Location**: `internal/application/`  
**Dependencies**: Domain layer + infrastructure abstractions (not implementations)  
**Purpose**: Orchestrate use cases, coordinate domain objects, implement business workflows.

Each package in this layer represents one **bounded context use case**. Services are stateless — all state lives in the repositories.

```go
// internal/application/progress/service.go
type CoreService struct {
    repo domain.CoreRepository
}

func NewCoreService(repo domain.CoreRepository) *CoreService {
    return &CoreService{repo: repo}
}

func (s *CoreService) CompleteDailyTask(ctx context.Context, userID, taskID string) error {
    // 1. Check if already completed (idempotency)
    // 2. Mark completed in user_daily_tasks
    // 3. Award XP to progress
    // 4. Update streak (increment or reset)
    // All via repo interface methods — no knowledge of MongoDB
}
```

| Package | Key Services | Responsibility |
|---------|-------------|----------------|
| `auth/` | `AuthService` | Signup (validate → hash password → create user → generate JWT), Login (find user → verify password → generate JWT) |
| `user/` | `UserService` | Profile CRUD, password change, account deletion, public profile view |
| `progress/` | `CoreService` | Daily task assignment (seeded deterministic shuffle), completion, XP/streak/level logic, leaderboard, seed data, rewards |
| `progress/` | `RecitationService` | Audio upload → Whisper → Arabic matching → score calculation |
| `notification/` | `Service` | Token registration, Expo push dispatch |
| `intelligent/` | `Service` | Rule evaluation engine, user fetcher, template-based messages |
| `worker/` | `Consumer` | Kafka message handler (notification.send → token lookup → push → log) |
| `worker/` | `Scheduler` | Daily job log cleanup |

### 3.3 Interfaces Layer

**Location**: `internal/interfaces/http/`  
**Dependencies**: Application layer + Gin framework  
**Purpose**: Translate HTTP requests into application service calls, and domain responses back into HTTP responses.

**Handlers** receive Gin context, extract parameters (path, query, body, headers), call application services, and write responses via the standardized response helper.

```go
// internal/interfaces/http/handler/auth_handler.go
type AuthHandler struct {
    authService *auth.Service
}

func NewAuthHandler(svc *auth.Service) *AuthHandler {
    return &AuthHandler{authService: svc}
}

func (h *AuthHandler) Signup(c *gin.Context) {
    var req dto.SignupRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.Error(c, http.StatusBadRequest, "Invalid request")
        return
    }
    user, token, err := h.authService.Signup(c.Request.Context(), req.Email, req.Password, req.DisplayName)
    if err != nil {
        response.Error(c, http.StatusConflict, err.Error())
        return
    }
    response.Success(c, http.StatusCreated, dto.NewAuthResponse(user, token))
}
```

**DTOs** define the API contract separately from domain entities, allowing the API surface to evolve independently:

```go
// internal/interfaces/http/dto/auth_dto.go
type SignupRequest struct {
    Email       string `json:"email" binding:"required,email"`
    Password    string `json:"password" binding:"required,min=8"`
    DisplayName string `json:"display_name" binding:"required"`
}
```

**Router** (`router.go`) wires routes to handlers and attaches middleware:

```go
func SetupRoutes(r *gin.Engine, authH *handler.AuthHandler, ...) {
    v1 := r.Group("/api/v1")
    authGroup := v1.Group("/auth")
    authGroup.POST("/signup", authH.Signup)

    authed := v1.Group("")
    authed.Use(middleware.JWTAuth(jwtManager))
    authed.GET("/users/me", userH.GetProfile)
    // ... 21 routes total
}
```

### 3.4 Infrastructure Layer

**Location**: `internal/infrastructure/`  
**Dependencies**: Domain layer + external libraries (MongoDB driver, Redis, Kafka, etc.)  
**Purpose**: Implement domain repository interfaces, provide framework adapters, expose cross-cutting utilities.

```go
// internal/infrastructure/persistence/mongo_user_repository.go
type mongoUserRepository struct {
    coll *mongo.Collection
}

func NewMongoUserRepository(db *mongo.Database) (domain.UserRepository, error) {
    return &mongoUserRepository{
        coll: db.Collection("users"),
    }, nil
}

func (r *mongoUserRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
    var user domain.User
    err := r.coll.FindOne(ctx, bson.M{"email": email}).Decode(&user)
    if err == mongo.ErrNoDocuments {
        return nil, domain.ErrNotFound
    }
    return &user, err
}
```

| Package | Implementation | Purpose |
|---------|---------------|---------|
| `persistence/` | 5 MongoDB repos | `UserRepository`, `CoreRepository`, `TokenRepository`, `LogRepository`, `JobLogRepository` |
| `jwt/` | `JWTManager` | Sign, verify, decode access/refresh JWT tokens |
| `bcrypt/` | `HashPassword`, `CheckPassword` | Password hashing with bcrypt |
| `cache/` | `NewRedisClient` | Redis connection for rate limiting |
| `middleware/` | 5 Gin handlers | Auth (JWT), CORS, Request Logger, Rate Limit (Redis), Panic Recovery |
| `push/` | `ExpoClient` | HTTP client for Expo Push API |
| `queue/` | `KafkaConsumer`, `KafkaProducer` | Kafka event streaming |
| `validator/` | `NewValidator` | Go Playground Validator v10 |
| `response/` | `Success`, `Error`, `ValidationError` | Standardized JSON envelope |
| `config/` | `Config.Load()` | Environment variable loading via godotenv |
| `logger/` | `Init`, `Info`, `Error`, `Fatal` | Uber Zap structured logging |
| `ollama/` | `Client` | HTTP client for Ollama LLM API |

---

## 4. Folder Structure Explained

```
cmd/api/main.go
  └── Single entry point. Loads config, connects to MongoDB/Redis/Kafka,
      creates all repositories → services → handlers → router,
      starts HTTP server + background goroutines, handles graceful shutdown.

internal/
├── domain/                    # Layer 1: Entities + Interfaces (zero dependencies)
│   ├── identity/              #   Bounded context: User accounts & authentication
│   │   ├── user.go            #     User entity struct
│   │   └── repository.go      #     UserRepository interface
│   ├── progress/              #   Bounded context: Learning progression system
│   │   ├── entity.go          #     Progress, Streak, UserDailyTask entities
│   │   ├── daily_task.go      #     DailyTask entity, TaskCategory, Difficulty enums
│   │   ├── block.go           #     14 block types (Text, Ayah, Hadith, Quiz...)
│   │   ├── level.go           #     Level, Lesson, MiniGame, LessonType enums
│   │   ├── course.go          #     CourseType (qaida/tajweed)
│   │   ├── reward.go          #     Reward entity, Rarity, RewardTrigger enums
│   │   ├── recitation.go      #     RecitationResult, WordResult value objects
│   │   ├── repository.go      #     CoreRepository interface (20+ methods)
│   │   ├── seed_levels.go     #     32 seeded levels
│   │   ├── seed_tasks.go      #     10 seeded daily tasks
│   │   └── seed_rewards.go    #     6 seeded rewards
│   ├── notification/          #   Bounded context: Push notification tokens
│   │   ├── entity.go          #     UserToken, Message value objects
│   │   ├── repository.go      #     TokenRepository interface
│   │   └── errors.go          #     ErrTokenNotFound, ErrTokenExpired
│   └── intelligent/           #   Bounded context: Notification rules engine
│       ├── entity.go          #     NotificationRule, UserContext, NotificationType
│       └── repository.go      #     LogRepository interface
│
├── application/               # Layer 2: Use Cases (depends on domain interfaces)
│   ├── auth/
│   │   └── service.go         #     Signup, Login — orchestrates UserRepo + JWT
│   ├── user/
│   │   └── service.go         #     Profile CRUD, password change, delete
│   ├── progress/
│   │   ├── service.go         #     CoreService — daily tasks, levels, leaderboard, seeding
│   │   ├── recitation_service.go  # RecitationService — Whisper + Arabic matching
│   │   └── arabic_matcher.go  #     Arabic normalization + word alignment + scoring
│   ├── notification/
│   │   └── service.go         #     Token registration + Expo push dispatch
│   ├── intelligent/
│   │   ├── service.go         #     NotificationService — rule engine + send
│   │   ├── rules.go           #     3 rule definitions with templates + cooldowns
│   │   ├── user_fetcher.go    #     Single-pass user data aggregation from MongoDB
│   │   └── scheduler.go       #     Cron job (every 60s)
│   └── worker/
│       ├── consumer.go        #     Kafka consumer handler for notification.send
│       └── scheduler.go       #     Daily job log cleanup cron (every 24h)
│
├── interfaces/                # Layer 3: HTTP Adapters (depends on application)
│   └── http/
│       ├── router.go          #     Unified route registration (21 routes)
│       ├── handler/
│       │   ├── auth_handler.go          # POST /auth/signup, /auth/login
│       │   ├── user_handler.go          # GET/PUT/DELETE /users/me, etc.
│       │   ├── core_handler.go          # Progress, leaderboard, tasks, levels, rewards
│       │   ├── recitation_handler.go    # POST /recitation/check
│       │   └── notification_handler.go  # POST /notifications/register, /test
│       └── dto/
│           ├── auth_dto.go     #     SignupRequest, LoginRequest, AuthResponse
│           └── user_dto.go     #     UpdateProfileRequest, ChangePasswordRequest, etc.
│
└── infrastructure/            # Layer 4: Framework Adapters (implements domain interfaces)
    ├── config/
    │   └── config.go          #     Environment loading, Config struct
    ├── logger/
    │   └── logger.go          #     Uber Zap structured logging
    ├── persistence/
    │   ├── mongo_user_repository.go          # UserRepository implementation
    │   ├── mongo_core_repository.go          # CoreRepository implementation
    │   ├── mongo_token_repository.go         # TokenRepository implementation
    │   ├── mongo_notification_log_repository.go  # LogRepository implementation
    │   └── mongo_job_log_repository.go      # JobLogRepository implementation
    ├── jwt/
    │   └── jwt.go             #     JWT access/refresh token management
    ├── bcrypt/
    │   └── password.go        #     bcrypt hashing + verification
    ├── cache/
    │   └── redis.go           #     Redis client initialization
    ├── middleware/
    │   ├── auth.go            #     JWT authentication middleware
    │   ├── cors.go            #     CORS middleware
    │   ├── logging.go         #     Request logging middleware
    │   ├── rate_limit.go      #     Redis-backed rate limiting (100 req/min)
    │   └── recovery.go        #     Panic recovery middleware
    ├── push/
    │   └── expo.go            #     Expo push notification API client
    ├── queue/
    │   └── kafka.go           #     Kafka consumer/producer
    ├── validator/
    │   └── validator.go       #     Go Playground Validator
    ├── response/
    │   └── response.go        #     Standardized JSON response helpers
    └── ollama/
        └── client.go          #     Ollama LLM API client
```

### Why This Structure?

| Decision | Rationale |
|----------|-----------|
| **Domain per bounded context** | Each domain package (`identity/`, `progress/`, `notification/`, `intelligent/`) maps to a distinct business concept. Makes it easy to find and change related code. |
| **Interface in domain, impl in infrastructure** | Domain defines `UserRepository`; MongoDB implements it. Swap to PostgreSQL by writing a new implementation — zero changes to domain or application layers. |
| **Application services are thin** | They orchestrate, not implement. `CoreService.CompleteDailyTask()` calls `coreRepo.MarkTaskCompleted()`, then `coreRepo.UpsertProgress()`, then `coreRepo.UpsertStreak()`. Each repository method is a single MongoDB operation. |
| **Handlers are dumb** | They extract HTTP params and call services. No business logic in handlers. |
| **DTOs separate from entities** | API contracts (`SignupRequest`) are independent of domain entities (`User`). Can change API shape without touching domain. |

---

## 5. Dependency Injection Flow

`cmd/api/main.go` performs all wiring explicitly (no DI framework — idiomatic Go):

```
main()
├── cfg = config.Load()                               // Load env vars
├── logger.Init(cfg.AppEnv)                           // Initialize logging
├── mongoClient = mongo.Connect(cfg.MongoURI)         // Connect MongoDB
├── db = mongoClient.Database(cfg.MongoDB)
│
├── userRepo    = persistence.NewMongoUserRepository(db)       // → domain.UserRepository
├── coreRepo    = persistence.NewMongoCoreRepository(db)       // → domain.CoreRepository
├── tokenRepo   = persistence.NewMongoTokenRepository(db)      // → domain.TokenRepository
├── notifLogRepo = persistence.NewMongoLogRepository(db)       // → domain.LogRepository
├── jobRepo     = persistence.NewJobLogRepository(db)          // → (worker use)
│
├── jwtManager  = jwt.NewJWTManager(...)                       // JWT infrastructure
├── expoClient  = push.NewExpoClient(...)                      // Push infrastructure
│
├── authService       = auth.NewAuthService(userRepo, jwtManager)
├── userService       = user.NewUserService(userRepo)
├── coreService       = progress.NewCoreService(coreRepo)
├── recitationService = progress.NewRecitationService(coreRepo, cfg.WhisperURL)
├── notificationService = notification.NewService(tokenRepo, expoClient)
│
├── consumer          = worker.NewConsumer(jobRepo, notificationService)
├── workerScheduler   = worker.NewScheduler(jobRepo)
├── intelNotifService = intelligent.NewNotificationService(intelUserFetcher, notifLogRepo, notificationService)
├── intelScheduler    = intelligent.NewScheduler(intelNotifService)
│
├── authH      = handler.NewAuthHandler(authService)
├── userH      = handler.NewUserHandler(userService)
├── coreH      = handler.NewCoreHandler(coreService)
├── recitationH = handler.NewRecitationHandler(recitationService)
├── notifH     = handler.NewNotificationHandler(notificationService)
│
├── redisClient = cache.NewRedisClient(...)                    // Optional — fail-open
├── r = gin.New()
├── r.Use(recovery, loggerMiddleware, corsMiddleware)
├── r.Use(rateLimitMiddleware)            // Only if Redis available
├── router.SetupRoutes(r, authH, userH, coreH, recitationH, notifH, jwtManager)
│
├── go consumer.Consume(notification.send)                      // Kafka goroutine
├── go workerScheduler.Start()                                  // 24h cron goroutine
├── go intelScheduler.Start()                                   // 60s cron goroutine
│
├── srv.ListenAndServe()                                        // HTTP server
└── signal.Notify → graceful shutdown
```

No reflection, no magic, no DI container. Every dependency is explicit, type-safe, and compile-time checked.

---

## 6. Request Lifecycle

A complete request journey from HTTP to database and back:

```
1. HTTP Request
   POST /api/v1/daily-tasks/abc123/complete
   Headers: Authorization: Bearer <JWT>

2. Gin Router Matches
   authed.POST("/daily-tasks/:id/complete", coreHandler.CompleteDailyTask)

3. Middleware Pipeline
   ├── Recovery()         → Catches panics, returns 500
   ├── RequestLogger()    → Logs method, path, status, latency
   ├── CORS()             → Sets CORS headers
   ├── RateLimit()        → INCR key, check < 100, TTL 60s (fail-open)
   └── JWTAuth()          → Decodes JWT, sets c.Get("user_id")

4. Handler (interfaces layer)
   coreHandler.CompleteDailyTask(c *gin.Context)
   ├── Extracts :id from path
   ├── Gets userID from c.Get("user_id")
   └── Calls coreService.CompleteDailyTask(ctx, userID, taskID)

5. Application Service (application layer)
   CoreService.CompleteDailyTask(ctx, userID, taskID)
   ├── Calls coreRepo.GetUserDailyTask(ctx, userID, taskID)
   │   → Returns UserDailyTask (or ErrNotFound)
   ├── If already completed → return success (idempotent)
   ├── Calls coreRepo.MarkTaskCompleted(ctx, userID, taskID)
   │   → Sets completed=true, completed_at=now
   ├── Calls coreRepo.GetProgress(ctx, userID)
   │   → Returns Progress{TotalXP: 250, Level: 2}
   ├── Computes new TotalXP += task.RewardXP
   ├── Computes new Level = TotalXP / 100
   ├── Calls coreRepo.UpsertProgress(ctx, updatedProgress)
   │   → Atomic upsert
   ├── Calls coreRepo.UpsertStreak(ctx, userID)
   │   → Increments or resets based on yesterday
   └── Returns nil

6. Handler Writes Response
   response.Success(c, http.StatusOK, gin.H{
       "xp_earned": 15,
       "total_xp":  265,
       "level":     2,
       "streak":    7,
   })

7. Middleware Post-Processing
   └── RequestLogger records status + latency

8. JSON Response Sent
   {"success":true,"data":{"xp_earned":15,"total_xp":265,"level":2,"streak":7}}
```

---

## 7. Background Processing

The monolith runs three background goroutines alongside the HTTP server:

### Kafka Consumer (`internal/application/worker/consumer.go`)

```
Topic:       notification.send
Group:       worker-notification-send-group
Message:     { EventType: "notification.send", Payload: Job{User, Message} }

Flow:
1. Consume message from Kafka
2. Decode Job struct
3. Look up user's latest Expo push token (TokenRepository)
4. If no token → mark job as "skipped" in job_logs
5. If token exists → send via ExpoClient
6. Save result in job_logs (sent/failed/skipped)
7. Commit Kafka offset

Retry: 3 attempts with exponential backoff
```

### Intelligent Notification Scheduler (`internal/application/intelligent/scheduler.go`)

```
Cron:  */1 * * * *  (every 60 seconds)

Flow:
1. Fetch all users from MongoDB via UserFetcher (single aggregation query)
2. For each user:
   a. Check cooldown for each rule via LogRepository
   b. Evaluate rule condition (UserContext + current time)
   c. If triggered → build template message → send via NotificationService
   d. Save notification log
3. Sleep until next tick

3 Rules:
┌─────────────────────┬──────────────────────────────────┬───────────┐
│ Rule                │ Trigger                          │ Cooldown  │
├─────────────────────┼──────────────────────────────────┼───────────┤
│ DailyTaskReminder   │ Pending tasks + inactive > 4h    │ 6 hours   │
│ StreakWarning       │ Streak > 3 days + missed today   │ 12 hours  │
│ FridaySpecial       │ Today is Friday                  │ 24 hours  │
└─────────────────────┴──────────────────────────────────┴───────────┘
```

### Worker Scheduler (`internal/application/worker/scheduler.go`)

```
Cron:  every 24 hours

Flow:
1. Remove job_log entries older than 30 days
2. Log completion
```

---

## 8. Domain Boundaries

The four domain packages map directly to the original microservice boundaries:

| Original Service | Domain Package | Key Entities |
|-----------------|----------------|--------------|
| Identity Service | `domain/identity/` | User, UserRepository |
| Core Service | `domain/progress/` | Progress, Streak, DailyTask, Level, Reward, Recitation, CoreRepository |
| Notification Service | `domain/notification/` | UserToken, Message, TokenRepository |
| AI/Worker Service | `domain/intelligent/` | NotificationRule, NotificationLog, LogRepository |

This means every concept from the original codebase exists in exactly one domain package. The application layer then composes these domains:

- **AuthService** uses `identity.UserRepository` + `infrastructure/jwt` + `infrastructure/bcrypt`
- **CoreService** uses `progress.CoreRepository`
- **NotificationService** uses `notification.TokenRepository` + `infrastructure/push`
- **IntelligentService** uses `intelligent.LogRepository` + `notification.TokenRepository` + `infrastructure/push`

---

## 9. Design Decisions

### Why no DI framework?

Go's explicit dependency injection (wiring in `main()`) provides:
- Compile-time safety — no runtime wiring failures
- Easy to trace — every dependency is visible in one file
- No reflection overhead
- Simple to test — just create mocks and pass them in

### Why keep Kafka in a monolith?

The `notification.send` Kafka topic decouples the **synchronous HTTP request** from the **asynchronous push notification delivery**. A user completing a task doesn't need to wait for the push notification to be sent — that's a background concern. Kafka provides:
- Reliable delivery with offset tracking
- Retry with consumer group rebalancing
- Future scalability (if we ever need to split the worker back out)

### Why is rate limiting fail-open?

Redis might be temporarily unavailable. Rather than rejecting all requests when Redis is down, we skip rate limiting. This is a conscious trade-off: brief rate limit gaps are acceptable; a 503 outage is not.

### Why no refresh token endpoint?

The mobile app stores the refresh token and calls `POST /auth/login` again when the access token expires. This simplifies the auth flow without compromising security — the refresh token is sent over HTTPS and stored in secure device storage (AsyncStorage/MMKV).

### Why template-based notifications instead of AI?

- Instant generation — no 30s Ollama timeout per user
- Predictable tone — every message is curated, not generated
- Zero external dependency — works even if Ollama is down
- Per-type cooldown tracking — each rule independently throttled
