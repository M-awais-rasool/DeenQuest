package handler

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"

	progresssvc "github.com/chawais/talent-flow/backend/internal/application/progress"
	"github.com/chawais/talent-flow/backend/internal/domain/progress"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/response"
)

// AdminHandler exposes the CMS endpoints used by the admin panel: the content
// registry plus CRUD for the real Level and DailyTask models.
type AdminHandler struct {
	service   *progresssvc.CoreService
	analytics progress.AnalyticsRepository
}

func NewAdminHandler(service *progresssvc.CoreService, analytics progress.AnalyticsRepository) *AdminHandler {
	return &AdminHandler{service: service, analytics: analytics}
}

// GET /admin/registry
func (h *AdminHandler) GetRegistry(c *gin.Context) {
	response.OK(c, "registry fetched", h.service.GetContentRegistry())
}

// GET /admin/analytics
func (h *AdminHandler) GetAnalytics(c *gin.Context) {
	data, err := h.analytics.GetAdminAnalytics(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to compute analytics")
		return
	}
	response.OK(c, "analytics fetched", data)
}

// ─── Levels ────────────────────────────────────────────────────────────────

// GET /admin/levels
func (h *AdminHandler) ListLevels(c *gin.Context) {
	levels, err := h.service.AdminListLevels(c.Request.Context())
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
	level, err := h.service.AdminGetLevel(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, progresssvc.ErrLevelNotFound) {
			response.NotFound(c, "level not found")
			return
		}
		response.InternalError(c, "failed to fetch level")
		return
	}
	response.OK(c, "level fetched", level)
}

// POST /admin/levels
func (h *AdminHandler) CreateLevel(c *gin.Context) {
	var in progress.Level
	if err := c.ShouldBindJSON(&in); err != nil {
		response.BadRequest(c, "invalid level payload: "+err.Error())
		return
	}
	created, err := h.service.AdminCreateLevel(c.Request.Context(), &in)
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
	var in progress.Level
	if err := c.ShouldBindJSON(&in); err != nil {
		response.BadRequest(c, "invalid level payload: "+err.Error())
		return
	}
	updated, err := h.service.AdminUpdateLevel(c.Request.Context(), id, &in)
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
	if err := h.service.AdminDeleteLevel(c.Request.Context(), id); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, "level deleted", gin.H{"id": id})
}

// ─── Daily tasks ─────────────────────────────────────────────────────────────

// GET /admin/tasks
func (h *AdminHandler) ListTasks(c *gin.Context) {
	tasks, err := h.service.AdminListTasks(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to list tasks")
		return
	}
	response.OK(c, "tasks fetched", tasks)
}

// GET /admin/tasks/:id
func (h *AdminHandler) GetTask(c *gin.Context) {
	task, err := h.service.AdminGetTask(c.Request.Context(), c.Param("id"))
	if err != nil {
		if errors.Is(err, progresssvc.ErrTaskNotFound) {
			response.NotFound(c, "task not found")
			return
		}
		response.InternalError(c, "failed to fetch task")
		return
	}
	response.OK(c, "task fetched", task)
}

// POST /admin/tasks
func (h *AdminHandler) CreateTask(c *gin.Context) {
	var in progress.DailyTask
	if err := c.ShouldBindJSON(&in); err != nil {
		response.BadRequest(c, "invalid task payload: "+err.Error())
		return
	}
	created, err := h.service.AdminCreateTask(c.Request.Context(), &in)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.Created(c, "task created", created)
}

// PUT /admin/tasks/:id
func (h *AdminHandler) UpdateTask(c *gin.Context) {
	var in progress.DailyTask
	if err := c.ShouldBindJSON(&in); err != nil {
		response.BadRequest(c, "invalid task payload: "+err.Error())
		return
	}
	updated, err := h.service.AdminUpdateTask(c.Request.Context(), c.Param("id"), &in)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, "task updated", updated)
}

// DELETE /admin/tasks/:id
func (h *AdminHandler) DeleteTask(c *gin.Context) {
	if err := h.service.AdminDeleteTask(c.Request.Context(), c.Param("id")); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, "task deleted", gin.H{"id": c.Param("id")})
}

// ─── Rewards ─────────────────────────────────────────────────────────────────

// GET /admin/rewards
func (h *AdminHandler) ListRewards(c *gin.Context) {
	rewards, err := h.service.AdminListRewards(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to list rewards")
		return
	}
	response.OK(c, "rewards fetched", rewards)
}

// GET /admin/rewards/:id
func (h *AdminHandler) GetReward(c *gin.Context) {
	reward, err := h.service.AdminGetReward(c.Request.Context(), c.Param("id"))
	if err != nil {
		if errors.Is(err, progresssvc.ErrRewardNotFound) {
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
	var in progress.Reward
	if err := c.ShouldBindJSON(&in); err != nil {
		response.BadRequest(c, "invalid reward payload: "+err.Error())
		return
	}
	created, err := h.service.AdminCreateReward(c.Request.Context(), &in)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.Created(c, "reward created", created)
}

// PUT /admin/rewards/:id
func (h *AdminHandler) UpdateReward(c *gin.Context) {
	var in progress.Reward
	if err := c.ShouldBindJSON(&in); err != nil {
		response.BadRequest(c, "invalid reward payload: "+err.Error())
		return
	}
	updated, err := h.service.AdminUpdateReward(c.Request.Context(), c.Param("id"), &in)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, "reward updated", updated)
}

// DELETE /admin/rewards/:id
func (h *AdminHandler) DeleteReward(c *gin.Context) {
	if err := h.service.AdminDeleteReward(c.Request.Context(), c.Param("id")); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, "reward deleted", gin.H{"id": c.Param("id")})
}
