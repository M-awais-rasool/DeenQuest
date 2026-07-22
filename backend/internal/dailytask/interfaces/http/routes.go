package http

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes mounts the authenticated daily-task endpoints.
//
//	GET  /daily-tasks
//	POST /daily-tasks/:id/complete
func RegisterRoutes(authed *gin.RouterGroup, h *Handler) {
	authed.GET("/daily-tasks", h.GetDailyTasks)
	authed.POST("/daily-tasks/:id/complete", h.CompleteDailyTask)
}

// RegisterAdminRoutes mounts the admin-panel daily-task CRUD endpoints.
func RegisterAdminRoutes(admin *gin.RouterGroup, h *AdminHandler) {
	admin.GET("/tasks", h.ListTasks)
	admin.POST("/tasks", h.CreateTask)
	admin.GET("/tasks/:id", h.GetTask)
	admin.PUT("/tasks/:id", h.UpdateTask)
	admin.DELETE("/tasks/:id", h.DeleteTask)
}
