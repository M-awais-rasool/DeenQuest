package domain

import (
	"context"
	"time"
)

type LastNotification struct {
	UserID string
	Type   NotificationType
	SentAt time.Time
}

type LogRepository interface {
	SaveLog(ctx context.Context, log *NotificationLog) error

	GetLastNotificationTimes(ctx context.Context, userIDs []string) ([]LastNotification, error)
}
