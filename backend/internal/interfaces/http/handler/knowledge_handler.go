package handler

import (
	"github.com/gin-gonic/gin"

	knowledgesvc "github.com/chawais/talent-flow/backend/internal/application/knowledge"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/response"
)

// KnowledgeHandler exposes the Q&A / Knowledge Agent.
type KnowledgeHandler struct {
	svc *knowledgesvc.Service
}

func NewKnowledgeHandler(svc *knowledgesvc.Service) *KnowledgeHandler {
	return &KnowledgeHandler{svc: svc}
}

// Ask answers a question from the curated FAQ (or refers to a scholar).
func (h *KnowledgeHandler) Ask(c *gin.Context) {
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
