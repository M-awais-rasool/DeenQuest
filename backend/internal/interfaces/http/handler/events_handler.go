package handler

import (
	"github.com/gin-gonic/gin"

	learningapp "github.com/chawais/talent-flow/backend/internal/application/learning"
	domain "github.com/chawais/talent-flow/backend/internal/domain/learning"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/response"
)

// EventsHandler ingests batched client-side behavior events and publishes them
// onto the learning.events topic. The endpoint is intentionally thin: it stamps
// the authenticated user_id, validates the event type, and fire-and-forgets.
type EventsHandler struct {
	publisher *learningapp.Publisher
}

func NewEventsHandler(publisher *learningapp.Publisher) *EventsHandler {
	return &EventsHandler{publisher: publisher}
}

// clientEventTypes are the behavior events the client is allowed to report.
// Lesson/level/recitation completions are emitted server-side and are not
// accepted here (so they can't be spoofed for XP-adjacent logic later).
var clientEventTypes = map[domain.EventType]bool{
	domain.EventTaskStarted:   true,
	domain.EventTaskCompleted: true,
	domain.EventTaskAbandoned: true,
	domain.EventAnswerCorrect: true,
	domain.EventAnswerWrong:   true,
	domain.EventHintUsed:      true,
	domain.EventTimeSpent:     true,
	domain.EventSessionStart:  true,
}

type ingestEvent struct {
	Type        domain.EventType `json:"type"`
	CourseType  string           `json:"course_type"`
	SkillTags   []string         `json:"skill_tags"`
	LevelID     int              `json:"level_id"`
	LessonIndex int              `json:"lesson_index"`
	TaskID      string           `json:"task_id"`
	Correct     bool             `json:"correct"`
	DurationMs  int64            `json:"duration_ms"`
}

func (h *EventsHandler) Ingest(c *gin.Context) {
	userID := c.GetString("user_id")

	var body struct {
		Events []ingestEvent `json:"events"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, "events array is required")
		return
	}
	if len(body.Events) == 0 {
		response.OK(c, "no events", gin.H{"accepted": 0})
		return
	}
	if len(body.Events) > 100 {
		body.Events = body.Events[:100] // cap batch size
	}

	batch := make([]domain.BehaviorEvent, 0, len(body.Events))
	for _, e := range body.Events {
		if !clientEventTypes[e.Type] {
			continue
		}
		batch = append(batch, domain.BehaviorEvent{
			UserID:      userID, // server-stamped; client-supplied user_id is ignored
			Type:        e.Type,
			CourseType:  e.CourseType,
			SkillTags:   e.SkillTags,
			LevelID:     e.LevelID,
			LessonIndex: e.LessonIndex,
			TaskID:      e.TaskID,
			Correct:     e.Correct,
			DurationMs:  e.DurationMs,
		})
	}

	// One batched, async publish — the handler returns without waiting on Kafka.
	h.publisher.EmitBatch(c.Request.Context(), batch)
	response.OK(c, "events accepted", gin.H{"accepted": len(batch)})
}
