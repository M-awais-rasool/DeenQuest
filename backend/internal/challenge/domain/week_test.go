package domain

import (
	"testing"
	"time"
)

func TestWeekStartAlwaysLandsOnMondayMidnight(t *testing.T) {
	// A full week of days plus an odd time-of-day must all fold to one Monday.
	base := time.Date(2026, 8, 17, 0, 0, 0, 0, time.UTC) // a Monday
	for i := 0; i < 7; i++ {
		day := base.AddDate(0, 0, i).Add(13*time.Hour + 47*time.Minute)
		got := WeekStart(day)
		if !got.Equal(base) {
			t.Errorf("WeekStart(%s) = %s, want %s", day.Format(time.RFC3339), got, base)
		}
		if got.Weekday() != time.Monday {
			t.Errorf("WeekStart(%s) is a %s, want Monday", day.Format(time.RFC3339), got.Weekday())
		}
	}
	// Sunday belongs to the week that opened six days earlier, not the next one.
	sunday := base.AddDate(0, 0, 6).Add(23 * time.Hour)
	if got := WeekStart(sunday); !got.Equal(base) {
		t.Errorf("Sunday folded to %s, want %s", got, base)
	}
}

func TestWeekWindowIsSevenDaysEndExclusive(t *testing.T) {
	start, end := WeekWindow(time.Date(2026, 8, 19, 9, 0, 0, 0, time.UTC))
	if d := end.Sub(start); d != 7*24*time.Hour {
		t.Fatalf("window is %v, want 168h", d)
	}
	// The boundary instant belongs to the *next* window.
	nextStart, _ := WeekWindow(end)
	if !nextStart.Equal(end) {
		t.Errorf("end %s did not open the next window (got %s)", end, nextStart)
	}
}

func TestWeekKeyUsesISOWeeksAcrossYearBoundary(t *testing.T) {
	// 2026-12-28 (Mon) through 2027-01-03 (Sun) is a single ISO week that ISO
	// numbers as 2026-W53 — a naive year+week would split it.
	monday := time.Date(2026, 12, 28, 0, 0, 0, 0, time.UTC)
	sunday := time.Date(2027, 1, 3, 23, 0, 0, 0, time.UTC)
	if a, b := WeekKey(monday), WeekKey(sunday); a != b {
		t.Errorf("week split across the year boundary: %s vs %s", a, b)
	}
	if got := WeekKey(monday); got != "2026-W53" {
		t.Errorf("WeekKey = %q, want %q", got, "2026-W53")
	}
}
