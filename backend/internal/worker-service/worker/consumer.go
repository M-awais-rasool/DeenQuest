package worker

import (
	"context"
	"errors"
	"fmt"

	"github.com/chawais/talent-flow/backend/internal/notification-service"
	"github.com/chawais/talent-flow/backend/internal/worker-service/repository"
	"github.com/chawais/talent-flow/backend/pkg/logger"
	"github.com/chawais/talent-flow/backend/pkg/queue"
	"go.uber.org/zap"
)

type Consumer struct {
	jobRepo             *repository.JobLogRepository
	notificationService *notification.Service
}

func NewConsumer(jobRepo *repository.JobLogRepository, notificationService *notification.Service) *Consumer {
	return &Consumer{jobRepo: jobRepo, notificationService: notificationService}
}

func (c *Consumer) HandleNotificationSend(ctx context.Context, event queue.Event) error {
	logger.Info("worker handled notification.send")
	if c.notificationService == nil {
		c.jobRepo.Save(ctx, "notification.send", event.Type, event.Payload, "processed", "")
		return nil
	}

	ticket, err := c.notificationService.SendFromJob(ctx, event.Payload)
	if err != nil {
		if errors.Is(err, notification.ErrNoToken) {
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
