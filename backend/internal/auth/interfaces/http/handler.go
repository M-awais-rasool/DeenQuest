package http

import (
	"errors"

	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/auth/application"
	"github.com/chawais/deenquest/backend/internal/platform/response"
	"github.com/chawais/deenquest/backend/internal/platform/validator"
)

type Handler struct {
	authService *application.Service
}

func NewHandler(authService *application.Service) *Handler {
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

// GET /auth/providers
func (h *Handler) Providers(c *gin.Context) {
	response.OK(c, "providers fetched", gin.H{"providers": h.authService.Providers()})
}

// POST /auth/oauth/:provider
func (h *Handler) SignInWithProvider(c *gin.Context) {
	var req application.OAuthSignInRequest
	if !bindAndValidate(c, &req) {
		return
	}
	req.UserAgent = c.GetHeader("User-Agent")

	result, err := h.authService.SignInWithProvider(c.Request.Context(), c.Param("provider"), &req)
	if err != nil {
		switch {
		case errors.Is(err, application.ErrProviderUnavailable):
			response.BadRequest(c, "That sign-in provider is not available")
		case errors.Is(err, application.ErrInvalidIDToken):
			response.Unauthorized(c, "Could not verify that sign-in")
		default:
			response.InternalError(c, "Failed to sign in")
		}
		return
	}

	response.OK(c, "Signed in", result)
}

// POST /auth/refresh
func (h *Handler) Refresh(c *gin.Context) {
	var req application.RefreshRequest
	if !bindAndValidate(c, &req) {
		return
	}
	req.UserAgent = c.GetHeader("User-Agent")

	result, err := h.authService.Refresh(c.Request.Context(), &req)
	if err != nil {
		switch {
		case errors.Is(err, application.ErrTokenReuse):
			response.Unauthorized(c, "Session expired, please sign in again")
		case errors.Is(err, application.ErrInvalidRefreshToken), errors.Is(err, application.ErrUserNotFound):
			response.Unauthorized(c, "Session expired, please sign in again")
		default:
			response.InternalError(c, "Failed to refresh session")
		}
		return
	}

	response.OK(c, "Session refreshed", result)
}

// POST /auth/logout
func (h *Handler) Logout(c *gin.Context) {
	var req application.LogoutRequest
	if !bindAndValidate(c, &req) {
		return
	}

	if err := h.authService.Logout(c.Request.Context(), req.RefreshToken); err != nil {
		response.InternalError(c, "Failed to sign out")
		return
	}

	response.OK(c, "Signed out", nil)
}

// GET /auth/sessions
func (h *Handler) ListSessions(c *gin.Context) {
	sessions, err := h.authService.ListSessions(
		c.Request.Context(),
		c.GetString("user_id"),
		c.Query("current"),
	)
	if err != nil {
		response.InternalError(c, "Failed to list sessions")
		return
	}

	response.OK(c, "sessions fetched", sessions)
}

// DELETE /auth/sessions/:id
func (h *Handler) RevokeSession(c *gin.Context) {
	err := h.authService.RevokeSession(c.Request.Context(), c.GetString("user_id"), c.Param("id"))
	if err != nil {
		response.NotFound(c, "Session not found")
		return
	}

	response.OK(c, "Session revoked", nil)
}
