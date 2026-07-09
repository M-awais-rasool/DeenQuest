package reflection

import "github.com/gin-gonic/gin"

// RegisterRoutes mounts the authenticated Reflection Companion endpoints:
//
//	POST /reflection
//	GET  /reflections
func RegisterRoutes(authed *gin.RouterGroup, h *Handler) {
	authed.POST("/reflection", h.Create)
	authed.GET("/reflections", h.List)
}
