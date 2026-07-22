package http

import (
	"errors"

	"github.com/chawais/deenquest/backend/internal/user/application"

	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/platform/response"
	"github.com/chawais/deenquest/backend/internal/platform/validator"
)

type Handler struct {
	userService *application.Service
}

func NewHandler(userService *application.Service) *Handler {
	return &Handler{userService: userService}
}

func (h *Handler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c, "domain.User not authenticated")
		return
	}

	result, err := h.userService.GetProfile(c.Request.Context(), userID.(string))
	if err != nil {
		if errors.Is(err, application.ErrUserNotFound) {
			response.NotFound(c, "domain.User not found")
			return
		}
		response.InternalError(c, "Failed to get profile")
		return
	}

	response.OK(c, "Profile retrieved successfully", result)
}

func (h *Handler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c, "domain.User not authenticated")
		return
	}

	var req application.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body")
		return
	}

	if err := validator.Validate(&req); err != nil {
		validationErrors := validator.FormatValidationErrors(err)
		c.JSON(400, gin.H{"success": false, "errors": validationErrors})
		return
	}

	result, err := h.userService.UpdateProfile(c.Request.Context(), userID.(string), &req)
	if err != nil {
		if errors.Is(err, application.ErrProfileEmailExists) {
			response.BadRequest(c, "Email already in use")
			return
		}
		response.InternalError(c, "Failed to update profile")
		return
	}

	response.OK(c, "Profile updated successfully", result)
}

func (h *Handler) ChangePassword(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c, "domain.User not authenticated")
		return
	}

	var req application.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body")
		return
	}

	if err := validator.Validate(&req); err != nil {
		validationErrors := validator.FormatValidationErrors(err)
		c.JSON(400, gin.H{"success": false, "errors": validationErrors})
		return
	}

	err := h.userService.ChangePassword(c.Request.Context(), userID.(string), &req)
	if err != nil {
		if errors.Is(err, application.ErrWrongPassword) {
			response.BadRequest(c, "Current password is incorrect")
			return
		}
		if errors.Is(err, application.ErrUserNotFound) {
			response.NotFound(c, "domain.User not found")
			return
		}
		response.InternalError(c, "Failed to change password")
		return
	}

	response.OK(c, "Password changed successfully", nil)
}

func (h *Handler) GetPublicProfile(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		response.BadRequest(c, "domain.User ID is required")
		return
	}

	result, err := h.userService.GetPublicProfile(c.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, application.ErrUserNotFound) {
			response.NotFound(c, "domain.User not found")
			return
		}
		response.InternalError(c, "Failed to get profile")
		return
	}

	response.OK(c, "Public profile retrieved", result)
}

func (h *Handler) DeleteAccount(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c, "domain.User not authenticated")
		return
	}

	err := h.userService.DeleteAccount(c.Request.Context(), userID.(string))
	if err != nil {
		if errors.Is(err, application.ErrUserNotFound) {
			response.NotFound(c, "domain.User not found")
			return
		}
		response.InternalError(c, "Failed to delete account")
		return
	}

	response.OK(c, "Account deleted successfully", nil)
}
