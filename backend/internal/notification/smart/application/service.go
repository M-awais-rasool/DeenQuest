package application

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/chawais/deenquest/backend/internal/notification/smart/domain"

	"go.uber.org/zap"

	notifdomain "github.com/chawais/deenquest/backend/internal/notification/domain"
	"github.com/chawais/deenquest/backend/internal/platform/logger"
	"github.com/chawais/deenquest/backend/internal/platform/push"
)

type PushSender interface {
	SendToUser(ctx context.Context, user notifdomain.UserInfo, msg notifdomain.Message) (*push.Ticket, error)
}

type UserFetcher interface {
	FetchUserPage(
		ctx context.Context,
		afterID string,
		limit int,
		activeHours domain.HourSet,
		now time.Time,
	) ([]domain.UserContext, string, error)
}

const maxPagesPerRun = 1000

type Service struct {
	userFetcher UserFetcher
	logRepo     domain.LogRepository
	pushSender  PushSender
	rules       []domain.NotificationRule
	batchSize   int
	maxRetries  int

	locMu     sync.RWMutex
	locations map[string]*time.Location
}

func NewService(
	userFetcher UserFetcher,
	logRepo domain.LogRepository,
	pushSender PushSender,
) *Service {
	return &Service{
		userFetcher: userFetcher,
		logRepo:     logRepo,
		pushSender:  pushSender,
		rules:       domain.BuildRules(),
		batchSize:   100,
		maxRetries:  3,
		locations:   make(map[string]*time.Location),
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

func (s *Service) ProcessAllNotifications(ctx context.Context) (*ProcessingStats, error) {
	logger.Info("starting intelligent notification processing")

	stats := &ProcessingStats{}
	for _, rule := range s.rules {
		stats.Notifications = append(stats.Notifications, NotificationTypeStats{Type: rule.Type})
	}

	activeHours := domain.ActiveHours(s.rules)
	now := time.Now()
	cursor := ""
	pages := 0

	for {
		users, next, err := s.userFetcher.FetchUserPage(ctx, cursor, s.batchSize, activeHours, now)
		if err != nil {
			return nil, fmt.Errorf("fetch users: %w", err)
		}
		pages++

		if len(users) > 0 {
			if err := s.processPage(ctx, users, now, stats); err != nil {
				return nil, err
			}
		}

		if next == "" {
			break
		}
		cursor = next

		if pages >= maxPagesPerRun {
			logger.Warn("notification scan hit the page ceiling; users beyond it were not evaluated this tick",
				zap.Int("pages", pages),
				zap.Int("users_processed", stats.TotalUsers))
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
		zap.Int("total_users", stats.TotalUsers),
		zap.Int("pages", pages))

	return stats, nil
}

func (s *Service) processPage(
	ctx context.Context,
	users []domain.UserContext,
	now time.Time,
	stats *ProcessingStats,
) error {
	userIDs := make([]string, 0, len(users))
	for i := range users {
		userIDs = append(userIDs, users[i].UserID)
	}

	cooldowns, err := s.loadCooldowns(ctx, userIDs)
	if err != nil {
		return fmt.Errorf("load cooldowns: %w", err)
	}

	for _, user := range users {
		stats.TotalUsers++
		localNow := now.In(s.location(user.Timezone))

		for i, rule := range s.rules {
			hour := localNow.Hour()
			if hour < rule.TimeWindow.StartHour || hour >= rule.TimeWindow.EndHour {
				stats.Notifications[i].Skipped++
				continue
			}

			if sentAt, ok := cooldowns[cooldownKey{user.UserID, rule.Type}]; ok {
				if now.Sub(sentAt) < rule.Cooldown {
					stats.Notifications[i].Skipped++
					continue
				}
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

			if err := s.sendWithRetry(ctx, user, rule.Type, title, message, data); err != nil {
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

	return nil
}

type cooldownKey struct {
	userID string
	typ    domain.NotificationType
}

func (s *Service) loadCooldowns(ctx context.Context, userIDs []string) (map[cooldownKey]time.Time, error) {
	rows, err := s.logRepo.GetLastNotificationTimes(ctx, userIDs)
	if err != nil {
		return nil, err
	}
	out := make(map[cooldownKey]time.Time, len(rows))
	for _, row := range rows {
		out[cooldownKey{row.UserID, row.Type}] = row.SentAt
	}
	return out, nil
}

func (s *Service) location(name string) *time.Location {
	if name == "" {
		return time.UTC
	}

	s.locMu.RLock()
	loc, ok := s.locations[name]
	s.locMu.RUnlock()
	if ok {
		return loc
	}

	loc, err := time.LoadLocation(name)
	if err != nil || loc == nil {
		loc = time.UTC
	}

	s.locMu.Lock()
	s.locations[name] = loc
	s.locMu.Unlock()
	return loc
}

func (s *Service) sendWithRetry(ctx context.Context, user domain.UserContext, notifType domain.NotificationType, title, message string, data map[string]interface{}) error {
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

func (s *Service) sendNotification(ctx context.Context, user domain.UserContext, notifType domain.NotificationType, title, message string, data map[string]interface{}, attempt int) error {
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
