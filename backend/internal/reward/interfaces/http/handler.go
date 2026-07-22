package http

import (
	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/reward/application"

	"github.com/chawais/deenquest/backend/internal/platform/response"
)

type Handler struct {
	service *application.Service
}

func NewHandler(service *application.Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) GetRewards(c *gin.Context) {
	userID := c.GetString("user_id")
	rewards, err := h.service.GetRewards(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, "failed to fetch rewards")
		return
	}
	response.OK(c, "rewards fetched", rewards)
}
