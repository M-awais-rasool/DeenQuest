package user

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/platform/response"
)

// AdminHandler serves the admin-panel user endpoints used by the App Icons page:
// searching users and pinning a per-user dynamic app icon.
type AdminHandler struct {
	service *Service
}

func NewAdminHandler(service *Service) *AdminHandler {
	return &AdminHandler{service: service}
}

// GET /admin/users?search=&limit=
func (h *AdminHandler) ListUsers(c *gin.Context) {
	limit, _ := strconv.Atoi(c.Query("limit"))
	rows, err := h.service.ListUsers(c.Request.Context(), c.Query("search"), limit)
	if err != nil {
		response.InternalError(c, "failed to list users")
		return
	}
	response.OK(c, "users fetched", rows)
}

// PUT /admin/users/:id/app-icon
func (h *AdminHandler) SetAppIcon(c *gin.Context) {
	var req SetAppIconRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	err := h.service.SetAppIcon(c.Request.Context(), c.Param("id"), req.Icon)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidIcon):
			response.BadRequest(c, "invalid app-icon value")
		case errors.Is(err, ErrUserNotFound):
			response.NotFound(c, "user not found")
		default:
			response.InternalError(c, "failed to set app icon")
		}
		return
	}

	response.OK(c, "app icon updated", gin.H{"id": c.Param("id"), "icon": req.Icon})
}
