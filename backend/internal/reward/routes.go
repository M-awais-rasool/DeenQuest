package reward

import "github.com/gin-gonic/gin"

//	GET /rewards
func RegisterRoutes(authed *gin.RouterGroup, h *Handler) {
	authed.GET("/rewards", h.GetRewards)
}

// RegisterAdminRoutes mounts the admin-panel reward CRUD endpoints.
func RegisterAdminRoutes(admin *gin.RouterGroup, h *AdminHandler) {
	admin.GET("/rewards", h.ListRewards)
	admin.POST("/rewards", h.CreateReward)
	admin.GET("/rewards/:id", h.GetReward)
	admin.PUT("/rewards/:id", h.UpdateReward)
	admin.DELETE("/rewards/:id", h.DeleteReward)
}
