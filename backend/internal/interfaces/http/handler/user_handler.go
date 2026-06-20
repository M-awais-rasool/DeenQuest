package handler

import (
	"errors"

	"github.com/gin-gonic/gin"

	usersvc "github.com/chawais/talent-flow/backend/internal/application/user"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/response"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/validator"
	"github.com/chawais/talent-flow/backend/internal/interfaces/http/dto"
)

type UserHandler struct {
	userService *usersvc.UserService
}

func NewUserHandler(userService *usersvc.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c, "User not authenticated")
		return
	}

	result, err := h.userService.GetProfile(c.Request.Context(), userID.(string))
	if err != nil {
		if errors.Is(err, usersvc.ErrUserNotFound) {
			response.NotFound(c, "User not found")
			return
		}
		response.InternalError(c, "Failed to get profile")
		return
	}

	response.OK(c, "Profile retrieved successfully", result)
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c, "User not authenticated")
		return
	}

	var req dto.UpdateUserRequest
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
		if errors.Is(err, usersvc.ErrProfileEmailExists) {
			response.BadRequest(c, "Email already in use")
			return
		}
		response.InternalError(c, "Failed to update profile")
		return
	}

	response.OK(c, "Profile updated successfully", result)
}

func (h *UserHandler) ChangePassword(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c, "User not authenticated")
		return
	}

	var req dto.ChangePasswordRequest
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
		if errors.Is(err, usersvc.ErrWrongPassword) {
			response.BadRequest(c, "Current password is incorrect")
			return
		}
		if errors.Is(err, usersvc.ErrUserNotFound) {
			response.NotFound(c, "User not found")
			return
		}
		response.InternalError(c, "Failed to change password")
		return
	}

	response.OK(c, "Password changed successfully", nil)
}

func (h *UserHandler) GetPublicProfile(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		response.BadRequest(c, "User ID is required")
		return
	}

	result, err := h.userService.GetPublicProfile(c.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, usersvc.ErrUserNotFound) {
			response.NotFound(c, "User not found")
			return
		}
		response.InternalError(c, "Failed to get profile")
		return
	}

	response.OK(c, "Public profile retrieved", result)
}

func (h *UserHandler) DeleteAccount(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c, "User not authenticated")
		return
	}

	err := h.userService.DeleteAccount(c.Request.Context(), userID.(string))
	if err != nil {
		if errors.Is(err, usersvc.ErrUserNotFound) {
			response.NotFound(c, "User not found")
			return
		}
		response.InternalError(c, "Failed to delete account")
		return
	}

	response.OK(c, "Account deleted successfully", nil)
}
