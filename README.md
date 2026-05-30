<p align="center">
  <img src="DeenQuestExpo/assets/logo.png" alt="DeenQuest Logo" width="110" />
</p>

<h1 align="center">DeenQuest</h1>
<p align="center">
  A gamified Islamic learning platform with a mobile app, admin panel, and a clean Go monolithic backend following Domain-Driven Design.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.81-20232A?logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-54-000020?logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Go-1.22-00ADD8?logo=go&logoColor=white" alt="Go" />
  <img src="https://img.shields.io/badge/Gin-Framework-008ECF" alt="Gin" />
  <img src="https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Kafka-Event_Driven-231F20?logo=apachekafka&logoColor=white" alt="Kafka" />
  <img src="https://img.shields.io/badge/Vite-Admin_Panel-646CFF?logo=vite&logoColor=white" alt="Vite" />
</p>

---

## App Screenshots

<p align="center">
  <img src="DeenQuestExpo/assets/IMG.PNG" alt="Home — Daily Missions & Streak" width="22%" />
  &nbsp;&nbsp;
  <img src="DeenQuestExpo/assets/IMG-5.PNG" alt="Learning Path — Choose a Course" width="22%" />
  &nbsp;&nbsp;
  <img src="DeenQuestExpo/assets/IMG-4.PNG" alt="Level Map — Course Progression" width="22%" />
  &nbsp;&nbsp;
  <img src="DeenQuestExpo/assets/IMG-8.PNG" alt="Settings — App Preferences" width="22%" />
</p>

<p align="center">
  <sub><b>Home</b> — Daily missions, streak &amp; XP progress</sub>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <sub><b>Learning Path</b> — Choose from available courses</sub>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <sub><b>Level Map</b> — Course progression with stars</sub>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <sub><b>Settings</b> — Account, preferences &amp; app info</sub>
</p>

<p align="center">
  <img src="DeenQuestExpo/assets/IMG-6.PNG" alt="Lesson — Arabic Letter Audio" width="22%" />
  &nbsp;&nbsp;
  <img src="DeenQuestExpo/assets/IMG-7.PNG" alt="Lesson — Dua with Recitation" width="22%" />
  &nbsp;&nbsp;
  <img src="DeenQuestExpo/assets/IMG-3.PNG" alt="Rewards — Reward Vault & Milestones" width="22%" />
  &nbsp;&nbsp;
  <img src="DeenQuestExpo/assets/IMG-2.PNG" alt="Profile — Stats & Streak History" width="22%" />
</p>

<p align="center">
  <sub><b>Letter Lesson</b> — Arabic letters with audio</sub>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <sub><b>Dua Lesson</b> — Recitation practice &amp; meaning</sub>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <sub><b>Rewards</b> — Reward vault, milestones &amp; XP bonuses</sub>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <sub><b>Profile</b> — XP, Barakah score &amp; streak history</sub>
</p>

## Why DeenQuest?

DeenQuest is designed to make daily Islamic growth consistent and rewarding through:

- Daily tasks and reflective activities.
- Level progression and XP-based motivation.
- Leaderboard ranking by level and XP.
- Reward-driven engagement loops.
- Admin-controlled content and operations.

## Monorepo Structure

```text
DeenQuest/
├─ DeenQuestExpo/        # Mobile app (React Native + Expo + TypeScript)
├─ admin-panel/          # Web admin dashboard (React + Vite + Tailwind)
└─ backend/              # Go monolithic API (DDD + Clean Architecture)
```

## Backend Architecture

The backend follows **Domain-Driven Design** with **Clean Architecture** principles, organized into four layers:

