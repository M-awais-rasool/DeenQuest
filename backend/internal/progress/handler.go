package progress

import (
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

func (h *Handler) GetProgress(c *gin.Context) {
	userID := c.GetString("user_id")
	result, err := h.service.GetUserProgress(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, "failed to fetch progress")
		return
	}
	response.OK(c, "progress fetched", result)
}

func (h *Handler) GetPublicProgress(c *gin.Context) {
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

func (h *Handler) GetLeaderboard(c *gin.Context) {
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
