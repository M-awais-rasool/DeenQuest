package reward

import (
	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/platform/response"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
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
