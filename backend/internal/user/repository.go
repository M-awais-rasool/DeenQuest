package user

import (
	"context"
)

type Repository interface {
	Create(ctx context.Context, user *User) error
	GetByEmail(ctx context.Context, email string) (*User, error)
	GetByID(ctx context.Context, id string) (*User, error)
	Update(ctx context.Context, user *User) error
	Delete(ctx context.Context, id string) error
	EmailExists(ctx context.Context, email string, excludeID string) (bool, error)
	ListUsers(ctx context.Context, search string, limit int) ([]User, error)
	SetIconOverride(ctx context.Context, id, icon string) error
}
