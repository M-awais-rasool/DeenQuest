package learning

import (
	"context"
	"fmt"
	"strings"

	"go.uber.org/zap"

	domain "github.com/chawais/talent-flow/backend/internal/domain/learning"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/logger"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/queue"
)

// Generator produces short copy from a system + user prompt. The Claude client
// satisfies it; kept as an interface so the AI layer stays optional and testable.
type Generator interface {
	Generate(ctx context.Context, system, userPrompt string) (string, error)
}

// AIService is the optional Claude reactor (consumer group "learning-ai"). It
// narrates a few meaningful "moments" with motivational/feedback copy and writes
// the text onto the learner's state. It is fully decoupled: failures are logged
// and skipped, and the deterministic engines never depend on it.
type AIService struct {
	repo domain.Repository
	gen  Generator
}

func NewAIService(repo domain.Repository, gen Generator) *AIService {
	return &AIService{repo: repo, gen: gen}
}

// aiSystemPrompt is stable so it is prompt-cached across calls (see claude.Client).
const aiSystemPrompt = "You are a warm, encouraging Islamic learning coach inside DeenQuest, a Qaida (Arabic reading) app for beginners. " +
	"Given a short context about a learner's moment, reply with ONE encouraging sentence (max 20 words). " +
	"Always render Arabic letters and words in Arabic script — never romanize them. Use English only for the encouragement itself. " +
	"Output plain text only: no quotes, no preamble, no emojis."

// Handle is a queue.MessageHandler. Only a few event types are narrated to keep
// cost down; everything else is ignored.
func (s *AIService) Handle(ctx context.Context, event queue.Event) error {
	ev, err := domain.DecodeBehaviorEvent(event.Payload)
	if err != nil || ev.UserID == "" {
		return nil
	}

	prompt, ok := s.promptFor(ctx, ev)
	if !ok {
		return nil // not a narratable moment
	}

	msg, err := s.gen.Generate(ctx, aiSystemPrompt, prompt)
	if err != nil {
		logger.Warn("learning ai: generation failed (skipping)", zap.Error(err))
		return nil // best-effort — never block or retry the AI path
	}
	if msg == "" {
		return nil
	}
	if err := s.repo.SetMotivation(ctx, ev.UserID, msg); err != nil {
		logger.Warn("learning ai: set motivation failed", zap.Error(err))
		return nil
	}
	logger.Info("learning ai: motivation generated", zap.String("user_id", ev.UserID), zap.String("event_type", string(ev.Type)))
	return nil
}

// promptFor builds the per-moment user prompt, or returns ok=false to skip.
func (s *AIService) promptFor(ctx context.Context, ev *domain.BehaviorEvent) (string, bool) {
	switch ev.Type {
	case domain.EventLevelCompleted:
		weak := s.weakAreas(ctx, ev.UserID)
		if weak != "" {
			return fmt.Sprintf("The learner just completed a level. Letters they could review next: %s. Celebrate the win and gently nudge them onward.", weak), true
		}
		return "The learner just completed a level. Celebrate the win and motivate them to keep going.", true

	case domain.EventRecitationScored:
		if ev.Correct {
			return "", false // only narrate recitations that need encouragement
		}
		struggled := strings.Join(ev.WrongTokens, "، ")
		if struggled == "" {
			struggled = s.weakAreas(ctx, ev.UserID)
		}
		if struggled != "" {
			return fmt.Sprintf("The learner's recitation scored %d%% and they struggled with: %s. Encourage them kindly and suggest practicing those.", ev.Score, struggled), true
		}
		return fmt.Sprintf("The learner's recitation scored %d%%. Encourage them kindly to keep practicing.", ev.Score), true

	default:
		return "", false
	}
}

func (s *AIService) weakAreas(ctx context.Context, userID string) string {
	st, err := s.repo.GetState(ctx, userID)
	if err != nil || st == nil || len(st.WeakAreas) == 0 {
		return ""
	}
	limit := st.WeakAreas
	if len(limit) > 3 {
		limit = limit[:3]
	}
	return strings.Join(limit, "، ")
}
