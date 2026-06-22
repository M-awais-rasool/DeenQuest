// Package scheduling is the Scheduling / Prayer-aware Agent: it computes the
// day's prayer times and suggests a study slot anchored to salah, so learning
// fits the Islamic daily rhythm. Pure + deterministic (no external API).
package scheduling

import (
	"time"

	"github.com/chawais/talent-flow/backend/internal/infrastructure/prayer"
)

// Plan is the agent's output: today's prayer times plus a suggested study slot.
type Plan struct {
	Date          string       `json:"date"`
	PrayerTimes   prayer.Times `json:"prayer_times"`
	SuggestedSlot string       `json:"suggested_slot"` // e.g. "After Fajr"
	SuggestedTime string       `json:"suggested_time"` // "HH:MM" to anchor a reminder
	Tip           string       `json:"tip"`
}

type Service struct{}

func NewService() *Service { return &Service{} }

// Plan computes prayer times for (lat, lng, tz) on the given local time and
// recommends the best calm slot to study. After-Fajr is preferred for focus;
// after-Isha is offered later in the day.
func (s *Service) Plan(lat, lng, tz float64, now time.Time) Plan {
	y, m, d := now.Date()
	times := prayer.Compute(y, int(m), d, lat, lng, tz, prayer.Default())

	slot, at := "After Fajr", times.Fajr
	tip := "The calm after Fajr is a beautiful time to review your letters."
	// If Fajr has already long passed today, suggest after Isha instead.
	if hourOf(now) >= hourMinTo(times.Dhuhr) {
		slot, at = "After Isha", times.Isha
		tip = "Wind down after Isha with a short, peaceful review."
	}

	return Plan{
		Date:          now.Format("2006-01-02"),
		PrayerTimes:   times,
		SuggestedSlot: slot,
		SuggestedTime: at,
		Tip:           tip,
	}
}

func hourOf(t time.Time) float64 { return float64(t.Hour()) + float64(t.Minute())/60 }

func hourMinTo(hhmm string) float64 {
	if len(hhmm) != 5 {
		return 12
	}
	h := float64((int(hhmm[0]-'0'))*10 + int(hhmm[1]-'0'))
	mm := float64((int(hhmm[3]-'0'))*10 + int(hhmm[4]-'0'))
	return h + mm/60
}
