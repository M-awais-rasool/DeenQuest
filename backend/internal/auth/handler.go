package auth

import (
	"errors"

	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/platform/response"
	"github.com/chawais/deenquest/backend/internal/platform/validator"
)

type Handler struct {
	authService *Service
}

func NewHandler(authService *Service) *Handler {
	return &Handler{authService: authService}
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

func (h *Handler) Signup(c *gin.Context) {
	var req SignupRequest
	if !bindAndValidate(c, &req) {
		return
	}

	if err := h.authService.Signup(c.Request.Context(), &req); err != nil {
		if errors.Is(err, ErrEmailExists) {
			response.BadRequest(c, "Email already exists")
			return
		}
		response.InternalError(c, "Failed to create user")
		return
	}

	response.Created(c, "User created successfully", nil)
}

func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if !bindAndValidate(c, &req) {
		return
	}

	result, err := h.authService.Login(c.Request.Context(), &req)
	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			response.Unauthorized(c, "Invalid email or password")
			return
		}
		response.InternalError(c, "Failed to login")
		return
	}

	response.OK(c, "Login successful", result)
}
