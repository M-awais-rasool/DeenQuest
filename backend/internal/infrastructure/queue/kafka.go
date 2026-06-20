package queue

import (
	"context"
	"encoding/json"
	"time"

	"github.com/segmentio/kafka-go"

	"github.com/chawais/talent-flow/backend/internal/infrastructure/logger"
	"go.uber.org/zap"
)

type KafkaProducer struct {
	writer *kafka.Writer
}

type Event struct {
	Type      string      `json:"type"`
	Payload   interface{} `json:"payload"`
	Timestamp time.Time   `json:"timestamp"`
}

func NewKafkaProducer(brokers []string) *KafkaProducer {
	writer := &kafka.Writer{
		Addr:                   kafka.TCP(brokers...),
		Balancer:               &kafka.LeastBytes{},
		BatchTimeout:           10 * time.Millisecond,
		AllowAutoTopicCreation: true,
	}

	logger.Info("Kafka producer initialized", zap.Strings("brokers", brokers))
	return &KafkaProducer{writer: writer}
}

// NewKafkaProducerAsync returns a fire-and-forget producer tuned for
// high-throughput, low-latency telemetry (e.g. learning.events): WriteMessages
// returns without blocking on broker acks (errors surface via Completion), and a
// Hash balancer routes by message key so all events for a key (user_id) land on
// one partition — preserving per-user ordering while still scaling horizontally.
func NewKafkaProducerAsync(brokers []string) *KafkaProducer {
	writer := &kafka.Writer{
		Addr:                   kafka.TCP(brokers...),
		Balancer:               &kafka.Hash{},
		BatchTimeout:           20 * time.Millisecond,
		Async:                  true,
		RequiredAcks:           kafka.RequireOne,
		AllowAutoTopicCreation: true,
		Completion: func(messages []kafka.Message, err error) {
			if err != nil {
				logger.Error("async kafka publish failed",
					zap.Int("messages", len(messages)), zap.Error(err))
			}
		},
	}
	logger.Info("Async Kafka producer initialized", zap.Strings("brokers", brokers))
	return &KafkaProducer{writer: writer}
}

// PublishKeyed publishes a single event with a partition key (e.g. user_id) so a
// key's events stay ordered on one partition. Empty key uses the balancer default.
func (p *KafkaProducer) PublishKeyed(ctx context.Context, topic, key string, event Event) error {
	event.Timestamp = time.Now()
	value, err := json.Marshal(event)
	if err != nil {
		return err
	}
	msg := kafka.Message{Topic: topic, Value: value}
	if key != "" {
		msg.Key = []byte(key)
	}
	return p.writer.WriteMessages(ctx, msg)
}

// PublishBatch publishes many events in one WriteMessages call (one network
// round-trip), each keyed via keyFn for per-key ordering. Ideal for the batched
// /events ingest endpoint.
func (p *KafkaProducer) PublishBatch(ctx context.Context, topic string, events []Event, keyFn func(Event) string) error {
	if len(events) == 0 {
		return nil
	}
	now := time.Now()
	msgs := make([]kafka.Message, 0, len(events))
	for _, e := range events {
		e.Timestamp = now
		value, err := json.Marshal(e)
		if err != nil {
			return err
		}
		m := kafka.Message{Topic: topic, Value: value}
		if keyFn != nil {
			if k := keyFn(e); k != "" {
				m.Key = []byte(k)
			}
		}
		msgs = append(msgs, m)
	}
	return p.writer.WriteMessages(ctx, msgs...)
}

func (p *KafkaProducer) Publish(ctx context.Context, topic string, event Event) error {
	event.Timestamp = time.Now()

	value, err := json.Marshal(event)
	if err != nil {
		return err
	}

	msg := kafka.Message{
		Topic: topic,
		Value: value,
	}

	if err := p.writer.WriteMessages(ctx, msg); err != nil {
		logger.Error("Failed to publish event",
			zap.String("topic", topic),
			zap.String("event_type", event.Type),
			zap.Error(err),
		)
		return err
	}

	logger.Info("Event published",
		zap.String("topic", topic),
		zap.String("event_type", event.Type),
	)
	return nil
}

func (p *KafkaProducer) Close() error {
	return p.writer.Close()
}

// KafkaConsumer wraps kafka.Reader for consuming messages from a topic.
type KafkaConsumer struct {
	reader *kafka.Reader
}

// MessageHandler is a function that processes a Kafka event.
type MessageHandler func(ctx context.Context, event Event) error

func NewKafkaConsumer(brokers []string, topic, groupID string) *KafkaConsumer {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  brokers,
		Topic:    topic,
		GroupID:  groupID,
		MinBytes: 10e3, // 10KB
		MaxBytes: 10e6, // 10MB
	})

	logger.Info("Kafka consumer initialized",
		zap.Strings("brokers", brokers),
		zap.String("topic", topic),
		zap.String("group_id", groupID),
	)
	return &KafkaConsumer{reader: reader}
}

// ConsumerConfig tunes a reader. Defaults favor low latency for small,
// near-real-time events (MinBytes 1, short MaxWait) while batching commits to
// keep broker round-trips and cost down.
type ConsumerConfig struct {
	MinBytes       int
	MaxBytes       int
	MaxWait        time.Duration
	CommitInterval time.Duration
}

// NewKafkaConsumerWithConfig builds a reader with explicit tuning. Used by the
// learning consumers so behavior events are picked up promptly instead of
// waiting to accumulate a 10KB batch (the default constructor's behavior).
func NewKafkaConsumerWithConfig(brokers []string, topic, groupID string, cfg ConsumerConfig) *KafkaConsumer {
	if cfg.MinBytes == 0 {
		cfg.MinBytes = 1
	}
	if cfg.MaxBytes == 0 {
		cfg.MaxBytes = 10e6
	}
	if cfg.MaxWait == 0 {
		cfg.MaxWait = 500 * time.Millisecond
	}
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:        brokers,
		Topic:          topic,
		GroupID:        groupID,
		MinBytes:       cfg.MinBytes,
		MaxBytes:       cfg.MaxBytes,
		MaxWait:        cfg.MaxWait,
		CommitInterval: cfg.CommitInterval,
	})

	logger.Info("Kafka consumer initialized (tuned)",
		zap.Strings("brokers", brokers),
		zap.String("topic", topic),
		zap.String("group_id", groupID),
		zap.Duration("max_wait", cfg.MaxWait),
	)
	return &KafkaConsumer{reader: reader}
}

func (c *KafkaConsumer) Consume(ctx context.Context, handler MessageHandler) error {
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
			msg, err := c.reader.ReadMessage(ctx)
			if err != nil {
				if ctx.Err() != nil {
					return ctx.Err()
				}
				logger.Error("Failed to read message", zap.Error(err))
				continue
			}
			var event Event
			if err := json.Unmarshal(msg.Value, &event); err != nil {
				logger.Error("Failed to unmarshal event", zap.Error(err))
				continue
			}
			if err := handler(ctx, event); err != nil {
				logger.Error("Failed to handle event",
					zap.String("event_type", event.Type),
					zap.Error(err),
				)
			}
		}
	}
}

func (c *KafkaConsumer) Close() error {
	return c.reader.Close()
}
