package domain

import (
	"context"
	"time"
)

type RefreshToken struct {
	ID        string     `bson:"_id"`
	UserID    string     `bson:"user_id"`
	TokenHash string     `bson:"token_hash"`
	FamilyID  string     `bson:"family_id"`
	DeviceID  string     `bson:"device_id,omitempty"`
	UserAgent string     `bson:"user_agent,omitempty"`
	CreatedAt time.Time  `bson:"created_at"`
	ExpiresAt time.Time  `bson:"expires_at"`
	UsedAt    *time.Time `bson:"used_at,omitempty"`
	RevokedAt *time.Time `bson:"revoked_at,omitempty"`
}

func (t *RefreshToken) IsActive(now time.Time) bool {
	return t.UsedAt == nil && t.RevokedAt == nil && now.Before(t.ExpiresAt)
}

type RefreshTokenRepository interface {
	Create(ctx context.Context, token *RefreshToken) error
	Consume(ctx context.Context, hash string, at time.Time) (*RefreshToken, error)
	GetByHash(ctx context.Context, hash string) (*RefreshToken, error)
	RevokeFamily(ctx context.Context, familyID string, at time.Time) error
	RevokeByID(ctx context.Context, userID, id string, at time.Time) error
	ListActive(ctx context.Context, userID string, now time.Time) ([]RefreshToken, error)
}
