package http

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/recitation/application"
	"github.com/chawais/deenquest/backend/internal/recitation/domain"
	"github.com/chawais/deenquest/backend/internal/recitation/infrastructure"
)

type stubChecker struct{ resolveErr error }

func (s stubChecker) ResolveLesson(context.Context, int, int) (string, int, error) {
	return "بسم الله", 25, s.resolveErr
}

func (s stubChecker) CheckRecitation(context.Context, string, int, int, io.Reader, string) (*domain.RecitationCheckResult, error) {
	return &domain.RecitationCheckResult{Score: 90}, nil
}

type memAudio struct {
	mu    sync.Mutex
	clips map[string][]byte
}

func (m *memAudio) Put(_ context.Context, id string, data []byte) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.clips == nil {
		m.clips = map[string][]byte{}
	}
	m.clips[id] = data
	return nil
}

func (m *memAudio) Get(_ context.Context, id string) ([]byte, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	data, ok := m.clips[id]
	if !ok {
		return nil, domain.ErrJobNotFound
	}
	return data, nil
}

func (m *memAudio) Delete(_ context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.clips, id)
	return nil
}

func (m *memAudio) only() []byte {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, data := range m.clips {
		return data
	}
	return nil
}

func newRouter(t *testing.T, checker application.Checker, cfg application.QueueConfig) (*gin.Engine, *memAudio) {
	t.Helper()
	gin.SetMode(gin.TestMode)

	audio := &memAudio{}
	queue := application.NewJobQueue(checker, infrastructure.NewMemoryJobStore(), audio, cfg)

	r := gin.New()
	group := r.Group("", func(c *gin.Context) { c.Set("user_id", "u1") })
	RegisterRoutes(group, group, NewHandler(queue))
	return r, audio
}

// fields are written in the order given, so a test can put the audio first and
// prove the parser does not depend on the client's ordering.
func multipartBody(t *testing.T, fields [][2]string, audioFirst bool) (*bytes.Buffer, string) {
	t.Helper()

	var body bytes.Buffer
	mw := multipart.NewWriter(&body)

	writeAudio := func() {
		fw, err := mw.CreateFormFile("audio", "clip.m4a")
		if err != nil {
			t.Fatal(err)
		}
		if _, err := fw.Write([]byte("audio-bytes")); err != nil {
			t.Fatal(err)
		}
	}

	if audioFirst {
		writeAudio()
	}
	for _, f := range fields {
		if err := mw.WriteField(f[0], f[1]); err != nil {
			t.Fatal(err)
		}
	}
	if !audioFirst {
		writeAudio()
	}
	if err := mw.Close(); err != nil {
		t.Fatal(err)
	}
	return &body, mw.FormDataContentType()
}

func post(t *testing.T, r *gin.Engine, body *bytes.Buffer, contentType string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(http.MethodPost, "/recitation/check", body)
	req.Header.Set("Content-Type", contentType)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

type envelope struct {
	Success bool            `json:"success"`
	Data    json.RawMessage `json:"data"`
	Error   string          `json:"error"`
}

func TestCheckReturns202WithAHandle(t *testing.T) {
	r, audio := newRouter(t, stubChecker{}, application.QueueConfig{})

	body, ct := multipartBody(t, [][2]string{{"level_id", "1"}, {"lesson_index", "0"}}, false)
	w := post(t, r, body, ct)

	if w.Code != http.StatusAccepted {
		t.Fatalf("status = %d, want 202 — the clip is queued, not scored", w.Code)
	}

	var env envelope
	if err := json.Unmarshal(w.Body.Bytes(), &env); err != nil {
		t.Fatalf("decode: %v (%s)", err, w.Body)
	}
	var accepted domain.JobAccepted
	if err := json.Unmarshal(env.Data, &accepted); err != nil {
		t.Fatalf("decode data: %v", err)
	}
	if accepted.JobID == "" {
		t.Error("no job id — the client has nothing to poll")
	}
	if accepted.Status != domain.JobQueued {
		t.Errorf("status = %q, want queued", accepted.Status)
	}
	if accepted.PollAfterMS <= 0 {
		t.Error("no poll interval — every client would pick its own")
	}
	if string(audio.only()) != "audio-bytes" {
		t.Errorf("spooled %q, want the uploaded clip", audio.only())
	}
}

// The client library decides part order; the parser must not.
func TestCheckAcceptsAudioBeforeItsFields(t *testing.T) {
	r, _ := newRouter(t, stubChecker{}, application.QueueConfig{})

	body, ct := multipartBody(t, [][2]string{{"level_id", "2"}, {"lesson_index", "3"}}, true)
	if w := post(t, r, body, ct); w.Code != http.StatusAccepted {
		t.Fatalf("status = %d, want 202 (body: %s)", w.Code, w.Body)
	}
}

func TestCheckRejectsIncompleteSubmissions(t *testing.T) {
	cases := []struct {
		name   string
		fields [][2]string
	}{
		{"no level_id", [][2]string{{"lesson_index", "0"}}},
		{"no lesson_index", [][2]string{{"level_id", "1"}}},
		{"level_id not a number", [][2]string{{"level_id", "abc"}, {"lesson_index", "0"}}},
		{"level_id zero", [][2]string{{"level_id", "0"}, {"lesson_index", "0"}}},
		{"negative lesson_index", [][2]string{{"level_id", "1"}, {"lesson_index", "-1"}}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			r, _ := newRouter(t, stubChecker{}, application.QueueConfig{})
			body, ct := multipartBody(t, tc.fields, false)
			if w := post(t, r, body, ct); w.Code != http.StatusBadRequest {
				t.Errorf("status = %d, want 400", w.Code)
			}
		})
	}
}

