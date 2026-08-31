package application

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/chawais/deenquest/backend/internal/recitation/domain"

	"github.com/google/uuid"
	"go.uber.org/zap"

	leveldomain "github.com/chawais/deenquest/backend/internal/level/domain"
	"github.com/chawais/deenquest/backend/internal/platform/logger"
	progressapp "github.com/chawais/deenquest/backend/internal/progress/application"
)

type whisperResponse struct {
	Text       string  `json:"text"`
	Language   string  `json:"language"`
	Confidence float64 `json:"confidence"`
}

type WhisperEngine string

const (
	EngineFasterWhisper WhisperEngine = "faster-whisper"
	EngineWhisperCPP    WhisperEngine = "whisper-cpp"
)

type engineDialect struct {
	path      string
	fileField string
	fields    map[string]string
}

func dialectFor(engine WhisperEngine) engineDialect {
	if engine == EngineWhisperCPP {
		return engineDialect{
			path:      "/inference",
			fileField: "file",
			fields:    map[string]string{"language": "ar", "response_format": "json"},
		}
	}
	return engineDialect{path: "/transcribe", fileField: "audio"}
}

const defaultLessonXP = 25

type RecitationCoach interface {
	Generate(ctx context.Context, system, userPrompt string) (string, error)
}

type LevelSource interface {
	LevelByID(ctx context.Context, levelID int) (*leveldomain.Level, error)
}

type Service struct {
	repo         domain.Repository
	levels       LevelSource
	progress     *progressapp.Service
	whisperURL   string // e.g. "http://whisper-service:8001"
	whisperToken string // shared secret; the whisper service has no other auth
	httpClient   *http.Client
	coach        RecitationCoach

	whisperSlots chan struct{}
	whisperWait  time.Duration
	dialect      engineDialect

	coachMu    sync.Mutex
	coachCache map[string]string
}

func NewService(repo domain.Repository, whisperURL, whisperToken string, levels LevelSource, progressSvc *progressapp.Service) *Service {
	return &Service{
		repo:         repo,
		levels:       levels,
		progress:     progressSvc,
		whisperURL:   whisperURL,
		whisperToken: whisperToken,
		httpClient:   &http.Client{Timeout: 60 * time.Second},
		whisperSlots: make(chan struct{}, 1),
		whisperWait:  defaultTranscribeWait,
		dialect:      dialectFor(EngineFasterWhisper),
	}
}

func (s *Service) SetEngine(engine WhisperEngine) {
	s.dialect = dialectFor(engine)
}

func (s *Service) SetCoach(c RecitationCoach) { s.coach = c }

func (s *Service) SetTranscribeLimits(concurrency int, wait time.Duration) {
	if concurrency < 1 {
		concurrency = 1
	}
	if wait <= 0 {
		wait = defaultTranscribeWait
	}
	s.whisperSlots = make(chan struct{}, concurrency)
	s.whisperWait = wait
}

var ErrTranscriberBusy = errors.New("transcription service is busy")

const defaultTranscribeWait = 45 * time.Second

func (s *Service) acquireTranscriber(ctx context.Context) (func(), error) {
	if s.whisperSlots == nil {
		return func() {}, nil
	}

	timer := time.NewTimer(s.whisperWait)
	defer timer.Stop()

	select {
	case s.whisperSlots <- struct{}{}:
		return func() { <-s.whisperSlots }, nil
	case <-ctx.Done():
		return nil, ctx.Err()
	case <-timer.C:
		return nil, ErrTranscriberBusy
	}
}

const recitationPassScore = 60

const recitationCoachPrompt = "You are a gentle Quran recitation (tajweed) coach for beginners. " +
	"Given the Arabic words a learner mispronounced, give ONE short tip (max 25 words) on how to say them more clearly — " +
	"mention the articulation point (makhraj) simply. Keep Arabic words in Arabic script. " +
	"Do NOT give religious rulings. Plain text only."

const maxFocusWords = 5

