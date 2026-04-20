package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/chawais/talent-flow/backend/internal/identity-service/auth/dto"
	identitykafka "github.com/chawais/talent-flow/backend/internal/identity-service/kafka"
	"github.com/chawais/talent-flow/backend/internal/identity-service/model"
	"github.com/chawais/talent-flow/backend/internal/identity-service/repository"
	"github.com/chawais/talent-flow/backend/pkg/auth"
	"github.com/chawais/talent-flow/backend/pkg/logger"
	"github.com/chawais/talent-flow/backend/pkg/queue"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

var (
	ErrEmailExists        = errors.New("email already exists")
	ErrInvalidCredentials = errors.New("invalid email or password")
)

type AuthService struct {
	users      repository.UserRepository
	jwtManager *auth.JWTManager
	publisher  identitykafka.Publisher
}

func NewAuthService(users repository.UserRepository, jwtManager *auth.JWTManager, publisher identitykafka.Publisher) *AuthService {
	return &AuthService{users: users, jwtManager: jwtManager, publisher: publisher}
}

func (s *AuthService) Signup(ctx context.Context, req *dto.SignupRequest) error {
	existing, err := s.users.GetByEmail(ctx, strings.ToLower(req.Email))
	if err != nil {
		return fmt.Errorf("check email: %w", err)
	}
	if existing != nil {
		return ErrEmailExists
	}

	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	role := "USER"
	if req.Role == "ADMIN" {
		role = "ADMIN"
	}

	now := time.Now().UTC()
	newUser := &model.User{
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

	if s.publisher != nil {
		err = s.publisher.Publish(ctx, "user.created", queue.Event{
			Type: "user.created",
			Payload: map[string]string{
				"user_id": newUser.ID,
				"email":   newUser.Email,
				"role":    newUser.Role,
			},
		})
		if err != nil {
			logger.Warn("failed to publish user.created", zap.Error(err), zap.String("user_id", newUser.ID))
		}
	}

	return nil
}

func (s *AuthService) Login(ctx context.Context, req *dto.LoginRequest) (*dto.AuthResponse, error) {
	u, err := s.users.GetByEmail(ctx, strings.ToLower(req.Email))
	if err != nil {
		return nil, fmt.Errorf("get user by email: %w", err)
	}
	if u == nil || !auth.CheckPassword(req.Password, u.PasswordHash) {
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
