package router

import (
	"github.com/gin-gonic/gin"

	authhandler "github.com/chawais/talent-flow/backend/internal/identity-service/auth/handler"
	userhandler "github.com/chawais/talent-flow/backend/internal/identity-service/user/handler"
	"github.com/chawais/talent-flow/backend/pkg/auth"
	"github.com/chawais/talent-flow/backend/pkg/middleware"
)

func SetupRoutes(r *gin.Engine, authHandler *authhandler.AuthHandler, userHandler *userhandler.UserHandler, jwtManager *auth.JWTManager) {
	v1 := r.Group("/api/v1")

	// Auth routes
	authGroup := v1.Group("/auth")
	{
		authGroup.POST("/signup", authHandler.Signup)
		authGroup.POST("/login", authHandler.Login)
		authGroup.POST("/refresh", authHandler.RefreshToken)
		authGroup.POST("/logout", middleware.JWTAuth(jwtManager), authHandler.Logout)
	}

	// User routes
	userGroup := v1.Group("/users")
	userGroup.Use(middleware.JWTAuth(jwtManager))
	{
		userGroup.GET("/me", userHandler.GetProfile)
		userGroup.PUT("/me", userHandler.UpdateProfile)
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "identity-service"})
	})
}
