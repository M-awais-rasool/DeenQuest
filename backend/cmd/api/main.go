package main

import (
	"log"

	"github.com/chawais/deenquest/backend/internal/app"
	"github.com/chawais/deenquest/backend/internal/platform/config"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	application, err := app.New(cfg)
	if err != nil {
		log.Fatalf("failed to start DeenQuest API: %v", err)
	}

	if err := application.Run(); err != nil {
		log.Fatal(err)
	}
}
