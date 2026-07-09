package reflection

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

var ErrUnsafe = errors.New("reflection failed moderation")

type Coach interface {
	Generate(ctx context.Context, system, userPrompt string) (string, error)
}

type Moderator interface {
	Check(ctx context.Context, text string) (bool, string)
}

type Service struct {
	repo      Repository
	coach     Coach
	moderator Moderator
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) SetCoach(c Coach) { s.coach = c }

func (s *Service) SetModerator(m Moderator) { s.moderator = m }

const systemPrompt = "You are a warm, gentle Islamic companion inside the DeenQuest app. " +
	"A learner shares a short daily reflection. Reply with ONE or TWO sentences (max 35 words) of sincere, kind encouragement. " +
	"Do NOT quote the Qur'an or Hadith, do NOT give religious rulings or advice — only warmth and support. Plain text, no quotes."

const defaultMessage = "Thank you for taking a moment to reflect. May Allah bring ease and peace to your heart."

func (s *Service) Respond(ctx context.Context, userID, text, mood string) (*Reflection, error) {
	text = strings.TrimSpace(text)

	if s.moderator != nil && text != "" {
		if ok, _ := s.moderator.Check(ctx, text); !ok {
			return nil, ErrUnsafe
		}
	}

	verse := PickVerse(text + " " + mood)

	message := defaultMessage
	if s.coach != nil && text != "" {
		gctx, cancel := context.WithTimeout(ctx, 8*time.Second)
		defer cancel()
		prompt := "The learner's reflection: \"" + text + "\". Respond with gentle encouragement."
		if out, err := s.coach.Generate(gctx, systemPrompt, prompt); err == nil && strings.TrimSpace(out) != "" {
			message = strings.TrimSpace(out)
		}
	}

	r := &Reflection{
		ID:        uuid.NewString(),
		UserID:    userID,
		Text:      text,
		Mood:      mood,
		Message:   message,
		Verse:     &verse,
		CreatedAt: time.Now().UTC(),
	}
	if err := s.repo.Save(ctx, r); err != nil {
		return nil, err
	}
	return r, nil
}

func (s *Service) List(ctx context.Context, userID string) ([]Reflection, error) {
	return s.repo.List(ctx, userID, 50)
}
