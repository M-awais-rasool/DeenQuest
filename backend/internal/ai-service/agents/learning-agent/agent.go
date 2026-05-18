package learningagent

import (
	"context"
	"encoding/json"

	"github.com/chawais/talent-flow/backend/pkg/logger"
	"github.com/chawais/talent-flow/backend/pkg/queue"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.uber.org/zap"
)

type Agent struct {
	config  *Config
	buffer  *EventBuffer
	store   *StateStore
	producer *queue.KafkaProducer
	consumers []*queue.KafkaConsumer
}

func New(cfg *Config) (*Agent, error) {
	if err := cfg.Validate(); err != nil {
		return nil, err
	}

	return &Agent{
		config:    cfg,
		buffer:    NewEventBuffer(cfg.BufferSize, cfg.BufferWindow, cfg.AnalysisThreshold),
		producer:  queue.NewKafkaProducer(cfg.KafkaBrokers),
		consumers: make([]*queue.KafkaConsumer, 0),
	}, nil
}

func (a *Agent) Initialize(ctx context.Context) error {
	a.store = NewStateStore(a.getMongoDB(ctx))
	return nil
}

func (a *Agent) Start(ctx context.Context) {
	topics := []string{
		"user.task.completed",
		"user.task.failed",
		"user.task.skipped",
		"user.level.completed",
		"user.level.failed",
		"user.inactive.detected",
		"user.activity.logged",
	}

	for _, topic := range topics {
		c := queue.NewKafkaConsumer(a.config.KafkaBrokers, topic, a.config.KafkaGroupID)
		a.consumers = append(a.consumers, c)
		go a.consumeLoop(ctx, c, topic)
	}

	<-ctx.Done()
}

func (a *Agent) consumeLoop(ctx context.Context, consumer *queue.KafkaConsumer, topic string) {
	defer consumer.Close()

	err := consumer.Consume(ctx, func(ctx context.Context, event queue.Event) error {
		return a.handleEvent(ctx, event)
	})
	if err != nil {
		logger.Error("consumer stopped", zap.String("topic", topic), zap.Error(err))
	}
}

func (a *Agent) handleEvent(ctx context.Context, event queue.Event) error {
	var payload map[string]interface{}
	if event.Payload != nil {
		data, err := json.Marshal(event.Payload)
		if err != nil {
			return err
		}
		if err := json.Unmarshal(data, &payload); err != nil {
			return err
		}
	}

	userID, _ := payload["user_id"].(string)
	if userID == "" {
		logger.Warn("event missing user_id", zap.String("event_type", event.Type))
		return nil
	}

	events, ready := a.buffer.Add(userID, event.Type, payload)
	if !ready {
		return nil
	}

	return a.processPipeline(ctx, userID, events)
}

func (a *Agent) getMongoDB(ctx context.Context) *mongo.Database {
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(a.config.MongoURI))
	if err != nil {
		logger.Fatal("failed to connect MongoDB", zap.Error(err))
	}
	return client.Database(a.config.MongoDB)
}
