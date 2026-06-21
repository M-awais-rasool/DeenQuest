package handler

import (
	"github.com/gin-gonic/gin"

	reflectionsvc "github.com/chawais/talent-flow/backend/internal/application/reflection"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/response"
)

// ReflectionHandler exposes the Reflection Companion: submit a reflection and
// list the journal.
type ReflectionHandler struct {
	svc *reflectionsvc.Service
}

func NewReflectionHandler(svc *reflectionsvc.Service) *ReflectionHandler {
	return &ReflectionHandler{svc: svc}
}

// Create accepts a reflection and returns the companion response (message + verse).
func (h *ReflectionHandler) Create(c *gin.Context) {
	userID := c.GetString("user_id")
	var body struct {
		Text string `json:"text"`
		Mood string `json:"mood"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, "text is required")
		return
	}
	if len(body.Text) > 2000 {
		body.Text = body.Text[:2000] // cap input size
	}
	ref, err := h.svc.Respond(c.Request.Context(), userID, body.Text, body.Mood)
	if err != nil {
		response.InternalError(c, "failed to save reflection")
		return
	}
	response.OK(c, "reflection saved", ref)
}

// List returns the learner's recent reflections.
func (h *ReflectionHandler) List(c *gin.Context) {
	userID := c.GetString("user_id")
	items, err := h.svc.List(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, "failed to fetch reflections")
		return
	}
	response.OK(c, "reflections fetched", items)
}
