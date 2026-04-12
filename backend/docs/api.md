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

- `POST /habits`
- `GET /habits`
- `POST /habits/:id/complete`
- `GET /progress/me`
- `POST /reflections`
- `GET /achievements/me`

## Health Checks

- `GET /health` on each service
