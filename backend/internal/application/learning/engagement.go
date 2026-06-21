package learning

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"go.uber.org/zap"

	domain "github.com/chawais/talent-flow/backend/internal/domain/learning"
	notifdomain "github.com/chawais/talent-flow/backend/internal/domain/notification"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/logger"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/push"
)

// ReengageSender is the slice of the notification service the Engagement Agent
// needs. *notification.Service satisfies it.
type ReengageSender interface {
	SendToUser(ctx context.Context, user notifdomain.UserInfo, msg notifdomain.Message) (*push.Ticket, error)
}

// EngagementNotifier is the Engagement Agent. It implements the pattern sweep's
// Notifier: when a learner slips into the inactive segment, it sends a
// personalized win-back push. Copy is deterministic + weak-area aware; an
// optional Generator (Gemini) may rewrite it. Best-effort — never blocks the
// sweep, and missing push tokens are treated as a normal skip.
type EngagementNotifier struct {
	repo   domain.Repository
	sender ReengageSender
	gen    Generator // optional
}

func NewEngagementNotifier(repo domain.Repository, sender ReengageSender, gen Generator) *EngagementNotifier {
	return &EngagementNotifier{repo: repo, sender: sender, gen: gen}
}

// NotifyReengage satisfies learning.Notifier (see scheduler.go).
func (n *EngagementNotifier) NotifyReengage(ctx context.Context, userID string) {
	if n == nil || n.sender == nil {
		return
	}
	state, _ := n.repo.GetState(ctx, userID)
	title, body := n.message(ctx, state)

	_, err := n.sender.SendToUser(ctx, notifdomain.UserInfo{ID: userID}, notifdomain.Message{
		Title: title,
		Body:  body,
		Data:  map[string]interface{}{"type": "reengage"},
	})
	if err != nil {
		if errors.Is(err, notifdomain.ErrNoToken) {
			return // no push token registered — expected, skip quietly
		}
		logger.Warn("engagement: re-engage push failed", zap.String("user_id", userID), zap.Error(err))
		return
	}
	logger.Info("engagement: re-engage push sent", zap.String("user_id", userID))
}

const engageSystemPrompt = "You are a warm Islamic learning coach for the DeenQuest Qaida app. " +
	"Write ONE short (max 18 words) push-notification body inviting a learner who has been away to return for a quick review. " +
	"Keep Arabic letters in Arabic script. Plain text only, no quotes."

func (n *EngagementNotifier) message(ctx context.Context, state *domain.LearnerState) (title, body string) {
	title = "We miss you"
	weak := topWeak(state, 2)

	if weak != "" {
		body = fmt.Sprintf("Your letters %s are waiting — a 2-minute review keeps your streak alive.", weak)
	} else {
		body = "Pick up where you left off — a quick review keeps your streak alive."
	}

	if n.gen != nil {
		prompt := "The learner has been inactive for a few days. "
		if weak != "" {
			prompt += "Gently mention these to review: " + weak + ". "
		}
		prompt += "Invite them back warmly."
		gctx, cancel := context.WithTimeout(ctx, 8*time.Second)
		defer cancel()
		if msg, err := n.gen.Generate(gctx, engageSystemPrompt, prompt); err == nil && strings.TrimSpace(msg) != "" {
			body = strings.TrimSpace(msg)
		}
	}
	return title, body
}

// topWeak renders up to n weak-area tags for the message (level fallbacks shown
// as "Level N", letters left in Arabic).
func topWeak(state *domain.LearnerState, n int) string {
	if state == nil || len(state.WeakAreas) == 0 {
		return ""
	}
	w := state.WeakAreas
	if len(w) > n {
		w = w[:n]
	}
	out := make([]string, 0, len(w))
	for _, t := range w {
		if strings.HasPrefix(t, "level:") {
			out = append(out, "Level "+strings.TrimPrefix(t, "level:"))
		} else {
			out = append(out, t)
		}
	}
	return strings.Join(out, "، ")
}
