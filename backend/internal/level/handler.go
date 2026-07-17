package level

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/platform/response"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func parseOptionalCourseType(raw string) (CourseType, bool) {
	if raw == "" {
		return "", true
	}
	return CourseTypeFromString(raw)
}

func (h *Handler) GetLevels(c *gin.Context) {
	userID := c.GetString("user_id")
	courseType, ok := CourseTypeOrDefault(c.Query("course_type"))
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

func (h *Handler) GetLevelDetail(c *gin.Context) {
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
	lvl, err := h.service.GetLevelDetail(c.Request.Context(), userID, levelID, courseType)
	if err != nil {
		if errors.Is(err, ErrLevelNotFound) {
			response.NotFound(c, "level not found")
			return
		}
		response.InternalError(c, "failed to fetch level detail")
		return
	}
	response.OK(c, "level detail fetched", lvl)
}

func (h *Handler) CompleteLesson(c *gin.Context) {
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
		if errors.Is(err, ErrLevelNotFound) {
			response.NotFound(c, "level not found")
			return
		}
		if errors.Is(err, ErrInvalidLessonIndex) {
			response.BadRequest(c, "invalid lesson index")
			return
		}
		response.InternalError(c, err.Error())
		return
	}
	response.OK(c, "lesson completed", ul)
}

func (h *Handler) CompleteLevel(c *gin.Context) {
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
		if errors.Is(err, ErrLevelNotFound) {
			response.NotFound(c, "level not found")
			return
		}
		response.InternalError(c, err.Error())
		return
	}
	response.OK(c, "level completed", result)
}
