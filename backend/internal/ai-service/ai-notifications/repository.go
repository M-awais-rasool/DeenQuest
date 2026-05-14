package notifications

import (
	"context"
	"time"
)

type LogRepository interface {
	SaveLog(ctx context.Context, log *InactivityNotificationLog) error
	GetLastNotificationTime(ctx context.Context, userID string) (*time.Time, error)
}
