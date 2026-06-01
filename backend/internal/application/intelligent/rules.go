package intelligent

import (
	"math"
	"time"

	domain "github.com/chawais/talent-flow/backend/internal/domain/intelligent"
)

func BuildRules() []domain.NotificationRule {
	return []domain.NotificationRule{
		{
			Type:       domain.DailyTaskReminder,
			Cooldown:   6 * time.Hour,
			TimeWindow: domain.TimeWindow{StartHour: 9, EndHour: 14},
			Evaluate: func(ctx *domain.UserContext, now time.Time) bool {
				if ctx.TodayTasksTotal == 0 {
					return false
				}
				if ctx.TodayTasksDone >= ctx.TodayTasksTotal {
					return false
				}
				hoursSinceLast := now.Sub(ctx.LastCompletedAt).Hours()
				if hoursSinceLast < 4 {
					return false
				}
				return true
			},
			BuildTitle: func(ctx *domain.UserContext) string {
				titles := []string{
					"Your daily mission awaits",
					"Time for today's deeds",
					"Don't forget your daily tasks",
				}
				return titles[int(math.Abs(float64(hashStr(ctx.UserID))))%len(titles)]
			},
			BuildMessage: func(ctx *domain.UserContext) string {
				remaining := ctx.TodayTasksTotal - ctx.TodayTasksDone
				if remaining > 0 {
					return formatWithVariations(
						"You have %d daily task left today. Keep going!",
						"Your daily Quran mission is waiting for you.",
						"A small step today keeps your learning journey strong.",
					)(ctx, remaining)
				}
				return "Your daily Quran mission is waiting for you."
			},
		},
		{
			Type:       domain.StreakWarning,
			Cooldown:   12 * time.Hour,
			TimeWindow: domain.TimeWindow{StartHour: 18, EndHour: 22},
			Evaluate: func(ctx *domain.UserContext, now time.Time) bool {
				if ctx.CurrentStreak <= 3 {
					return false
				}
				today := now.UTC().Format("2006-01-02")
				lastDay := ctx.LastCompletedAt.UTC().Format("2006-01-02")
				if lastDay == today {
					return false
				}
				return true
			},
			BuildTitle: func(ctx *domain.UserContext) string {
				titles := []string{
					"Your streak needs you",
					"Don't lose your streak",
					"Protect your progress",
				}
				return titles[int(math.Abs(float64(hashStr(ctx.UserID+"streak"))))%len(titles)]
			},
			BuildMessage: func(ctx *domain.UserContext) string {
				return formatWithVariations(
					"Your %d-day streak is at risk. Complete a task today to keep it alive!",
					"You've built an amazing %d-day streak. Don't let it break now!",
					"Consistency is key. Your %d-day streak is waiting for you to continue.",
				)(ctx, ctx.CurrentStreak)
			},
		},
		{
			Type:       domain.FridaySpecial,
			Cooldown:   24 * time.Hour,
			TimeWindow: domain.TimeWindow{StartHour: 10, EndHour: 16},
			Evaluate: func(ctx *domain.UserContext, now time.Time) bool {
				return now.Weekday() == time.Friday
			},
			BuildTitle: func(ctx *domain.UserContext) string {
				titles := []string{
					"Jummah Mubarak",
					"Blessed Friday",
					"Friday reminder",
				}
				return titles[int(math.Abs(float64(hashStr(ctx.UserID+"friday"))))%len(titles)]
			},
			BuildMessage: func(ctx *domain.UserContext) string {
				msgs := []string{
					"Don't forget to read Surah Al-Kahf today. It brings light between two Fridays.",
					"Friday is a blessed day. Increase your dhikr and send salawat upon the Prophet.",
					"Make the most of this blessed Friday. Open the app and earn extra rewards.",
				}
				return msgs[int(math.Abs(float64(hashStr(ctx.UserID+"friday-msg"))))%len(msgs)]
			},
			BuildData: func(ctx *domain.UserContext) map[string]interface{} {
				return quranNotificationData(18, "Al-Kahf")
			},
		},
		{
			Type:       domain.QuranSuggestion,
			Cooldown:   24 * time.Hour,
			TimeWindow: domain.TimeWindow{StartHour: 7, EndHour: 11},
			Evaluate: func(ctx *domain.UserContext, now time.Time) bool {
				return true
			},
			BuildTitle: func(ctx *domain.UserContext) string {
				surah := pickSuggestedSurah(ctx)
				return "Daily Quran reminder: " + surah.name
			},
			BuildMessage: func(ctx *domain.UserContext) string {
				surah := pickSuggestedSurah(ctx)
				return "Take a few quiet minutes with Surah " + surah.name + " today."
			},
			BuildData: func(ctx *domain.UserContext) map[string]interface{} {
				surah := pickSuggestedSurah(ctx)
				return quranNotificationData(surah.id, surah.name)
			},
		},
		{
			Type:       domain.MulkReminder,
			Cooldown:   24 * time.Hour,
			TimeWindow: domain.TimeWindow{StartHour: 22, EndHour: 23},
			Evaluate: func(ctx *domain.UserContext, now time.Time) bool {
				return true
			},
			BuildTitle: func(ctx *domain.UserContext) string {
				titles := []string{
					"Time for Surah Al-Mulk",
					"Your nightly protection",
					"Before you sleep",
				}
				seed := ctx.UserID + "mulk-title" + time.Now().UTC().Format("2006-01-02")
				return titles[int(math.Abs(float64(hashStr(seed))))%len(titles)]
			},
			BuildMessage: func(ctx *domain.UserContext) string {
				msgs := []string{
					"The Prophet ﷺ used to recite Surah Al-Mulk before sleep. It protects from the punishment of the grave.",
					"Surah Al-Mulk intercedes for its reciter. Make it your nightly companion.",
					"Recite Surah Al-Mulk tonight and earn 30 hasanah for every ayah.",
					"Avoid the punishment of the grave — recite Surah Al-Mulk before sleeping tonight.",
					"Surah Al-Mulk is the protector. The Prophet ﷺ never slept without it.",
				}
				seed := ctx.UserID + "mulk-msg" + time.Now().UTC().Format("2006-01-02")
				return msgs[int(math.Abs(float64(hashStr(seed))))%len(msgs)]
			},
			BuildData: func(ctx *domain.UserContext) map[string]interface{} {
				return quranNotificationData(67, "Al-Mulk")
			},
		},
	}
}

