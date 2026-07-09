package notification

import (
	"context"
	"time"

	"github.com/chawais/deenquest/backend/internal/platform/logger"
)

type JobScheduler struct {
	jobRepo *JobLogRepository
}

func NewJobScheduler(jobRepo *JobLogRepository) *JobScheduler {
	return &JobScheduler{jobRepo: jobRepo}
}

func (s *JobScheduler) Start(ctx context.Context) {
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
