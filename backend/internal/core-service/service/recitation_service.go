package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/chawais/talent-flow/backend/internal/core-service/model"
	"github.com/chawais/talent-flow/backend/internal/core-service/repository"
	"github.com/chawais/talent-flow/backend/pkg/logger"
)

// whisperResponse mirrors the JSON returned by the Whisper microservice.
type whisperResponse struct {
	Text       string  `json:"text"`
	Language   string  `json:"language"`
	Confidence float64 `json:"confidence"`
}

// defaultLessonXP is used when a lesson carries no explicit xp_reward field.
const defaultLessonXP = 25

// RecitationService handles all recitation check logic.
type RecitationService struct {
	repo       repository.CoreRepository
	whisperURL string // e.g. "http://whisper-service:8001"
	httpClient *http.Client
}

// NewRecitationService wires up the service. whisperURL should point to the
// Python faster-whisper microservice.
func NewRecitationService(repo repository.CoreRepository, whisperURL string) *RecitationService {
	return &RecitationService{
		repo:       repo,
		whisperURL: whisperURL,
		httpClient: &http.Client{Timeout: 60 * time.Second},
	}
}

// extractArabicText reads the Arabic text out of a lesson's Data map.
// QuranReaderComponent uses the key "text"; DuaCardComponent uses "arabic".
func extractArabicText(lesson model.Lesson) (string, error) {
	for _, key := range []string{"text", "arabic"} {
		if v, ok := lesson.Data[key]; ok {
			if s, ok := v.(string); ok && s != "" {
				return s, nil
			}
		}
	}
	return "", fmt.Errorf("lesson of type %s has no arabic text (checked 'text' and 'arabic' keys)", lesson.Component)
}

// extractLessonXP reads the optional xp_reward field from lesson Data,
// falling back to defaultLessonXP if absent.
func extractLessonXP(lesson model.Lesson) int {
	if v, ok := lesson.Data["xp_reward"]; ok {
		switch x := v.(type) {
		case int:
			if x > 0 {
				return x
			}
		case int32:
			if x > 0 {
				return int(x)
			}
		case int64:
			if x > 0 {
				return int(x)
			}
		case float64:
			if x > 0 {
				return int(x)
			}
		}
	}
	return defaultLessonXP
}

