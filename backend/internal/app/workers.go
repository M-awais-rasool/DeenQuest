package app

import (
	"context"
	"io"
	"time"

	"go.uber.org/zap"

	"github.com/chawais/deenquest/backend/internal/learning"
	"github.com/chawais/deenquest/backend/internal/learning/model"
	"github.com/chawais/deenquest/backend/internal/notification"
	"github.com/chawais/deenquest/backend/internal/notification/smart"
	"github.com/chawais/deenquest/backend/internal/platform/config"
	"github.com/chawais/deenquest/backend/internal/platform/kafka"
	"github.com/chawais/deenquest/backend/internal/platform/logger"
)

// startWorkers launches every background piece of the monolith: Kafka
// consumers and cron-style schedulers. Each worker is listed here, in one
// place, so a reader can see the whole background surface at a glance.
// Workers stop when ctx is cancelled; the returned func closes the consumers.
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

	// 4. learning.events → learner-state engine (deterministic, always on).
	stateConsumer := kafka.NewConsumerWithConfig(
		brokers, model.TopicLearningEvents, "learning-state-group",
		kafka.ConsumerConfig{MaxWait: 500 * time.Millisecond, CommitInterval: time.Second},
	)
	closers = append(closers, stateConsumer)
	go func() { _ = stateConsumer.Consume(ctx, m.LearningState.Handle) }()

	// 5. learning.events → mistake notebook (records wrong answers for review).
	mistakeConsumer := kafka.NewConsumerWithConfig(
		brokers, model.TopicLearningEvents, "learning-mistakes-group",
		kafka.ConsumerConfig{MaxWait: 500 * time.Millisecond, CommitInterval: time.Second},
	)
	closers = append(closers, mistakeConsumer)
	go func() { _ = mistakeConsumer.Consume(ctx, m.LearningMistakes.Handle) }()

	// 6. learning.events → Gemini copywriter (optional: motivational/feedback
	//    text on meaningful moments). The deterministic engines above never
	//    depend on it.
	if m.LearningAI != nil {
		aiConsumer := kafka.NewConsumerWithConfig(
			brokers, model.TopicLearningEvents, "learning-ai-group",
			kafka.ConsumerConfig{MaxWait: time.Second, CommitInterval: 2 * time.Second},
		)
		closers = append(closers, aiConsumer)
		go func() { _ = aiConsumer.Consume(ctx, m.LearningAI.Handle) }()
		logger.Info("Learning Agent Gemini AI layer enabled")
	} else {
		logger.Info("Learning Agent Gemini AI layer disabled (no GEMINI_API_KEY)")
	}

	// 7. Learning pattern sweep: periodically re-segments learners
	//    (active/at-risk/inactive) and lets the engagement notifier send
	//    personalized win-back pushes to learners who slipped away.
	var engageGen learning.Generator
	if infra.Gemini != nil {
		engageGen = infra.Gemini
	}
	sweep := learning.NewScheduler(m.LearningRepo, m.LearningRecommender)
	sweep.SetNotifier(learning.NewEngagementNotifier(m.LearningRepo, m.NotificationService, engageGen))
	go func() {
		if err := sweep.Start(ctx); err != nil {
			logger.Error("learning pattern sweep error", zap.Error(err))
		}
	}()

	return func() {
		for _, c := range closers {
			_ = c.Close()
		}
	}
}
