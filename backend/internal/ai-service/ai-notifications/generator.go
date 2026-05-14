package notifications

import (
	"context"
	"fmt"
	"strings"
	"time"
)

type MessageGenerator struct {
	ollamaClient OllamaClient
	model        string
}

type OllamaClient interface {
	Generate(ctx context.Context, model, prompt string) (string, error)
}

func NewMessageGenerator(client OllamaClient, model string) *MessageGenerator {
	if model == "" {
		model = "llama3"
	}
	return &MessageGenerator{ollamaClient: client, model: model}
}

func (g *MessageGenerator) GenerateMessage(ctx context.Context, user InactiveUser) (string, error) {
	inactivityHours := time.Since(user.LastCompletedAt).Hours()

	prompt := fmt.Sprintf(
		`Write a short motivational notification message for an Islamic gamified learning app.

User details:
- Streak: %d days
- Inactive for: %.0f hours
- Completed lessons: %d

Rules:
- Maximum 1-2 sentences only
- Friendly Islamic tone
- Motivational and encouraging
- No extreme wording
- Personalize based on their streak and inactivity
- Do not include emojis unless natural
- Return ONLY the message text, nothing else

Example tone: "You were doing amazing, continue your Quran journey today."`,
		user.Streak,
		inactivityHours,
		user.CompletedLessons,
	)

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	message, err := g.ollamaClient.Generate(ctx, g.model, prompt)
	if err != nil {
		return "", fmt.Errorf("ollama generation failed: %w", err)
	}

	message = strings.TrimSpace(message)
	message = strings.Trim(message, "\"'")

	if len(message) > 200 {
		message = message[:197] + "..."
	}

	return message, nil
}
