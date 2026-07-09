package smart

import (
	"context"
	"time"

	"github.com/chawais/deenquest/backend/internal/platform/logger"
	"github.com/robfig/cron/v3"
	"go.uber.org/zap"
)

type Scheduler struct {
	cron    *cron.Cron
	service *Service
}

func NewScheduler(service *Service) *Scheduler {
	return &Scheduler{
		cron:    cron.New(),
		service: service,
	}
}

func (s *Scheduler) Start(ctx context.Context) error {
	_, err := s.cron.AddFunc("*/1 * * * *", func() {
		execCtx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		logger.Info("intelligent notification cron triggered")
		stats, err := s.service.ProcessAllNotifications(execCtx)
		if err != nil {
			logger.Error("intelligent notification processing failed", zap.Error(err))
			return
		}
		logger.Info("notification batch completed",
			zap.Int("total_users_processed", stats.TotalUsers))
	})
	if err != nil {
		return err
	}

	s.cron.Start()
	logger.Info("intelligent notification scheduler started (every 10 minutes)")

	<-ctx.Done()

	s.cron.Stop()
	logger.Info("intelligent notification scheduler stopped")
	return nil
}
