package http

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes mounts the authenticated push-notification endpoints:
//
//	POST /notifications/register
//	POST /notifications/test
func RegisterRoutes(authed *gin.RouterGroup, h *Handler) {
	authed.POST("/notifications/register", h.RegisterToken)
	authed.POST("/notifications/test", h.SendTestNotification)
}
