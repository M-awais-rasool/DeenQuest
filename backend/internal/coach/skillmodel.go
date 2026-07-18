package coach

import (
	"math"
	"sort"
	"strings"
	"time"
)

const (
	emaAlpha          = 0.15 // EMA weight of the newest answer
	masteryHalfLife   = 14.0 // days for recency decay to halve mastery
	confusionWindow   = 7    // days of rolling confusion counts
	dayStatWindow     = 14   // days of per-day accuracy kept for the week chart
	paceAlpha         = 0.10 // EMA weight for the user's overall pace baseline
	slowSkillFactor   = 1.8  // avg_latency > factor × baseline ⇒ "slow" rule
	slowSkillMinTries = 5    // don't call a skill slow on thin data
	confusionMinCount = 3    // 7-day A→B count that triggers the confusion rule
	decayMastery      = 0.6  // mastery below this + unseen ⇒ decay rule
	decayUnseenDays   = 10
	winMastery        = 0.95
	winMinAttempts    = 10
)

const dayKeyFormat = "2006-01-02"

func dayKey(t time.Time) string { return t.UTC().Format(dayKeyFormat) }

// NewUserSkillState returns an empty state for a user.
func NewUserSkillState(userID string) *UserSkillState {
	return &UserSkillState{
		UserID:     userID,
		Skills:     map[string]*SkillStat{},
		Confusions: map[string]map[string]int{},
		Days:       map[string]*DayStat{},
	}
}

// ApplyEvent folds one telemetry event into the state. Pure with respect to
// inputs (mutates state in place, touches nothing else) — unit-testable.
func ApplyEvent(state *UserSkillState, ev TelemetryEvent, now time.Time) {
	switch ev.Type {
	case EventQuestionAnswered, EventRecitationScored:
		applyAnswer(state, ev)
	case EventLessonCompleted:
		day := ensureDay(state, dayKey(ev.Time()))
		day.Lessons++
	}
	state.UpdatedAt = now
}

func applyAnswer(state *UserSkillState, ev TelemetryEvent) {
	if ev.Correct == nil {
		return
	}
	correct := *ev.Correct
	score := 0.0
	if correct {
		score = 1.0
	}
	at := ev.Time()

	for _, tag := range ev.SkillTags {
		tag = strings.TrimSpace(tag)
		if tag == "" {
			continue
		}
		s := state.Skills[tag]
		if s == nil {
			s = &SkillStat{EMAAccuracy: score} // seed EMA at first observation
			state.Skills[tag] = s
		} else {
			s.EMAAccuracy = emaAlpha*score + (1-emaAlpha)*s.EMAAccuracy
		}
		s.Attempts++
		if correct {
			s.Correct++
		}
		if at.After(s.LastSeen) {
			s.LastSeen = at
		}
		if ev.LatencyMS > 0 {
			if s.AvgLatencyMS == 0 {
				s.AvgLatencyMS = float64(ev.LatencyMS)
			} else {
				s.AvgLatencyMS = emaAlpha*float64(ev.LatencyMS) + (1-emaAlpha)*s.AvgLatencyMS
			}
		}
	}

	// Pace baseline: EMA of latency across every answered question.
	if ev.LatencyMS > 0 {
		if state.PaceBaselineMS == 0 {
			state.PaceBaselineMS = float64(ev.LatencyMS)
		} else {
			state.PaceBaselineMS = paceAlpha*float64(ev.LatencyMS) + (1-paceAlpha)*state.PaceBaselineMS
		}
	}

	day := ensureDay(state, dayKey(at))
	day.Attempts++
	if correct {
		day.Correct++
	}

	// Confusion matrix: only choice/hunt tasks where expected ≠ chosen and
	// both are Arabic tokens (plan §3.4).
	if !correct && (ev.Interaction == "choice" || ev.Interaction == "hunt") &&
		ev.Expected != "" && ev.Chosen != "" && ev.Expected != ev.Chosen &&
		ContainsArabic(ev.Expected) && ContainsArabic(ev.Chosen) {
		pair := ev.Expected + "→" + ev.Chosen
		if state.Confusions[pair] == nil {
			state.Confusions[pair] = map[string]int{}
		}
		state.Confusions[pair][dayKey(at)]++
	}
}

func ensureDay(state *UserSkillState, key string) *DayStat {
	if state.Days == nil {
		state.Days = map[string]*DayStat{}
	}
	d := state.Days[key]
	if d == nil {
		d = &DayStat{}
		state.Days[key] = d
	}
	return d
}

