package app

import (
	"context"

	"github.com/chawais/deenquest/backend/internal/level"
	"github.com/chawais/deenquest/backend/internal/progress"
	"github.com/chawais/deenquest/backend/internal/reward"
)

// rewardMetrics is the seam that lets the reward package evaluate its triggers
// without importing level or progress: it composes the two services here in the
// wiring layer and satisfies reward.MetricsProvider.
type rewardMetrics struct {
	level    *level.Service
	progress *progress.Service
}

func (m rewardMetrics) Metrics(ctx context.Context, userID string) (reward.Metrics, error) {
	completed, err := m.level.CompletedLevelCount(ctx, userID)
	if err != nil {
		return reward.Metrics{}, err
	}
	pub, err := m.progress.GetPublicProgress(ctx, userID)
	if err != nil {
		return reward.Metrics{}, err
	}
	return reward.Metrics{
		CompletedLevels: completed,
		XP:              pub.XP,
		StreakDays:      pub.CurrentStreak,
	}, nil
}
