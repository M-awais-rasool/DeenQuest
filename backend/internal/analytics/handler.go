package analytics

import (
	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/platform/response"
)

type Handler struct {
	repo Repository
}

func NewHandler(repo Repository) *Handler {
	return &Handler{repo: repo}
}

// GET /admin/analytics
func (h *Handler) GetAnalytics(c *gin.Context) {
	data, err := h.repo.GetAdminAnalytics(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to compute analytics")
		return
	}
	response.OK(c, "analytics fetched", data)
}
