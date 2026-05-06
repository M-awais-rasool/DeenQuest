# API Endpoints (v1)

## Auth Service

Base: `/api/v1`

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout` (JWT)
- `GET /users/me` (JWT)
- `PUT /users/me` (JWT)

## Core Service

Base: `/api/v1` (all JWT protected)

- `GET /progress/me`
- `GET /leaderboard`
- `GET /daily-tasks`
- `POST /daily-tasks/:id/complete`
- `GET /levels?course_type=qaida|tajweed` (defaults to `qaida`)
- `GET /levels/:id?course_type=qaida|tajweed`
- `POST /levels/:id/lessons/complete`
- `POST /levels/:id/complete`
- `GET /rewards`
- `POST /recitation/check`

## Health Checks

- `GET /health` on each service
