SHELL := /bin/bash

GO ?= go
PYTHON ?= python3
COMPOSE ?= docker compose

WHISPER_DIR := whisper-service
WHISPER_VENV := $(WHISPER_DIR)/.venv

.PHONY: help tidy fmt vet test lint build run \
        whisper-setup whisper-run whisper-dev \
        compose-up compose-down compose-build compose-logs compose-ps compose-restart clean

help:
	@echo "Go / quality:"
	@echo "  make tidy              - Run go mod tidy"
	@echo "  make fmt               - Format all Go files"
	@echo "  make vet               - Run go vet"
	@echo "  make test              - Run go test ./..."
	@echo "  make lint              - Run fmt + vet + test"
	@echo "  make build             - Build the Go binary"
	@echo "  make run               - Run the server (go run)"
	@echo ""
	@echo "Whisper (Python):"
	@echo "  make whisper-setup     - Create venv and install Python deps"
	@echo "  make whisper-run       - Start whisper service (port 8001)"
	@echo "  make whisper-dev       - Whisper with uvicorn --reload"
	@echo ""
	@echo "Docker Compose (infrastructure):"
	@echo "  make compose-up        - Start Kafka + Redis"
	@echo "  make compose-down      - Stop all Docker services"
	@echo "  make compose-build     - Rebuild Docker images"
	@echo "  make compose-logs      - Tail compose logs"
	@echo "  make compose-ps        - List compose services"
	@echo "  make compose-restart   - Restart compose services"
	@echo ""
	@echo "Cleanup:"
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
	$(GO) build -o build/deenquest-api ./cmd/

run:
	WHISPER_URL=http://localhost:8001 $(GO) run ./cmd/

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

clean:
	rm -rf build/ $(WHISPER_VENV)/ tmp/
	$(GO) clean -cache -testcache
