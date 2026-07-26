package http

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/hifz/application"
	"github.com/chawais/deenquest/backend/internal/hifz/domain"
	"github.com/chawais/deenquest/backend/internal/platform/response"
)

const maxAudioBytes = 12 << 20 // 12 MB

type Handler struct {
	service *application.Service
}

func NewHandler(service *application.Service) *Handler {
	return &Handler{service: service}
}

// GetOverview handles GET /hifz/overview — the Hifz home screen payload.
func (h *Handler) GetOverview(c *gin.Context) {
	overview, err := h.service.Overview(c.Request.Context(), c.GetString("user_id"))
	if err != nil {
		response.InternalError(c, "Failed to load your hifz progress")
		return
	}
	response.OK(c, "Hifz overview", overview)
}

// GetPlans handles GET /hifz/plans.
func (h *Handler) GetPlans(c *gin.Context) {
	plans, err := h.service.ListPlans(c.Request.Context(), c.GetString("user_id"))
	if err != nil {
		response.InternalError(c, "Failed to load hifz plans")
		return
	}
	response.OK(c, "Hifz plans", plans)
}

type enrollRequest struct {
	PlanID    string `json:"plan_id" binding:"required"`
	ReciterID string `json:"reciter_id"`
}

// PostEnroll handles POST /hifz/enroll.
func (h *Handler) PostEnroll(c *gin.Context) {
	var req enrollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid enrollment payload: "+err.Error())
		return
	}

	enrollment, err := h.service.Enroll(c.Request.Context(), c.GetString("user_id"), application.EnrollInput{
		PlanID:    req.PlanID,
		ReciterID: req.ReciterID,
	})
	if err != nil {
		if errors.Is(err, domain.ErrPlanNotFound) {
			response.NotFound(c, "That hifz plan does not exist")
			return
		}
		response.InternalError(c, "Failed to start this plan")
		return
	}
	response.OK(c, "Enrolled", enrollment)
}

// GetToday handles GET /hifz/today — the Sabaq/Sabqi/Manzil queues.
func (h *Handler) GetToday(c *gin.Context) {
	plan, err := h.service.Today(c.Request.Context(), c.GetString("user_id"))
	if err != nil {
		response.InternalError(c, "Failed to build today's hifz plan")
		return
	}
	response.OK(c, "Today's hifz", plan)
}

func (h *Handler) GetSettings(c *gin.Context) {
	cfg, err := h.service.Settings(c.Request.Context())
	if err != nil {
		response.InternalError(c, "Failed to load hifz settings")
		return
	}
	// Reciters are the only setting the app still lets a learner choose.
	response.OK(c, "Hifz settings", gin.H{
		"reciters": cfg.Reciters,
	})
}

type startSessionRequest struct {
	PortionID string `json:"portion_id" binding:"required"`
	Queue     string `json:"queue"`
}

// PostSession handles POST /hifz/sessions.
func (h *Handler) PostSession(c *gin.Context) {
	var req startSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid session payload: "+err.Error())
		return
	}

	queue := domain.Queue(req.Queue)
	if queue != domain.QueueSabqi && queue != domain.QueueManzil {
		queue = domain.QueueSabaq
	}

	view, err := h.service.StartSession(c.Request.Context(), c.GetString("user_id"), req.PortionID, queue)
	if err != nil {
		switch {
		case errors.Is(err, application.ErrNoPlanSelected):
			response.BadRequest(c, "Pick a hifz plan first")
		case errors.Is(err, domain.ErrPortionNotFound):
			response.NotFound(c, "That portion is not part of your plan")
		default:
			response.InternalError(c, "Failed to start the session")
		}
		return
	}
	response.OK(c, "Session started", view)
}

type stageRequest struct {
	Stage      string `json:"stage" binding:"required"`
	Challenge  string `json:"challenge_type"`
	RawScore   int    `json:"raw_score"`
	HintsUsed  int    `json:"hints_used"`
	LatencyMS  int    `json:"latency_ms"`
	Overridden bool   `json:"overridden"`
}

// PostStage handles POST /hifz/sessions/:id/stage.
func (h *Handler) PostStage(c *gin.Context) {
	var req stageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid stage payload: "+err.Error())
		return
	}

	session, err := h.service.SubmitStage(c.Request.Context(), c.GetString("user_id"), c.Param("id"),
		application.StageResult{
			Stage:      domain.Stage(req.Stage),
			Challenge:  req.Challenge,
			RawScore:   req.RawScore,
			HintsUsed:  req.HintsUsed,
			LatencyMS:  req.LatencyMS,
			Overridden: req.Overridden,
		})
	if err != nil {
		h.sessionError(c, err, "Failed to record that step")
		return
	}
	response.OK(c, "Step recorded", session)
}

// PostRecite handles POST /hifz/sessions/:id/recite — multipart audio.
func (h *Handler) PostRecite(c *gin.Context) {
	file, err := c.FormFile("audio")
	if err != nil {
		response.BadRequest(c, "An audio file is required")
		return
	}
	if file.Size > maxAudioBytes {
		response.BadRequest(c, "That recording is too long — record one ayah at a time")
		return
	}

	src, err := file.Open()
	if err != nil {
		response.BadRequest(c, "Could not read the audio file")
		return
	}
	defer src.Close()

	ayahNumber, _ := strconv.Atoi(c.PostForm("ayah_number"))
	lastAyah := c.PostForm("last_ayah") == "true"

	result, err := h.service.SubmitRecitation(
		c.Request.Context(), c.GetString("user_id"), c.Param("id"),
		ayahNumber, lastAyah, src, file.Filename,
	)
	if err != nil {
		h.sessionError(c, err, "Failed to check your recitation")
		return
	}
	response.OK(c, result.Message, result)
}

// PostComplete handles POST /hifz/sessions/:id/complete.
func (h *Handler) PostComplete(c *gin.Context) {
	result, err := h.service.CompleteSession(c.Request.Context(), c.GetString("user_id"), c.Param("id"))
	if err != nil {
		h.sessionError(c, err, "Failed to finish the session")
		return
	}
	response.OK(c, "Session complete", result)
}

// PostResetPortion handles POST /hifz/portions/:id/reset.
func (h *Handler) PostResetPortion(c *gin.Context) {
	if err := h.service.ResetPortion(c.Request.Context(), c.GetString("user_id"), c.Param("id")); err != nil {
		response.InternalError(c, "Failed to reset that portion")
		return
	}
	response.OK(c, "Portion reset", nil)
}

// GetMistakes handles GET /hifz/mistakes — the words you keep dropping.
func (h *Handler) GetMistakes(c *gin.Context) {
	limit, _ := strconv.Atoi(c.Query("limit"))
	mistakes, err := h.service.Mistakes(c.Request.Context(), c.GetString("user_id"), limit)
	if err != nil {
		response.InternalError(c, "Failed to load your mistake log")
		return
	}
	response.OK(c, "Mistake log", mistakes)
}

func (h *Handler) sessionError(c *gin.Context, err error, fallback string) {
	switch {
	case errors.Is(err, domain.ErrSessionNotFound):
		response.NotFound(c, "That session has expired — start it again")
	case errors.Is(err, domain.ErrSessionFinished):
		response.BadRequest(c, "That session is already finished")
	default:
		response.InternalError(c, fallback)
	}
}
