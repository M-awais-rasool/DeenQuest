package handler

import (
	"errors"

	"github.com/gin-gonic/gin"

	"github.com/chawais/talent-flow/backend/internal/identity-service/auth/dto"
	"github.com/chawais/talent-flow/backend/internal/identity-service/auth/service"
	"github.com/chawais/talent-flow/backend/pkg/response"
	"github.com/chawais/talent-flow/backend/pkg/validator"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func bindAndValidate[T any](c *gin.Context, req *T) bool {
	if err := c.ShouldBindJSON(req); err != nil {
		response.BadRequest(c, "Invalid request body")
		return false
	}

	if err := validator.Validate(req); err != nil {
		validationErrors := validator.FormatValidationErrors(err)
		c.JSON(400, gin.H{"success": false, "errors": validationErrors})
		return false
	}

	return true
}

func (h *AuthHandler) Signup(c *gin.Context) {
	var req dto.SignupRequest
	if !bindAndValidate(c, &req) {
		return
	}

	if err := h.authService.Signup(c.Request.Context(), &req); err != nil {
		if errors.Is(err, service.ErrEmailExists) {
			response.BadRequest(c, "Email already exists")
			return
		}
		response.InternalError(c, "Failed to create user")
		return
	}

	response.Created(c, "User created successfully", nil)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if !bindAndValidate(c, &req) {
		return
	}

	result, err := h.authService.Login(c.Request.Context(), &req)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			response.Unauthorized(c, "Invalid email or password")
			return
		}
		response.InternalError(c, "Failed to login")
		return
	}

	response.OK(c, "Login successful", result)
}
