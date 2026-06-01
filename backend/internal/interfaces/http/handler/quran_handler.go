package handler

import (
	"errors"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	quransvc "github.com/chawais/talent-flow/backend/internal/application/quran"
	"github.com/chawais/talent-flow/backend/internal/domain/quran"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/response"
)

type QuranHandler struct {
	service *quransvc.Service
}

func NewQuranHandler(service *quransvc.Service) *QuranHandler {
	return &QuranHandler{service: service}
}

func (h *QuranHandler) GetSurahList(c *gin.Context) {
	surahs, err := h.service.GetSurahList(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to fetch surahs")
		return
	}
	response.OK(c, "surahs fetched", surahs)
}

func (h *QuranHandler) GetSurahByID(c *gin.Context) {
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

func (h *QuranHandler) GetSurahAudio(c *gin.Context) {
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
	if err != nil || quran.ValidateSurahID(id) != nil {
		response.BadRequest(c, "surah id must be between 1 and 114")
		return 0, false
	}
	return id, true
}

func writeQuranError(c *gin.Context, err error, fallback string) {
	if errors.Is(err, quran.ErrInvalidSurahID) {
		response.BadRequest(c, "surah id must be between 1 and 114")
		return
	}
	if errors.Is(err, quran.ErrSurahNotFound) {
		response.NotFound(c, "surah not found")
		return
	}
	response.InternalError(c, fallback)
}
