// Package reflection is the application layer of the Reflection Companion: it
// pairs a learner's reflection with warm encouragement (deterministic, or an
// optional AI rewrite) and a curated verse, then persists it as a journal entry.
package reflection

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"

	domain "github.com/chawais/talent-flow/backend/internal/domain/reflection"
)

// ErrUnsafe is returned when a reflection fails moderation; the handler maps it
// to a friendly 400 and nothing is stored.
var ErrUnsafe = errors.New("reflection failed moderation")

// Coach generates gentle encouragement text. The Gemini client satisfies it.
// Optional — when nil, the companion uses a deterministic message.
type Coach interface {
	Generate(ctx context.Context, system, userPrompt string) (string, error)
}

// Moderator screens the learner's text. The moderation Service satisfies it.
// Optional — when nil, reflections are stored without screening.
type Moderator interface {
	Check(ctx context.Context, text string) (bool, string)
}

type Service struct {
	repo      domain.Repository
	coach     Coach
	moderator Moderator
}

func NewService(repo domain.Repository) *Service {
	return &Service{repo: repo}
}

// SetCoach wires the optional AI companion (Gemini).
func (s *Service) SetCoach(c Coach) { s.coach = c }

// SetModerator wires the optional Safety/Moderation Agent.
func (s *Service) SetModerator(m Moderator) { s.moderator = m }

// systemPrompt strictly bounds the AI: warmth only — no scripture, no rulings.
// The verse is attached separately from the curated list.
const systemPrompt = "You are a warm, gentle Islamic companion inside the DeenQuest app. " +
	"A learner shares a short daily reflection. Reply with ONE or TWO sentences (max 35 words) of sincere, kind encouragement. " +
	"Do NOT quote the Qur'an or Hadith, do NOT give religious rulings or advice — only warmth and support. Plain text, no quotes."

const defaultMessage = "Thank you for taking a moment to reflect. May Allah bring ease and peace to your heart."

// Respond builds the companion's reply (deterministic + optional AI), attaches a
// curated verse, persists the entry, and returns it.
func (s *Service) Respond(ctx context.Context, userID, text, mood string) (*domain.Reflection, error) {
	text = strings.TrimSpace(text)

	// Safety gate before anything is generated or stored.
	if s.moderator != nil && text != "" {
		if ok, _ := s.moderator.Check(ctx, text); !ok {
			return nil, ErrUnsafe
		}
	}

	verse := domain.PickVerse(text + " " + mood)

	message := defaultMessage
	if s.coach != nil && text != "" {
		gctx, cancel := context.WithTimeout(ctx, 8*time.Second)
		defer cancel()
		prompt := "The learner's reflection: \"" + text + "\". Respond with gentle encouragement."
		if out, err := s.coach.Generate(gctx, systemPrompt, prompt); err == nil && strings.TrimSpace(out) != "" {
			message = strings.TrimSpace(out)
		}
	}

	r := &domain.Reflection{
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

// List returns the learner's recent reflections (journal).
func (s *Service) List(ctx context.Context, userID string) ([]domain.Reflection, error) {
	return s.repo.List(ctx, userID, 50)
}
