package http

import (
	"errors"
	"net/url"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/platform/response"
	"github.com/chawais/deenquest/backend/internal/tester/application"
)

type AdminHandler struct {
	svc *application.Service
}

func NewAdminHandler(svc *application.Service) *AdminHandler {
	return &AdminHandler{svc: svc}
}

// GET /admin/testers?days=14
func (h *AdminHandler) Report(c *gin.Context) {
	days, _ := strconv.Atoi(c.Query("days"))

	report, err := h.svc.Report(c.Request.Context(), days)
	if err != nil {
		response.InternalError(c, "failed to build tester report")
		return
	}
	response.OK(c, "tester report", report)
}

// GET /admin/testers/roster
func (h *AdminHandler) Roster(c *gin.Context) {
	entries, err := h.svc.Roster(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to load tester roster")
		return
	}
	response.OK(c, "tester roster", entries)
}

type rosterRequest struct {
	// Emails accepts either one address per element or a whole pasted blob;
	// the service splits on commas, newlines and spaces either way.
	Emails  []string `json:"emails"`
	Replace bool     `json:"replace"`
}

// POST /admin/testers/roster
func (h *AdminHandler) SaveRoster(c *gin.Context) {
	var req rosterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	entries, err := h.svc.SaveRoster(c.Request.Context(), req.Emails, req.Replace)
	if err != nil {
		if errors.Is(err, application.ErrNoEmails) {
			response.BadRequest(c, "no valid email addresses in the list")
			return
		}
		response.InternalError(c, "failed to save tester roster")
		return
	}
	response.OK(c, "tester roster saved", entries)
}

// DELETE /admin/testers/roster/:email
func (h *AdminHandler) DeleteRoster(c *gin.Context) {
	email, err := url.PathUnescape(c.Param("email"))
	if err != nil {
		response.BadRequest(c, "invalid email")
		return
	}

	if err := h.svc.DeleteRoster(c.Request.Context(), email); err != nil {
		if errors.Is(err, application.ErrNoEmails) {
			response.BadRequest(c, "invalid email")
			return
		}
		response.InternalError(c, "failed to remove tester")
		return
	}
	response.OK(c, "tester removed", gin.H{"email": email})
}
