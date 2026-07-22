package domain

import (
	"context"
	"errors"
)

var ErrRewardNotFound = errors.New("reward not found")

type Repository interface {
	SeedRewards(ctx context.Context, rewards []Reward) error
	ListAllRewards(ctx context.Context) ([]Reward, error)
	GetUserRewards(ctx context.Context, userID string) ([]UserReward, error)
	GrantUserReward(ctx context.Context, ur *UserReward) error
	// Admin CRUD
	GetRewardByID(ctx context.Context, id string) (*Reward, error)
	CreateReward(ctx context.Context, reward *Reward) error
	UpdateReward(ctx context.Context, reward *Reward) error
	DeleteReward(ctx context.Context, id string) error
}
