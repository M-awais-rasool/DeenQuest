package learningagent

import (
	"time"
)

type Config struct {
	KafkaBrokers []string
	KafkaGroupID string
	MongoURI     string
	MongoDB      string

	BufferSize        int
	BufferWindow      time.Duration
	AnalysisThreshold int
}

func DefaultConfig() *Config {
	return &Config{
		KafkaBrokers:      []string{"localhost:9092"},
		KafkaGroupID:      "learning-agent-group",
		MongoURI:          "mongodb://localhost:27017",
		MongoDB:           "deenquest",
		BufferSize:        5,
		BufferWindow:      10 * time.Minute,
		AnalysisThreshold: 5,
	}
}

func (c *Config) Validate() error {
	if len(c.KafkaBrokers) == 0 {
		return ErrKafkaBrokersRequired
	}
	if c.MongoURI == "" {
		return ErrMongoURIRequired
	}
	return nil
}
