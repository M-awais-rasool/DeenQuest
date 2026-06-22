// Package knowledge is the Q&A / Knowledge Agent. It answers basic questions by
// RETRIEVING from a curated, vetted FAQ (never inventing). An optional AI pass
// only rephrases the retrieved answer more simply — it may not add facts. It
// refuses fatwa-style questions and defers to scholars.
package knowledge

import (
	"context"
	"strings"
	"time"

	domain "github.com/chawais/talent-flow/backend/internal/domain/knowledge"
)

// Answer is the agent's reply.
type Answer struct {
	Text     string `json:"text"`
	Source   string `json:"source,omitempty"`
	Matched  bool   `json:"matched"`  // found a confident FAQ match
	Referral bool   `json:"referral"` // deferred to a scholar
}

// Generator is the optional AI rephraser (Gemini satisfies it).
type Generator interface {
	Generate(ctx context.Context, system, userPrompt string) (string, error)
}

type Service struct {
	entries []domain.Entry
	gen     Generator
}

func NewService() *Service { return &Service{entries: domain.Entries()} }

// SetGenerator wires the optional AI rephrase pass.
func (s *Service) SetGenerator(g Generator) { s.gen = g }

const minScore = 2

// fatwaTriggers route ruling-style questions to a scholar instead of answering.
var fatwaTriggers = []string{
	"halal", "haram", "permissible", "permitted", "is it ok to", "is it okay to",
	"allowed to", "is it a sin", "sinful", "ruling", "fatwa", "must i", "do i have to",
}

const rephraseSystem = "You rephrase a given answer for a young beginner in ONE or TWO simple, warm sentences. " +
	"Do NOT add any new facts, opinions, Qur'an, Hadith, or rulings — only restate the provided answer more simply. Plain text, no quotes."

// Ask retrieves the best vetted answer for a question.
func (s *Service) Ask(ctx context.Context, query string) Answer {
	q := strings.ToLower(strings.TrimSpace(query))
	if q == "" {
		return Answer{Text: "Please type a question.", Matched: false}
	}
	for _, f := range fatwaTriggers {
		if strings.Contains(q, f) {
			return Answer{
				Text:     "For religious rulings (like what is halal or haram), please ask a qualified scholar — I'm not able to give rulings.",
				Referral: true,
			}
		}
	}

	best, score := s.bestMatch(q)
	if best == nil || score < minScore {
		return Answer{
			Text:    "I'm not sure about that one. For detailed questions, please ask a knowledgeable teacher or scholar.",
			Matched: false,
		}
	}

	text := best.Answer
	if s.gen != nil {
		gctx, cancel := context.WithTimeout(ctx, 8*time.Second)
		defer cancel()
		if out, err := s.gen.Generate(gctx, rephraseSystem, "Answer to rephrase: "+best.Answer); err == nil && strings.TrimSpace(out) != "" {
			text = strings.TrimSpace(out)
		}
	}
	return Answer{Text: text, Source: best.Source, Matched: true}
}

// bestMatch scores entries by keyword-phrase hits (strong) + token overlap.
func (s *Service) bestMatch(q string) (*domain.Entry, int) {
	tokens := strings.Fields(q)
	var best *domain.Entry
	bestScore := 0
	for i := range s.entries {
		e := &s.entries[i]
		score := 0
		for _, kw := range e.Keywords {
			if strings.Contains(q, kw) {
				score += 3
			}
		}
		ql := strings.ToLower(e.Question)
		for _, t := range tokens {
			if len(t) >= 3 && strings.Contains(ql, t) {
				score++
			}
		}
		if score > bestScore {
			bestScore = score
			best = e
		}
	}
	return best, bestScore
}
