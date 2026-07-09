package reflection

import (
	"errors"

	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/platform/response"
)

// Handler exposes the Reflection Companion: submit a reflection and
// list the journal.
type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// Create accepts a reflection and returns the companion response (message + verse).
func (h *Handler) Create(c *gin.Context) {
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
		if errors.Is(err, ErrUnsafe) {
			response.BadRequest(c, "Please keep your reflection kind and appropriate.")
			return
		}
		response.InternalError(c, "failed to save reflection")
		return
	}
	response.OK(c, "reflection saved", ref)
}

// List returns the learner's recent reflections.
func (h *Handler) List(c *gin.Context) {
	userID := c.GetString("user_id")
	items, err := h.svc.List(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, "failed to fetch reflections")
		return
	}
	response.OK(c, "reflections fetched", items)
}
