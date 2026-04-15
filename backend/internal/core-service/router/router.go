package router

import (
	"github.com/gin-gonic/gin"

	"github.com/chawais/talent-flow/backend/internal/core-service/controller"
	"github.com/chawais/talent-flow/backend/pkg/auth"
	"github.com/chawais/talent-flow/backend/pkg/middleware"
)

func SetupRoutes(r *gin.Engine, ctl *controller.CoreController, jwtManager *auth.JWTManager) {
	v1 := r.Group("/api/v1")
	v1.Use(middleware.JWTAuth(jwtManager))
	{
		v1.GET("/daily-tasks", ctl.GetDailyTasks)
		v1.POST("/daily-tasks/:id/complete", ctl.CompleteDailyTask)
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "core-service"})
	})
}
