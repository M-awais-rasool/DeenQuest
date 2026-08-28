package app

import (
	"context"

	"go.uber.org/zap"

	coachapp "github.com/chawais/deenquest/backend/internal/coach/application"
	notifinfra "github.com/chawais/deenquest/backend/internal/notification/infrastructure"
	smartapp "github.com/chawais/deenquest/backend/internal/notification/smart/application"
	"github.com/chawais/deenquest/backend/internal/platform/config"
	"github.com/chawais/deenquest/backend/internal/platform/logger"
)

func startWorkers(ctx context.Context, cfg *config.Config, infra *Infra, m *Modules) func() {
	go notifinfra.NewJobScheduler(m.JobLogs).Start(ctx)

	smartScheduler := smartapp.NewScheduler(m.SmartNotifications)
	go func() {
		if err := smartScheduler.Start(ctx); err != nil {
			logger.Error("smart notification scheduler error", zap.Error(err))
		}
	}()

	if m.CoachService != nil {
		coachSweeper := coachapp.NewSweeper(m.CoachService)
		go func() {
			if err := coachSweeper.Start(ctx); err != nil {
				logger.Error("coach sweeper error", zap.Error(err))
			}
		}()
	}

	return func() {}
}
