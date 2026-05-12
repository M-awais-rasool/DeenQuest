package notification

import "context"

type TokenRepository interface {
	Upsert(ctx context.Context, token *UserToken) (*UserToken, error)
	GetActiveByUserID(ctx context.Context, userID string) (*UserToken, error)
	Disable(ctx context.Context, userID, expoPushToken string) error
}
