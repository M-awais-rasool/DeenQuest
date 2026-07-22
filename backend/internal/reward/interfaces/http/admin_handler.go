package http

import (
	"errors"

	"github.com/chawais/deenquest/backend/internal/reward/application"
	"github.com/chawais/deenquest/backend/internal/reward/domain"

	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/platform/response"
)

type AdminHandler struct {
	service *application.Service
}

func NewAdminHandler(service *application.Service) *AdminHandler {
	return &AdminHandler{service: service}
}

// GET /admin/rewards
func (h *AdminHandler) ListRewards(c *gin.Context) {
	rewards, err := h.service.AdminList(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to list rewards")
		return
	}
	response.OK(c, "rewards fetched", rewards)
}

// GET /admin/rewards/:id
func (h *AdminHandler) GetReward(c *gin.Context) {
	reward, err := h.service.AdminGet(c.Request.Context(), c.Param("id"))
	if err != nil {
		if errors.Is(err, domain.ErrRewardNotFound) {
			response.NotFound(c, "reward not found")
			return
		}
		response.InternalError(c, "failed to fetch reward")
		return
	}
	response.OK(c, "reward fetched", reward)
}

// POST /admin/rewards
func (h *AdminHandler) CreateReward(c *gin.Context) {
	var in domain.Reward
	if err := c.ShouldBindJSON(&in); err != nil {
		response.BadRequest(c, "invalid reward payload: "+err.Error())
		return
	}
	created, err := h.service.AdminCreate(c.Request.Context(), &in)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.Created(c, "reward created", created)
}

// PUT /admin/rewards/:id
func (h *AdminHandler) UpdateReward(c *gin.Context) {
	var in domain.Reward
	if err := c.ShouldBindJSON(&in); err != nil {
		response.BadRequest(c, "invalid reward payload: "+err.Error())
		return
	}
	updated, err := h.service.AdminUpdate(c.Request.Context(), c.Param("id"), &in)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, "reward updated", updated)
}

// DELETE /admin/rewards/:id
func (h *AdminHandler) DeleteReward(c *gin.Context) {
	if err := h.service.AdminDelete(c.Request.Context(), c.Param("id")); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, "reward deleted", gin.H{"id": c.Param("id")})
}
