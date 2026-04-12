SHELL := /bin/bash

GO ?= go
COMPOSE ?= docker compose

SERVICES := gateway auth core-service worker-service

.PHONY: help tidy fmt vet test lint build run run-gateway run-auth run-core run-worker compose-up compose-down compose-build compose-logs compose-ps compose-restart clean

help:
	@echo "Available targets:"
	@echo "  make tidy              - Run go mod tidy"
	@echo "  make fmt               - Format all Go files"
	@echo "  make vet               - Run go vet"
	@echo "  make test              - Run go test ./..."
	@echo "  make lint              - Run fmt + vet + test"
	@echo "  make build             - Build all services"
	@echo "  make run-gateway       - Run gateway service"
	@echo "  make run-auth          - Run auth service"
	@echo "  make run-core          - Run core service"
	@echo "  make run-worker        - Run worker service"
	@echo "  make compose-up        - Start all Docker services"
	@echo "  make compose-down      - Stop all Docker services"
	@echo "  make compose-build     - Rebuild Docker images"
	@echo "  make compose-logs      - Tail compose logs"
	@echo "  make compose-ps        - List compose services"
	@echo "  make compose-restart   - Restart compose services"

tidy:
	$(GO) mod tidy

fmt:
	$(GO) fmt ./...

vet:
	$(GO) vet ./...

test:
	$(GO) test ./...

lint: fmt vet test

build:
	@mkdir -p build
	@for service in $(SERVICES); do \
		echo "Building $$service..."; \
		$(GO) build -o build/$$service ./cmd/$$service || exit 1; \
	done

run: run-gateway

run-gateway:
	$(GO) run ./cmd/gateway

run-auth:
	$(GO) run ./cmd/auth

run-core:
	$(GO) run ./cmd/core-service

run-worker:
	$(GO) run ./cmd/worker-service

compose-up:
	$(COMPOSE) up -d

compose-down:
	$(COMPOSE) down

compose-build:
	$(COMPOSE) build

compose-logs:
	$(COMPOSE) logs -f --tail=200

compose-ps:
	$(COMPOSE) ps

compose-restart:
	$(COMPOSE) restart

clean:
	$(GO) clean -cache -testcache
