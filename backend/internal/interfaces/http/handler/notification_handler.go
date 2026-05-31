package handler

import (
	"errors"

	"github.com/gin-gonic/gin"

	notifiesvc "github.com/chawais/talent-flow/backend/internal/application/notification"
	domain "github.com/chawais/talent-flow/backend/internal/domain/notification"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/response"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/validator"
)

type NotificationHandler struct {
	service *notifiesvc.Service
}

func NewNotificationHandler(service *notifiesvc.Service) *NotificationHandler {
	return &NotificationHandler{service: service}
}

func (h *NotificationHandler) RegisterToken(c *gin.Context) {
	var req domain.RegisterTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body")
		return
	}
	if err := validator.Validate(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "errors": validator.FormatValidationErrors(err)})
		return
	}

	result, err := h.service.RegisterToken(c.Request.Context(), userFromContext(c), req)
	if err != nil {
		if errors.Is(err, domain.ErrInvalidToken) {
			response.BadRequest(c, "Invalid Expo push token")
			return
		}
		response.InternalError(c, "Failed to register notification token")
		return
	}

	response.OK(c, "Notification token registered", result)
}

func (h *NotificationHandler) SendTestNotification(c *gin.Context) {
	err := h.service.SendTestNotificationToAll(
		c.Request.Context(),
		"Test Notification 🚀",
		"This is a test notification from Talent Flow",
	)

	if err != nil {
		response.InternalError(c, "Failed to send test notifications")
		return
	}

	response.OK(c, "Test notifications sent", nil)
}

func userFromContext(c *gin.Context) domain.UserInfo {
	return domain.UserInfo{
		ID:    c.GetString("user_id"),
		Email: c.GetString("email"),
		Role:  c.GetString("role"),
	}
}
