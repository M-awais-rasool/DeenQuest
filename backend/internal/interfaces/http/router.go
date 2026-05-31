package router

import (
	"github.com/gin-gonic/gin"

	"github.com/chawais/talent-flow/backend/internal/interfaces/http/handler"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/jwt"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/middleware"
)

func SetupRoutes(
	r *gin.Engine,
	authHandler *handler.AuthHandler,
	userHandler *handler.UserHandler,
	coreHandler *handler.CoreHandler,
	recitationHandler *handler.RecitationHandler,
	notificationHandler *handler.NotificationHandler,
	jwtManager *jwt.JWTManager,
) {
	v1 := r.Group("/api/v1")

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "deenquest-api"})
	})

	authGroup := v1.Group("/auth")
	{
		authGroup.POST("/signup", authHandler.Signup)
		authGroup.POST("/login", authHandler.Login)
	}

	v1.GET("/users/:id/public", userHandler.GetPublicProfile)

	v1.GET("/progress/user/:id", coreHandler.GetPublicProgress)

	authed := v1.Group("")
	authed.Use(middleware.JWTAuth(jwtManager))
	{
		authed.GET("/users/me", userHandler.GetProfile)
		authed.PUT("/users/me", userHandler.UpdateProfile)
		authed.PUT("/users/me/password", userHandler.ChangePassword)
		authed.DELETE("/users/me", userHandler.DeleteAccount)

		authed.POST("/notifications/register", notificationHandler.RegisterToken)
		authed.POST("/notifications/test", notificationHandler.SendTestNotification)

		authed.GET("/progress/me", coreHandler.GetProgress)
		authed.GET("/leaderboard", coreHandler.GetLeaderboard)
		authed.GET("/daily-tasks", coreHandler.GetDailyTasks)
		authed.POST("/daily-tasks/:id/complete", coreHandler.CompleteDailyTask)

		authed.GET("/levels", coreHandler.GetLevels)
		authed.GET("/levels/:id", coreHandler.GetLevelDetail)
		authed.POST("/levels/:id/lessons/complete", coreHandler.CompleteLesson)
		authed.POST("/levels/:id/complete", coreHandler.CompleteLevel)

		authed.GET("/rewards", coreHandler.GetRewards)

		authed.POST("/recitation/check", recitationHandler.CheckRecitation)
	}
}
