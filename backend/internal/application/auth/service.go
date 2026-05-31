package auth

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/chawais/talent-flow/backend/internal/domain/identity"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/bcrypt"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/jwt"
	"github.com/chawais/talent-flow/backend/internal/interfaces/http/dto"
	"github.com/google/uuid"
)

var (
	ErrEmailExists        = errors.New("email already exists")
	ErrInvalidCredentials = errors.New("invalid email or password")
)

type AuthService struct {
	users      identity.UserRepository
	jwtManager *jwt.JWTManager
}

func NewAuthService(users identity.UserRepository, jwtManager *jwt.JWTManager) *AuthService {
	return &AuthService{users: users, jwtManager: jwtManager}
}

func (s *AuthService) Signup(ctx context.Context, req *dto.SignupRequest) error {
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
	newUser := &identity.User{
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

func (s *AuthService) Login(ctx context.Context, req *dto.LoginRequest) (*dto.AuthResponse, error) {
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

	return &dto.AuthResponse{
		User: dto.UserResponse{
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
