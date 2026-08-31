package application

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

type capturedCall struct {
	path      string
	fileField string
	language  string
	token     string
	body      string
}

// The two transcribers disagree about the URL and the form field and nothing
// else, so that disagreement is exactly what has to be pinned down: getting it
// wrong means every recitation 404s in production while every test still
// passes.
func TestEngineDialects(t *testing.T) {
	cases := []struct {
		name          string
		engine        WhisperEngine
		wantPath      string
		wantFileField string
		wantLanguage  string
	}{
		{"python service", EngineFasterWhisper, "/transcribe", "audio", ""},
		{"whisper.cpp", EngineWhisperCPP, "/inference", "file", "ar"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			var got capturedCall
			srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				got.path = r.URL.Path
				got.token = r.Header.Get("X-Internal-Token")
				if err := r.ParseMultipartForm(1 << 20); err != nil {
					t.Errorf("parse multipart: %v", err)
				}
				for field := range r.MultipartForm.File {
					got.fileField = field
				}
				got.language = r.FormValue("language")

				file, _, err := r.FormFile(tc.wantFileField)
				if err == nil {
					defer file.Close()
					buf := make([]byte, 16)
					n, _ := file.Read(buf)
					got.body = string(buf[:n])
				}

				w.Header().Set("Content-Type", "application/json")
				_, _ = w.Write([]byte(`{"text":"بسم الله"}`))
			}))
			defer srv.Close()

			svc := NewService(nil, srv.URL, "secret-token", nil, nil)
			svc.SetEngine(tc.engine)

			resp, err := svc.callWhisper(context.Background(), strings.NewReader("audio-bytes"), "clip.m4a")
			if err != nil {
				t.Fatalf("callWhisper: %v", err)
			}
			if resp.Text != "بسم الله" {
				t.Errorf("text = %q", resp.Text)
			}
			if got.path != tc.wantPath {
				t.Errorf("path = %q, want %q", got.path, tc.wantPath)
			}
			if got.fileField != tc.wantFileField {
				t.Errorf("file field = %q, want %q", got.fileField, tc.wantFileField)
			}
			if got.language != tc.wantLanguage {
				t.Errorf("language = %q, want %q", got.language, tc.wantLanguage)
			}
			if got.token != "secret-token" {
				t.Errorf("internal token = %q, want it forwarded", got.token)
			}
			if got.body != "audio-bytes" {
				t.Errorf("uploaded body = %q", got.body)
			}
		})
	}
}

// An unset engine must behave like the deployed default rather than posting to
// an empty path.
func TestUnsetEngineFallsBackToTheDeployedDefault(t *testing.T) {
	var path string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path = r.URL.Path
		_, _ = w.Write([]byte(`{"text":""}`))
	}))
	defer srv.Close()

	svc := NewService(nil, srv.URL, "", nil, nil)
	svc.dialect = engineDialect{}

	if _, err := svc.callWhisper(context.Background(), strings.NewReader("x"), "c.m4a"); err != nil {
		t.Fatalf("callWhisper: %v", err)
	}
	if path != "/transcribe" {
		t.Errorf("path = %q, want /transcribe", path)
	}
}

// The gate is what keeps the queue worker and the synchronous Hifz path from
// both piling into a transcriber that handles one clip at a time.
func TestTranscriberGateRefusesRatherThanHangs(t *testing.T) {
	release := make(chan struct{})
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		<-release
		_, _ = w.Write([]byte(`{"text":""}`))
	}))
	defer srv.Close()
	defer close(release)

	svc := NewService(nil, srv.URL, "", nil, nil)
	svc.SetTranscribeLimits(1, 50*time.Millisecond)

	inFlight := make(chan struct{})
	go func() {
		close(inFlight)
		_, _ = svc.callWhisper(context.Background(), strings.NewReader("x"), "c.m4a")
	}()
	<-inFlight

	// Give the first call time to take the only slot.
	time.Sleep(20 * time.Millisecond)

	start := time.Now()
	_, err := svc.callWhisper(context.Background(), strings.NewReader("y"), "d.m4a")
	if err == nil {
		t.Fatal("second call went through; the gate is not bounding concurrency")
	}
	if !isBusy(err) {
		t.Fatalf("err = %v, want ErrTranscriberBusy", err)
	}
	if elapsed := time.Since(start); elapsed > time.Second {
		t.Errorf("waited %v before giving up — the caller was left hanging", elapsed)
	}
}

func isBusy(err error) bool {
	return err != nil && err.Error() == ErrTranscriberBusy.Error()
}
