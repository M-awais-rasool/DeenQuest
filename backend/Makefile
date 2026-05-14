SHELL := /bin/bash

GO ?= go
PYTHON ?= python3
COMPOSE ?= docker compose
AIR ?= air
# All Air configs live here (run make / air from backend/)
AIR_CONF_DIR := dev/air

# tmux session name for scripts/dev-tmux.sh and scripts/stop-dev.sh
TMUX_SESSION ?= deenquest-backend

SERVICES := gateway auth core-service worker-service
WHISPER_DIR := whisper-service
WHISPER_VENV := $(WHISPER_DIR)/.venv

.PHONY: help tidy fmt vet test lint build run run-gateway run-auth run-core run-worker \
        whisper-setup whisper-run whisper-dev \
        compose-up compose-down compose-build compose-logs compose-ps compose-restart clean \
        air-install dev-check air-gateway air-auth air-core air-worker \
        dev-tmux dev-all dev-attach dev-stop dev-fresh

help:
	@echo "Go / quality:"
	@echo "  make tidy              - Run go mod tidy"
	@echo "  make fmt               - Format all Go files"
	@echo "  make vet               - Run go vet"
	@echo "  make test              - Run go test ./..."
	@echo "  make lint              - Run fmt + vet + test"
	@echo "  make build             - Build all Go services"
	@echo "  make run-gateway       - Run gateway (go run)"
	@echo "  make run-auth          - Run auth (go run)"
	@echo "  make run-core          - Run core (go run, WHISPER_URL=localhost:8001)"
	@echo "  make run-worker        - Run worker (go run)"
	@echo ""
	@echo "Hot reload (Air) — configs in $(AIR_CONF_DIR)/; run from backend/ or use dev-tmux:"
	@echo "  make air-install       - go install github.com/air-verse/air@latest"
	@echo "  make dev-check         - Verify air + tmux in PATH"
	@echo "  make air-gateway       - Gateway with Air"
	@echo "  make air-auth          - Auth with Air"
	@echo "  make air-core          - Core with Air (+ WHISPER_URL)"
	@echo "  make air-worker        - Worker with Air"
	@echo ""
	@echo "tmux all-in-one (no Docker required for the shell layout):"
	@echo "  make dev-tmux          - scripts/dev-tmux.sh (attach or create session)"
	@echo "  make dev-all           - same as dev-tmux (one command for every service)"
	@echo "  make dev-attach        - tmux attach to $(TMUX_SESSION)"
	@echo "  make dev-stop          - scripts/stop-dev.sh (kill session)"
	@echo "  make dev-fresh         - dev-stop then dev-tmux"
	@echo ""
	@echo "Whisper (Python):"
	@echo "  make whisper-setup     - Create venv and install Python deps"
	@echo "  make whisper-run       - Start whisper service (port 8001)"
	@echo "  make whisper-dev       - Whisper with uvicorn --reload"
	@echo ""
	@echo "Docker Compose (optional):"
	@echo "  make compose-up        - Start all Docker services"
	@echo "  make compose-down      - Stop all Docker services"
	@echo "  make compose-build     - Rebuild Docker images"
	@echo "  make compose-logs      - Tail compose logs"
	@echo "  make compose-ps        - List compose services"
	@echo "  make compose-restart   - Restart compose services"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean             - Remove build artifacts, Air tmp, venv"

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

# ── Air (hot reload) ──────────────────────────────────────────────────────────

air-install:
	$(GO) install github.com/air-verse/air@latest
	@echo "Ensure $(shell go env GOPATH)/bin is on your PATH."

dev-check:
	@command -v $(AIR) >/dev/null 2>&1 || { echo "air not found — run: make air-install"; exit 1; }
	@command -v tmux >/dev/null 2>&1 || { echo "tmux not found — e.g. brew install tmux"; exit 1; }
	@echo "air: $$($(AIR) -v 2>&1)"
	@echo "tmux: $$(tmux -V)"

air-gateway:
	$(AIR) -c $(AIR_CONF_DIR)/gateway.toml

air-auth:
	$(AIR) -c $(AIR_CONF_DIR)/auth.toml

air-core:
	WHISPER_URL=http://localhost:8001 $(AIR) -c $(AIR_CONF_DIR)/core-service.toml

air-worker:
	$(AIR) -c $(AIR_CONF_DIR)/worker-service.toml

# ── tmux dev layout ───────────────────────────────────────────────────────────

dev-tmux:
	@TMUX_SESSION=$(TMUX_SESSION) bash scripts/dev-tmux.sh

dev-all: dev-tmux

dev-attach:
	@tmux attach -t $(TMUX_SESSION) || true

dev-stop:
	@TMUX_SESSION=$(TMUX_SESSION) bash scripts/stop-dev.sh

dev-fresh: dev-stop dev-tmux

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

whisper-setup:
	@echo "Setting up whisper-service virtualenv..."
	$(PYTHON) -m venv $(WHISPER_VENV)
	$(WHISPER_VENV)/bin/pip install --upgrade pip
	$(WHISPER_VENV)/bin/pip install -r $(WHISPER_DIR)/requirements.txt
	@echo "Done. Run: make whisper-run"

whisper-run: $(WHISPER_VENV)
	WHISPER_MODEL=$(or $(WHISPER_MODEL),small) \
	WHISPER_DEVICE=$(or $(WHISPER_DEVICE),cpu) \
	WHISPER_COMPUTE=$(or $(WHISPER_COMPUTE),int8) \
	$(WHISPER_VENV)/bin/uvicorn main:app \
		--app-dir $(WHISPER_DIR) \
		--host 0.0.0.0 \
		--port 8001

whisper-dev: $(WHISPER_VENV)
	WHISPER_MODEL=$(or $(WHISPER_MODEL),small) \
	WHISPER_DEVICE=$(or $(WHISPER_DEVICE),cpu) \
	WHISPER_COMPUTE=$(or $(WHISPER_COMPUTE),int8) \
	$(WHISPER_VENV)/bin/uvicorn main:app \
		--app-dir $(WHISPER_DIR) \
		--host 0.0.0.0 \
		--port 8001 \
		--reload

$(WHISPER_VENV):
	@$(MAKE) whisper-setup

# ── Cleanup ───────────────────────────────────────────────────────────────────

clean:
	rm -rf build/ $(WHISPER_VENV)/ tmp/
	$(GO) clean -cache -testcache
