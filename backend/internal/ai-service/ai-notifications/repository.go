package notifications

import (
	"context"
	"time"
)

type LogRepository interface {
	SaveLog(ctx context.Context, log *NotificationLog) error
	GetLastNotificationTime(ctx context.Context, userID string, notifType NotificationType) (*time.Time, error)
}
