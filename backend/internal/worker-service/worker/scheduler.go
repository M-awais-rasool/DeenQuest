package worker

import (
	"context"
	"time"

	"github.com/chawais/talent-flow/backend/internal/worker-service/repository"
	"github.com/chawais/talent-flow/backend/pkg/logger"
)

type Scheduler struct {
	jobRepo *repository.JobLogRepository
}

func NewScheduler(jobRepo *repository.JobLogRepository) *Scheduler {
	return &Scheduler{jobRepo: jobRepo}
}

func (s *Scheduler) Start(ctx context.Context) {
	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			logger.Info("running daily reset job")
			s.jobRepo.Save(ctx, "cron.daily_reset", "daily_reset", map[string]string{"job": "daily_reset"}, "processed", "")
		}
	}
}
