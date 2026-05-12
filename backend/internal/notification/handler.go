package notification

import (
	"errors"

	"github.com/gin-gonic/gin"

	"github.com/chawais/talent-flow/backend/pkg/response"
	"github.com/chawais/talent-flow/backend/pkg/validator"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterToken(c *gin.Context) {
	var req RegisterTokenRequest
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
		if errors.Is(err, ErrInvalidToken) {
			response.BadRequest(c, "Invalid Expo push token")
			return
		}
		response.InternalError(c, "Failed to register notification token")
		return
	}

	response.OK(c, "Notification token registered", result)
}

func (h *Handler) UnregisterToken(c *gin.Context) {
	var req struct {
		ExpoPushToken string `json:"expo_push_token" validate:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body")
		return
	}
	if err := validator.Validate(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "errors": validator.FormatValidationErrors(err)})
		return
	}

	if err := h.service.UnregisterToken(c.Request.Context(), userFromContext(c), req.ExpoPushToken); err != nil {
		if errors.Is(err, ErrInvalidToken) {
			response.BadRequest(c, "Invalid Expo push token")
			return
		}
		response.InternalError(c, "Failed to unregister notification token")
		return
	}

	response.OK(c, "Notification token unregistered", nil)
}

func userFromContext(c *gin.Context) UserInfo {
	return UserInfo{
		ID:    c.GetString("user_id"),
		Email: c.GetString("email"),
		Role:  c.GetString("role"),
	}
}
