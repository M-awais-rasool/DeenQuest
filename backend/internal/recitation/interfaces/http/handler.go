package http

import (
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/chawais/deenquest/backend/internal/recitation/application"
	"github.com/chawais/deenquest/backend/internal/recitation/domain"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/chawais/deenquest/backend/internal/platform/logger"
	"github.com/chawais/deenquest/backend/internal/platform/response"
)

const maxAudioSize = 10 << 20
const queueFullRetryAfter = 20 * time.Second

type Handler struct {
	queue *application.JobQueue
}

func NewHandler(queue *application.JobQueue) *Handler {
	return &Handler{queue: queue}
}

func (h *Handler) CheckRecitation(c *gin.Context) {
	userID := c.GetString("user_id")

	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxAudioSize)

	form, err := readSubmission(c.Request)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	levelID, err := strconv.Atoi(form.levelID)
	if err != nil || levelID < 1 {
		response.BadRequest(c, "level_id must be a positive integer")
		return
	}
	lessonIndex, err := strconv.Atoi(form.lessonIndex)
	if err != nil || lessonIndex < 0 {
		response.BadRequest(c, "lesson_index must be a non-negative integer")
		return
	}

	accepted, err := h.queue.Submit(c.Request.Context(), userID, levelID, lessonIndex, form.audio, form.filename)
	switch {
	case errors.Is(err, domain.ErrQueueFull):
		logger.Warn("recitation queue is full; shedding a submission",
			zap.String("user_id", userID))
		response.TooManyRequests(c,
			"too many recitations are being checked right now — please try again in a moment",
			queueFullRetryAfter)
		return
	case err != nil:
		logger.Warn("recitation submission rejected",
			zap.String("user_id", userID),
			zap.Int("level_id", levelID),
			zap.Int("lesson_index", lessonIndex),
			zap.Error(err))
		response.BadRequest(c, err.Error())
		return
	}

	logger.Info("recitation queued",
		zap.String("user_id", userID),
		zap.String("job_id", accepted.JobID),
		zap.Int("level_id", levelID),
		zap.Int("lesson_index", lessonIndex),
		zap.Int("position", accepted.Position),
		zap.Int("size_bytes", len(form.audio)))

	response.Accepted(c, "recitation queued", accepted)
}

type submission struct {
	levelID     string
	lessonIndex string
	filename    string
	audio       []byte
}

const maxFieldSize = 1 << 10

func readSubmission(r *http.Request) (*submission, error) {
	reader, err := r.MultipartReader()
	if err != nil {
		return nil, errors.New("expected a multipart form with an audio file")
	}

	form := &submission{}
	for {
		part, err := reader.NextPart()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return nil, errors.New("audio file too large or malformed request (max 10 MB)")
		}

		switch part.FormName() {
		case "audio":
			form.filename = part.FileName()
			form.audio, err = io.ReadAll(io.LimitReader(part, maxAudioSize))
		case "level_id":
			form.levelID, err = readField(part)
		case "lesson_index":
			form.lessonIndex, err = readField(part)
		}
		_ = part.Close()
		if err != nil {
			return nil, errors.New("audio file too large or malformed request (max 10 MB)")
		}
	}

	switch {
	case form.levelID == "":
		return nil, errors.New("level_id is required")
	case form.lessonIndex == "":
		return nil, errors.New("lesson_index is required")
	case len(form.audio) == 0:
		return nil, errors.New("audio file is required")
	}
	return form, nil
}

func readField(part io.Reader) (string, error) {
	value, err := io.ReadAll(io.LimitReader(part, maxFieldSize))
	return strings.TrimSpace(string(value)), err
}

func (h *Handler) RecitationJob(c *gin.Context) {
	userID := c.GetString("user_id")

	jobID := c.Param("job_id")
	if jobID == "" {
		response.BadRequest(c, "job_id is required")
		return
	}

	state, err := h.queue.Status(c.Request.Context(), userID, jobID)
	switch {
	case errors.Is(err, domain.ErrJobNotFound):
		response.NotFound(c, "that recitation is no longer available — please record it again")
		return
	case err != nil:
		logger.Error("recitation job lookup failed",
			zap.String("job_id", jobID), zap.Error(err))
		response.InternalError(c, "could not read the recitation status")
		return
	}

	response.OK(c, "recitation status", state)
}
