# API Endpoints (v1)

Base prefix: `/api/v1`. Standard response envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "optional",
  "error": "optional"
}
```

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Service health check |

## Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/signup` | No | Create account |
| POST | `/api/v1/auth/login` | No | Authenticate, returns JWT |

## Public

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/users/:id/public` | No | View public profile |
| GET | `/api/v1/progress/user/:id` | No | View public progress/stats |

## User (JWT required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/users/me` | Get own profile |
| PUT | `/api/v1/users/me` | Update profile |
| PUT | `/api/v1/users/me/password` | Change password |
| DELETE | `/api/v1/users/me` | Delete account |

## Notifications (JWT required)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/notifications/register` | Register Expo push token |
| POST | `/api/v1/notifications/test` | Send test push notification |

## Progress & Gamification (JWT required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/progress/me` | Get XP, level, streak, barakah score |
| GET | `/api/v1/leaderboard` | Global leaderboard (level DESC, XP DESC) |
| GET | `/api/v1/daily-tasks` | Get today's assigned tasks (generates if none exist) |
| POST | `/api/v1/daily-tasks/:id/complete` | Mark daily task completed, award XP |
| GET | `/api/v1/levels?course_type=qaida\|tajweed` | List levels for a course (default: qaida) |
| GET | `/api/v1/levels/:id?course_type=qaida\|tajweed` | Get level detail with lessons |
| POST | `/api/v1/levels/:id/lessons/complete` | Complete a lesson within a level |
| POST | `/api/v1/levels/:id/complete` | Complete a level, unlock rewards |
| GET | `/api/v1/rewards` | Get all rewards with unlock status |

## Recitation (JWT required)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/recitation/check` | Upload audio for Whisper AI pronunciation check |

## Notes

- JWT token is sent as `Authorization: Bearer <token>` header
- Access tokens are short-lived (default 15m), refresh by re-authenticating
- Rate limit: 100 requests per minute per IP (Redis-backed, fail-open if Redis is down)
- CORS origins configured via `CORS_ALLOWED_ORIGINS` env var