func (s *Service) buildCoaching(ctx context.Context, score int, words []domain.WordResult, heard bool) *domain.RecitationCoaching {
	pass := score >= recitationPassScore

	if !heard {
		return &domain.RecitationCoaching{Pass: false, Tip: domain.NoSpeechFeedback}
	}

	var focus []string
	seen := make(map[string]struct{})
	for _, w := range words {
		if (w.Status == domain.WordWrong || w.Status == domain.WordMissing) && w.Text != "" {
			if _, ok := seen[w.Text]; ok {
				continue
			}
			seen[w.Text] = struct{}{}
			focus = append(focus, w.Text)
		}
	}
	if len(focus) > maxFocusWords {
		focus = focus[:maxFocusWords]
	}

	c := &domain.RecitationCoaching{Pass: pass, FocusWords: focus}
	switch {
	case len(focus) == 0 && pass:
		c.Tip = "Excellent recitation — you can move on."
	case pass:
		c.Tip = "Great! Polish these words: " + strings.Join(focus, "، ")
	default:
		c.Tip = "Let's practice these again, slowly: " + strings.Join(focus, "، ")
	}

	if s.coach != nil && len(focus) > 0 && !pass {
		if cached, ok := s.cachedCoaching(focus); ok {
			c.Explanation = cached
			return c
		}
		gctx, cancel := context.WithTimeout(ctx, coachTimeout)
		defer cancel()
		prompt := "The learner mispronounced these words: " + strings.Join(focus, "، ") + ". Give one short tip to fix them."
		if exp, err := s.coach.Generate(gctx, recitationCoachPrompt, prompt); err == nil {
			c.Explanation = strings.TrimSpace(exp)
			s.cacheCoaching(focus, c.Explanation)
		}
	}
	return c
}

const coachTimeout = 3 * time.Second
const coachCacheMax = 256

func coachCacheKey(focus []string) string {
	sorted := append([]string(nil), focus...)
	sort.Strings(sorted)
	return strings.Join(sorted, "|")
}

func (s *Service) cachedCoaching(focus []string) (string, bool) {
	s.coachMu.Lock()
	defer s.coachMu.Unlock()
	exp, ok := s.coachCache[coachCacheKey(focus)]
	return exp, ok
}

func (s *Service) cacheCoaching(focus []string, explanation string) {
	if explanation == "" {
		return
	}
	s.coachMu.Lock()
	defer s.coachMu.Unlock()
	if s.coachCache == nil || len(s.coachCache) >= coachCacheMax {
		s.coachCache = make(map[string]string, coachCacheMax)
	}
	s.coachCache[coachCacheKey(focus)] = explanation
}

func extractArabicText(lesson leveldomain.Lesson) (string, error) {
	for _, key := range []string{"text", "arabic"} {
		if v, ok := lesson.Data[key]; ok {
			if s, ok := v.(string); ok && s != "" {
				return s, nil
			}
		}
	}
	return "", fmt.Errorf("lesson of type %s has no arabic text (checked 'text' and 'arabic' keys)", lesson.Component)
}

