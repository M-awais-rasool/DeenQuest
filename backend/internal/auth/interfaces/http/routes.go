package http

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes mounts the public auth endpoints:
//
//	POST /auth/signup
//	POST /auth/login
func RegisterRoutes(public *gin.RouterGroup, h *Handler) {
	g := public.Group("/auth")
	g.POST("/signup", h.Signup)
	g.POST("/login", h.Login)
}
