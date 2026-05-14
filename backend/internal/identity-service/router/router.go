package router

import (
	"github.com/gin-gonic/gin"

	authhandler "github.com/chawais/talent-flow/backend/internal/identity-service/auth/handler"
	userhandler "github.com/chawais/talent-flow/backend/internal/identity-service/user/handler"
	"github.com/chawais/talent-flow/backend/internal/notification-service"
	"github.com/chawais/talent-flow/backend/pkg/auth"
	"github.com/chawais/talent-flow/backend/pkg/middleware"
)

func SetupRoutes(r *gin.Engine, authHandler *authhandler.AuthHandler, userHandler *userhandler.UserHandler, notificationHandler *notification.Handler, jwtManager *auth.JWTManager) {
	v1 := r.Group("/api/v1")

	// Auth routes
	authGroup := v1.Group("/auth")
	{
		authGroup.POST("/signup", authHandler.Signup)
		authGroup.POST("/login", authHandler.Login)
	}

	// Public user routes (no auth)
	v1.GET("/users/:id/public", userHandler.GetPublicProfile)

	// User routes (authenticated)
	userGroup := v1.Group("/users")
	userGroup.Use(middleware.JWTAuth(jwtManager))
	{
		userGroup.GET("/me", userHandler.GetProfile)
		userGroup.PUT("/me", userHandler.UpdateProfile)
		userGroup.PUT("/me/password", userHandler.ChangePassword)
		userGroup.DELETE("/me", userHandler.DeleteAccount)
	}

	notificationGroup := v1.Group("/notifications")
	notificationGroup.Use(middleware.JWTAuth(jwtManager))
	{
		notificationGroup.POST("/register", notificationHandler.RegisterToken)
		notificationGroup.POST("/test", notificationHandler.SendTestNotification)
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "identity-service"})
	})
}
