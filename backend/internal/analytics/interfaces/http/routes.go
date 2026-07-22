package http

import "github.com/gin-gonic/gin"

// RegisterAdminRoutes mounts the admin analytics dashboard endpoint.
//
//	GET /admin/analytics
func RegisterAdminRoutes(admin *gin.RouterGroup, h *Handler) {
	admin.GET("/analytics", h.GetAnalytics)
}
