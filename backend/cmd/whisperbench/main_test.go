package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestEditDistance(t *testing.T) {
	cases := []struct {
		a, b []string
		want float64
	}{
		{nil, nil, 0},
		{[]string{"a", "b"}, []string{"a", "b"}, 0},
		{[]string{"a", "b"}, []string{"a", "c"}, 1},
		{[]string{"a"}, []string{"a", "b"}, 1},
		{[]string{"a", "b", "c"}, nil, 3},
	}
	for _, tc := range cases {
		if got := editDistance(tc.a, tc.b); got != tc.want {
			t.Errorf("editDistance(%v, %v) = %v, want %v", tc.a, tc.b, got, tc.want)
		}
	}
}

func TestLoadManifestResolvesPathsRelativeToItself(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "clips.jsonl")
	body := "" +
		"// a comment line is skipped\n" +
		"\n" +
		`{"audio":"clips/001.m4a","reference":"بسم الله"}` + "\n"
	if err := os.WriteFile(path, []byte(body), 0o600); err != nil {
		t.Fatal(err)
	}

	clips, err := loadManifest(path)
	if err != nil {
		t.Fatalf("loadManifest: %v", err)
	}
	if len(clips) != 1 {
		t.Fatalf("got %d clips, want 1", len(clips))
	}
	if want := filepath.Join(dir, "clips", "001.m4a"); clips[0].Audio != want {
		t.Errorf("audio = %q, want %q", clips[0].Audio, want)
	}
}

func TestLoadManifestRejectsIncompleteEntries(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "clips.jsonl")
	if err := os.WriteFile(path, []byte(`{"audio":"a.m4a"}`+"\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	if _, err := loadManifest(path); err == nil {
		t.Fatal("accepted a clip with no reference text")
	}
}

func fakeEngine(t *testing.T, name, transcript string) engine {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		wantPath := "/transcribe"
		if name == "whisper-cpp" {
			wantPath = "/inference"
		}
		if r.URL.Path != wantPath {
			t.Errorf("%s got path %q, want %q", name, r.URL.Path, wantPath)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"text":"` + transcript + `"}`))
	}))
	t.Cleanup(srv.Close)
	return engine{name: name, url: srv.URL}
}

// The gate has to be driven by the score the learner sees, not by WER: a
// transcript can differ in spelling and still be a perfect recitation.
func TestScoringIgnoresOrthographicDrift(t *testing.T) {
	dir := t.TempDir()
	audio := filepath.Join(dir, "001.m4a")
	if err := os.WriteFile(audio, []byte("not-really-audio"), 0o600); err != nil {
		t.Fatal(err)
	}

	c := clip{Audio: audio, Reference: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"}
	e := fakeEngine(t, "whisper-cpp", "بسم الله الرحمن الرحيم")

	m := run(&http.Client{}, e, c, "", 5*time.Second)
	if m.err != nil {
		t.Fatalf("run: %v", m.err)
	}
	if m.score != 100 {
		t.Errorf("score = %d, want 100 — plain script is the same recitation", m.score)
	}
}

func TestVerdictRejectsAClipThatStopsPassing(t *testing.T) {
	engines := []engine{{name: "faster-whisper"}, {name: "whisper-cpp"}}
	results := map[string][]measurement{
		"faster-whisper": {
			{score: 100, wordCount: 4, charCount: 16},
			{score: 80, wordCount: 4, charCount: 16},
		},
		"whisper-cpp": {
			{score: 100, wordCount: 4, charCount: 16},
			{score: 55, wordCount: 4, charCount: 16},
		},
	}
	// The mean only falls 12.5 points but one clip crossed the pass line, which
	// is a learner stuck on a lesson.
	if verdict(engines, results, 100) {
		t.Error("accepted a swap that turns a passing recitation into a failing one")
	}
}

func TestVerdictAcceptsAnEquivalentEngine(t *testing.T) {
	engines := []engine{{name: "faster-whisper"}, {name: "whisper-cpp"}}
	results := map[string][]measurement{
		"faster-whisper": {{score: 90, wordCount: 4, charCount: 16}},
		"whisper-cpp":    {{score: 90, wordCount: 4, charCount: 16}},
	}
	if !verdict(engines, results, 1.0) {
		t.Error("rejected an engine that scored identically")
	}
}

func TestVerdictRejectsOutrightFailures(t *testing.T) {
	engines := []engine{{name: "faster-whisper"}, {name: "whisper-cpp"}}
	results := map[string][]measurement{
		"faster-whisper": {{score: 90, wordCount: 4, charCount: 16}},
		"whisper-cpp":    {{err: os.ErrDeadlineExceeded}},
	}
	if verdict(engines, results, 100) {
		t.Error("accepted an engine that could not transcribe the clip at all")
	}
}
