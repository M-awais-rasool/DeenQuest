package kafka

import (
	"context"

	"github.com/chawais/talent-flow/backend/pkg/queue"
)

type Publisher interface {
	Publish(ctx context.Context, topic string, event queue.Event) error
}
