package scheduling

import "github.com/gin-gonic/gin"

// RegisterRoutes mounts the authenticated prayer-aware scheduling endpoint:
//
//	GET /scheduling/plan
func RegisterRoutes(authed *gin.RouterGroup, h *Handler) {
	authed.GET("/scheduling/plan", h.Plan)
}
