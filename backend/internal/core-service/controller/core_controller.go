package controller

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/chawais/talent-flow/backend/internal/core-service/model"
	"github.com/chawais/talent-flow/backend/internal/core-service/service"
	"github.com/chawais/talent-flow/backend/pkg/response"
	"github.com/chawais/talent-flow/backend/pkg/validator"
)

type CoreController struct {
	service *service.CoreService
}

type CreateHabitRequest struct {
	Title       string          `json:"title" validate:"required,min=2,max=128"`
	Type        model.HabitType `json:"type" validate:"required,oneof=prayer quran task"`
	TargetDaily int             `json:"target_daily" validate:"required,min=1,max=20"`
}

type CompleteHabitRequest struct {
	XP int `json:"xp" validate:"required,min=1,max=500"`
}

type ReflectionRequest struct {
	Text      string `json:"text" validate:"required,min=5,max=2000"`
	MoodScore int    `json:"mood_score" validate:"required,min=1,max=10"`
}

func NewCoreController(service *service.CoreService) *CoreController {
	return &CoreController{service: service}
}

func (h *CoreController) CreateHabit(c *gin.Context) {
	userID := c.GetString("user_id")
	var req CreateHabitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if err := validator.Validate(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errors": validator.FormatValidationErrors(err)})
		return
	}

	habit, err := h.service.CreateHabit(c.Request.Context(), userID, req.Title, req.Type, req.TargetDaily)
	if err != nil {
		response.InternalError(c, "failed to create habit")
		return
	}
	response.Created(c, "habit created", habit)
}

func (h *CoreController) ListHabits(c *gin.Context) {
	userID := c.GetString("user_id")
	habits, err := h.service.ListHabits(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, "failed to list habits")
		return
	}
	response.OK(c, "habits fetched", habits)
}

func (h *CoreController) CompleteHabit(c *gin.Context) {
	userID := c.GetString("user_id")
	habitID := c.Param("id")
	var req CompleteHabitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if err := validator.Validate(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errors": validator.FormatValidationErrors(err)})
		return
	}

	err := h.service.CompleteHabit(c.Request.Context(), userID, habitID, req.XP)
	if err != nil {
		if errors.Is(err, service.ErrHabitNotFound) {
			response.NotFound(c, "habit not found")
			return
		}
		response.InternalError(c, "failed to complete habit")
		return
	}
	response.OK(c, "habit completed", gin.H{"habit_id": habitID})
}

func (h *CoreController) GetProgress(c *gin.Context) {
	userID := c.GetString("user_id")
	progress, streak, err := h.service.GetProgress(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, "failed to fetch progress")
		return
	}
	response.OK(c, "progress fetched", gin.H{"progress": progress, "streak": streak})
}

func (h *CoreController) AddReflection(c *gin.Context) {
	userID := c.GetString("user_id")
	var req ReflectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}
	if err := validator.Validate(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "errors": validator.FormatValidationErrors(err)})
		return
	}

	item, err := h.service.AddReflection(c.Request.Context(), userID, req.Text, req.MoodScore)
	if err != nil {
		response.InternalError(c, "failed to add reflection")
		return
	}
	response.Created(c, "reflection added", item)
}

func (h *CoreController) ListAchievements(c *gin.Context) {
	userID := c.GetString("user_id")
	items, err := h.service.ListAchievements(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, "failed to list achievements")
		return
	}
	response.OK(c, "achievements fetched", items)
}