```text
backend/
├── cmd/
│   └── api/
│       └── main.go                          # Single entry point
├── internal/
│   ├── domain/                              # Domain Layer (entities, value objects, repository interfaces)
│   │   ├── identity/                        #   User entity, UserRepository interface
│   │   ├── progress/                        #   Progress, Streak, DailyTask, Level, Reward, Recitation
│   │   ├── notification/                    #   UserToken, Message, TokenRepository interface
│   │   └── intelligent/                     #   NotificationRule, NotificationLog, LogRepository interface
│   ├── application/                         # Application Layer (use cases, application services)
│   │   ├── auth/                            #   AuthService (signup, login)
│   │   ├── user/                            #   UserService (profile, password)
│   │   ├── progress/                        #   CoreService, RecitationService, ArabicMatcher
│   │   ├── notification/                    #   NotificationService (token registration, push)
│   │   ├── intelligent/                     #   Intelligent notification rules, scheduler, user fetcher
│   │   └── worker/                          #   Kafka consumer, daily reset scheduler
│   ├── interfaces/                          # Interface Layer (HTTP handlers, DTOs, routing)
│   │   └── http/
│   │       ├── handler/                     #   Auth, User, Core, Recitation, Notification handlers
│   │       ├── dto/                         #   Request/response DTOs
│   │       └── router.go                    #   Unified route registration
│   └── infrastructure/                      # Infrastructure Layer (external concerns)
│       ├── config/                          #   Environment configuration
│       ├── logger/                          #   Structured logging (zap)
│       ├── persistence/                     #   MongoDB repository implementations
│       ├── jwt/                             #   JWT token management
│       ├── bcrypt/                          #   Password hashing
│       ├── cache/                           #   Redis client
│       ├── middleware/                       #   Auth, CORS, logging, rate limiting, recovery
│       ├── push/                            #   Expo push notification client
│       ├── queue/                           #   Kafka producer/consumer
│       ├── validator/                       #   Request validation
│       ├── response/                        #   Standardized API responses
│       └── ollama/                          #   Ollama LLM client
├── whisper-service/                         # Python speech-to-text microservice (FastAPI)
├── docs/                                    # API docs, workflows, project analysis
├── docker-compose.yml                       # Kafka + Redis infrastructure
├── Makefile                                 # Build, run, test, lint commands
└── go.mod
```

```mermaid
flowchart LR
  M[Mobile App\nDeenQuestExpo] --> API[DeenQuest API\nGin Monolith]
  A[Admin Panel\nReact + Vite] --> API

  API --> DB[(MongoDB)]
  API --> K[(Kafka)]
  API --> R[(Redis\nRate Limiting)]
  API --> W[Whisper Service\nPython/FastAPI]
  API --> P[Expo Push API]
```

## Tech Stack

| Layer | Technologies |
|---|---|
| Mobile | React Native, Expo, TypeScript, Redux Toolkit (RTK Query), AsyncStorage, Expo Notifications |
| Admin | React 18, TypeScript, Vite, Tailwind CSS, Axios, Chart.js |
| Backend | Go 1.22, Gin, JWT, MongoDB driver, Kafka, Redis, Cron |
| Infra | Docker, Docker Compose |

## Core Features

- Authentication with JWT and refresh flow.
- Daily tasks with completion tracking.
- Levels, lessons, and progression rewards.
- Leaderboard ranking by level and XP.
- Role-aware admin panel for content management.
- Event-driven processing with Kafka.
- Intelligent notification system with template-based push notifications:
  - Daily task reminders for pending missions
  - Streak warnings to protect user consistency
  - Friday special reminders for Surah Al-Kahf

## API Highlights

Base prefix: `/api/v1`

- Auth
  - `POST /auth/signup`
  - `POST /auth/login`
- User
  - `GET /users/me`
  - `PUT /users/me`
  - `PUT /users/me/password`
  - `DELETE /users/me`
  - `GET /users/:id/public`
- Progress
  - `GET /progress/me`
  - `GET /progress/user/:id`
  - `GET /leaderboard`
  - `GET /daily-tasks`
  - `POST /daily-tasks/:id/complete`
  - `GET /levels?course_type=qaida|tajweed`
  - `GET /levels/:id?course_type=qaida|tajweed`
  - `POST /levels/:id/lessons/complete`
  - `POST /levels/:id/complete`
  - `GET /rewards`
  - `POST /recitation/check`
