package app

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"github.com/chawais/deenquest/backend/internal/platform/config"
	"github.com/chawais/deenquest/backend/internal/platform/logger"
)

func seedStartupData(cfg *config.Config, m *Modules) error {
	ctx := context.Background()

	logger.Info("Admin allowlist loaded",
		zap.Strings("emails", cfg.AdminEmailList()))

	if err := m.TaskService.Seed(ctx); err != nil {
		return fmt.Errorf("seed daily tasks: %w", err)
	}
	logger.Info("Daily tasks seeded successfully")

	if err := m.LevelService.Seed(ctx); err != nil {
		logger.Warn("failed to seed levels (will retry on next startup)", zap.Error(err))
	} else {
		logger.Info("Levels seeded successfully")
	}

	if err := m.RewardService.Seed(ctx); err != nil {
		logger.Warn("failed to seed rewards (will retry on next startup)", zap.Error(err))
	} else {
		logger.Info("Rewards seeded successfully")
	}

	if err := m.ChallengeService.Seed(ctx); err != nil {
		logger.Warn("failed to seed challenge quests (will retry on next startup)", zap.Error(err))
	} else {
		logger.Info("Challenge quests seeded successfully")
	}

	if n, err := m.HifzAdminService.Seed(ctx); err != nil {
		logger.Warn("failed to seed hifz plans (will retry on next startup)", zap.Error(err))
	} else {
		logger.Info("Hifz plans seeded successfully", zap.Int("written", n))
	}

	return nil
}
