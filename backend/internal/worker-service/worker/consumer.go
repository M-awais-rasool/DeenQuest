package worker

import (
	"context"
	"fmt"

	"github.com/chawais/talent-flow/backend/internal/worker-service/repository"
	"github.com/chawais/talent-flow/backend/pkg/logger"
	"github.com/chawais/talent-flow/backend/pkg/queue"
	"go.uber.org/zap"
)

type Consumer struct {
	jobRepo *repository.JobLogRepository
}

func NewConsumer(jobRepo *repository.JobLogRepository) *Consumer {
	return &Consumer{jobRepo: jobRepo}
}

func (c *Consumer) HandleUserCreated(ctx context.Context, event queue.Event) error {
	logger.Info("worker handled user.created")
	c.jobRepo.Save(ctx, "user.created", event.Type, event.Payload, "processed", "")
	return nil
}

func (c *Consumer) HandleHabitCompleted(ctx context.Context, event queue.Event) error {
	logger.Info("worker handled habit.completed", zap.Any("payload", event.Payload))
	c.jobRepo.Save(ctx, "habit.completed", event.Type, event.Payload, "processed", "")
	return nil
}

func (c *Consumer) HandleStreakUpdated(ctx context.Context, event queue.Event) error {
	logger.Info("worker handled streak.updated")
	c.jobRepo.Save(ctx, "streak.updated", event.Type, event.Payload, "processed", "")
	return nil
}

func (c *Consumer) HandleNotificationSend(ctx context.Context, event queue.Event) error {
	logger.Info("worker handled notification.send")
	c.jobRepo.Save(ctx, "notification.send", event.Type, event.Payload, "processed", "")
	return nil
}

func (c *Consumer) Wrap(topic string, handler queue.MessageHandler) queue.MessageHandler {
	return func(ctx context.Context, event queue.Event) error {
		err := handler(ctx, event)
		if err != nil {
			c.jobRepo.Save(ctx, topic, event.Type, event.Payload, "failed", err.Error())
			logger.Error("worker handler failed", zap.String("topic", topic), zap.Error(err))
			return fmt.Errorf("topic %s failed: %w", topic, err)
		}
		return nil
	}
}