func extractLessonXP(lesson leveldomain.Lesson) int {
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

type Grade struct {
	Score      int
	Words      []domain.WordResult
	Message    string
	Transcript string
	Heard      bool
	Coaching   *domain.RecitationCoaching
}

func (s *Service) GradeAgainstText(
	ctx context.Context,
	expectedText string,
	audio io.Reader,
	audioFilename string,
) (*Grade, error) {
	if strings.TrimSpace(expectedText) == "" {
		return nil, fmt.Errorf("expected text is empty")
	}

	transcript, err := s.callWhisper(ctx, audio, audioFilename)
	if err != nil {
		logger.Error("Whisper call failed", zap.Error(err))
		return nil, fmt.Errorf("transcription service unavailable: %w", err)
	}

	words, score := domain.CompareRecitation(expectedText, transcript.Text)

	heard := strings.TrimSpace(transcript.Text) != ""
	message := domain.ScoreToFeedback(score)
	if !heard {
		message = domain.NoSpeechFeedback
		logger.Warn("Recitation produced an empty transcript",
			zap.String("filename", audioFilename))
	}

	return &Grade{
		Score:      score,
		Words:      words,
		Message:    message,
		Transcript: transcript.Text,
		Heard:      heard,
		Coaching:   s.buildCoaching(ctx, score, words, heard),
	}, nil
}

func (s *Service) ResolveLesson(ctx context.Context, levelID, lessonIndex int) (string, int, error) {
	lvl, err := s.levels.LevelByID(ctx, levelID)
	if err != nil {
		return "", 0, fmt.Errorf("get level %d: %w", levelID, err)
	}
	if lvl == nil {
		return "", 0, fmt.Errorf("level %d not found", levelID)
	}
	if lessonIndex < 0 || lessonIndex >= len(lvl.Lessons) {
		return "", 0, fmt.Errorf("lesson_index %d out of range (level %d has %d lessons)", lessonIndex, levelID, len(lvl.Lessons))
	}
	lesson := lvl.Lessons[lessonIndex]

	arabicText, err := extractArabicText(lesson)
	if err != nil {
		return "", 0, err
	}
	return arabicText, extractLessonXP(lesson), nil
}

func (s *Service) CheckRecitation(
	ctx context.Context,
	userID string,
	levelID int,
	lessonIndex int,
	audio io.Reader,
	audioFilename string,
) (*domain.RecitationCheckResult, error) {
	arabicText, baseXP, err := s.ResolveLesson(ctx, levelID, lessonIndex)
	if err != nil {
		return nil, err
	}

	grade, err := s.GradeAgainstText(ctx, arabicText, audio, audioFilename)
	if err != nil {
		return nil, err
	}

	words, score := grade.Words, grade.Score
	message := grade.Message
	xpEarned := domain.ScoreToXP(score, baseXP)

	attemptNum, err := s.repo.CountUserRecitationAttempts(ctx, userID, levelID, lessonIndex)
	if err != nil {
		logger.Warn("Failed to count attempts (non-fatal)", zap.Error(err))
	}
	attemptNum++

	attempt := &domain.RecitationAttempt{
		ID:          uuid.New().String(),
		UserID:      userID,
		LevelID:     levelID,
		LessonIndex: lessonIndex,
		Score:       score,
		Words:       words,
		XPEarned:    xpEarned,
		Transcript:  grade.Transcript,
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

	return &domain.RecitationCheckResult{
		Score:      score,
		Words:      words,
		Message:    message,
		XPEarned:   xpEarned,
		Transcript: grade.Transcript,
		AttemptNum: attemptNum,
		Coaching:   grade.Coaching,
	}, nil
}

func (s *Service) callWhisper(
	ctx context.Context,
	audio io.Reader,
	filename string,
) (*whisperResponse, error) {
	release, err := s.acquireTranscriber(ctx)
	if err != nil {
		return nil, err
	}
	defer release()

	dialect := s.dialect
	if dialect.path == "" {
		dialect = dialectFor(EngineFasterWhisper)
	}

	pr, pw := io.Pipe()
	mw := multipart.NewWriter(pw)

	go func() {
		for name, value := range dialect.fields {
			if err := mw.WriteField(name, value); err != nil {
				_ = pw.CloseWithError(fmt.Errorf("write field %s: %w", name, err))
				return
			}
		}
		fw, err := mw.CreateFormFile(dialect.fileField, filename)
		if err != nil {
			_ = pw.CloseWithError(fmt.Errorf("create form file: %w", err))
			return
		}
		if _, err := io.Copy(fw, audio); err != nil {
			_ = pw.CloseWithError(fmt.Errorf("write audio: %w", err))
			return
		}
		_ = pw.CloseWithError(mw.Close())
	}()

	url := s.whisperURL + dialect.path
	req, reqErr := http.NewRequestWithContext(ctx, http.MethodPost, url, pr)
	err = reqErr
	if err != nil {
		return nil, fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Content-Type", mw.FormDataContentType())
	if s.whisperToken != "" {
		req.Header.Set("X-Internal-Token", s.whisperToken)
	}

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

func (s *Service) awardXP(ctx context.Context, userID string, xp int) error {
	_, err := s.progress.AwardFrom(ctx, userID, xp, 0, progressapp.SourceRecitation)
	return err
}
