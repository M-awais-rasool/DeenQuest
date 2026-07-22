package application

import (
	"context"
	"time"

	"github.com/robfig/cron/v3"
	"go.uber.org/zap"

	"github.com/chawais/deenquest/backend/internal/platform/logger"
)

type Sweeper struct {
	cron    *cron.Cron
	service *Service
}

func NewSweeper(service *Service) *Sweeper {
	return &Sweeper{cron: cron.New(), service: service}
}

func (s *Sweeper) Start(ctx context.Context) error {
	_, err := s.cron.AddFunc("30 2 * * *", func() {
		execCtx, cancel := context.WithTimeout(context.Background(), 15*time.Minute)
		defer cancel()

		start := time.Now()
		users, err := s.service.SweepAll(execCtx)
		if err != nil {
			logger.Error("coach nightly sweep failed", zap.Error(err))
			return
		}
		logger.Info("coach nightly sweep completed",
			zap.Int("users", users), zap.Duration("took", time.Since(start)))
	})
	if err != nil {
		return err
	}

	s.cron.Start()
	logger.Info("coach nightly sweep scheduled (02:30)")

	<-ctx.Done()
	s.cron.Stop()
	logger.Info("coach nightly sweep stopped")
	return nil
}