func TestCheckRejectsANonMultipartBody(t *testing.T) {
	r, _ := newRouter(t, stubChecker{}, application.QueueConfig{})

	req := httptest.NewRequest(http.MethodPost, "/recitation/check", strings.NewReader(`{"level_id":1}`))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

// A full queue must say "come back", with a Retry-After — not accept a clip it
// cannot get to, and not fail as though the client were at fault.
func TestFullQueueAnswers429WithRetryAfter(t *testing.T) {
	r, _ := newRouter(t, stubChecker{}, application.QueueConfig{MaxDepth: 1})

	body, ct := multipartBody(t, [][2]string{{"level_id", "1"}, {"lesson_index", "0"}}, false)
	if w := post(t, r, body, ct); w.Code != http.StatusAccepted {
		t.Fatalf("first submission: status = %d", w.Code)
	}

	body, ct = multipartBody(t, [][2]string{{"level_id", "1"}, {"lesson_index", "0"}}, false)
	w := post(t, r, body, ct)

	if w.Code != http.StatusTooManyRequests {
		t.Fatalf("status = %d, want 429", w.Code)
	}
	if w.Header().Get("Retry-After") == "" {
		t.Error("no Retry-After — the client has to guess when to come back")
	}
}

func TestUnknownLessonIsTheClientsFault(t *testing.T) {
	r, _ := newRouter(t, stubChecker{resolveErr: errors.New("level 99 not found")},
		application.QueueConfig{})

	body, ct := multipartBody(t, [][2]string{{"level_id", "99"}, {"lesson_index", "0"}}, false)
	w := post(t, r, body, ct)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", w.Code)
	}
}

func TestPollingAnUnknownJobIs404(t *testing.T) {
	r, _ := newRouter(t, stubChecker{}, application.QueueConfig{})

	req := httptest.NewRequest(http.MethodGet, "/recitation/jobs/nope", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", w.Code)
	}
}

func TestPollingReportsTheQueuedState(t *testing.T) {
	r, _ := newRouter(t, stubChecker{}, application.QueueConfig{})

	body, ct := multipartBody(t, [][2]string{{"level_id", "1"}, {"lesson_index", "0"}}, false)
	w := post(t, r, body, ct)

	var env envelope
	if err := json.Unmarshal(w.Body.Bytes(), &env); err != nil {
		t.Fatal(err)
	}
	var accepted domain.JobAccepted
	if err := json.Unmarshal(env.Data, &accepted); err != nil {
		t.Fatal(err)
	}

	req := httptest.NewRequest(http.MethodGet, "/recitation/jobs/"+accepted.JobID, nil)
	poll := httptest.NewRecorder()
	r.ServeHTTP(poll, req)

	if poll.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", poll.Code)
	}
	if err := json.Unmarshal(poll.Body.Bytes(), &env); err != nil {
		t.Fatal(err)
	}
	var state domain.JobState
	if err := json.Unmarshal(env.Data, &state); err != nil {
		t.Fatal(err)
	}
	if state.Status != domain.JobQueued {
		t.Errorf("status = %q, want queued", state.Status)
	}
	if state.JobID != accepted.JobID {
		t.Errorf("job id = %q, want %q", state.JobID, accepted.JobID)
	}
}
