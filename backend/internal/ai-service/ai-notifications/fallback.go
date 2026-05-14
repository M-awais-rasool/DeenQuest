package notifications

import "math/rand"

var fallbackMessages = []string{
	"Assalamu Alaikum! Your learning journey is waiting for you. Come back and continue today.",
	"You were doing amazing, keep your streak alive and continue your Quran journey today.",
	"Every step counts in your learning path. We miss you, come back today!",
	"Your progress is inspiring! Take a moment today to continue where you left off.",
	"Don't let your streak fade! Jump back in and continue your Islamic learning journey.",
	"Barakah is in consistency. Return today and keep building your knowledge.",
	"Your learning streak is a blessing, protect it by continuing today.",
	"We're proud of your progress so far! Come back and keep going.",
	"A small step today keeps your learning journey strong. See you inside!",
	"Your dedication has been wonderful. Continue your journey and earn more rewards today.",
	"The Quran awaits your return. Pick up where you left off and keep growing.",
	"Consistency is key to success. Return today and maintain your beautiful streak.",
}

func GetFallbackMessage() string {
	return fallbackMessages[rand.Intn(len(fallbackMessages))]
}
