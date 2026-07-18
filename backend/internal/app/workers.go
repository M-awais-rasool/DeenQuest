package app

import (
	"context"
	"io"

	"go.uber.org/zap"

	"github.com/chawais/deenquest/backend/internal/coach"
	"github.com/chawais/deenquest/backend/internal/notification"
	"github.com/chawais/deenquest/backend/internal/notification/smart"
	"github.com/chawais/deenquest/backend/internal/platform/config"
	"github.com/chawais/deenquest/backend/internal/platform/kafka"
	"github.com/chawais/deenquest/backend/internal/platform/logger"
)

func startWorkers(ctx context.Context, cfg *config.Config, infra *Infra, m *Modules) func() {
	brokers := cfg.GetKafkaBrokerList()
	var closers []io.Closer

	// 1. notification.send topic → Expo push delivery (with job logging).
	jobConsumer := notification.NewJobConsumer(m.JobLogs, m.NotificationService)
	sendConsumer := kafka.NewConsumer(brokers, "notification.send", "worker-notification-send-group")
	closers = append(closers, sendConsumer)
	go func() {
		_ = sendConsumer.Consume(ctx, jobConsumer.Wrap("notification.send", jobConsumer.HandleNotificationSend))
	}()

	// 2. Daily job-log heartbeat.
	go notification.NewJobScheduler(m.JobLogs).Start(ctx)

	// 3. Smart notifications cron: every minute, evaluate the rules engine
	//    (daily-task reminders, streak savers, ...) against all users.
	smartScheduler := smart.NewScheduler(m.SmartNotifications)
	go func() {
		if err := smartScheduler.Start(ctx); err != nil {
			logger.Error("smart notification scheduler error", zap.Error(err))
		}
	}()

	if m.CoachService != nil {
		coachSweeper := coach.NewSweeper(m.CoachService)
		go func() {
			if err := coachSweeper.Start(ctx); err != nil {
				logger.Error("coach sweeper error", zap.Error(err))
			}
		}()
	}

	return func() {
		for _, c := range closers {
			_ = c.Close()
		}
	}
}
