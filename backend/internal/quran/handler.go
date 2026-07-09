package quran

import (
	"errors"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/platform/response"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) GetSurahList(c *gin.Context) {
	surahs, err := h.service.GetSurahList(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to fetch surahs")
		return
	}
	response.OK(c, "surahs fetched", surahs)
}

func (h *Handler) GetSurahByID(c *gin.Context) {
	id, ok := parseSurahID(c)
	if !ok {
		return
	}

	translation := strings.TrimSpace(c.Query("translation"))
	surah, err := h.service.GetSurahByID(c.Request.Context(), id, translation)
	if err != nil {
		writeQuranError(c, err, "failed to fetch surah")
		return
	}
	response.OK(c, "surah fetched", surah)
}

func (h *Handler) GetSurahAudio(c *gin.Context) {
	id, ok := parseSurahID(c)
	if !ok {
		return
	}

	audio, err := h.service.GetSurahAudio(c.Request.Context(), id)
	if err != nil {
		writeQuranError(c, err, "failed to fetch surah audio")
		return
	}
	response.OK(c, "surah audio fetched", audio)
}

func parseSurahID(c *gin.Context) (int, bool) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || ValidateSurahID(id) != nil {
		response.BadRequest(c, "surah id must be between 1 and 114")
		return 0, false
	}
	return id, true
}

func writeQuranError(c *gin.Context, err error, fallback string) {
	if errors.Is(err, ErrInvalidSurahID) {
		response.BadRequest(c, "surah id must be between 1 and 114")
		return
	}
	if errors.Is(err, ErrSurahNotFound) {
		response.NotFound(c, "surah not found")
		return
	}
	response.InternalError(c, fallback)
}
