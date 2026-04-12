package handler

import (
	"errors"

	"github.com/gin-gonic/gin"

	"github.com/chawais/talent-flow/backend/internal/identity-service/user/dto"
	"github.com/chawais/talent-flow/backend/internal/identity-service/user/service"
	"github.com/chawais/talent-flow/backend/pkg/response"
	"github.com/chawais/talent-flow/backend/pkg/validator"
)

type UserHandler struct {
	userService *service.UserService
}

func NewUserHandler(userService *service.UserService) *UserHandler {
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
		if errors.Is(err, service.ErrUserNotFound) {
			response.NotFound(c, "User not found")
			return
		}
		response.NotFound(c, "User not found")
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
		errors := validator.FormatValidationErrors(err)
		c.JSON(400, gin.H{"success": false, "errors": errors})
		return
	}

	result, err := h.userService.UpdateProfile(c.Request.Context(), userID.(string), &req)
	if err != nil {
		if errors.Is(err, service.ErrProfileEmailExists) {
			response.BadRequest(c, "Email already in use")
			return
		}
		response.InternalError(c, "Failed to update profile")
		return
	}

	response.OK(c, "Profile updated successfully", result)
}
