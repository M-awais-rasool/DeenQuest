package http

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/challenge/application"
	"github.com/chawais/deenquest/backend/internal/challenge/domain"
	"github.com/chawais/deenquest/backend/internal/platform/response"
)

type Handler struct {
	service *application.Service
}

func NewHandler(service *application.Service) *Handler {
	return &Handler{service: service}
}

// GetOverview returns the whole Challenges screen in one call.
func (h *Handler) GetOverview(c *gin.Context) {
	overview, err := h.service.GetOverview(c.Request.Context(), c.GetString("user_id"))
	if err != nil {
		response.InternalError(c, "failed to load challenges")
		return
	}
	response.OK(c, "challenges fetched", overview)
}

// CreateDuel opens a duel and returns the code to share.
func (h *Handler) CreateDuel(c *gin.Context) {
	duel, err := h.service.CreateDuel(c.Request.Context(), c.GetString("user_id"))
	if err != nil {
		writeError(c, err, "failed to create duel")
		return
	}
	response.Created(c, "duel created", duel)
}

// JoinDuel redeems a shared duel code.
func (h *Handler) JoinDuel(c *gin.Context) {
	var req application.JoinRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "a code is required")
		return
	}
	duel, err := h.service.JoinDuel(c.Request.Context(), c.GetString("user_id"), req.Code)
	if err != nil {
		writeError(c, err, "failed to join duel")
		return
	}
	response.OK(c, "duel joined", duel)
}

// CancelDuel withdraws a duel the caller is part of.
func (h *Handler) CancelDuel(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "duel id is required")
		return
	}
	if err := h.service.CancelDuel(c.Request.Context(), c.GetString("user_id"), id); err != nil {
		writeError(c, err, "failed to cancel duel")
		return
	}
	response.OK(c, "duel cancelled", gin.H{"duel_id": id})
}

// CreateGroup starts a shared group challenge.
func (h *Handler) CreateGroup(c *gin.Context) {
	var req application.CreateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid group challenge payload")
		return
	}
	group, err := h.service.CreateGroup(c.Request.Context(), c.GetString("user_id"), req)
	if err != nil {
		writeError(c, err, "failed to create group challenge")
		return
	}
	response.Created(c, "group challenge created", group)
}

// JoinGroup adds the caller to a group challenge by code.
func (h *Handler) JoinGroup(c *gin.Context) {
	var req application.JoinRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "a code is required")
		return
	}
	group, err := h.service.JoinGroup(c.Request.Context(), c.GetString("user_id"), req.Code)
	if err != nil {
		writeError(c, err, "failed to join group challenge")
		return
	}
	response.OK(c, "group challenge joined", group)
}

type encourageRequest struct {
	TargetUserID string `json:"target_user_id"`
}

// Encourage records a nudge sent to a fellow participant.
func (h *Handler) Encourage(c *gin.Context) {
	var req encourageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "a target user is required")
		return
	}
	if err := h.service.Encourage(c.Request.Context(), c.GetString("user_id"), req.TargetUserID); err != nil {
		writeError(c, err, "failed to send encouragement")
		return
	}
	response.OK(c, "encouragement sent", gin.H{"target_user_id": req.TargetUserID})
}

// writeError maps the module's sentinel errors onto status codes, so the client
// can tell "bad code" apart from "server is down".
func writeError(c *gin.Context, err error, fallback string) {
	switch {
	case errors.Is(err, domain.ErrDuelNotFound), errors.Is(err, domain.ErrGroupNotFound):
		response.NotFound(c, "that code did not match an open challenge")
	case errors.Is(err, domain.ErrSelfJoin):
		response.BadRequest(c, "you cannot join your own challenge")
	case errors.Is(err, domain.ErrDuelUnavailable):
		response.Conflict(c, "that duel has already started or expired")
	case errors.Is(err, domain.ErrActiveDuel):
		response.Conflict(c, "you already have a duel in progress")
	case errors.Is(err, domain.ErrAlreadyJoined):
		response.Conflict(c, "you have already joined that challenge")
	case errors.Is(err, domain.ErrGroupFull):
		response.Conflict(c, "that group challenge is full")
	case errors.Is(err, domain.ErrDuplicateEncouragement):
		response.Conflict(c, "you already encouraged them today")
	case errors.Is(err, domain.ErrNotAParticipant):
		response.Forbidden(c, "they are not in one of your challenges")
	case errors.Is(err, application.ErrInvalidRequest):
		response.Error(c, http.StatusBadRequest, err.Error())
	default:
		response.InternalError(c, fallback)
	}
}
