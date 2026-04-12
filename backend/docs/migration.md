# PostgreSQL to MongoDB Migration Guide

## Scope

This migration command currently migrates `users` into the Auth service MongoDB database.

## Prerequisites

- PostgreSQL still accessible with legacy data.
- MongoDB running and reachable by `MONGO_URI`.
- Environment configured using `.env.example` as template.

## Run Migration

```bash
POSTGRES_DSN='postgres://user:pass@localhost:5432/talentflow?sslmode=disable' \
MONGO_URI='mongodb://localhost:27017' \
go run ./cmd/migrate
```

## Validation

1. Check users count in PostgreSQL and MongoDB.
2. Verify login works through Auth service `/api/v1/auth/login`.
3. Verify refresh token flow with Redis.

## Recommended Cutover Steps

1. Stop write traffic to legacy services.
2. Run migration.
3. Deploy new services.
4. Run smoke tests.
5. Switch traffic to gateway.
6. Monitor worker and Kafka lag.
