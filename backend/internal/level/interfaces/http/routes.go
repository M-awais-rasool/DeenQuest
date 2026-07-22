package http

import (
	"github.com/gin-gonic/gin"
)

// GET  /levels
// GET  /levels/:id
// POST /levels/:id/lessons/complete
// POST /levels/:id/complete
func RegisterRoutes(authed *gin.RouterGroup, h *Handler) {
	authed.GET("/levels", h.GetLevels)
	authed.GET("/levels/:id", h.GetLevelDetail)
	authed.POST("/levels/:id/lessons/complete", h.CompleteLesson)
	authed.POST("/levels/:id/complete", h.CompleteLevel)
}

// RegisterAdminRoutes mounts the admin-panel level CRUD endpoints.
func RegisterAdminRoutes(admin *gin.RouterGroup, h *AdminHandler) {
	admin.GET("/levels", h.ListLevels)
	admin.POST("/levels", h.CreateLevel)
	admin.GET("/levels/:id", h.GetLevel)
	admin.PUT("/levels/:id", h.UpdateLevel)
	admin.DELETE("/levels/:id", h.DeleteLevel)
}