type suggestedSurah struct {
	id   int
	name string
}

var suggestedSurahs = []suggestedSurah{
	{id: 1, name: "Al-Fatiha"},
	{id: 18, name: "Al-Kahf"},
	{id: 36, name: "Ya-Sin"},
	{id: 55, name: "Ar-Rahman"},
	{id: 67, name: "Al-Mulk"},
	{id: 112, name: "Al-Ikhlas"},
}

func pickSuggestedSurah(ctx *domain.UserContext) suggestedSurah {
	idx := int(math.Abs(float64(hashStr(ctx.UserID+time.Now().UTC().Format("2006-01-02"))))) % len(suggestedSurahs)
	return suggestedSurahs[idx]
}

func quranNotificationData(id int, name string) map[string]interface{} {
	return map[string]interface{}{
		"screen":     "SurahDetail",
		"surah_id":   id,
		"surah_name": name,
		"url":        "deenquest://quran/surah/" + intToStr(id),
	}
}

func formatWithVariations(variants ...string) func(ctx *domain.UserContext, args ...int) string {
	return func(ctx *domain.UserContext, args ...int) string {
		idx := int(math.Abs(float64(hashStr(ctx.UserID+time.Now().UTC().Format("2006-01-02"))))) % len(variants)
		msg := variants[idx]
		if len(args) > 0 {
			placeholders := countPlaceholders(msg)
			if placeholders > len(args) {
				placeholders = len(args)
			}
			formatted := make([]interface{}, placeholders)
			for i := 0; i < placeholders; i++ {
				formatted[i] = args[i]
			}
			msg = formatString(msg, formatted...)
		}
		return msg
	}
}

func countPlaceholders(s string) int {
	count := 0
	for i := 0; i < len(s)-1; i++ {
		if s[i] == '%' && s[i+1] == 'd' {
			count++
		}
	}
	return count
}

func formatString(s string, args ...interface{}) string {
	result := s
	for _, arg := range args {
		idx := indexOf(result, "%d")
		if idx == -1 {
			break
		}
		result = result[:idx] + sprintInt(arg) + result[idx+2:]
	}
	return result
}

func indexOf(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}

func sprintInt(v interface{}) string {
	switch val := v.(type) {
	case int:
		return intToStr(val)
	case int64:
		return intToStr(int(val))
	default:
		return "0"
	}
}

func intToStr(n int) string {
	if n == 0 {
		return "0"
	}
	negative := n < 0
	if negative {
		n = -n
	}
	var digits []byte
	for n > 0 {
		digits = append([]byte{byte('0' + n%10)}, digits...)
		n /= 10
	}
	if negative {
		digits = append([]byte{'-'}, digits...)
	}
	return string(digits)
}

func hashStr(s string) int64 {
	var h int64
	for _, c := range s {
		h = h*31 + int64(c)
	}
	return h
}
