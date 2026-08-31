// whisperbench answers one question: can whisper.cpp replace the Python
// transcription service without making recitations worse for learners?
//
// It is not a generic ASR benchmark. Word error rate alone would not settle
// the question — the app never shows a transcript, it shows a score produced
// by domain.CompareRecitation, which forgives orthographic drift the Uthmani
// and imla'i scripts disagree about and punishes real mistakes. A transcriber
// can lose a point of WER and cost nothing at all, or gain one and mark clean
// recitations wrong. So this reports both, and gates on the score.
//
//	go run ./cmd/whisperbench \
//	  -manifest bench/clips.jsonl \
//	  -engine faster-whisper=http://localhost:8001 \
//	  -engine whisper-cpp=http://localhost:8002 \
//	  -token "$WHISPER_INTERNAL_TOKEN"
//
// Manifest is JSON Lines, one clip per line, paths relative to the manifest:
//
//	{"audio": "clips/001.m4a", "reference": "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"}
package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/chawais/deenquest/backend/internal/recitation/domain"
)

type clip struct {
	Audio     string `json:"audio"`
	Reference string `json:"reference"`
}

type engine struct {
	name string
	url  string
}

// measurement is one clip through one engine.
type measurement struct {
	clip       clip
	transcript string
	score      int
	wordErrors float64
	wordCount  int
	charErrors float64
	charCount  int
	latency    time.Duration
	err        error
}

type engineList []engine

func (e *engineList) String() string { return fmt.Sprint(*e) }

func (e *engineList) Set(v string) error {
	name, url, ok := strings.Cut(v, "=")
	if !ok || name == "" || url == "" {
		return fmt.Errorf("want name=url, got %q", v)
	}
	*e = append(*e, engine{name: name, url: strings.TrimRight(url, "/")})
	return nil
}

func main() {
	var engines engineList
	manifest := flag.String("manifest", "bench/clips.jsonl", "JSONL manifest of labelled clips")
	token := flag.String("token", os.Getenv("WHISPER_INTERNAL_TOKEN"), "X-Internal-Token sent to each engine")
	timeout := flag.Duration("timeout", 120*time.Second, "per-clip timeout")
	maxScoreDrop := flag.Float64("max-score-drop", 1.0,
		"fail if the candidate's mean score is more than this many points below the baseline")
	flag.Var(&engines, "engine", "name=url, repeatable; the first is the baseline")
	flag.Parse()

	if len(engines) == 0 {
		fatal("no -engine given")
	}

	clips, err := loadManifest(*manifest)
	if err != nil {
		fatal("manifest: %v", err)
	}
	if len(clips) == 0 {
		fatal("manifest %s has no clips", *manifest)
	}

	client := &http.Client{Timeout: *timeout}
	results := make(map[string][]measurement, len(engines))

	for _, e := range engines {
		fmt.Fprintf(os.Stderr, "▸ %s (%s): %d clips\n", e.name, e.url, len(clips))
		measurements := make([]measurement, 0, len(clips))
		for i, c := range clips {
			m := run(client, e, c, *token, *timeout)
			if m.err != nil {
				fmt.Fprintf(os.Stderr, "  ✗ %s: %v\n", c.Audio, m.err)
			}
			measurements = append(measurements, m)
			if (i+1)%10 == 0 {
				fmt.Fprintf(os.Stderr, "  %d/%d\n", i+1, len(clips))
			}
		}
		results[e.name] = measurements
	}

	report(engines, results)

	if len(engines) < 2 {
		return
	}
	if !verdict(engines, results, *maxScoreDrop) {
		os.Exit(1)
	}
}

func loadManifest(path string) ([]clip, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	base := filepath.Dir(path)
	var clips []clip

	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 0, 64*1024), 1<<20)
	for line := 1; scanner.Scan(); line++ {
		text := strings.TrimSpace(scanner.Text())
		if text == "" || strings.HasPrefix(text, "//") {
			continue
		}
		var c clip
		if err := json.Unmarshal([]byte(text), &c); err != nil {
			return nil, fmt.Errorf("line %d: %w", line, err)
		}
		if c.Audio == "" || c.Reference == "" {
			return nil, fmt.Errorf("line %d: both audio and reference are required", line)
		}
		if !filepath.IsAbs(c.Audio) {
			c.Audio = filepath.Join(base, c.Audio)
		}
		clips = append(clips, c)
	}
	return clips, scanner.Err()
}

