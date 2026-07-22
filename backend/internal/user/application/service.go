package application

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/chawais/deenquest/backend/internal/user/domain"

	"github.com/chawais/deenquest/backend/internal/platform/bcrypt"
)

var (
	ErrUserNotFound       = errors.New("user not found")
	ErrProfileEmailExists = errors.New("email already in use")
	ErrWrongPassword      = errors.New("current password is incorrect")
	ErrInvalidIcon        = errors.New("invalid app-icon value")
)

type Service struct {
	users domain.Repository
}

func NewService(users domain.Repository) *Service {
	return &Service{users: users}
}

func (s *Service) GetProfile(ctx context.Context, userID string) (*UserProfileResponse, error) {
	u, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("get user: %w", err)
	}
	if u == nil {
		return nil, ErrUserNotFound
	}
	return toProfile(u), nil
}

func (s *Service) UpdateProfile(ctx context.Context, userID string, req *UpdateUserRequest) (*UserProfileResponse, error) {
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

func (s *Service) ChangePassword(ctx context.Context, userID string, req *ChangePasswordRequest) error {
	u, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("get user: %w", err)
	}
	if u == nil {
		return ErrUserNotFound
	}

	if !bcrypt.CheckPassword(req.CurrentPassword, u.PasswordHash) {
		return ErrWrongPassword
	}

	hashed, err := bcrypt.HashPassword(req.NewPassword)
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

func (s *Service) GetPublicProfile(ctx context.Context, userID string) (*PublicUserResponse, error) {
	u, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("get user: %w", err)
	}
	if u == nil {
		return nil, ErrUserNotFound
	}
	return &PublicUserResponse{
		ID:          u.ID,
		DisplayName: u.DisplayName,
		AvatarURL:   u.AvatarURL,
		Bio:         u.Bio,
		Title:       u.Title,
	}, nil
}

func (s *Service) ListUsers(ctx context.Context, search string, limit int) ([]AdminUserRow, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	users, err := s.users.ListUsers(ctx, search, limit)
	if err != nil {
		return nil, fmt.Errorf("list users: %w", err)
	}
	rows := make([]AdminUserRow, 0, len(users))
	for i := range users {
		u := &users[i]
		rows = append(rows, AdminUserRow{
			ID:           u.ID,
			Email:        u.Email,
			DisplayName:  u.DisplayName,
			Role:         u.Role,
			IconOverride: u.IconOverride,
		})
	}
	return rows, nil
}

func (s *Service) SetAppIcon(ctx context.Context, userID, icon string) error {
	normalized, ok := domain.NormalizeIconOverride(icon)
	if !ok {
		return ErrInvalidIcon
	}
	u, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("get user: %w", err)
	}
	if u == nil {
		return ErrUserNotFound
	}
	if err := s.users.SetIconOverride(ctx, userID, normalized); err != nil {
		return fmt.Errorf("set app icon: %w", err)
	}
	return nil
}

func (s *Service) DeleteAccount(ctx context.Context, userID string) error {
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

func toProfile(u *domain.User) *UserProfileResponse {
	return &UserProfileResponse{
		ID:           u.ID,
		Email:        u.Email,
		Role:         u.Role,
		DisplayName:  u.DisplayName,
		AvatarURL:    u.AvatarURL,
		Bio:          u.Bio,
		Title:        u.Title,
		IsVerified:   u.IsVerified,
		IconOverride: u.IconOverride,
		CreatedAt:    u.CreatedAt.Format(time.RFC3339),
		UpdatedAt:    u.UpdatedAt.Format(time.RFC3339),
	}
}
