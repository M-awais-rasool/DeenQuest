package http

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes mounts the user-profile endpoints.
//
// Public:
//
//	GET /users/:id/public
//
// Authenticated:
//
//	GET    /users/me
//	PUT    /users/me
//	DELETE /users/me
func RegisterRoutes(public, authed *gin.RouterGroup, h *Handler) {
	public.GET("/users/:id/public", h.GetPublicProfile)

	authed.GET("/users/me", h.GetProfile)
	authed.PUT("/users/me", h.UpdateProfile)
	authed.DELETE("/users/me", h.DeleteAccount)
}
