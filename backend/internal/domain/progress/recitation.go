package progress

import "time"

// WordStatus describes the quality of a single spoken word vs the expected word.
type WordStatus string

const (
	WordCorrect WordStatus = "correct" // spoken correctly (within tolerance)
	WordWrong   WordStatus = "wrong"   // spoken but differs too much
	WordMissing WordStatus = "missing" // expected but not spoken
	WordExtra   WordStatus = "extra"   // spoken but not expected
)

// WordResult is the per-word recitation assessment.
type WordResult struct {
	Text       string     `bson:"text" json:"text"`
	Status     WordStatus `bson:"status" json:"status"`
	Confidence float64    `bson:"confidence" json:"confidence"` // 0.0–1.0
}

// RecitationAttempt stores every user recitation attempt for analytics.
// It is keyed by level_id + lesson_index so it maps directly to the Lesson
// already embedded in the levels collection — no separate ayah collection needed.
type RecitationAttempt struct {
	ID          string       `bson:"_id" json:"id"`
	UserID      string       `bson:"user_id" json:"user_id"`
	LevelID     int          `bson:"level_id" json:"level_id"`
	LessonIndex int          `bson:"lesson_index" json:"lesson_index"`
	Score       int          `bson:"score" json:"score"` // 0–100
	Words       []WordResult `bson:"words" json:"words"`
	XPEarned    int          `bson:"xp_earned" json:"xp_earned"`
	Transcript  string       `bson:"transcript" json:"transcript"` // raw Whisper output
	AttemptNum  int          `bson:"attempt_num" json:"attempt_num"`
	CreatedAt   time.Time    `bson:"created_at" json:"created_at"`
}

// RecitationCheckResult is the API response for POST /recitation/check.
type RecitationCheckResult struct {
	Score      int          `json:"score"`      // 0–100 percentage correct
	Words      []WordResult `json:"words"`      // per-word breakdown
	Message    string       `json:"message"`    // encouraging feedback
	XPEarned   int          `json:"xp_earned"`  // XP awarded this attempt
	Transcript string       `json:"transcript"` // what Whisper heard
	AttemptNum int          `json:"attempt_num"`
}
