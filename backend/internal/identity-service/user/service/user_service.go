package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/chawais/talent-flow/backend/internal/identity-service/model"
	"github.com/chawais/talent-flow/backend/internal/identity-service/repository"
	"github.com/chawais/talent-flow/backend/internal/identity-service/user/dto"
	"github.com/chawais/talent-flow/backend/pkg/auth"
)

var (
	ErrUserNotFound       = errors.New("user not found")
	ErrProfileEmailExists = errors.New("email already in use")
	ErrWrongPassword      = errors.New("current password is incorrect")
)

type UserService struct {
	users repository.UserRepository
}

func NewUserService(users repository.UserRepository) *UserService {
	return &UserService{users: users}
}

func (s *UserService) GetProfile(ctx context.Context, userID string) (*dto.UserProfileResponse, error) {
	u, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("get user: %w", err)
	}
	if u == nil {
		return nil, ErrUserNotFound
	}
	return toProfile(u), nil
}

func (s *UserService) UpdateProfile(ctx context.Context, userID string, req *dto.UpdateUserRequest) (*dto.UserProfileResponse, error) {
	u, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("get user: %w", err)
	}
	if u == nil {
		return nil, ErrUserNotFound
	}

	if req.Email != "" {
		email := strings.ToLower(req.Email)
		exists, err := s.users.EmailExists(ctx, email, userID)
		if err != nil {
			return nil, fmt.Errorf("check email uniqueness: %w", err)
		}
		if exists {
			return nil, ErrProfileEmailExists
		}
		u.Email = email
	}

	if req.DisplayName != "" {
		u.DisplayName = req.DisplayName
	}
	if req.AvatarURL != "" {
		u.AvatarURL = req.AvatarURL
	}
	if req.Bio != "" {
		u.Bio = req.Bio
	}
	if req.Title != "" {
		u.Title = req.Title
	}
	if req.Role != "" {
		u.Role = req.Role
	}

	u.UpdatedAt = time.Now().UTC()
	if err := s.users.Update(ctx, u); err != nil {
		return nil, fmt.Errorf("update user: %w", err)
	}
	return toProfile(u), nil
}

func (s *UserService) ChangePassword(ctx context.Context, userID string, req *dto.ChangePasswordRequest) error {
	u, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("get user: %w", err)
	}
	if u == nil {
		return ErrUserNotFound
	}

	if !auth.CheckPassword(req.CurrentPassword, u.PasswordHash) {
		return ErrWrongPassword
	}

	hashed, err := auth.HashPassword(req.NewPassword)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	u.PasswordHash = hashed
	u.UpdatedAt = time.Now().UTC()
	if err := s.users.Update(ctx, u); err != nil {
		return fmt.Errorf("update password: %w", err)
	}
	return nil
}

func (s *UserService) DeleteAccount(ctx context.Context, userID string) error {
	u, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("get user: %w", err)
	}
	if u == nil {
		return ErrUserNotFound
	}
	if err := s.users.Delete(ctx, userID); err != nil {
		return fmt.Errorf("delete user: %w", err)
	}
	return nil
}

func toProfile(u *model.User) *dto.UserProfileResponse {
	return &dto.UserProfileResponse{
		ID:          u.ID,
		Email:       u.Email,
		Role:        u.Role,
		DisplayName: u.DisplayName,
		AvatarURL:   u.AvatarURL,
		Bio:         u.Bio,
		Title:       u.Title,
		IsVerified:  u.IsVerified,
		CreatedAt:   u.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   u.UpdatedAt.Format(time.RFC3339),
	}
}
