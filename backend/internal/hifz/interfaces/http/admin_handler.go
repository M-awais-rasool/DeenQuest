package http

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/hifz/application"
	"github.com/chawais/deenquest/backend/internal/hifz/domain"
	"github.com/chawais/deenquest/backend/internal/platform/response"
)

type AdminHandler struct {
	service *application.AdminService
}

func NewAdminHandler(service *application.AdminService) *AdminHandler {
	return &AdminHandler{service: service}
}

// ── plans ────────────────────────────────────────────────────────────────────

func (h *AdminHandler) ListPlans(c *gin.Context) {
	plans, err := h.service.ListPlans(c.Request.Context())
	if err != nil {
		response.InternalError(c, "Failed to load hifz plans")
		return
	}
	response.OK(c, "Hifz plans", plans)
}

func (h *AdminHandler) GetPlan(c *gin.Context) {
	plan, err := h.service.GetPlan(c.Request.Context(), c.Param("id"))
	if err != nil {
		if errors.Is(err, domain.ErrPlanNotFound) {
			response.NotFound(c, "Plan not found")
			return
		}
		response.InternalError(c, "Failed to load the plan")
		return
	}
	response.OK(c, "Hifz plan", plan)
}

func (h *AdminHandler) CreatePlan(c *gin.Context) {
	var plan domain.Plan
	if err := c.ShouldBindJSON(&plan); err != nil {
		response.BadRequest(c, "Invalid plan payload: "+err.Error())
		return
	}
	saved, err := h.service.SavePlan(c.Request.Context(), &plan)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.Created(c, "Plan created", saved)
}

func (h *AdminHandler) UpdatePlan(c *gin.Context) {
	var plan domain.Plan
	if err := c.ShouldBindJSON(&plan); err != nil {
		response.BadRequest(c, "Invalid plan payload: "+err.Error())
		return
	}
	plan.ID = c.Param("id")

	saved, err := h.service.SavePlan(c.Request.Context(), &plan)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, "Plan updated", saved)
}

func (h *AdminHandler) DeletePlan(c *gin.Context) {
	if err := h.service.DeletePlan(c.Request.Context(), c.Param("id")); err != nil {
		response.InternalError(c, "Failed to delete the plan")
		return
	}
	response.OK(c, "Plan deleted", nil)
}

func (h *AdminHandler) PreviewPortions(c *gin.Context) {
	var plan domain.Plan
	if err := c.ShouldBindJSON(&plan); err != nil {
		response.BadRequest(c, "Invalid plan payload: "+err.Error())
		return
	}

	withText, err := strconv.Atoi(c.DefaultQuery("with_text", "6"))
	if err != nil || withText < 0 {
		withText = 6
	}
	if withText > 20 {
		withText = 20
	}

	preview, err := h.service.PreviewPortions(c.Request.Context(), &plan, withText)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, "Portion preview", preview)
}

// ── settings ─────────────────────────────────────────────────────────────────

func (h *AdminHandler) GetSettings(c *gin.Context) {
	cfg, err := h.service.GetSettings(c.Request.Context())
	if err != nil {
		response.InternalError(c, "Failed to load hifz settings")
		return
	}
	response.OK(c, "Hifz settings", cfg)
}

func (h *AdminHandler) UpdateSettings(c *gin.Context) {
	var cfg domain.Settings
	if err := c.ShouldBindJSON(&cfg); err != nil {
		response.BadRequest(c, "Invalid settings payload: "+err.Error())
		return
	}
	saved, err := h.service.SaveSettings(c.Request.Context(), &cfg)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, "Settings saved", saved)
}

// GetChallenges handles GET /admin/hifz/challenges — the catalog plus config.
func (h *AdminHandler) GetChallenges(c *gin.Context) {
	catalog, err := h.service.ChallengeCatalog(c.Request.Context())
	if err != nil {
		response.InternalError(c, "Failed to load the challenge catalog")
		return
	}
	response.OK(c, "Challenge catalog", catalog)
}
