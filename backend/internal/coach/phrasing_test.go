package coach

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"
)

type fakeLLM struct {
	response string
	err      error
	delay    time.Duration
	calls    int
}

func (f *fakeLLM) Generate(ctx context.Context, _, _ string) (string, error) {
	f.calls++
	if f.delay > 0 {
		select {
		case <-time.After(f.delay):
		case <-ctx.Done():
			return "", ctx.Err()
		}
	}
	return f.response, f.err
}

func testInsight() Insight {
	return Insight{
		Rule: RuleConfusionPair, Skills: []string{"ث", "ت"},
		Count: 4, Detail: "4 mistakes this week",
	}
}

func TestPhraserDisabledReturnsTemplate(t *testing.T) {
	llm := &fakeLLM{response: `{"text":"never used"}`}
	p := NewPhraser(llm, nil, false)
	if got := p.Detail(context.Background(), "u1", testInsight()); got != "4 mistakes this week" {
		t.Errorf("disabled phraser returned %q, want the template", got)
	}
	if llm.calls != 0 {
		t.Errorf("disabled phraser must never call the LLM")
	}
}

func TestPhraserNilLLMIsSafe(t *testing.T) {
	p := NewPhraser(nil, nil, true) // flag on but no key configured
	if got := p.Detail(context.Background(), "u1", testInsight()); got != "4 mistakes this week" {
		t.Errorf("nil-LLM phraser returned %q, want the template", got)
	}
}

func TestPhraserUsesLLMAndFallsBack(t *testing.T) {
	llm := &fakeLLM{response: `{"text":"You mixed these up 4 times — the dots are the key!"}`}
	p := NewPhraser(llm, nil, true)
	got := p.Detail(context.Background(), "u1", testInsight())
	if !strings.Contains(got, "dots are the key") {
		t.Errorf("enabled phraser returned %q, want the LLM text", got)
	}

	// Any LLM error → template, never an error to the caller.
	p = NewPhraser(&fakeLLM{err: errors.New("boom")}, nil, true)
	if got := p.Detail(context.Background(), "u1", testInsight()); got != "4 mistakes this week" {
		t.Errorf("failing LLM should fall back to template, got %q", got)
	}

	// Over-budget latency → template (800ms cap).
	p = NewPhraser(&fakeLLM{response: `{"text":"late"}`, delay: 2 * time.Second}, nil, true)
	start := time.Now()
	got = p.Detail(context.Background(), "u1", testInsight())
	if got != "4 mistakes this week" {
		t.Errorf("slow LLM should fall back to template, got %q", got)
	}
	if elapsed := time.Since(start); elapsed > 1500*time.Millisecond {
		t.Errorf("phrasing took %v, must respect the 800ms budget", elapsed)
	}
}

func TestParsePhrase(t *testing.T) {
	cases := []struct {
		in, want string
	}{
		{`{"text":"hello"}`, "hello"},
		{"```json\n{\"text\":\"fenced\"}\n```", "fenced"},
		{`{"text":""}`, ""},
		{`not json`, ""},
		{`{"text":"` + strings.Repeat("x", 200) + `"}`, ""}, // over 160 chars
	}
	for _, c := range cases {
		if got := parsePhrase(c.in); got != c.want {
			t.Errorf("parsePhrase(%.30q) = %q, want %q", c.in, got, c.want)
		}
	}
}

func TestHomeMessageShapes(t *testing.T) {
	msg := HomeMessage(testInsight())
	if msg.ArabicA != "ث" || msg.ArabicB != "ت" {
		t.Errorf("confusion message arabic parts = %q/%q", msg.ArabicA, msg.ArabicB)
	}
	if !strings.Contains(msg.Highlight, "4") {
		t.Errorf("highlight should carry the count, got %q", msg.Highlight)
	}
	if !strings.Contains(msg.Tail, "dots") {
		t.Errorf("ت/ث are a same-skeleton pair — tail should mention dots, got %q", msg.Tail)
	}

	decay := Insight{Rule: RuleDecay, Skills: []string{"د"}, Count: 12}
	msg = HomeMessage(decay)
	if msg.ArabicA != "د" || !strings.Contains(msg.Highlight, "12 days") {
		t.Errorf("decay message = %+v", msg)
	}
}