func run(client *http.Client, e engine, c clip, token string, timeout time.Duration) measurement {
	m := measurement{clip: c}

	audio, err := os.ReadFile(c.Audio)
	if err != nil {
		m.err = err
		return m
	}

	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	start := time.Now()
	transcript, err := transcribe(ctx, client, e, audio, filepath.Base(c.Audio), token)
	m.latency = time.Since(start)
	if err != nil {
		m.err = err
		return m
	}

	m.transcript = transcript
	_, m.score = domain.CompareRecitation(c.Reference, transcript)

	refWords := domain.TokenizeArabic(c.Reference)
	hypWords := domain.TokenizeArabic(transcript)
	m.wordErrors = editDistance(refWords, hypWords)
	m.wordCount = len(refWords)

	refChars := strings.Split(strings.ReplaceAll(domain.NormalizeArabic(c.Reference), " ", ""), "")
	hypChars := strings.Split(strings.ReplaceAll(domain.NormalizeArabic(transcript), " ", ""), "")
	m.charErrors = editDistance(refChars, hypChars)
	m.charCount = len(refChars)

	return m
}

// transcribe speaks whichever dialect the engine name implies. It duplicates
// the service's request shape rather than importing it, because the point of
// the exercise is to compare two engines side by side in one process — which
// the service, configured for exactly one, cannot do.
func transcribe(ctx context.Context, client *http.Client, e engine, audio []byte, filename, token string) (string, error) {
	path, fileField := "/transcribe", "audio"
	fields := map[string]string{}
	if e.name == "whisper-cpp" {
		path, fileField = "/inference", "file"
		fields["language"] = "ar"
		fields["response_format"] = "json"
	}

	var body bytes.Buffer
	mw := multipart.NewWriter(&body)
	for k, v := range fields {
		if err := mw.WriteField(k, v); err != nil {
			return "", err
		}
	}
	fw, err := mw.CreateFormFile(fileField, filename)
	if err != nil {
		return "", err
	}
	if _, err := fw.Write(audio); err != nil {
		return "", err
	}
	if err := mw.Close(); err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, e.url+path, &body)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", mw.FormDataContentType())
	if token != "" {
		req.Header.Set("X-Internal-Token", token)
	}

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		detail, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return "", fmt.Errorf("%s returned %d: %s", e.name, resp.StatusCode, strings.TrimSpace(string(detail)))
	}

	var payload struct {
		Text string `json:"text"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return "", fmt.Errorf("decode %s response: %w", e.name, err)
	}
	return strings.TrimSpace(payload.Text), nil
}

// editDistance is plain unweighted Levenshtein over tokens — the standard
// WER/CER numerator. The grader's own weighted distance lives in the domain
// package and is reported separately as the score; mixing them would make the
// WER incomparable to anything published elsewhere.
func editDistance[T comparable](a, b []T) float64 {
	prev := make([]float64, len(b)+1)
	curr := make([]float64, len(b)+1)
	for j := range prev {
		prev[j] = float64(j)
	}
	for i := 1; i <= len(a); i++ {
		curr[0] = float64(i)
		for j := 1; j <= len(b); j++ {
			cost := 1.0
			if a[i-1] == b[j-1] {
				cost = 0
			}
			curr[j] = min3(prev[j]+1, curr[j-1]+1, prev[j-1]+cost)
		}
		prev, curr = curr, prev
	}
	return prev[len(b)]
}

func min3(a, b, c float64) float64 {
	if b < a {
		a = b
	}
	if c < a {
		a = c
	}
	return a
}

type summary struct {
	name       string
	clips      int
	failures   int
	wer        float64
	cer        float64
	meanScore  float64
	p50, p95   time.Duration
	worstScore int
}

func summarize(name string, ms []measurement) summary {
	s := summary{name: name, worstScore: 100}

	var wordErr, words, charErr, chars, scoreSum float64
	latencies := make([]time.Duration, 0, len(ms))

	for _, m := range ms {
		if m.err != nil {
			s.failures++
			continue
		}
		s.clips++
		wordErr += m.wordErrors
		words += float64(m.wordCount)
		charErr += m.charErrors
		chars += float64(m.charCount)
		scoreSum += float64(m.score)
		if m.score < s.worstScore {
			s.worstScore = m.score
		}
		latencies = append(latencies, m.latency)
	}

	if words > 0 {
		s.wer = wordErr / words * 100
	}
	if chars > 0 {
		s.cer = charErr / chars * 100
	}
	if s.clips > 0 {
		s.meanScore = scoreSum / float64(s.clips)
	}
	s.p50, s.p95 = percentiles(latencies)
	return s
}

func percentiles(latencies []time.Duration) (p50, p95 time.Duration) {
	if len(latencies) == 0 {
		return 0, 0
	}
	sort.Slice(latencies, func(i, j int) bool { return latencies[i] < latencies[j] })
	return latencies[len(latencies)*50/100], latencies[min(len(latencies)*95/100, len(latencies)-1)]
}

func report(engines []engine, results map[string][]measurement) {
	fmt.Println()
	fmt.Printf("%-16s %6s %6s %8s %8s %10s %8s %8s\n",
		"engine", "clips", "fail", "WER%", "CER%", "mean score", "p50", "p95")
	fmt.Println(strings.Repeat("─", 80))

	for _, e := range engines {
		s := summarize(e.name, results[e.name])
		fmt.Printf("%-16s %6d %6d %8.2f %8.2f %10.1f %8s %8s\n",
			s.name, s.clips, s.failures, s.wer, s.cer, s.meanScore,
			s.p50.Round(time.Millisecond), s.p95.Round(time.Millisecond))
	}

	if len(engines) < 2 {
		return
	}

	// A mean can hide the failure mode that actually matters: one clip that
	// used to pass and now does not is a learner blocked on a lesson.
	baseline, candidate := engines[0], engines[1]
	base, cand := results[baseline.name], results[candidate.name]

	fmt.Println()
	fmt.Printf("Per-clip score changes (%s → %s), worst first:\n", baseline.name, candidate.name)

	type delta struct {
		clip       string
		from, to   int
		change     int
		brokeAPass bool
	}
	var deltas []delta
	for i := range base {
		if i >= len(cand) || base[i].err != nil || cand[i].err != nil {
			continue
		}
		if base[i].score == cand[i].score {
			continue
		}
		deltas = append(deltas, delta{
			clip:       filepath.Base(base[i].clip.Audio),
			from:       base[i].score,
			to:         cand[i].score,
			change:     cand[i].score - base[i].score,
			brokeAPass: base[i].score >= passScore && cand[i].score < passScore,
		})
	}
	sort.Slice(deltas, func(i, j int) bool { return deltas[i].change < deltas[j].change })

	if len(deltas) == 0 {
		fmt.Println("  (identical on every clip)")
		return
	}
	for _, d := range deltas {
		flag := ""
		if d.brokeAPass {
			flag = "  ← was a pass, now a fail"
		}
		fmt.Printf("  %-28s %3d → %3d  (%+d)%s\n", d.clip, d.from, d.to, d.change, flag)
	}
}

// passScore mirrors the recitation service's own threshold. A clip crossing it
// downward is the failure this whole exercise exists to catch.
const passScore = 60

func verdict(engines []engine, results map[string][]measurement, maxScoreDrop float64) bool {
	baseline := summarize(engines[0].name, results[engines[0].name])
	candidate := summarize(engines[1].name, results[engines[1].name])

	drop := baseline.meanScore - candidate.meanScore
	regressions := 0
	base, cand := results[engines[0].name], results[engines[1].name]
	for i := range base {
		if i >= len(cand) || base[i].err != nil || cand[i].err != nil {
			continue
		}
		if base[i].score >= passScore && cand[i].score < passScore {
			regressions++
		}
	}

	fmt.Println()
	fmt.Printf("mean score %+.2f (%s vs %s), clips that stopped passing: %d\n",
		-drop, engines[1].name, engines[0].name, regressions)

	switch {
	case candidate.failures > baseline.failures:
		fmt.Printf("REJECT: %s failed %d clips outright (baseline failed %d)\n",
			engines[1].name, candidate.failures, baseline.failures)
		return false
	case regressions > 0:
		fmt.Printf("REJECT: %d clip(s) would now fail a lesson that used to pass\n", regressions)
		return false
	case drop > maxScoreDrop:
		fmt.Printf("REJECT: mean score dropped %.2f points, over the %.2f allowed\n", drop, maxScoreDrop)
		return false
	default:
		fmt.Printf("ACCEPT: %s is within the gate — the swap is safe on this clip set\n", engines[1].name)
		return true
	}
}

func fatal(format string, args ...any) {
	fmt.Fprintf(os.Stderr, "whisperbench: "+format+"\n", args...)
	os.Exit(2)
}
