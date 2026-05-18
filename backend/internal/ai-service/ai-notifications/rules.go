package notifications

import (
	"math"
	"time"
)

func BuildRules() []NotificationRule {
	return []NotificationRule{
		{
			Type:     DailyTaskReminder,
			Cooldown: 6 * time.Hour,
			Evaluate: func(ctx *UserContext, now time.Time) bool {
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
			BuildTitle: func(ctx *UserContext) string {
				titles := []string{
					"Your daily mission awaits",
					"Time for today's deeds",
					"Don't forget your daily tasks",
				}
				return titles[int(math.Abs(float64(hashStr(ctx.UserID))))%len(titles)]
			},
			BuildMessage: func(ctx *UserContext) string {
				remaining := ctx.TodayTasksTotal - ctx.TodayTasksDone
				if remaining > 0 {
					return formatWithVariations(
						"You have %d task%s left today. Keep going!",
						"Your daily Quran mission is waiting for you.",
						"A small step today keeps your learning journey strong.",
					)(ctx, remaining)
				}
				return "Your daily Quran mission is waiting for you."
			},
		},
		{
			Type:     StreakWarning,
			Cooldown: 12 * time.Hour,
			Evaluate: func(ctx *UserContext, now time.Time) bool {
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
			BuildTitle: func(ctx *UserContext) string {
				titles := []string{
					"Your streak needs you",
					"Don't lose your streak",
					"Protect your progress",
				}
				return titles[int(math.Abs(float64(hashStr(ctx.UserID+"streak"))))%len(titles)]
			},
			BuildMessage: func(ctx *UserContext) string {
				return formatWithVariations(
					"Your %d-day streak is at risk. Complete a task today to keep it alive!",
					"You've built an amazing %d-day streak. Don't let it break now!",
					"Consistency is key. Your %d-day streak is waiting for you to continue.",
				)(ctx, ctx.CurrentStreak)
			},
		},
		{
			Type:     FridaySpecial,
			Cooldown: 24 * time.Hour,
			Evaluate: func(ctx *UserContext, now time.Time) bool {
				return now.Weekday() == time.Friday
			},
			BuildTitle: func(ctx *UserContext) string {
				titles := []string{
					"Jummah Mubarak",
					"Blessed Friday",
					"Friday reminder",
				}
				return titles[int(math.Abs(float64(hashStr(ctx.UserID+"friday"))))%len(titles)]
			},
		BuildMessage: func(ctx *UserContext) string {
			msgs := []string{
				"Don't forget to read Surah Al-Kahf today. It brings light between two Fridays.",
				"Friday is a blessed day. Increase your dhikr and send salawat upon the Prophet.",
				"Make the most of this blessed Friday. Open the app and earn extra rewards.",
			}
			return msgs[int(math.Abs(float64(hashStr(ctx.UserID+"friday-msg"))))%len(msgs)]
		},
		},
}
}

func formatWithVariations(variants ...string) func(ctx *UserContext, args ...int) string {
	return func(ctx *UserContext, args ...int) string {
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


