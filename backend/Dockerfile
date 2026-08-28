# syntax=docker/dockerfile:1.7

# ── build ─────────────────────────────────────────────────────────────────────
FROM golang:1.25.13-alpine AS build

WORKDIR /src

# Dependencies in their own layer so code changes don't re-download the module
# cache on every build.
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download

COPY . .

ARG VERSION=dev
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux go build \
      -trimpath -ldflags="-s -w -X main.version=${VERSION}" \
      -o /out/deenquest-api ./cmd/api && \
    CGO_ENABLED=0 GOOS=linux go build \
      -trimpath -ldflags="-s -w" \
      -o /out/healthcheck ./cmd/healthcheck

# ── runtime ───────────────────────────────────────────────────────────────────
# Distroless static: no shell, no package manager, no libc. Remote code
# execution lands somewhere with essentially no tooling to work with — which,
# combined with a read-only rootfs and a data network that has no egress, is
# most of the post-exploitation surface gone.
FROM gcr.io/distroless/static-debian12:nonroot

# Root certificates come with the base image and are needed for Google/Apple
# JWKS, Expo push, Gemini, and the AlQuran API.
COPY --from=build /out/deenquest-api /app/deenquest-api
COPY --from=build /out/healthcheck   /app/healthcheck

USER 65532:65532
EXPOSE 8080

# Readiness, not liveness: Docker restarting a container whose MongoDB is having
# a bad minute would turn a blip into an outage, but the deploy gate needs to
# know whether this instance can actually serve.
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD ["/app/healthcheck", "--ready"]

ENTRYPOINT ["/app/deenquest-api"]
