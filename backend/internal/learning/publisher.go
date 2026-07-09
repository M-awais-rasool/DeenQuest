// Package learning is the Learning Agent module: the event Publisher, the
// StateService (deterministic), the Recommender (deterministic), the
// pattern-sweep Scheduler, and the optional Gemini AI copy consumer. The
// shared data types live in internal/learning/model so other modules (e.g.
// progress) can emit events without importing this package.
package learning

import (
	"context"
	"time"

	"github.com/chawais/deenquest/backend/internal/learning/model"
	"github.com/chawais/deenquest/backend/internal/platform/kafka"
	"github.com/chawais/deenquest/backend/internal/platform/logger"
	"go.uber.org/zap"
)

// Producer is the subset of the Kafka producer the Publisher needs. Keyed and
// batched publishing keep per-user ordering and minimize broker round-trips.
type Producer interface {
	PublishKeyed(ctx context.Context, topic, key string, event kafka.Event) error
	PublishBatch(ctx context.Context, topic string, events []kafka.Event, keyFn func(kafka.Event) string) error
}

// Publisher emits BehaviorEvents to the learning.events topic. It is safe to use
// with a nil Publisher or a nil producer (no-op), so the app still runs when
// Kafka is unavailable in development.
type Publisher struct {
	producer Producer
}

func NewPublisher(producer Producer) *Publisher {
	return &Publisher{producer: producer}
}

// Emit publishes a behavior event, keyed by user so a user's events stay ordered
// on one partition. Fire-and-forget: failures are logged but never returned, so
// the learning pipeline never blocks the core flows that produce events. With an
// async producer this returns without waiting for a broker ack.
func (p *Publisher) Emit(ctx context.Context, ev model.BehaviorEvent) {
	if p == nil || p.producer == nil {
		return
	}
	if ev.ServerTS.IsZero() {
		ev.ServerTS = time.Now().UTC()
	}
	if err := p.producer.PublishKeyed(ctx, model.TopicLearningEvents, ev.UserID, kafka.Event{
		Type:    string(ev.Type),
		Payload: ev,
	}); err != nil {
		logger.Warn("learning: failed to publish behavior event",
			zap.String("event_type", string(ev.Type)),
			zap.Error(err))
	}
}

// EmitBatch publishes many events in a single broker round-trip (used by the
// /events ingest endpoint), each keyed by its user_id.
func (p *Publisher) EmitBatch(ctx context.Context, evs []model.BehaviorEvent) {
	if p == nil || p.producer == nil || len(evs) == 0 {
		return
	}
	now := time.Now().UTC()
	events := make([]kafka.Event, 0, len(evs))
	for _, ev := range evs {
		if ev.ServerTS.IsZero() {
			ev.ServerTS = now
		}
		events = append(events, kafka.Event{Type: string(ev.Type), Payload: ev})
	}
	keyFn := func(e kafka.Event) string {
		if be, ok := e.Payload.(model.BehaviorEvent); ok {
			return be.UserID
		}
		return ""
	}
	if err := p.producer.PublishBatch(ctx, model.TopicLearningEvents, events, keyFn); err != nil {
		logger.Warn("learning: failed to publish behavior event batch",
			zap.Int("count", len(events)), zap.Error(err))
	}
}
