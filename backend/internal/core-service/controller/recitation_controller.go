package controller

import (
	"io"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/chawais/talent-flow/backend/internal/core-service/service"
	"github.com/chawais/talent-flow/backend/pkg/logger"
	"github.com/chawais/talent-flow/backend/pkg/response"
)

// maxAudioSize is the maximum allowed audio upload (10 MB). Prevents DoS.
const maxAudioSize = 10 << 20 // 10 MB

// RecitationController exposes the recitation-check API.
type RecitationController struct {
	svc *service.RecitationService
}

// NewRecitationController creates the controller.
func NewRecitationController(svc *service.RecitationService) *RecitationController {
	return &RecitationController{svc: svc}
}

// CheckRecitation godoc
// POST /api/v1/recitation/check
// Multipart form fields:
//   - level_id      (int)  — required: which level contains the ayah
//   - lesson_index  (int)  — required: index of the lesson within the level
//   - audio         (file) — required, max 10 MB, .m4a/.wav/.mp3/.ogg
//
// Arabic text is read directly from the level's lesson data stored in MongoDB
// (lesson.Data["text"] for QuranReaderComponent, lesson.Data["arabic"] for DuaCardComponent).
func (h *RecitationController) CheckRecitation(c *gin.Context) {
	userID := c.GetString("user_id")

	levelIDStr := c.PostForm("level_id")
	if levelIDStr == "" {
		response.BadRequest(c, "level_id is required")
		return
	}
	levelID, err := strconv.Atoi(levelIDStr)
	if err != nil || levelID < 1 {
		response.BadRequest(c, "level_id must be a positive integer")
		return
	}

	lessonIndexStr := c.PostForm("lesson_index")
	if lessonIndexStr == "" {
		response.BadRequest(c, "lesson_index is required")
		return
	}
	lessonIndex, err := strconv.Atoi(lessonIndexStr)
	if err != nil || lessonIndex < 0 {
		response.BadRequest(c, "lesson_index must be a non-negative integer")
		return
	}

	logger.Info("RecitationCheck request received",
		zap.String("user_id", userID),
		zap.Int("level_id", levelID),
		zap.Int("lesson_index", lessonIndex),
	)

	// Enforce size limit before parsing the file
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxAudioSize)
	if err := c.Request.ParseMultipartForm(maxAudioSize); err != nil {
		response.BadRequest(c, "audio file too large or malformed request (max 10 MB)")
		return
	}

	file, header, err := c.Request.FormFile("audio")
	if err != nil {
		response.BadRequest(c, "audio file is required")
		return
	}
	defer file.Close()

	logger.Info("Audio file received",
		zap.String("filename", header.Filename),
		zap.Int64("size_bytes", header.Size),
	)

	audioData, err := io.ReadAll(io.LimitReader(file, maxAudioSize))
	if err != nil {
		logger.Error("Failed to read audio bytes", zap.Error(err))
		response.InternalError(c, "failed to read audio file")
		return
	}

	result, err := h.svc.CheckRecitation(
		c.Request.Context(),
		userID,
		levelID,
		lessonIndex,
		audioData,
		header.Filename,
	)
	if err != nil {
		logger.Error("CheckRecitation service error", zap.Error(err))
		response.InternalError(c, err.Error())
		return
	}

	logger.Info("RecitationCheck completed",
		zap.String("user_id", userID),
		zap.Int("level_id", levelID),
		zap.Int("lesson_index", lessonIndex),
		zap.Int("score", result.Score),
		zap.Int("stars", result.Stars),
		zap.Int("xp_earned", result.XPEarned),
	)

	response.OK(c, "recitation checked", result)
}