- Notifications
  - `POST /notifications/register`
  - `POST /notifications/test`

## Quick Start

### 1) Backend (Go + Docker)

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and other settings

# Start infrastructure (Kafka + Redis)
make compose-up

# Run the API server
make run
```

The API server starts at `http://localhost:8080`.

Useful commands:

```bash
make build          # Build binary to build/deenquest-api
make run            # Run with go run
make test           # Run tests
make lint           # Format + vet + test
make compose-logs   # Tail infrastructure logs
make compose-down   # Stop Kafka + Redis
```

### 2) Mobile App (Expo)

```bash
cd DeenQuestExpo
npm install
npm run start
```

Run on device/simulator:

```bash
npm run android
npm run ios
```

Note: Update API base URL in `DeenQuestExpo/app/store/services/api.ts` to match your server address.

### 3) Admin Panel (Vite)

```bash
cd admin-panel
npm install
npm run dev
```

The admin panel expects API traffic under `/api`.

## Environment Notes

Backend environment template is provided in `backend/.env.example`.

Important keys:

- `SERVER_HOST`, `SERVER_PORT` — API server bind address
- `MONGO_URI`, `MONGO_DB` — MongoDB connection
- `REDIS_HOST`, `REDIS_PORT` — Redis for rate limiting
- `KAFKA_BROKERS` — Kafka for async event processing
- `JWT_SECRET`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY` — JWT configuration
- `WHISPER_URL` — Python whisper service URL
- `EXPO_PUSH_URL`, `EXPO_PUSH_ACCESS_TOKEN` — Push notifications

## Documentation

Backend docs:

- `backend/docs/api.md` — API endpoint reference
- `backend/docs/kafka-explained.md` — Kafka event architecture
- `backend/docs/daily-task-assignment.md` — Daily task assignment algorithm
- `backend/docs/WORKFLOW.md` — Intelligent notification system workflow
- `backend/docs/PROJECT_ANALYSIS.md` — Comprehensive project analysis
- `backend/docs/LEARNING_AGENT.md` — Learning agent framework design

## Intelligent Notification System

The server runs a cron job every minute that evaluates all users against notification rules in a single pass:

| Notification Type | Trigger Condition | Cooldown |
|---|---|---|
| Daily Task Reminder | Pending tasks + inactive > 4h | 6 hours |
| Streak Warning | Streak > 3 days + missed today | 12 hours |
| Friday Special | Today is Friday | 24 hours |

Key design decisions:
- **Template-based messages** — no AI dependency, instant generation, predictable tone
- **Single-pass processing** — users fetched once, evaluated against all rules
- **Per-type cooldowns** — each notification type tracks its own cooldown window
- **Retry with backoff** — up to 3 attempts with exponential backoff on failure

## Screens Overview

| Screen | File | Description |
|---|---|---|
| Home | `IMG.PNG` | Daily missions, weekly streak calendar, XP bar |
| Learning Path | `IMG-5.PNG` | Choose from available courses with progress tracking |
| Level Map | `IMG-4.PNG` | Course level progression with star milestones |
| Letter Lesson | `IMG-6.PNG` | Arabic letters with audio pronunciation |
| Dua Lesson | `IMG-7.PNG` | Dua recitation practice with meaning and transliteration |
| Rewards | `IMG-3.PNG` | Reward vault, milestone progress, and unlockable achievements |
| Profile | `IMG-2.PNG` | XP total, Barakah score, streak history |
| Settings | `IMG-8.PNG` | Account settings, preferences, and app info |
| Rank | — | Global leaderboard ranked by level then XP |

## Contributing

1. Create a feature branch.
2. Keep changes scoped to one domain when possible.
3. Run checks before opening a PR:

```bash
# backend
cd backend && make lint

# mobile
cd DeenQuestExpo && ./node_modules/.bin/tsc --noEmit

# admin
cd admin-panel && npm run build
```

## License

No license file is currently defined in this repository.
