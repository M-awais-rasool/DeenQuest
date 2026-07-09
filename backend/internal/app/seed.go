package app

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"github.com/chawais/deenquest/backend/internal/platform/config"
	"github.com/chawais/deenquest/backend/internal/platform/logger"
)

// seedStartupData makes sure baseline data exists on boot: the admin account,
// the daily-task catalog, levels, and rewards. Only missing daily tasks are
// fatal — everything else logs a warning and retries on next startup.
func seedStartupData(cfg *config.Config, m *Modules) error {
	ctx := context.Background()

	if status, err := m.AuthService.SeedAdmin(ctx, cfg.AdminSeedEmail, cfg.AdminSeedPassword, cfg.AdminSeedName); err != nil {
		logger.Warn("failed to seed admin user", zap.Error(err))
	} else {
		logger.Info("Admin user ready",
			zap.String("email", cfg.AdminSeedEmail),
			zap.String("status", status))
	}

	if err := m.CoreService.SeedDailyTasks(ctx); err != nil {
		return fmt.Errorf("seed daily tasks: %w", err)
	}
	logger.Info("Daily tasks seeded successfully")

	if err := m.CoreService.SeedLevels(ctx); err != nil {
		logger.Warn("failed to seed levels (will retry on next startup)", zap.Error(err))
	} else {
		logger.Info("Levels seeded successfully")
	}

	if err := m.CoreService.SeedRewards(ctx); err != nil {
		logger.Warn("failed to seed rewards (will retry on next startup)", zap.Error(err))
	} else {
		logger.Info("Rewards seeded successfully")
	}

	return nil
}
