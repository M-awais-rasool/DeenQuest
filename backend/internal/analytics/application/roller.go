package application

import (
	"context"
	"time"

	"github.com/robfig/cron/v3"
	"go.uber.org/zap"

	"github.com/chawais/deenquest/backend/internal/analytics/domain"
	"github.com/chawais/deenquest/backend/internal/platform/logger"
)

type Roller struct {
	cron *cron.Cron
	repo domain.Repository
}

func NewRoller(repo domain.Repository) *Roller {
	return &Roller{cron: cron.New(), repo: repo}
}

func (r *Roller) Backfill(ctx context.Context) error {
	start := time.Now()
	n, err := r.repo.BackfillMissingDays(ctx)
	if err != nil {
		return err
	}
	if n > 0 {
		logger.Info("analytics backfill complete",
			zap.Int("days", n),
			zap.Duration("took", time.Since(start)))
	}
	return nil
}

func (r *Roller) Start(ctx context.Context) error {
	_, err := r.cron.AddFunc("20 3 * * *", func() {
		execCtx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
		defer cancel()

		yesterday := time.Now().UTC().AddDate(0, 0, -1).Format("2006-01-02")
		if err := r.repo.RollUpDay(execCtx, yesterday); err != nil {
			logger.Error("analytics rollup failed",
				zap.String("date", yesterday), zap.Error(err))
			return
		}
		logger.Info("analytics rollup complete", zap.String("date", yesterday))

		if _, err := r.repo.BackfillMissingDays(execCtx); err != nil {
			logger.Warn("analytics gap backfill failed", zap.Error(err))
		}
	})
	if err != nil {
		return err
	}

	r.cron.Start()
	logger.Info("analytics roller started (daily at 03:20 UTC)")

	<-ctx.Done()

	r.cron.Stop()
	logger.Info("analytics roller stopped")
	return nil
}
