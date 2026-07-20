package coach

import (
	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/platform/response"
)

type AdminHandler struct {
	service *AdminService
}

func NewAdminHandler(service *AdminService) *AdminHandler {
	return &AdminHandler{service: service}
}

// GET /admin/learning/stats
func (h *AdminHandler) GetStats(c *gin.Context) {
	stats, err := h.service.Stats(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to compute learning stats")
		return
	}
	response.OK(c, "learning stats fetched", stats)
}

// GET /admin/learning/curriculum
func (h *AdminHandler) GetCurriculum(c *gin.Context) {
	cur, err := h.service.Curriculum(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to compute curriculum insights")
		return
	}
	response.OK(c, "curriculum insights fetched", cur)
}
