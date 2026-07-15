package progress

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/chawais/deenquest/backend/internal/platform/logger"
)

type whisperResponse struct {
	Text       string  `json:"text"`
	Language   string  `json:"language"`
	Confidence float64 `json:"confidence"`
}

const defaultLessonXP = 25

type RecitationCoach interface {
	Generate(ctx context.Context, system, userPrompt string) (string, error)
}

type RecitationService struct {
	repo       CoreRepository
	whisperURL string // e.g. "http://whisper-service:8001"
	httpClient *http.Client
	coach      RecitationCoach
}

func NewRecitationService(repo CoreRepository, whisperURL string) *RecitationService {
	return &RecitationService{
		repo:       repo,
		whisperURL: whisperURL,
		httpClient: &http.Client{Timeout: 60 * time.Second},
	}
}

func (s *RecitationService) SetCoach(c RecitationCoach) { s.coach = c }

const recitationPassScore = 60

const recitationCoachPrompt = "You are a gentle Quran recitation (tajweed) coach for beginners. " +
	"Given the Arabic words a learner mispronounced, give ONE short tip (max 25 words) on how to say them more clearly — " +
	"mention the articulation point (makhraj) simply. Keep Arabic words in Arabic script. " +
	"Do NOT give religious rulings. Plain text only."

func (s *RecitationService) buildCoaching(ctx context.Context, score int, words []WordResult) *RecitationCoaching {
	var focus []string
	seen := make(map[string]struct{})
	for _, w := range words {
		if (w.Status == WordWrong || w.Status == WordMissing) && w.Text != "" {
			if _, ok := seen[w.Text]; ok {
				continue
			}
			seen[w.Text] = struct{}{}
			focus = append(focus, w.Text)
		}
	}

	pass := score >= recitationPassScore
	c := &RecitationCoaching{Pass: pass, FocusWords: focus}
	switch {
	case len(focus) == 0 && pass:
		c.Tip = "Excellent recitation — you can move on."
	case pass:
		c.Tip = "Great! Polish these words: " + strings.Join(focus, "، ")
	default:
		c.Tip = "Let's practice these again, slowly: " + strings.Join(focus, "، ")
	}

	// Optional AI explanation for the focus words (short timeout; best-effort).
	if s.coach != nil && len(focus) > 0 {
		gctx, cancel := context.WithTimeout(ctx, 8*time.Second)
		defer cancel()
		prompt := "The learner mispronounced these words: " + strings.Join(focus, "، ") + ". Give one short tip to fix them."
		if exp, err := s.coach.Generate(gctx, recitationCoachPrompt, prompt); err == nil {
			c.Explanation = strings.TrimSpace(exp)
		}
	}
	return c
}

func extractArabicText(lesson Lesson) (string, error) {
	for _, key := range []string{"text", "arabic"} {
		if v, ok := lesson.Data[key]; ok {
			if s, ok := v.(string); ok && s != "" {
				return s, nil
			}
		}
	}
	return "", fmt.Errorf("lesson of type %s has no arabic text (checked 'text' and 'arabic' keys)", lesson.Component)
}

func extractLessonXP(lesson Lesson) int {
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

func (s *RecitationService) CheckRecitation(
	ctx context.Context,
	userID string,
	levelID int,
	lessonIndex int,
	audio io.Reader,
	audioFilename string,
) (*RecitationCheckResult, error) {
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

	transcript, err := s.callWhisper(ctx, audio, audioFilename, arabicText)
	if err != nil {
		logger.Error("Whisper call failed", zap.Error(err))
		return nil, fmt.Errorf("transcription service unavailable: %w", err)
	}

	words, score := CompareRecitation(arabicText, transcript.Text)
	message := ScoreToFeedback(score)
	xpEarned := ScoreToXP(score, baseXP)

	attemptNum, err := s.repo.CountUserRecitationAttempts(ctx, userID, levelID, lessonIndex)
	if err != nil {
		logger.Warn("Failed to count attempts (non-fatal)", zap.Error(err))
	}
	attemptNum++

	attempt := &RecitationAttempt{
		ID:          uuid.New().String(),
		UserID:      userID,
		LevelID:     levelID,
		LessonIndex: lessonIndex,
		Score:       score,
		Words:       words,
		XPEarned:    xpEarned,
		Transcript:  transcript.Text,
		AttemptNum:  attemptNum,
		CreatedAt:   time.Now(),
	}
	if err := s.repo.SaveRecitationAttempt(ctx, attempt); err != nil {
		logger.Error("Failed to save recitation attempt", zap.Error(err))
	}

	if xpEarned > 0 {
		if err := s.awardXP(ctx, userID, xpEarned); err != nil {
			logger.Error("Failed to award XP", zap.Error(err))
		}
	}

	return &RecitationCheckResult{
		Score:      score,
		Words:      words,
		Message:    message,
		XPEarned:   xpEarned,
		Transcript: transcript.Text,
		AttemptNum: attemptNum,
		Coaching:   s.buildCoaching(ctx, score, words),
	}, nil
}

func (s *RecitationService) callWhisper(
	ctx context.Context,
	audio io.Reader,
	filename string,
	prompt string,
) (*whisperResponse, error) {
	pr, pw := io.Pipe()
	mw := multipart.NewWriter(pw)

	go func() {
		fw, err := mw.CreateFormFile("audio", filename)
		if err != nil {
			_ = pw.CloseWithError(fmt.Errorf("create form file: %w", err))
			return
		}
		if _, err := io.Copy(fw, audio); err != nil {
			_ = pw.CloseWithError(fmt.Errorf("write audio: %w", err))
			return
		}
		if prompt != "" {
			if err := mw.WriteField("initial_prompt", prompt); err != nil {
				_ = pw.CloseWithError(fmt.Errorf("write prompt: %w", err))
				return
			}
		}
		_ = pw.CloseWithError(mw.Close())
	}()

	url := s.whisperURL + "/transcribe"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, pr)
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

func (s *RecitationService) awardXP(ctx context.Context, userID string, xp int) error {
	_, err := s.repo.IncrementProgress(ctx, userID, xp, 0)
	return err
}
