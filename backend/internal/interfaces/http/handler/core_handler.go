package handler

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"

	progresssvc "github.com/chawais/talent-flow/backend/internal/application/progress"
	"github.com/chawais/talent-flow/backend/internal/domain/progress"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/response"
)

type CoreHandler struct {
	service *progresssvc.CoreService
}

func NewCoreHandler(service *progresssvc.CoreService) *CoreHandler {
	return &CoreHandler{service: service}
}

func (h *CoreHandler) GetProgress(c *gin.Context) {
	userID := c.GetString("user_id")
	result, err := h.service.GetUserProgress(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, "failed to fetch progress")
		return
	}
	response.OK(c, "progress fetched", result)
}

func (h *CoreHandler) GetPublicProgress(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		response.BadRequest(c, "user id is required")
		return
	}
	result, err := h.service.GetPublicProgress(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, "failed to fetch progress")
		return
	}
	response.OK(c, "public progress fetched", result)
}

const defaultLeaderboardLimit = 100

func (h *CoreHandler) GetLeaderboard(c *gin.Context) {
	limit := defaultLeaderboardLimit
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

func (h *CoreHandler) GetDailyTasks(c *gin.Context) {
	userID := c.GetString("user_id")
	tasks, err := h.service.GetDailyTasks(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, "failed to fetch daily tasks")
		return
	}
	response.OK(c, "daily tasks fetched", tasks)
}

func (h *CoreHandler) CompleteDailyTask(c *gin.Context) {
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

func parseOptionalCourseType(raw string) (progress.CourseType, bool) {
	if raw == "" {
		return "", true
	}
	return progress.CourseTypeFromString(raw)
}

func (h *CoreHandler) GetLevels(c *gin.Context) {
	userID := c.GetString("user_id")
	courseType, ok := progress.CourseTypeOrDefault(c.Query("course_type"))
	if !ok {
		response.BadRequest(c, "invalid course_type")
		return
	}
	levels, err := h.service.GetLevels(c.Request.Context(), userID, courseType)
	if err != nil {
		response.InternalError(c, "failed to fetch levels")
		return
	}
	response.OK(c, "levels fetched", levels)
}

func (h *CoreHandler) GetLevelDetail(c *gin.Context) {
	userID := c.GetString("user_id")
	levelID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid level id")
		return
	}
	courseType, ok := parseOptionalCourseType(c.Query("course_type"))
	if !ok {
		response.BadRequest(c, "invalid course_type")
		return
	}
	level, err := h.service.GetLevelDetail(c.Request.Context(), userID, levelID, courseType)
	if err != nil {
		if errors.Is(err, progresssvc.ErrLevelNotFound) {
			response.NotFound(c, "level not found")
			return
		}
		response.InternalError(c, "failed to fetch level detail")
		return
	}
	response.OK(c, "level detail fetched", level)
}

func (h *CoreHandler) CompleteLesson(c *gin.Context) {
	userID := c.GetString("user_id")
	levelID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid level id")
		return
	}

	var body struct {
		LessonIndex int    `json:"lesson_index"`
		CourseType  string `json:"course_type"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, "lesson_index is required")
		return
	}

	rawCourseType := c.Query("course_type")
	if rawCourseType == "" {
		rawCourseType = body.CourseType
	}
	courseType, ok := parseOptionalCourseType(rawCourseType)
	if !ok {
		response.BadRequest(c, "invalid course_type")
		return
	}

	ul, err := h.service.CompleteLessonInLevel(c.Request.Context(), userID, levelID, body.LessonIndex, courseType)
	if err != nil {
		if errors.Is(err, progresssvc.ErrLevelNotFound) {
			response.NotFound(c, "level not found")
			return
		}
		if errors.Is(err, progresssvc.ErrInvalidLessonIndex) {
			response.BadRequest(c, "invalid lesson index")
			return
		}
		response.InternalError(c, err.Error())
		return
	}
	response.OK(c, "lesson completed", ul)
}

func (h *CoreHandler) CompleteLevel(c *gin.Context) {
	userID := c.GetString("user_id")
	levelID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid level id")
		return
	}

	var body struct {
		CourseType string `json:"course_type"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
	}

	rawCourseType := c.Query("course_type")
	if rawCourseType == "" {
		rawCourseType = body.CourseType
	}
	courseType, ok := parseOptionalCourseType(rawCourseType)
	if !ok {
		response.BadRequest(c, "invalid course_type")
		return
	}

	result, err := h.service.CompleteLevel(c.Request.Context(), userID, levelID, courseType)
	if err != nil {
		if errors.Is(err, progresssvc.ErrLevelNotFound) {
			response.NotFound(c, "level not found")
			return
		}
		response.InternalError(c, err.Error())
		return
	}
	response.OK(c, "level completed", result)
}

func (h *CoreHandler) GetRewards(c *gin.Context) {
	userID := c.GetString("user_id")
	rewards, err := h.service.GetRewards(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, "failed to fetch rewards")
		return
	}
	response.OK(c, "rewards fetched", rewards)
}
