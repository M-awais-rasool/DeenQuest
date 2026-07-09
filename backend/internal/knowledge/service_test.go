package knowledge

import (
	"context"
	"strings"
	"testing"
)

func TestAsk_RefusesFatwaQuestions(t *testing.T) {
	s := NewService()
	a := s.Ask(context.Background(), "Is music halal?")
	if !a.Referral {
		t.Fatalf("expected a scholar referral for a ruling question, got %+v", a)
	}
	if a.Matched {
		t.Fatalf("ruling questions must not be 'matched'")
	}
}

func TestAsk_MatchesCuratedFAQ(t *testing.T) {
	s := NewService()
	a := s.Ask(context.Background(), "what does bismillah mean?")
	if !a.Matched {
		t.Fatalf("expected a match for a known FAQ, got %+v", a)
	}
	if !strings.Contains(a.Text, "name of Allah") {
		t.Fatalf("expected the curated answer, got %q", a.Text)
	}
}

func TestAsk_UnknownDefersGracefully(t *testing.T) {
	s := NewService()
	a := s.Ask(context.Background(), "xyzzy qwerty zzz")
	if a.Matched || a.Referral {
		t.Fatalf("expected a graceful no-match, got %+v", a)
	}
}