// Prune drops day buckets outside their windows. Called on every write so the
// document stays bounded no matter how long a user has been learning.
func Prune(state *UserSkillState, now time.Time) {
	confCutoff := dayKey(now.AddDate(0, 0, -confusionWindow))
	for pair, days := range state.Confusions {
		for d := range days {
			if d < confCutoff {
				delete(days, d)
			}
		}
		if len(days) == 0 {
			delete(state.Confusions, pair)
		}
	}
	dayCutoff := dayKey(now.AddDate(0, 0, -dayStatWindow))
	for d := range state.Days {
		if d < dayCutoff {
			delete(state.Days, d)
		}
	}
}

// Mastery = ema_accuracy × recency_decay(last_seen), half-life 14 days —
// the one-line explainable simplification of half-life regression.
func Mastery(s *SkillStat, now time.Time) float64 {
	if s == nil || s.LastSeen.IsZero() {
		return 0
	}
	days := now.Sub(s.LastSeen).Hours() / 24
	if days < 0 {
		days = 0
	}
	return s.EMAAccuracy * math.Pow(0.5, days/masteryHalfLife)
}

// ConfusionCount sums a pair's rolling-window counters.
func ConfusionCount(days map[string]int, now time.Time) int {
	cutoff := dayKey(now.AddDate(0, 0, -confusionWindow))
	total := 0
	for d, n := range days {
		if d >= cutoff {
			total += n
		}
	}
	return total
}

// TopConfusions returns pairs with their 7-day counts, highest first.
type ConfusionPair struct {
	Expected string
	Chosen   string
	Count    int
}

func TopConfusions(state *UserSkillState, now time.Time) []ConfusionPair {
	out := make([]ConfusionPair, 0, len(state.Confusions))
	for pair, days := range state.Confusions {
		parts := strings.SplitN(pair, "→", 2)
		if len(parts) != 2 {
			continue
		}
		if n := ConfusionCount(days, now); n > 0 {
			out = append(out, ConfusionPair{Expected: parts[0], Chosen: parts[1], Count: n})
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Count != out[j].Count {
			return out[i].Count > out[j].Count
		}
		return out[i].Expected+out[i].Chosen < out[j].Expected+out[j].Chosen // stable order
	})
	return out
}

// WeekAccuracy builds the Mon..Sun chart for the week containing now.
// Days with no attempts (or in the future) are -1, matching the UI contract.
// weekDelta is this week's overall accuracy minus last week's, in percentage
// points (0 when either week has no data).
func WeekAccuracy(state *UserSkillState, now time.Time) (week []float64, weekDeltaPct int) {
	week = make([]float64, 7)
	monday := startOfISOWeek(now.UTC())

	sumWeek := func(start time.Time) (attempts, correct int) {
		for i := 0; i < 7; i++ {
			if d := state.Days[dayKey(start.AddDate(0, 0, i))]; d != nil {
				attempts += d.Attempts
				correct += d.Correct
			}
		}
		return
	}

	for i := 0; i < 7; i++ {
		day := monday.AddDate(0, 0, i)
		d := state.Days[dayKey(day)]
		if d == nil || d.Attempts == 0 {
			week[i] = -1
			continue
		}
		week[i] = float64(d.Correct) / float64(d.Attempts)
	}

	curA, curC := sumWeek(monday)
	prevA, prevC := sumWeek(monday.AddDate(0, 0, -7))
	if curA > 0 && prevA > 0 {
		cur := float64(curC) / float64(curA)
		prev := float64(prevC) / float64(prevA)
		weekDeltaPct = int(math.Round((cur - prev) * 100))
	}
	return week, weekDeltaPct
}

func startOfISOWeek(t time.Time) time.Time {
	t = time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC)
	wd := int(t.Weekday())
	if wd == 0 { // Sunday
		wd = 7
	}
	return t.AddDate(0, 0, 1-wd)
}

// LessonsInWindow counts lesson_completed events over the last n days.
func LessonsInWindow(state *UserSkillState, now time.Time, n int) int {
	cutoff := dayKey(now.AddDate(0, 0, -n))
	total := 0
	for d, s := range state.Days {
		if d >= cutoff {
			total += s.Lessons
		}
	}
	return total
}

// ContainsArabic reports whether s contains at least one Arabic-script rune.
func ContainsArabic(s string) bool {
	for _, r := range s {
		if (r >= 0x0600 && r <= 0x06FF) || (r >= 0x0750 && r <= 0x077F) ||
			(r >= 0x08A0 && r <= 0x08FF) || (r >= 0xFB50 && r <= 0xFDFF) ||
			(r >= 0xFE70 && r <= 0xFEFF) {
			return true
		}
	}
	return false
}
