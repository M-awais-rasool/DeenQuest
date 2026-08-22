package domain

import (
	"context"
)

type Repository interface {
	Create(ctx context.Context, user *User) error
	GetByEmail(ctx context.Context, email string) (*User, error)
	GetByID(ctx context.Context, id string) (*User, error)
	Update(ctx context.Context, user *User) error
	Delete(ctx context.Context, id string) error
	GetByIdentity(ctx context.Context, provider, subject string) (*User, error)
	LinkIdentity(ctx context.Context, userID string, identity LinkedIdentity) error
}
