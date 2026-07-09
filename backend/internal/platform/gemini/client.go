// Package gemini is a tiny raw-HTTP client for Google's Generative Language API
// (Gemini), used by the optional Learning Agent AI layer to generate short
// motivational/feedback copy. It mirrors the lightweight infrastructure/ollama
// client (no heavy SDK, minimal deps). The deterministic learning core never
// calls it — if it is not configured, the AI layer simply doesn't start.
package gemini

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const (
	// DefaultModel is fast + cheap, ideal for one-line copy. Override via config.
	DefaultModel = "gemini-2.0-flash"

	apiBase         = "https://generativelanguage.googleapis.com/v1beta"
	maxOutputTokens = 256
)

// Client wraps the Gemini REST API with a fixed model + API key.
type Client struct {
	apiKey     string
	model      string
	httpClient *http.Client
}

// New returns a Client, or nil when apiKey is empty so callers can cleanly skip
// wiring the AI layer. model may be empty to use DefaultModel.
func New(apiKey, model string) *Client {
	apiKey = strings.TrimSpace(apiKey)
	if apiKey == "" {
		return nil
	}
	m := strings.TrimSpace(model)
	if m == "" {
		m = DefaultModel
	}
	return &Client{
		apiKey:     apiKey,
		model:      m,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiContent struct {
	Role  string       `json:"role,omitempty"`
	Parts []geminiPart `json:"parts"`
}

type generateRequest struct {
	SystemInstruction *geminiContent  `json:"system_instruction,omitempty"`
	Contents          []geminiContent `json:"contents"`
	GenerationConfig  struct {
		MaxOutputTokens int     `json:"maxOutputTokens"`
		Temperature     float64 `json:"temperature"`
	} `json:"generationConfig"`
}

type generateResponse struct {
	Candidates []struct {
		Content      geminiContent `json:"content"`
		FinishReason string        `json:"finishReason"`
	} `json:"candidates"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

// Generate runs a single generateContent call and returns the model's text.
// `system` is sent as system_instruction; `userPrompt` as the user turn.
func (c *Client) Generate(ctx context.Context, system, userPrompt string) (string, error) {
	if c == nil {
		return "", fmt.Errorf("gemini: client not configured")
	}

	reqBody := generateRequest{
		Contents: []geminiContent{
			{Role: "user", Parts: []geminiPart{{Text: userPrompt}}},
		},
	}
	reqBody.GenerationConfig.MaxOutputTokens = maxOutputTokens
	reqBody.GenerationConfig.Temperature = 0.7
	if strings.TrimSpace(system) != "" {
		reqBody.SystemInstruction = &geminiContent{Parts: []geminiPart{{Text: system}}}
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("gemini: marshal request: %w", err)
	}

	url := fmt.Sprintf("%s/models/%s:generateContent", apiBase, c.model)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("gemini: build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", c.apiKey) // key in header, not URL/logs

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("gemini: http: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("gemini: read body: %w", err)
	}

	var out generateResponse
	if err := json.Unmarshal(raw, &out); err != nil {
		return "", fmt.Errorf("gemini: decode response: %w", err)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		if out.Error != nil && out.Error.Message != "" {
			return "", fmt.Errorf("gemini: status %d: %s", resp.StatusCode, out.Error.Message)
		}
		return "", fmt.Errorf("gemini: status %d: %s", resp.StatusCode, strings.TrimSpace(string(raw)))
	}

	var b strings.Builder
	for _, cand := range out.Candidates {
		for _, p := range cand.Content.Parts {
			b.WriteString(p.Text)
		}
	}
	return strings.TrimSpace(b.String()), nil
}
