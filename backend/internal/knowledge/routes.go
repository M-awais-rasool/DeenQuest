package knowledge

import "github.com/gin-gonic/gin"

// RegisterRoutes mounts the authenticated Q&A endpoint:
//
//	POST /knowledge/ask
func RegisterRoutes(authed *gin.RouterGroup, h *Handler) {
	authed.POST("/knowledge/ask", h.Ask)
}
