package recitation

import "github.com/gin-gonic/gin"

//	POST /recitation/check
func RegisterRoutes(authed *gin.RouterGroup, h *Handler) {
	authed.POST("/recitation/check", h.CheckRecitation)
}
