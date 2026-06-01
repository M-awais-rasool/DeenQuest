package intelligent

import (
	"context"
	"fmt"
	"time"

	domain "github.com/chawais/talent-flow/backend/internal/domain/intelligent"
	notifdomain "github.com/chawais/talent-flow/backend/internal/domain/notification"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/logger"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/push"
	"go.uber.org/zap"
)

type PushSender interface {
	SendToUser(ctx context.Context, user notifdomain.UserInfo, msg notifdomain.Message) (*push.Ticket, error)
}

type NotificationService struct {
	userFetcher *UserFetcher
	logRepo     domain.LogRepository
	pushSender  PushSender
	rules       []domain.NotificationRule
	batchSize   int
	maxRetries  int
}

func NewNotificationService(
	userFetcher *UserFetcher,
	logRepo domain.LogRepository,
	pushSender PushSender,
) *NotificationService {
	return &NotificationService{
		userFetcher: userFetcher,
		logRepo:     logRepo,
		pushSender:  pushSender,
		rules:       BuildRules(),
		batchSize:   100,
		maxRetries:  3,
	}
}

type ProcessingStats struct {
	TotalUsers    int
	Notifications []NotificationTypeStats
}

type NotificationTypeStats struct {
	Type    domain.NotificationType
	Sent    int
	Skipped int
	Failed  int
}

func (s *NotificationService) ProcessAllNotifications(ctx context.Context) (*ProcessingStats, error) {
	logger.Info("starting intelligent notification processing")

	stats := &ProcessingStats{}
	for _, rule := range s.rules {
		stats.Notifications = append(stats.Notifications, NotificationTypeStats{Type: rule.Type})
	}

	for offset := 0; ; offset += s.batchSize {
		users, err := s.userFetcher.FetchAllUsers(ctx, s.batchSize, offset)
		if err != nil {
			return nil, fmt.Errorf("fetch users: %w", err)
		}

		if len(users) == 0 {
			break
		}

		now := time.Now()

		for _, user := range users {
			stats.TotalUsers++

			loc := time.UTC
			if user.Timezone != "" {
				if parsed, err := time.LoadLocation(user.Timezone); err == nil {
					loc = parsed
				}
			}
			localNow := now.In(loc)

			for i, rule := range s.rules {
				hour := localNow.Hour()
				if hour < rule.TimeWindow.StartHour || hour >= rule.TimeWindow.EndHour {
					stats.Notifications[i].Skipped++
					continue
				}

				onCooldown, err := s.isOnCooldown(ctx, user.UserID, rule.Type)
				if err != nil {
					logger.Warn("failed to check cooldown",
						zap.String("user_id", user.UserID),
						zap.String("type", string(rule.Type)),
						zap.Error(err))
					continue
				}
				if onCooldown {
					stats.Notifications[i].Skipped++
					continue
				}

				if !rule.Evaluate(&user, now) {
					stats.Notifications[i].Skipped++
					continue
				}

				title := rule.BuildTitle(&user)
				message := rule.BuildMessage(&user)
				data := map[string]interface{}{
					"type": string(rule.Type),
				}
				if rule.BuildData != nil {
					for k, v := range rule.BuildData(&user) {
						data[k] = v
					}
				}

				err = s.sendWithRetry(ctx, user, rule.Type, title, message, data)
				if err != nil {
					stats.Notifications[i].Failed++
					logger.Error("failed to send notification after retries",
						zap.String("user_id", user.UserID),
						zap.String("type", string(rule.Type)),
						zap.Error(err))
				} else {
					stats.Notifications[i].Sent++
				}
			}
		}

		if len(users) < s.batchSize {
			break
		}
	}

	for _, ns := range stats.Notifications {
		logger.Info("notification type stats",
			zap.String("type", string(ns.Type)),
			zap.Int("sent", ns.Sent),
			zap.Int("skipped", ns.Skipped),
			zap.Int("failed", ns.Failed))
	}

	logger.Info("intelligent notification processing complete",
		zap.Int("total_users", stats.TotalUsers))

	return stats, nil
}

func (s *NotificationService) isOnCooldown(ctx context.Context, userID string, notifType domain.NotificationType) (bool, error) {
	lastNotified, err := s.logRepo.GetLastNotificationTime(ctx, userID, notifType)
	if err != nil {
		return false, err
	}
	if lastNotified == nil {
		return false, nil
	}

	var cooldown time.Duration
	for _, rule := range s.rules {
		if rule.Type == notifType {
			cooldown = rule.Cooldown
			break
		}
	}

	return time.Since(*lastNotified) < cooldown, nil
}

func (s *NotificationService) sendWithRetry(ctx context.Context, user domain.UserContext, notifType domain.NotificationType, title, message string, data map[string]interface{}) error {
	var lastErr error
	for attempt := 1; attempt <= s.maxRetries; attempt++ {
		err := s.sendNotification(ctx, user, notifType, title, message, data, attempt)
		if err == nil {
			return nil
		}
		lastErr = err

		if attempt < s.maxRetries {
			backoff := time.Duration(1<<(attempt-1)) * time.Second
			logger.Info("retrying notification send",
				zap.String("user_id", user.UserID),
				zap.String("type", string(notifType)),
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

func (s *NotificationService) sendNotification(ctx context.Context, user domain.UserContext, notifType domain.NotificationType, title, message string, data map[string]interface{}, attempt int) error {
	userInfo := notifdomain.UserInfo{ID: user.UserID}
	msg := notifdomain.Message{
		Title: title,
		Body:  message,
		Data:  data,
	}

	_, err := s.pushSender.SendToUser(ctx, userInfo, msg)

	log := &domain.NotificationLog{
		UserID:           user.UserID,
		NotificationType: notifType,
		Status:           "sent",
		Attempts:         attempt,
	}
	if err != nil {
		log.Status = "failed"
		log.Error = err.Error()
	}

	if saveErr := s.logRepo.SaveLog(ctx, log); saveErr != nil {
		logger.Error("failed to save notification log",
			zap.String("user_id", user.UserID),
			zap.String("type", string(notifType)),
			zap.Error(saveErr))
	}

	return err
}
