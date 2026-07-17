package content

import "github.com/gin-gonic/gin"

//	GET /admin/registry
func RegisterAdminRoutes(admin *gin.RouterGroup, h *Handler) {
	admin.GET("/registry", h.GetRegistry)
}
