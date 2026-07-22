package application

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/chawais/deenquest/backend/internal/notification/domain"

	"github.com/chawais/deenquest/backend/internal/platform/push"
)

type Sender interface {
	Send(ctx context.Context, expoPushToken string, msg push.Message) (*push.Ticket, error)
}

type Service struct {
	tokens domain.TokenRepository
	sender Sender
}

func NewService(tokens domain.TokenRepository, sender Sender) *Service {
	return &Service{tokens: tokens, sender: sender}
}

func (s *Service) RegisterToken(ctx context.Context, user domain.UserInfo, req domain.RegisterTokenRequest) (*domain.TokenResponse, error) {
	expoPushToken := strings.TrimSpace(req.ExpoPushToken)
	if !push.IsExpoPushToken(expoPushToken) {
		return nil, domain.ErrInvalidToken
	}

	saved, err := s.tokens.Upsert(ctx, &domain.UserToken{
		User:          user,
		ExpoPushToken: expoPushToken,
		Platform:      strings.ToLower(strings.TrimSpace(req.Platform)),
		DeviceID:      strings.TrimSpace(req.DeviceID),
		AppVersion:    strings.TrimSpace(req.AppVersion),
		Timezone:      strings.TrimSpace(req.Timezone),
	})
	if err != nil {
		return nil, fmt.Errorf("save notification token: %w", err)
	}

	return tokenResponse(saved), nil
}

func (s *Service) SendToUser(ctx context.Context, user domain.UserInfo, msg domain.Message) (*push.Ticket, error) {
	if strings.TrimSpace(msg.Title) == "" && strings.TrimSpace(msg.Body) == "" {
		return nil, domain.ErrBadMessage
	}

	token, err := s.tokens.GetActiveByUserID(ctx, user.ID)
	if err != nil {
		return nil, fmt.Errorf("get notification token: %w", err)
	}
	if token == nil {
		return nil, domain.ErrNoToken
	}

	return s.sender.Send(ctx, token.ExpoPushToken, push.Message{
		Title: msg.Title,
		Body:  msg.Body,
		Data:  msg.Data,
	})
}

func (s *Service) SendFromJob(ctx context.Context, payload interface{}) (*push.Ticket, error) {
	raw, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal notification job: %w", err)
	}

	var job domain.Job
	if err := json.Unmarshal(raw, &job); err != nil {
		return nil, fmt.Errorf("decode notification job: %w", err)
	}

	return s.SendToUser(ctx, job.User, job.Message)
}

func (s *Service) SendTestNotificationToAll(
	ctx context.Context,
	title string,
	body string,
) error {

	tokens, err := s.tokens.GetAllActiveTokens(ctx)
	if err != nil {
		return fmt.Errorf("get tokens: %w", err)
	}

	for _, token := range tokens {

		if token.ExpoPushToken == "" {
			continue
		}

		_, err := s.sender.Send(ctx, token.ExpoPushToken, push.Message{
			Title: title,
			Body:  body,
			Data: map[string]interface{}{
				"type": "test",
			},
		})

		if err != nil {
			fmt.Println("failed to send push:", err)
			continue
		}
	}

	return nil
}

func tokenResponse(token *domain.UserToken) *domain.TokenResponse {
	return &domain.TokenResponse{
		User:          token.User,
		ExpoPushToken: token.ExpoPushToken,
		Platform:      token.Platform,
		UpdatedAt:     token.UpdatedAt.Format(time.RFC3339),
	}
}
