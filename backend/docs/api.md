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
| GET | `/api/v1/quran/surahs` | No | List all 114 Surahs |
| GET | `/api/v1/quran/surah/:id?translation=en.asad` | No | Get a Surah ayah-by-ayah, optionally with translation |
| GET | `/api/v1/quran/surah/:id/audio` | No | Get full-Surah audio URL |

Compatibility aliases are also available under `/api/quran/*` for clients that do not use the v1 prefix.

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
| POST | `/api/v1/recitation/check` | Queue a clip for checking — **202**, returns a job id |
| GET | `/api/v1/recitation/jobs/:job_id` | Poll that job for its score |

Checking is asynchronous. The transcriber decodes one clip at a time, so a
synchronous endpoint made every learner's response time equal to the length of
a queue they could not see. The POST now parks the clip and returns:

```json
{
  "success": true,
  "message": "recitation queued",
  "data": {
    "job_id": "1f0c…",
    "status": "queued",
    "position": 3,
    "estimated_wait_seconds": 12,
    "poll_after_ms": 4000
  }
}
```

Poll `GET /api/v1/recitation/jobs/:job_id` after `poll_after_ms`. The body has
the same shape at every stage; `status` moves `queued` → `running` → `done` or
`failed`, and the score arrives whole under `result` exactly once:

```json
{
  "data": {
    "job_id": "1f0c…",
    "status": "done",
    "result": { "score": 92, "words": [], "xp_earned": 25, "…": "…" }
  }
}
```

Notes:

- **XP is awarded when the job finishes**, not when it is submitted, so
  progress caches are stale until the poll returns `done`.
- **429** means the queue is at its ceiling; `Retry-After` says when to come
  back. Submitting is limited to 10/min per user; polling rides the ordinary
  authenticated budget.
- **404** on a poll means the job has expired (state is kept ~15 minutes) or
  belongs to someone else. Both mean: record it again.
- Jobs survive a redeploy when Redis is configured. Without Redis the queue is
  in-process and is lost on restart.

## Notes

- JWT token is sent as `Authorization: Bearer <token>` header
- Access tokens are short-lived (default 15m), refresh by re-authenticating
- Rate limit: 100 requests per minute per IP (Redis-backed, fail-open if Redis is down)
- CORS origins configured via `CORS_ALLOWED_ORIGINS` env var
- Quran responses are Redis-backed: Surah list is cached for 1 hour; Surah details and audio URLs are cached for 7 days.
