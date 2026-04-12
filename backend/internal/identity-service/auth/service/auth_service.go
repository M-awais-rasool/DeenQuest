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
	"github.com/chawais/talent-flow/backend/pkg/cache"
	"github.com/chawais/talent-flow/backend/pkg/logger"
	"github.com/chawais/talent-flow/backend/pkg/queue"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

var (
	ErrEmailExists         = errors.New("email already exists")
	ErrInvalidCredentials  = errors.New("invalid email or password")
	ErrInvalidRefreshToken = errors.New("invalid or expired refresh token")
)

type AuthService struct {
	users      repository.UserRepository
	jwtManager *auth.JWTManager
	redis      *cache.RedisClient
	publisher  identitykafka.Publisher
}

func NewAuthService(users repository.UserRepository, jwtManager *auth.JWTManager, redis *cache.RedisClient, publisher identitykafka.Publisher) *AuthService {
	return &AuthService{users: users, jwtManager: jwtManager, redis: redis, publisher: publisher}
}

func (s *AuthService) Signup(ctx context.Context, req *dto.SignupRequest) (*dto.AuthResponse, error) {
	existing, err := s.users.GetByEmail(ctx, strings.ToLower(req.Email))
	if err != nil {
		return nil, fmt.Errorf("check email: %w", err)
	}
	if existing != nil {
		return nil, ErrEmailExists
	}

	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
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
		return nil, fmt.Errorf("create user: %w", err)
	}

	tokenPair, err := s.jwtManager.GenerateTokenPair(newUser.ID, newUser.Email, newUser.Role)
	if err != nil {
		return nil, fmt.Errorf("generate tokens: %w", err)
	}

	if err := s.redis.StoreRefreshToken(ctx, newUser.ID, tokenPair.RefreshToken, s.jwtManager.GetRefreshExpiry()); err != nil {
		logger.Warn("failed to store refresh token", zap.Error(err), zap.String("user_id", newUser.ID))
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

	return &dto.AuthResponse{
		User: dto.UserResponse{
			ID:         newUser.ID,
			Email:      newUser.Email,
			Role:       newUser.Role,
			IsVerified: newUser.IsVerified,
		},
		AccessToken:  tokenPair.AccessToken,
		RefreshToken: tokenPair.RefreshToken,
	}, nil
}

func (s *AuthService) Login(ctx context.Context, req *dto.LoginRequest) (*dto.AuthResponse, error) {
	u, err := s.users.GetByEmail(ctx, strings.ToLower(req.Email))
	if err != nil {
		return nil, fmt.Errorf("get user by email: %w", err)
	}
	if u == nil || !auth.CheckPassword(req.Password, u.PasswordHash) {
		return nil, ErrInvalidCredentials
	}

	tokenPair, err := s.jwtManager.GenerateTokenPair(u.ID, u.Email, u.Role)
	if err != nil {
		return nil, fmt.Errorf("generate tokens: %w", err)
	}

	if err := s.redis.StoreRefreshToken(ctx, u.ID, tokenPair.RefreshToken, s.jwtManager.GetRefreshExpiry()); err != nil {
		logger.Warn("failed to store refresh token", zap.Error(err), zap.String("user_id", u.ID))
	}

	return &dto.AuthResponse{
		User: dto.UserResponse{
			ID:         u.ID,
			Email:      u.Email,
			Role:       u.Role,
			IsVerified: u.IsVerified,
		},
		AccessToken:  tokenPair.AccessToken,
		RefreshToken: tokenPair.RefreshToken,
	}, nil
}

func (s *AuthService) RefreshToken(ctx context.Context, req *dto.RefreshRequest) (*dto.TokenResponse, error) {
	claims, err := s.jwtManager.ValidateToken(req.RefreshToken)
	if err != nil {
		return nil, ErrInvalidRefreshToken
	}

	storedToken, err := s.redis.GetRefreshToken(ctx, claims.UserID)
	if err != nil || storedToken != req.RefreshToken {
		return nil, ErrInvalidRefreshToken
	}

	u, err := s.users.GetByID(ctx, claims.UserID)
	if err != nil || u == nil {
		return nil, ErrInvalidRefreshToken
	}

	accessToken, err := s.jwtManager.GenerateAccessToken(u.ID, u.Email, u.Role)
	if err != nil {
		return nil, fmt.Errorf("generate access token: %w", err)
	}

	refreshToken, err := s.jwtManager.GenerateRefreshToken(u.ID)
	if err != nil {
		return nil, fmt.Errorf("generate refresh token: %w", err)
	}

	if err := s.redis.StoreRefreshToken(ctx, u.ID, refreshToken, s.jwtManager.GetRefreshExpiry()); err != nil {
		logger.Warn("failed to rotate refresh token", zap.Error(err), zap.String("user_id", u.ID))
	}

	return &dto.TokenResponse{AccessToken: accessToken, RefreshToken: refreshToken}, nil
}

func (s *AuthService) Logout(ctx context.Context, userID string) error {
	if err := s.redis.DeleteRefreshToken(ctx, userID); err != nil {
		return fmt.Errorf("delete refresh token: %w", err)
	}
	return nil
}
