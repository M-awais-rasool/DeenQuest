package http

import (
	"errors"
	"net/http"

	"github.com/chawais/deenquest/backend/internal/coach/application"
	"github.com/chawais/deenquest/backend/internal/coach/domain"

	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/platform/response"
)

type Handler struct {
	service *application.Service
}

func NewHandler(service *application.Service) *Handler {
	return &Handler{service: service}
}

type ingestRequest struct {
	IdempotencyKey string                  `json:"idempotency_key"`
	Events         []domain.TelemetryEvent `json:"events" binding:"required"`
}

// PostEvents handles POST /telemetry/events — the batched ingest endpoint.
func (h *Handler) PostEvents(c *gin.Context) {
	userID := c.GetString("user_id")

	var req ingestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid telemetry payload: "+err.Error())
		return
	}

	accepted, err := h.service.Ingest(c.Request.Context(), userID, req.IdempotencyKey, req.Events)
	if err != nil {
		response.InternalError(c, "Failed to ingest telemetry")
		return
	}
	response.OK(c, "Events accepted", gin.H{"accepted": accepted})
}

// GetInsights handles GET /coach/insights — replaces getMockCoachState().
func (h *Handler) GetInsights(c *gin.Context) {
	userID := c.GetString("user_id")

	state, err := h.service.CoachState(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, "Failed to load coach insights")
		return
	}
	if state == nil {
		c.JSON(http.StatusOK, response.APIResponse{Success: true, Message: "Coach has no data yet"})
		return
	}
	response.OK(c, "Coach insights", state)
}

// GetPractice handles GET /coach/practice?insight_id=… — compiles and returns
func (h *Handler) GetPractice(c *gin.Context) {
	userID := c.GetString("user_id")
	insightID := c.Query("insight_id")
	if insightID == "" {
		response.BadRequest(c, "insight_id is required")
		return
	}

	lvl, err := h.service.Practice(c.Request.Context(), userID, insightID)
	if err != nil {
		switch {
		case errors.Is(err, application.ErrInsightNotFound):
			response.NotFound(c, "domain.Insight not found")
		case errors.Is(err, application.ErrNoPractice):
			response.NotFound(c, "This insight has no practice drill")
		default:
			response.InternalError(c, "Failed to build practice")
		}
		return
	}
	response.OK(c, "Practice level", lvl)
}

type completePracticeRequest struct {
	InsightID string `json:"insight_id" binding:"required"`
}

// CompletePractice handles POST /coach/practice/complete — marks the insight
func (h *Handler) CompletePractice(c *gin.Context) {
	userID := c.GetString("user_id")

	var req completePracticeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "insight_id is required")
		return
	}

	xp, err := h.service.CompletePractice(c.Request.Context(), userID, req.InsightID)
	if err != nil {
		if errors.Is(err, application.ErrInsightNotFound) {
			response.NotFound(c, "domain.Insight not found")
			return
		}
		response.InternalError(c, "Failed to complete practice")
		return
	}
	response.OK(c, "Practice completed", gin.H{"xp_earned": xp})
}
