package learningagent

import (
	"context"
)

func analyze(state *LearningState, events []BufferedEvent) *PatternReport {
	report := &PatternReport{
		WeakAreas:      state.WeakAreas,
		StrongAreas:    state.StrongAreas,
		EngagementRisk: state.Engagement.Level == EngagementAtRisk || state.Engagement.Level == EngagementLow,
		LearningSpeed:  state.LearningSpeed.Classification,
		TrendDirection: TrendStable,
	}

	return report
}

func decide(state *LearningState, report *PatternReport) *DecisionResult {
	result := &DecisionResult{
		UserID:    state.UserID,
		Timestamp: state.UpdatedAt,
	}

	if report.EngagementRisk {
		result.ActionType = ActionReEngage
		result.Reason = "engagement_risk_detected"
		return result
	}

	if len(report.WeakAreas) > 0 {
		result.ActionType = ActionAssignRevision
		result.Reason = "weak_area_detected"
		result.SubCategory = report.WeakAreas[0]
		result.Difficulty = "easy"
		return result
	}

	result.ActionType = ActionContinueNormal
	result.Reason = "healthy_progress"
	return result
}

func (a *Agent) processPipeline(ctx context.Context, userID string, events []BufferedEvent) error {
	state, err := a.store.GetOrCreate(ctx, userID)
	if err != nil {
		return err
	}

	report := analyze(state, events)
	decision := decide(state, report)

	if err := a.store.Save(ctx, state); err != nil {
		return err
	}

	return a.publishDecision(ctx, decision)
}
