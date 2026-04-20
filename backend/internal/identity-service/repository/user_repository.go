package repository

import (
	"context"

	"github.com/chawais/talent-flow/backend/internal/identity-service/model"
)

type UserRepository interface {
	Create(ctx context.Context, user *model.User) error
	GetByEmail(ctx context.Context, email string) (*model.User, error)
	GetByID(ctx context.Context, id string) (*model.User, error)
	Update(ctx context.Context, user *model.User) error
	Delete(ctx context.Context, id string) error
	EmailExists(ctx context.Context, email string, excludeID string) (bool, error)
}
