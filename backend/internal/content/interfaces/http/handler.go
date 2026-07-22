package http

import (
	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/content/domain"

	"github.com/chawais/deenquest/backend/internal/platform/response"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

// GetContentRegistry returns the component/mini-game/block schema catalog.
func (h *Handler) GetContentRegistry() domain.ContentRegistry {
	return domain.BuildContentRegistry()
}

// GET /admin/registry
func (h *Handler) GetRegistry(c *gin.Context) {
	response.OK(c, "registry fetched", domain.BuildContentRegistry())
}
