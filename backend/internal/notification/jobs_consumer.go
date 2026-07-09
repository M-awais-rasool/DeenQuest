package notification

import (
	"context"
	"errors"
	"fmt"

	"github.com/chawais/deenquest/backend/internal/platform/kafka"
	"github.com/chawais/deenquest/backend/internal/platform/logger"
	"go.uber.org/zap"
)

type JobConsumer struct {
	jobRepo             *JobLogRepository
	notificationService *Service
}

func NewJobConsumer(jobRepo *JobLogRepository, notificationService *Service) *JobConsumer {
	return &JobConsumer{jobRepo: jobRepo, notificationService: notificationService}
}

func (c *JobConsumer) HandleNotificationSend(ctx context.Context, event kafka.Event) error {
	logger.Info("worker handled notification.send")
	if c.notificationService == nil {
		c.jobRepo.Save(ctx, "notification.send", event.Type, event.Payload, "processed", "")
		return nil
	}

	ticket, err := c.notificationService.SendFromJob(ctx, event.Payload)
	if err != nil {
		if errors.Is(err, ErrNoToken) {
			c.jobRepo.Save(ctx, "notification.send", event.Type, event.Payload, "skipped", err.Error())
			return nil
		}
		return err
	}

	c.jobRepo.Save(ctx, "notification.send", event.Type, map[string]interface{}{
		"payload": event.Payload,
		"ticket":  ticket,
	}, "processed", "")
	return nil
}

func (c *JobConsumer) Wrap(topic string, handler kafka.MessageHandler) kafka.MessageHandler {
	return func(ctx context.Context, event kafka.Event) error {
		err := handler(ctx, event)
		if err != nil {
			c.jobRepo.Save(ctx, topic, event.Type, event.Payload, "failed", err.Error())
			logger.Error("worker handler failed", zap.String("topic", topic), zap.Error(err))
			return fmt.Errorf("topic %s failed: %w", topic, err)
		}
		return nil
	}
}
