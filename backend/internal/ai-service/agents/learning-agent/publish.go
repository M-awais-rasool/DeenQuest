package learningagent

import (
	"context"
	"encoding/json"

	"github.com/chawais/talent-flow/backend/pkg/logger"
	"github.com/chawais/talent-flow/backend/pkg/queue"
	"go.uber.org/zap"
)

const topicLearningAction = "learning.action.decided"

func (a *Agent) publishDecision(ctx context.Context, result *DecisionResult) error {
	payload, err := json.Marshal(result)
	if err != nil {
		return err
	}

	event := queue.Event{
		Type:    "action.decided",
		Payload: json.RawMessage(payload),
	}

	if err := a.producer.Publish(ctx, topicLearningAction, event); err != nil {
		logger.Error("failed to publish decision",
			zap.String("user_id", result.UserID),
			zap.String("action", string(result.ActionType)),
			zap.Error(err),
		)
		return err
	}

	logger.Info("decision published",
		zap.String("user_id", result.UserID),
		zap.String("action", string(result.ActionType)),
	)
	return nil
}
