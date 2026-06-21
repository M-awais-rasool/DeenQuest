package progress

import (
	"testing"
	"time"

	"github.com/chawais/talent-flow/backend/internal/domain/progress"
)

func day(y int, m time.Month, d int) time.Time {
	return time.Date(y, m, d, 12, 0, 0, 0, time.UTC)
}

func TestAdvanceStreak_FirstCompletion(t *testing.T) {
	got := advanceStreak(progress.Streak{}, day(2026, 6, 20))
	if got.CurrentStreak != 1 || got.LongestStreak != 1 {
		t.Fatalf("expected 1/1, got %d/%d", got.CurrentStreak, got.LongestStreak)
	}
}

func TestAdvanceStreak_ConsecutiveDay(t *testing.T) {
	prev := progress.Streak{CurrentStreak: 3, LongestStreak: 3, LastCompletedAt: day(2026, 6, 19)}
	got := advanceStreak(prev, day(2026, 6, 20))
	if got.CurrentStreak != 4 {
		t.Fatalf("expected 4, got %d", got.CurrentStreak)
	}
}

func TestAdvanceStreak_SameDayNoChange(t *testing.T) {
	prev := progress.Streak{CurrentStreak: 4, LastCompletedAt: day(2026, 6, 20)}
	got := advanceStreak(prev, day(2026, 6, 20).Add(3*time.Hour))
	if got.CurrentStreak != 4 {
		t.Fatalf("expected unchanged 4, got %d", got.CurrentStreak)
	}
}

func TestAdvanceStreak_GapResetsWithoutFreeze(t *testing.T) {
	// Missed a day, no freezes — identical to the original behavior (reset to 1).
	prev := progress.Streak{CurrentStreak: 5, LongestStreak: 5, Freezes: 0, LastCompletedAt: day(2026, 6, 18)}
	got := advanceStreak(prev, day(2026, 6, 20))
	if got.CurrentStreak != 1 {
		t.Fatalf("expected reset to 1, got %d", got.CurrentStreak)
	}
	if got.LongestStreak != 5 {
		t.Fatalf("longest should stay 5, got %d", got.LongestStreak)
	}
}

func TestAdvanceStreak_FreezeProtectsGap(t *testing.T) {
	// Missed a day but holds a freeze — streak continues, freeze consumed.
	prev := progress.Streak{CurrentStreak: 5, LongestStreak: 5, Freezes: 1, LastCompletedAt: day(2026, 6, 18)}
	got := advanceStreak(prev, day(2026, 6, 20))
	if got.CurrentStreak != 6 {
		t.Fatalf("expected continued 6, got %d", got.CurrentStreak)
	}
	if got.Freezes != 0 {
		t.Fatalf("expected freeze consumed (0), got %d", got.Freezes)
	}
}

func TestAdvanceStreak_EarnsFreezeAtMilestone(t *testing.T) {
	// Hitting day 7 earns a freeze.
	prev := progress.Streak{CurrentStreak: 6, LongestStreak: 6, Freezes: 0, LastCompletedAt: day(2026, 6, 19)}
	got := advanceStreak(prev, day(2026, 6, 20))
	if got.CurrentStreak != 7 {
		t.Fatalf("expected 7, got %d", got.CurrentStreak)
	}
	if got.Freezes != 1 {
		t.Fatalf("expected 1 freeze earned, got %d", got.Freezes)
	}
}

func TestAdvanceStreak_FreezeCap(t *testing.T) {
	// Already at the cap — milestone doesn't over-grant.
	prev := progress.Streak{CurrentStreak: 13, LongestStreak: 13, Freezes: maxStreakFreezes, LastCompletedAt: day(2026, 6, 19)}
	got := advanceStreak(prev, day(2026, 6, 20)) // -> 14, a milestone
	if got.Freezes != maxStreakFreezes {
		t.Fatalf("expected freezes capped at %d, got %d", maxStreakFreezes, got.Freezes)
	}
}
