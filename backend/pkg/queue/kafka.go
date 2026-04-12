package queue

import (
	"context"
	"encoding/json"
	"time"

	"github.com/segmentio/kafka-go"

	"github.com/chawais/talent-flow/backend/pkg/logger"
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
