package notifications

import (
	"context"
	"fmt"
	"time"

	notification "github.com/chawais/talent-flow/backend/internal/notification-service"
	"github.com/chawais/talent-flow/backend/pkg/logger"
	"github.com/chawais/talent-flow/backend/pkg/push"
	"go.uber.org/zap"
)

type PushSender interface {
	SendToUser(ctx context.Context, user notification.UserInfo, msg notification.Message) (*push.Ticket, error)
}

type InactivityService struct {
	userFetcher *UserFetcher
	generator   *MessageGenerator
	logRepo     LogRepository
	pushSender  PushSender
	batchSize   int
	cooldown    time.Duration
	maxRetries  int
}

func NewInactivityService(
	userFetcher *UserFetcher,
	generator *MessageGenerator,
	logRepo LogRepository,
	pushSender PushSender,
) *InactivityService {
	return &InactivityService{
		userFetcher: userFetcher,
		generator:   generator,
		logRepo:     logRepo,
		pushSender:  pushSender,
		batchSize:   100,
		cooldown:    48 * time.Hour,
		maxRetries:  3,
	}
}

func (s *InactivityService) ProcessInactiveUsers(ctx context.Context) error {
	logger.Info("starting inactivity notification processing")

	var totalProcessed, totalSent, totalFailed int

	for {
		users, err := s.userFetcher.FetchInactiveUsers(ctx, 12*time.Hour, s.batchSize)
		if err != nil {
			return fmt.Errorf("fetch inactive users: %w", err)
		}

		if len(users) == 0 {
			break
		}

		for _, user := range users {
			shouldSkip, err := s.isOnCooldown(ctx, user.UserID)
			if err != nil {
				logger.Warn("failed to check cooldown, skipping user",
					zap.String("user_id", user.UserID),
					zap.Error(err))
				continue
			}
			if shouldSkip {
				continue
			}
			message, err := s.generator.GenerateMessage(ctx, user)
			if err != nil {
				logger.Warn("using fallback message",
					zap.String("user_id", user.UserID),
					zap.Error(err))
				message = GetFallbackMessage()
			}

			err = s.sendWithRetry(ctx, user, message)
			if err != nil {
				totalFailed++
				logger.Error("failed to send inactivity notification after retries",
					zap.String("user_id", user.UserID),
					zap.Error(err))
			} else {
				totalSent++
			}
			totalProcessed++
		}

		if len(users) < s.batchSize {
			break
		}
	}

	logger.Info("inactivity notification processing complete",
		zap.Int("total_processed", totalProcessed),
		zap.Int("total_sent", totalSent),
		zap.Int("total_failed", totalFailed))

	return nil
}

func (s *InactivityService) isOnCooldown(ctx context.Context, userID string) (bool, error) {
	lastNotified, err := s.logRepo.GetLastNotificationTime(ctx, userID)
	if err != nil {
		return false, err
	}
	if lastNotified == nil {
		return false, nil
	}
	return time.Since(*lastNotified) < s.cooldown, nil
}

func (s *InactivityService) sendWithRetry(ctx context.Context, user InactiveUser, message string) error {
	var lastErr error
	for attempt := 1; attempt <= s.maxRetries; attempt++ {
		err := s.sendNotification(ctx, user, message, attempt)
		if err == nil {
			return nil
		}
		lastErr = err

		if attempt < s.maxRetries {
			backoff := time.Duration(1<<(attempt-1)) * time.Second
			logger.Info("retrying notification send",
				zap.String("user_id", user.UserID),
				zap.Int("attempt", attempt),
				zap.Duration("backoff", backoff))
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(backoff):
			}
		}
	}

	return fmt.Errorf("all %d attempts failed, last error: %w", s.maxRetries, lastErr)
}

func (s *InactivityService) sendNotification(ctx context.Context, user InactiveUser, message string, attempt int) error {
	userInfo := notification.UserInfo{ID: user.UserID}
	msg := notification.Message{
		Title: "We miss you!",
		Body:  message,
		Data: map[string]interface{}{
			"type": "inactivity",
		},
	}

	_, err := s.pushSender.SendToUser(ctx, userInfo, msg)

	log := &InactivityNotificationLog{
		UserID:   user.UserID,
		Message:  message,
		Status:   "sent",
		Attempts: attempt,
	}
	if err != nil {
		log.Status = "failed"
		log.Error = err.Error()
	}

	if saveErr := s.logRepo.SaveLog(ctx, log); saveErr != nil {
		logger.Error("failed to save notification log",
			zap.String("user_id", user.UserID),
			zap.Error(saveErr))
	}

	return err
}
