package http

import "github.com/gin-gonic/gin"

// RegisterRoutes mounts the authenticated challenge endpoints.
//
//	GET    /challenges
//	POST   /challenges/duels
//	POST   /challenges/duels/join
//	DELETE /challenges/duels/:id
//	POST   /challenges/groups
//	POST   /challenges/groups/join
//	POST   /challenges/encouragements
func RegisterRoutes(authed *gin.RouterGroup, h *Handler) {
	g := authed.Group("/challenges")
	g.GET("", h.GetOverview)
	g.POST("/duels", h.CreateDuel)
	// Static "join" is registered before the /:id wildcard so gin does not
	// treat it as a duel id.
	g.POST("/duels/join", h.JoinDuel)
	g.DELETE("/duels/:id", h.CancelDuel)
	g.POST("/groups", h.CreateGroup)
	g.POST("/groups/join", h.JoinGroup)
	g.POST("/encouragements", h.Encourage)
}
