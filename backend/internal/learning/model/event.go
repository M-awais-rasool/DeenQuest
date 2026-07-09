package model

import (
	"encoding/json"
	"time"
)

// TopicLearningEvents is the Kafka topic every behavior event is published to.
// Each reactor (state updater, recommender hook, AI copy) consumes it under its
// own consumer group, so they react independently and stay loosely coupled.
const TopicLearningEvents = "learning.events"

// EventType enumerates the user-behavior signals the agent listens to.
type EventType string

const (
	EventTaskStarted      EventType = "task_started"
	EventTaskCompleted    EventType = "task_completed"
	EventTaskAbandoned    EventType = "task_abandoned"
	EventAnswerCorrect    EventType = "answer_correct"
	EventAnswerWrong      EventType = "answer_wrong"
	EventHintUsed         EventType = "hint_used"
	EventTimeSpent        EventType = "time_spent"
	EventLessonCompleted  EventType = "lesson_completed"
	EventLevelCompleted   EventType = "level_completed"
	EventRecitationScored EventType = "recitation_scored"
	EventSessionStart     EventType = "session_start"
)

// BehaviorEvent is the payload carried inside kafka.Event.Payload on the
// learning.events topic. Producers (server-side completion handlers and the
// client /events endpoint) build it; consumers decode it via DecodeBehaviorEvent.
type BehaviorEvent struct {
	UserID      string    `json:"user_id" bson:"user_id"`
	Type        EventType `json:"type" bson:"type"`
	CourseType  string    `json:"course_type,omitempty" bson:"course_type,omitempty"`
	SkillTags   []string  `json:"skill_tags,omitempty" bson:"skill_tags,omitempty"`
	LevelID     int       `json:"level_id,omitempty" bson:"level_id,omitempty"`
	LessonIndex int       `json:"lesson_index,omitempty" bson:"lesson_index,omitempty"`
	TaskID      string    `json:"task_id,omitempty" bson:"task_id,omitempty"`

	// Optional metrics, present depending on Type.
	Correct     bool     `json:"correct,omitempty" bson:"correct,omitempty"`
	DurationMs  int64    `json:"duration_ms,omitempty" bson:"duration_ms,omitempty"`
	Score       int      `json:"score,omitempty" bson:"score,omitempty"`               // recitation 0-100
	WrongTokens []string `json:"wrong_tokens,omitempty" bson:"wrong_tokens,omitempty"` // weak letters from recitation

	ClientTS time.Time `json:"client_ts,omitempty" bson:"client_ts,omitempty"`
	ServerTS time.Time `json:"server_ts" bson:"server_ts"`
}

// ItemKey returns a stable identifier for the content an event touched, used for
// the anti-repetition window in LearnerState.RecentItems.
func (e BehaviorEvent) ItemKey() string {
	if e.TaskID != "" {
		return "task:" + e.TaskID
	}
	if e.LevelID != 0 {
		return "level:" + itoa(e.LevelID)
	}
	return ""
}

// DecodeBehaviorEvent converts a kafka.Event payload (which round-trips through
// JSON as a map[string]interface{}) back into a typed BehaviorEvent.
func DecodeBehaviorEvent(payload interface{}) (*BehaviorEvent, error) {
	raw, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	var ev BehaviorEvent
	if err := json.Unmarshal(raw, &ev); err != nil {
		return nil, err
	}
	return &ev, nil
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	neg := n < 0
	if neg {
		n = -n
	}
	var buf [20]byte
	i := len(buf)
	for n > 0 {
		i--
		buf[i] = byte('0' + n%10)
		n /= 10
	}
	if neg {
		i--
		buf[i] = '-'
	}
	return string(buf[i:])
}
