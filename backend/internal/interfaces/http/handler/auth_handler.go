package handler

import (
	"errors"

	"github.com/gin-gonic/gin"

	authsvc "github.com/chawais/talent-flow/backend/internal/application/auth"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/response"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/validator"
	"github.com/chawais/talent-flow/backend/internal/interfaces/http/dto"
)

type AuthHandler struct {
	authService *authsvc.AuthService
}

func NewAuthHandler(authService *authsvc.AuthService) *AuthHandler {
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
		if errors.Is(err, authsvc.ErrEmailExists) {
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
		if errors.Is(err, authsvc.ErrInvalidCredentials) {
			response.Unauthorized(c, "Invalid email or password")
			return
		}
		response.InternalError(c, "Failed to login")
		return
	}

	response.OK(c, "Login successful", result)
}
