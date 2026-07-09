package knowledge

import (
	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/platform/response"
)

// Handler exposes the Q&A / Knowledge Agent.
type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// Ask answers a question from the curated FAQ (or refers to a scholar).
func (h *Handler) Ask(c *gin.Context) {
	var body struct {
		Question string `json:"question"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, "question is required")
		return
	}
	if len(body.Question) > 500 {
		body.Question = body.Question[:500]
	}
	response.OK(c, "answer", h.svc.Ask(c.Request.Context(), body.Question))
}
