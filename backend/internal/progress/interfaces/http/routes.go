package http

import "github.com/gin-gonic/gin"

//	GET /progress/user/:id
//
// Authenticated:
//
//	GET /progress/me
//	GET /leaderboard
func RegisterRoutes(public, authed *gin.RouterGroup, h *Handler) {
	public.GET("/progress/user/:id", h.GetPublicProgress)

	authed.GET("/progress/me", h.GetProgress)
	authed.GET("/leaderboard", h.GetLeaderboard)
}
