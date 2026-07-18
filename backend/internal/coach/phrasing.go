package coach

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"go.uber.org/zap"

	"github.com/chawais/deenquest/backend/internal/platform/logger"
)

type Generator interface {
	Generate(ctx context.Context, system, userPrompt string) (string, error)
}

type PhraseCache interface {
	Get(ctx context.Context, key string) (string, error)
	Set(ctx context.Context, key string, value interface{}, expiry time.Duration) error
	Incr(ctx context.Context, key string, expiry time.Duration) (int64, error)
}

const (
	llmBudget          = 800 * time.Millisecond 
	llmMaxChars        = 160
	llmCacheTTL        = 30 * 24 * time.Hour
	llmDailyCallLimit  = 3 
	phrasingToneSystem = "You are a warm, encouraging learning coach for children and adults learning to read Quranic Arabic. " +
		"Rewrite the given progress note in a friendly, motivating tone. Keep every Arabic letter exactly as-is. " +
		"Never add religious rulings or invent facts. Respond ONLY with JSON: {\"text\":\"...\"} — max 160 characters."
)

type Phraser struct {
	llm     Generator
	cache   PhraseCache
	enabled bool
}

func NewPhraser(llm Generator, cache PhraseCache, enabled bool) *Phraser {
	return &Phraser{llm: llm, cache: cache, enabled: enabled && llm != nil}
}

func (p *Phraser) Detail(ctx context.Context, userID string, ins Insight) string {
	if p == nil || !p.enabled {
		return ins.Detail
	}
	key := fmt.Sprintf("coach:phrase:%s:%s:%d:en", ins.Rule, strings.Join(ins.Skills, ""), countBucket(ins.Count))

	if p.cache != nil {
		if cached, err := p.cache.Get(ctx, key); err == nil && cached != "" {
			return cached
		}
		day := time.Now().UTC().Format("2006-01-02")
		n, err := p.cache.Incr(ctx, "coach:llmcalls:"+userID+":"+day, 24*time.Hour)
		if err == nil && n > llmDailyCallLimit {
			return ins.Detail
		}
	}

	llmCtx, cancel := context.WithTimeout(ctx, llmBudget)
	defer cancel()
	raw, err := p.llm.Generate(llmCtx, phrasingToneSystem, ins.Detail)
	if err != nil {
		logger.Debug("coach: llm phrasing fell back to template", zap.Error(err))
		return ins.Detail
	}
	text := parsePhrase(raw)
	if text == "" {
		return ins.Detail
	}
	if p.cache != nil {
		_ = p.cache.Set(ctx, key, text, llmCacheTTL)
	}
	return text
}

func parsePhrase(raw string) string {
	raw = strings.TrimSpace(raw)
	raw = strings.TrimPrefix(raw, "```json")
	raw = strings.TrimPrefix(raw, "```")
	raw = strings.TrimSuffix(raw, "```")
	var out struct {
		Text string `json:"text"`
	}
	if err := json.Unmarshal([]byte(strings.TrimSpace(raw)), &out); err != nil {
		return ""
	}
	text := strings.TrimSpace(out.Text)
	if text == "" || len([]rune(text)) > llmMaxChars {
		return ""
	}
	return text
}

func countBucket(n int) int {
	switch {
	case n <= 5:
		return 5
	case n <= 10:
		return 10
	default:
		return 11
	}
}

func HomeMessage(ins Insight) MessageParts {
	switch ins.Rule {
	case RuleConfusionPair:
		if len(ins.Skills) == 2 {
			return MessageParts{
				Before:    "I noticed you mix up ",
				ArabicA:   ins.Skills[0],
				Middle:    " and ",
				ArabicB:   ins.Skills[1],
				After:     " — it happened ",
				Highlight: fmt.Sprintf("%d times", ins.Count),
				Tail:      " this week. " + pairHint(ins.Skills[0], ins.Skills[1]),
			}
		}
	case RuleSlowSkill:
		if len(ins.Skills) == 1 {
			return MessageParts{
				Before:    "You're slowing down on ",
				ArabicA:   ins.Skills[0],
				After:     " — about ",
				Highlight: "2× your pace",
				Tail:      ". A quick drill makes it automatic!",
			}
		}
	case RuleDecay:
		if len(ins.Skills) == 1 {
			return MessageParts{
				Before:    "It's been a while since you practiced ",
				ArabicA:   ins.Skills[0],
				After:     " — ",
				Highlight: fmt.Sprintf("%d days", ins.Count),
				Tail:      ". A 2-minute review keeps it fresh!",
			}
		}
	}
	return MessageParts{Before: ins.Title + " — ", Highlight: ins.Detail, Tail: ""}
}

func pairHint(a, b string) string {
	sameSkeleton := map[[2]string]bool{
		{"ت", "ث"}: true, {"ب", "ت"}: true, {"ب", "ث"}: true, {"ب", "ن"}: true,
		{"ت", "ن"}: true, {"ث", "ن"}: true, {"ج", "ح"}: true, {"ج", "خ"}: true,
		{"ح", "خ"}: true, {"د", "ذ"}: true, {"ر", "ز"}: true, {"س", "ش"}: true,
		{"ص", "ض"}: true, {"ط", "ظ"}: true, {"ع", "غ"}: true, {"ف", "ق"}: true,
	}
	if sameSkeleton[[2]string{a, b}] || sameSkeleton[[2]string{b, a}] {
		return "The dots are the key!"
	}
	return "Look closely at the shapes!"
}
