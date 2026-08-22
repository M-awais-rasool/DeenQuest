package http

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes mounts the auth endpoints.
//
// Public:
//
//	GET  /auth/providers
//	POST /auth/oauth/:provider
//	POST /auth/refresh
//	POST /auth/logout
//
// Authenticated:
//
//	GET    /auth/sessions
//	DELETE /auth/sessions/:id
//
// /auth/refresh and /auth/logout are public because they authenticate with the
// refresh token itself — by the time a client needs them, its access token is
// already expired.
func RegisterRoutes(public, authed *gin.RouterGroup, h *Handler) {
	g := public.Group("/auth")
	g.GET("/providers", h.Providers)
	g.POST("/oauth/:provider", h.SignInWithProvider)
	g.POST("/refresh", h.Refresh)
	g.POST("/logout", h.Logout)

	s := authed.Group("/auth")
	s.GET("/sessions", h.ListSessions)
	s.DELETE("/sessions/:id", h.RevokeSession)
}
