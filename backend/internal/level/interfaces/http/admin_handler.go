package http

import (
	"errors"
	"strconv"

	"github.com/chawais/deenquest/backend/internal/level/application"
	"github.com/chawais/deenquest/backend/internal/level/domain"

	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/platform/response"
)

type AdminHandler struct {
	service *application.Service
}

func NewAdminHandler(service *application.Service) *AdminHandler {
	return &AdminHandler{service: service}
}

// GET /admin/levels
func (h *AdminHandler) ListLevels(c *gin.Context) {
	levels, err := h.service.AdminList(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to list levels")
		return
	}
	response.OK(c, "levels fetched", levels)
}

// GET /admin/levels/:id
func (h *AdminHandler) GetLevel(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid level id")
		return
	}
	lvl, err := h.service.AdminGet(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, application.ErrLevelNotFound) {
			response.NotFound(c, "level not found")
			return
		}
		response.InternalError(c, "failed to fetch level")
		return
	}
	response.OK(c, "level fetched", lvl)
}

// POST /admin/levels
func (h *AdminHandler) CreateLevel(c *gin.Context) {
	var in domain.Level
	if err := c.ShouldBindJSON(&in); err != nil {
		response.BadRequest(c, "invalid level payload: "+err.Error())
		return
	}
	created, err := h.service.AdminCreate(c.Request.Context(), &in)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.Created(c, "level created", created)
}

// PUT /admin/levels/:id
func (h *AdminHandler) UpdateLevel(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid level id")
		return
	}
	var in domain.Level
	if err := c.ShouldBindJSON(&in); err != nil {
		response.BadRequest(c, "invalid level payload: "+err.Error())
		return
	}
	updated, err := h.service.AdminUpdate(c.Request.Context(), id, &in)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, "level updated", updated)
}

// DELETE /admin/levels/:id
func (h *AdminHandler) DeleteLevel(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid level id")
		return
	}
	if err := h.service.AdminDelete(c.Request.Context(), id); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, "level deleted", gin.H{"id": id})
}
