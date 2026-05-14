package notifications

import (
	"context"
	"time"

	"github.com/chawais/talent-flow/backend/pkg/logger"
	"github.com/robfig/cron/v3"
	"go.uber.org/zap"
)

type Scheduler struct {
	cron    *cron.Cron
	service *InactivityService
}

func NewScheduler(service *InactivityService) *Scheduler {
	return &Scheduler{
		cron:    cron.New(),
		service: service,
	}
}

func (s *Scheduler) Start(ctx context.Context) error {
	_, err := s.cron.AddFunc("*/10 * * * *", func() {
		execCtx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		logger.Info("inactivity notification cron triggered")
		if err := s.service.ProcessInactiveUsers(execCtx); err != nil {
			logger.Error("inactivity notification processing failed", zap.Error(err))
		}
	})
	if err != nil {
		return err
	}

	s.cron.Start()
	logger.Info("inactivity notification scheduler started (every 10 minutes)")

	<-ctx.Done()

	s.cron.Stop()
	logger.Info("inactivity notification scheduler stopped")
	return nil
}
