package controller

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/chawais/talent-flow/backend/internal/core-service/service"
	"github.com/chawais/talent-flow/backend/pkg/response"
)

type CoreController struct {
	service *service.CoreService
}

func NewCoreController(service *service.CoreService) *CoreController {
	return &CoreController{service: service}
}

func (h *CoreController) GetProgress(c *gin.Context) {
	userID := c.GetString("user_id")
	result, err := h.service.GetUserProgress(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, "failed to fetch progress")
		return
	}
	response.OK(c, "progress fetched", result)
}

func (h *CoreController) GetLeaderboard(c *gin.Context) {
	limit := 0 // 0 means return all users
	rawLimit := c.Query("limit")
	if rawLimit != "" {
		parsed, err := strconv.Atoi(rawLimit)
		if err != nil || parsed < 1 {
			response.BadRequest(c, "limit must be a positive integer")
			return
		}
		if parsed > 2000 {
			response.BadRequest(c, "limit must be <= 2000")
			return
		}
		limit = parsed
	}

	result, err := h.service.GetLeaderboard(c.Request.Context(), limit)
	if err != nil {
		response.InternalError(c, "failed to fetch leaderboard")
		return
	}

	response.OK(c, "leaderboard fetched", result)
}

func (h *CoreController) GetDailyTasks(c *gin.Context) {
	userID := c.GetString("user_id")
	tasks, err := h.service.GetDailyTasks(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, "failed to fetch daily tasks")
		return
	}
	response.OK(c, "daily tasks fetched", tasks)
}

func (h *CoreController) CompleteDailyTask(c *gin.Context) {
	userID := c.GetString("user_id")
	taskID := c.Param("id")
	if taskID == "" {
		response.BadRequest(c, "task id is required")
		return
	}
	err := h.service.CompleteDailyTask(c.Request.Context(), userID, taskID)
	if err != nil {
		response.InternalError(c, "failed to complete daily task")
		return
	}
	response.OK(c, "daily task completed", gin.H{"task_id": taskID})
}

// ─── Level Journey Endpoints ───

func (h *CoreController) GetLevels(c *gin.Context) {
	userID := c.GetString("user_id")
	levels, err := h.service.GetLevels(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, "failed to fetch levels")
		return
	}
	response.OK(c, "levels fetched", levels)
}

func (h *CoreController) GetLevelDetail(c *gin.Context) {
	userID := c.GetString("user_id")
	levelID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid level id")
		return
	}
	level, err := h.service.GetLevelDetail(c.Request.Context(), userID, levelID)
	if err != nil {
		response.InternalError(c, "failed to fetch level detail")
		return
	}
	response.OK(c, "level detail fetched", level)
}

func (h *CoreController) CompleteLesson(c *gin.Context) {
	userID := c.GetString("user_id")
	levelID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid level id")
		return
	}

	var body struct {
		LessonIndex int `json:"lesson_index"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, "lesson_index is required")
		return
	}

	ul, err := h.service.CompleteLessonInLevel(c.Request.Context(), userID, levelID, body.LessonIndex)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.OK(c, "lesson completed", ul)
}

func (h *CoreController) CompleteLevel(c *gin.Context) {
	userID := c.GetString("user_id")
	levelID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid level id")
		return
	}

	var body struct {
		Stars int `json:"stars"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		body.Stars = 1
	}

	result, err := h.service.CompleteLevel(c.Request.Context(), userID, levelID, body.Stars)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}
	response.OK(c, "level completed", result)
}
