package application

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/chawais/deenquest/backend/internal/platform/bcrypt"
	"github.com/chawais/deenquest/backend/internal/platform/jwt"
	userdomain "github.com/chawais/deenquest/backend/internal/user/domain"
)

var (
	ErrEmailExists        = errors.New("email already exists")
	ErrInvalidCredentials = errors.New("invalid email or password")
)

type Service struct {
	users      userdomain.Repository
	jwtManager *jwt.JWTManager
}

func NewService(users userdomain.Repository, jwtManager *jwt.JWTManager) *Service {
	return &Service{users: users, jwtManager: jwtManager}
}

func (s *Service) Signup(ctx context.Context, req *SignupRequest) error {
	existing, err := s.users.GetByEmail(ctx, strings.ToLower(req.Email))
	if err != nil {
		return fmt.Errorf("check email: %w", err)
	}
	if existing != nil {
		return ErrEmailExists
	}

	hashedPassword, err := bcrypt.HashPassword(req.Password)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	role := "USER"
	if req.Role == "ADMIN" {
		role = "ADMIN"
	}

	now := time.Now().UTC()
	newUser := &userdomain.User{
		ID:           uuid.NewString(),
		Email:        strings.ToLower(req.Email),
		PasswordHash: hashedPassword,
		Role:         role,
		IsVerified:   true,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	if err := s.users.Create(ctx, newUser); err != nil {
		return fmt.Errorf("create user: %w", err)
	}

	return nil
}

func (s *Service) SeedAdmin(ctx context.Context, email, password, name string) (string, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" || password == "" {
		return "skipped", nil
	}

	existing, err := s.users.GetByEmail(ctx, email)
	if err != nil {
		return "", fmt.Errorf("check admin email: %w", err)
	}

	now := time.Now().UTC()
	if existing != nil {
		if existing.Role == "ADMIN" {
			return "exists", nil
		}
		// Promote an existing account to admin.
		existing.Role = "ADMIN"
		existing.UpdatedAt = now
		if err := s.users.Update(ctx, existing); err != nil {
			return "", fmt.Errorf("promote admin: %w", err)
		}
		return "promoted", nil
	}

	hashedPassword, err := bcrypt.HashPassword(password)
	if err != nil {
		return "", fmt.Errorf("hash admin password: %w", err)
	}
	admin := &userdomain.User{
		ID:           uuid.NewString(),
		Email:        email,
		PasswordHash: hashedPassword,
		Role:         "ADMIN",
		DisplayName:  name,
		IsVerified:   true,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	if err := s.users.Create(ctx, admin); err != nil {
		return "", fmt.Errorf("create admin: %w", err)
	}
	return "created", nil
}

func (s *Service) Login(ctx context.Context, req *LoginRequest) (*AuthResponse, error) {
	u, err := s.users.GetByEmail(ctx, strings.ToLower(req.Email))
	if err != nil {
		return nil, fmt.Errorf("get user by email: %w", err)
	}
	if u == nil || !bcrypt.CheckPassword(req.Password, u.PasswordHash) {
		return nil, ErrInvalidCredentials
	}

	accessToken, err := s.jwtManager.GenerateAccessToken(u.ID, u.Email, u.Role)
	if err != nil {
		return nil, fmt.Errorf("generate token: %w", err)
	}

	return &AuthResponse{
		User: UserResponse{
			ID:          u.ID,
			Email:       u.Email,
			Role:        u.Role,
			DisplayName: u.DisplayName,
			AvatarURL:   u.AvatarURL,
			Bio:         u.Bio,
			Title:       u.Title,
			IsVerified:  u.IsVerified,
		},
		AccessToken: accessToken,
	}, nil
}
