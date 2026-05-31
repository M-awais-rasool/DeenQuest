// Package ollama provides a small HTTP client for the Ollama REST API. Any service can construct
// a Client with New and call Generate for /api/generate (non-streaming). Feature-specific prompts
// live under internal/ai (e.g. ai/notifications/content for push copy).
package ollama

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

const DefaultBaseURL = "http://127.0.0.1:11434"

// Client is a reusable Ollama HTTP client (not tied to intelligent notifications).
type Client struct {
	baseURL    string
	httpClient *http.Client
}

// New returns a client for baseURL (e.g. from config). Empty baseURL uses DefaultBaseURL.
func New(baseURL string) *Client {
	baseURL = strings.TrimSpace(baseURL)
	if baseURL == "" {
		baseURL = DefaultBaseURL
	}
	baseURL = strings.TrimRight(baseURL, "/")
	return &Client{
		baseURL:    baseURL,
		httpClient: &http.Client{Timeout: 120 * time.Second},
	}
}

type generateRequest struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
	Stream bool   `json:"stream"`
}

type generateResponse struct {
	Response string `json:"response"`
	Error    string `json:"error,omitempty"`
}

// Generate runs POST /api/generate with stream=false and returns the model response text.
func (c *Client) Generate(ctx context.Context, model, prompt string) (string, error) {
	model = strings.TrimSpace(model)
	prompt = strings.TrimSpace(prompt)
	if model == "" {
		return "", fmt.Errorf("ollama: model is required")
	}
	if prompt == "" {
		return "", fmt.Errorf("ollama: prompt is required")
	}

	body, err := json.Marshal(generateRequest{Model: model, Prompt: prompt, Stream: false})
	if err != nil {
		return "", fmt.Errorf("ollama: marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/api/generate", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("ollama: build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("ollama: http: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("ollama: read body: %w", err)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("ollama: status %d: %s", resp.StatusCode, strings.TrimSpace(string(raw)))
	}

	var out generateResponse
	if err := json.Unmarshal(raw, &out); err != nil {
		return "", fmt.Errorf("ollama: decode response: %w", err)
	}
	if strings.TrimSpace(out.Error) != "" {
		return "", fmt.Errorf("ollama: %s", out.Error)
	}
	return strings.TrimSpace(out.Response), nil
}
