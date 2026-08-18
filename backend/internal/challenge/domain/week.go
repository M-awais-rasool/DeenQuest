package domain

import (
	"fmt"
	"time"
)

// Quests and duels run on ISO weeks: Monday 00:00 UTC through the following
// Monday 00:00 UTC (end-exclusive).

// WeekStart returns the Monday 00:00 UTC that opens t's week.
func WeekStart(t time.Time) time.Time {
	t = t.UTC()
	day := time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC)
	// time.Weekday is Sunday=0; shift so Monday is the zero offset.
	offset := (int(day.Weekday()) + 6) % 7
	return day.AddDate(0, 0, -offset)
}

// WeekWindow returns the [start, end) bounds of t's week.
func WeekWindow(t time.Time) (start, end time.Time) {
	start = WeekStart(t)
	return start, start.AddDate(0, 0, 7)
}

// WeekKey identifies t's week as "2026-W34" using ISO-8601 week numbering, so
// it stays stable across a year boundary that splits a week.
func WeekKey(t time.Time) string {
	year, week := t.UTC().ISOWeek()
	return fmt.Sprintf("%04d-W%02d", year, week)
}
