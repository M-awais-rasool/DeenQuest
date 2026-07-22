package app

import (
	"context"
	"io"

	"go.uber.org/zap"

	coachapp "github.com/chawais/deenquest/backend/internal/coach/application"
	notifinfra "github.com/chawais/deenquest/backend/internal/notification/infrastructure"
	smartapp "github.com/chawais/deenquest/backend/internal/notification/smart/application"
	"github.com/chawais/deenquest/backend/internal/platform/config"
	"github.com/chawais/deenquest/backend/internal/platform/kafka"
	"github.com/chawais/deenquest/backend/internal/platform/logger"
)

func startWorkers(ctx context.Context, cfg *config.Config, infra *Infra, m *Modules) func() {
	brokers := cfg.GetKafkaBrokerList()
	var closers []io.Closer

	// 1. notification.send topic → Expo push delivery (with job logging).
	jobConsumer := notifinfra.NewJobConsumer(m.JobLogs, m.NotificationService)
	sendConsumer := kafka.NewConsumer(brokers, "notification.send", "worker-notification-send-group")
	closers = append(closers, sendConsumer)
	go func() {
		_ = sendConsumer.Consume(ctx, jobConsumer.Wrap("notification.send", jobConsumer.HandleNotificationSend))
	}()

	// 2. Daily job-log heartbeat.
	go notifinfra.NewJobScheduler(m.JobLogs).Start(ctx)

	// 3. Smart notifications cron: every minute, evaluate the rules engine
	//    (daily-task reminders, streak savers, ...) against all users.
	smartScheduler := smartapp.NewScheduler(m.SmartNotifications)
	go func() {
		if err := smartScheduler.Start(ctx); err != nil {
			logger.Error("smart notification scheduler error", zap.Error(err))
		}
	}()

	if m.CoachService != nil {
		coachSweeper := coachapp.NewSweeper(m.CoachService)
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
