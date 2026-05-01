package router

import (
	"github.com/gin-gonic/gin"

	"github.com/chawais/talent-flow/backend/internal/core-service/controller"
	"github.com/chawais/talent-flow/backend/pkg/auth"
	"github.com/chawais/talent-flow/backend/pkg/middleware"
)

func SetupRoutes(r *gin.Engine, ctl *controller.CoreController, recCtl *controller.RecitationController, jwtManager *auth.JWTManager) {
	v1 := r.Group("/api/v1")

	// Public routes (no auth)
	v1.GET("/progress/user/:id", ctl.GetPublicProgress)

	v1.Use(middleware.JWTAuth(jwtManager))
	{
		v1.GET("/progress/me", ctl.GetProgress)
		v1.GET("/leaderboard", ctl.GetLeaderboard)
		v1.GET("/daily-tasks", ctl.GetDailyTasks)
		v1.POST("/daily-tasks/:id/complete", ctl.CompleteDailyTask)

		// Level journey
		v1.GET("/levels", ctl.GetLevels)
		v1.GET("/levels/:id", ctl.GetLevelDetail)
		v1.POST("/levels/:id/lessons/complete", ctl.CompleteLesson)
		v1.POST("/levels/:id/complete", ctl.CompleteLevel)

		// Rewards
		v1.GET("/rewards", ctl.GetRewards)

		// Quran recitation — arabic text is read from the level's lesson data,
		// no separate ayah collection needed.
		v1.POST("/recitation/check", recCtl.CheckRecitation)
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "core-service"})
	})
}