// CheckRecitation is the core feature endpoint.
// It:
//  1. Fetches the level and extracts the arabic text from the lesson at lessonIndex.
//  2. Calls the Whisper service to transcribe the audio.
//  3. Runs Arabic fuzzy comparison word-by-word.
//  4. Persists the attempt.
//  5. Awards XP to the user.
//  6. Returns a rich word-level result.
func (s *RecitationService) CheckRecitation(
	ctx context.Context,
	userID string,
	levelID int,
	lessonIndex int,
	audioData []byte,
	audioFilename string,
) (*model.RecitationCheckResult, error) {
	logger.Info("RecitationCheck started",
		zap.String("user_id", userID),
		zap.Int("level_id", levelID),
		zap.Int("lesson_index", lessonIndex),
		zap.Int("audio_bytes", len(audioData)),
	)

	// ── 1. Fetch level and extract Arabic text ────────────────────────────────
	level, err := s.repo.GetLevelByID(ctx, levelID)
	if err != nil {
		return nil, fmt.Errorf("get level %d: %w", levelID, err)
	}
	if level == nil {
		return nil, fmt.Errorf("level %d not found", levelID)
	}
	if lessonIndex < 0 || lessonIndex >= len(level.Lessons) {
		return nil, fmt.Errorf("lesson_index %d out of range (level %d has %d lessons)", lessonIndex, levelID, len(level.Lessons))
	}
	lesson := level.Lessons[lessonIndex]

	arabicText, err := extractArabicText(lesson)
	if err != nil {
		return nil, err
	}
	baseXP := extractLessonXP(lesson)

	logger.Info("Lesson Arabic text found",
		zap.Int("level_id", levelID),
		zap.Int("lesson_index", lessonIndex),
		zap.String("component", lesson.Component),
		zap.String("arabic_text", arabicText),
		zap.Int("base_xp", baseXP),
	)

	// ── 2. Transcribe via Whisper ─────────────────────────────────────────────
	transcript, err := s.callWhisper(ctx, audioData, audioFilename)
	if err != nil {
		logger.Error("Whisper call failed", zap.Error(err))
		return nil, fmt.Errorf("transcription service unavailable: %w", err)
	}
	logger.Info("Whisper transcript received",
		zap.String("transcript", transcript.Text),
		zap.String("detected_language", transcript.Language),
	)

	// ── 3. Arabic fuzzy comparison ────────────────────────────────────────────
	words, score := CompareRecitation(arabicText, transcript.Text)
	stars := ScoreToStars(score)
	message := ScoreToFeedback(score)
	xpEarned := ScoreToXP(score, baseXP)

	logger.Info("Recitation comparison complete",
		zap.Int("score", score),
		zap.Int("stars", stars),
		zap.Int("xp_earned", xpEarned),
		zap.Int("word_count", len(words)),
	)

	// ── 4. Count previous attempts ────────────────────────────────────────────
	attemptNum, err := s.repo.CountUserRecitationAttempts(ctx, userID, levelID, lessonIndex)
	if err != nil {
		logger.Warn("Failed to count attempts (non-fatal)", zap.Error(err))
	}
	attemptNum++ // this is the new attempt number

	// ── 5. Persist attempt ────────────────────────────────────────────────────
	attempt := &model.RecitationAttempt{
		ID:          uuid.New().String(),
		UserID:      userID,
		LevelID:     levelID,
		LessonIndex: lessonIndex,
		Score:       score,
		Stars:       stars,
		Words:       words,
		XPEarned:    xpEarned,
		Transcript:  transcript.Text,
		AttemptNum:  attemptNum,
		CreatedAt:   time.Now(),
	}
	if err := s.repo.SaveRecitationAttempt(ctx, attempt); err != nil {
		logger.Error("Failed to save recitation attempt", zap.Error(err))
		// non-fatal: return result even if persistence fails
	}

	// ── 6. Award XP ───────────────────────────────────────────────────────────
	if xpEarned > 0 {
		if err := s.awardXP(ctx, userID, xpEarned); err != nil {
			logger.Error("Failed to award XP", zap.Error(err))
			// non-fatal
		}
	}

	return &model.RecitationCheckResult{
		Score:      score,
		Stars:      stars,
		Words:      words,
		Message:    message,
		XPEarned:   xpEarned,
		Transcript: transcript.Text,
		AttemptNum: attemptNum,
	}, nil
}

// callWhisper forwards the audio bytes to the Python Whisper service as
// multipart/form-data and returns the transcription response.
func (s *RecitationService) callWhisper(
	ctx context.Context,
	audioData []byte,
	filename string,
) (*whisperResponse, error) {
	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)

	fw, err := mw.CreateFormFile("audio", filename)
	if err != nil {
		return nil, fmt.Errorf("create form file: %w", err)
	}
	if _, err := fw.Write(audioData); err != nil {
		return nil, fmt.Errorf("write audio: %w", err)
	}
	if err := mw.Close(); err != nil {
		return nil, fmt.Errorf("close multipart writer: %w", err)
	}

	url := s.whisperURL + "/transcribe"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, &buf)
	if err != nil {
		return nil, fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Content-Type", mw.FormDataContentType())

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("whisper request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return nil, fmt.Errorf("whisper returned %d: %s", resp.StatusCode, string(body))
	}

	var result whisperResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode whisper response: %w", err)
	}
	return &result, nil
}

// awardXP increments the user's total XP in the progress document.
func (s *RecitationService) awardXP(ctx context.Context, userID string, xp int) error {
	progress, err := s.repo.GetProgress(ctx, userID)
	if err != nil {
		return err
	}
	if progress == nil {
		progress = &model.Progress{
			ID:     uuid.New().String(),
			UserID: userID,
		}
	}
	progress.TotalXP += xp
	logger.Info("Awarding XP for recitation",
		zap.String("user_id", userID),
		zap.Int("xp", xp),
		zap.Int("total_xp", progress.TotalXP),
	)
	return s.repo.UpsertProgress(ctx, progress)
}
