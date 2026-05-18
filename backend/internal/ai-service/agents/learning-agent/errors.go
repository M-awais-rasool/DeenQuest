package learningagent

import "errors"

var (
	ErrKafkaBrokersRequired = errors.New("learning-agent: kafka brokers are required")
	ErrMongoURIRequired     = errors.New("learning-agent: mongo URI is required")
)
