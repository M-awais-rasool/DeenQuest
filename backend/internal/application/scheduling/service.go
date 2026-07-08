package scheduling

import (
	"time"

	"github.com/chawais/talent-flow/backend/internal/infrastructure/prayer"
)

type Plan struct {
	Date          string       `json:"date"`
	PrayerTimes   prayer.Times `json:"prayer_times"`
	SuggestedSlot string       `json:"suggested_slot"` 
	SuggestedTime string       `json:"suggested_time"` 
	Tip           string       `json:"tip"`
}

type Service struct{}

func NewService() *Service { return &Service{} }

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
