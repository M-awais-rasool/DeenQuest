SHELL := /bin/bash

GO ?= go
PYTHON ?= python3
COMPOSE ?= docker compose

SERVICES := gateway auth core-service worker-service
WHISPER_DIR := whisper-service
WHISPER_VENV := $(WHISPER_DIR)/.venv

.PHONY: help tidy fmt vet test lint build run run-gateway run-auth run-core run-worker \
        whisper-setup whisper-run whisper-dev \
        compose-up compose-down compose-build compose-logs compose-ps compose-restart clean

help:
	@echo "Available targets:"
	@echo "  make tidy              - Run go mod tidy"
	@echo "  make fmt               - Format all Go files"
	@echo "  make vet               - Run go vet"
	@echo "  make test              - Run go test ./..."
	@echo "  make lint              - Run fmt + vet + test"
	@echo "  make build             - Build all Go services"
	@echo "  make run-gateway       - Run gateway service"
	@echo "  make run-auth          - Run auth service"
	@echo "  make run-core          - Run core service"
	@echo "  make run-worker        - Run worker service"
	@echo "  make whisper-setup     - Create venv and install Python deps"
	@echo "  make whisper-run       - Start whisper service (port 8001)"
	@echo "  make whisper-dev       - Start whisper service with auto-reload"
	@echo "  make compose-up        - Start all Docker services"
	@echo "  make compose-down      - Stop all Docker services"
	@echo "  make compose-build     - Rebuild Docker images"
	@echo "  make compose-logs      - Tail compose logs"
	@echo "  make compose-ps        - List compose services"
	@echo "  make compose-restart   - Restart compose services"
	@echo "  make clean             - Remove build artifacts and venv"

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
	WHISPER_URL=http://localhost:8001 $(GO) run ./cmd/core-service

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

# ── Whisper Python service ────────────────────────────────────────────────────

# Create a virtualenv and install dependencies
whisper-setup:
	@echo "Setting up whisper-service virtualenv..."
	$(PYTHON) -m venv $(WHISPER_VENV)
	$(WHISPER_VENV)/bin/pip install --upgrade pip
	$(WHISPER_VENV)/bin/pip install -r $(WHISPER_DIR)/requirements.txt
	@echo "Done. Run: make whisper-run"

# Run the service (production mode, port 8001)
whisper-run: $(WHISPER_VENV)
	WHISPER_MODEL=$(or $(WHISPER_MODEL),small) \
	WHISPER_DEVICE=$(or $(WHISPER_DEVICE),cpu) \
	WHISPER_COMPUTE=$(or $(WHISPER_COMPUTE),int8) \
	$(WHISPER_VENV)/bin/uvicorn main:app \
		--app-dir $(WHISPER_DIR) \
		--host 0.0.0.0 \
		--port 8001

# Run with --reload for development (auto-restarts on code changes)
whisper-dev: $(WHISPER_VENV)
	WHISPER_MODEL=$(or $(WHISPER_MODEL),small) \
	WHISPER_DEVICE=$(or $(WHISPER_DEVICE),cpu) \
	WHISPER_COMPUTE=$(or $(WHISPER_COMPUTE),int8) \
	$(WHISPER_VENV)/bin/uvicorn main:app \
		--app-dir $(WHISPER_DIR) \
		--host 0.0.0.0 \
		--port 8001 \
		--reload

# Guard: auto-run setup if venv doesn't exist yet
$(WHISPER_VENV):
	@$(MAKE) whisper-setup

# ── Cleanup ───────────────────────────────────────────────────────────────────

clean:
	rm -rf build/ $(WHISPER_VENV)/
	$(GO) clean -cache -testcache
