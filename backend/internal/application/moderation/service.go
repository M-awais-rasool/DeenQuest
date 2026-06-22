// Package moderation is the Safety/Moderation Agent: it screens user-generated
// text before it is stored or shown. Deterministic checks run first (fast, free,
// predictable); an optional AI classifier catches nuanced cases. Reusable by any
// feature that accepts user text (today: reflections; later: community).
package moderation

import (
	"context"
	"regexp"
	"strings"
)

const maxLen = 2000

var urlRe = regexp.MustCompile(`(?i)\b(https?://|www\.)\S+`)

// bannedWords is a minimal, generic profanity/abuse list. Kept short on purpose;
// the optional AI classifier handles the long tail.
var bannedWords = []string{
	"fuck", "shit", "bitch", "asshole", "bastard", "cunt", "dick", "slut",
	"nigger", "faggot", "retard",
}

// Classifier is the optional AI moderation backend (Gemini satisfies it).
type Classifier interface {
	Generate(ctx context.Context, system, userPrompt string) (string, error)
}

type Service struct {
	ai Classifier
}

func NewService() *Service { return &Service{} }

// SetClassifier wires the optional AI moderation pass.
func (s *Service) SetClassifier(c Classifier) { s.ai = c }

const modSystem = "You are a strict content-safety classifier for a children's Islamic learning app. " +
	"Reply with exactly one word: SAFE or UNSAFE. Mark UNSAFE if the text contains profanity, hate, sexual content, " +
	"violence, self-harm, personal contact details, spam, or anything inappropriate for children."

// Check returns whether the text is allowed, and a short reason when it is not.
// Deterministic first; AI only as a second opinion for text that passed the
// cheap checks (so the AI call is skipped for obviously-bad input).
func (s *Service) Check(ctx context.Context, text string) (bool, string) {
	t := strings.TrimSpace(text)
	if t == "" {
		return false, "empty"
	}
	if len([]rune(t)) > maxLen {
		return false, "too long"
	}
	if urlRe.MatchString(t) {
		return false, "links are not allowed"
	}
	low := strings.ToLower(t)
	for _, w := range bannedWords {
		if strings.Contains(low, w) {
			return false, "inappropriate language"
		}
	}

	if s.ai != nil {
		if out, err := s.ai.Generate(ctx, modSystem, t); err == nil {
			if strings.Contains(strings.ToUpper(out), "UNSAFE") {
				return false, "flagged by safety check"
			}
		}
		// AI error → fall back to the deterministic verdict (allow).
	}
	return true, ""
}
