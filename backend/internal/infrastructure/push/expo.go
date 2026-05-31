package push

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

const DefaultExpoPushURL = "https://exp.host/--/api/v2/push/send"

type Message struct {
	Title string                 `json:"title"`
	Body  string                 `json:"body"`
	Data  map[string]interface{} `json:"data,omitempty"`
}

type Ticket struct {
	Status  string                 `json:"status"`
	ID      string                 `json:"id,omitempty"`
	Message string                 `json:"message,omitempty"`
	Details map[string]interface{} `json:"details,omitempty"`
}

type ExpoClient struct {
	endpoint    string
	accessToken string
	httpClient  *http.Client
}

func NewExpoClient(endpoint, accessToken string) *ExpoClient {
	if strings.TrimSpace(endpoint) == "" {
		endpoint = DefaultExpoPushURL
	}

	return &ExpoClient{
		endpoint:    endpoint,
		accessToken: strings.TrimSpace(accessToken),
		httpClient:  &http.Client{Timeout: 10 * time.Second},
	}
}

func IsExpoPushToken(token string) bool {
	token = strings.TrimSpace(token)
	return (strings.HasPrefix(token, "ExpoPushToken[") || strings.HasPrefix(token, "ExponentPushToken[")) && strings.HasSuffix(token, "]")
}

func (c *ExpoClient) Send(ctx context.Context, expoPushToken string, msg Message) (*Ticket, error) {
	payload := []map[string]interface{}{
		{
			"to":        strings.TrimSpace(expoPushToken),
			"title":     strings.TrimSpace(msg.Title),
			"body":      strings.TrimSpace(msg.Body),
			"data":      msg.Data,
			"sound":     "default",
			"channelId": "default",
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal expo push payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.endpoint, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create expo push request: %w", err)
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/json")
	if c.accessToken != "" {
		req.Header.Set("Authorization", "Bearer "+c.accessToken)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("send expo push request: %w", err)
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, fmt.Errorf("read expo push response: %w", err)
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return nil, fmt.Errorf("expo push API returned %d: %s", resp.StatusCode, strings.TrimSpace(string(responseBody)))
	}

	var envelope struct {
		Data []Ticket `json:"data"`
	}
	if err := json.Unmarshal(responseBody, &envelope); err != nil {
		return nil, fmt.Errorf("decode expo push response: %w", err)
	}
	if len(envelope.Data) == 0 {
		return nil, fmt.Errorf("expo push API returned no ticket")
	}
	fmt.Printf("Expo push response: %s\n", strings.TrimSpace(string(responseBody)))
	return &envelope.Data[0], nil
}
