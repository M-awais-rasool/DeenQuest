package handler

import (
	"github.com/gin-gonic/gin"

	learningapp "github.com/chawais/talent-flow/backend/internal/application/learning"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/response"
)

// LearningHandler exposes the Learning Agent's read surface: the user's evolving
// state and their current next-best-action recommendations.
type LearningHandler struct {
	recommender *learningapp.RecommenderService
}

func NewLearningHandler(recommender *learningapp.RecommenderService) *LearningHandler {
	return &LearningHandler{recommender: recommender}
}

// GetState returns the user's LearnerState (null for users with no events yet).
func (h *LearningHandler) GetState(c *gin.Context) {
	userID := c.GetString("user_id")
	state, err := h.recommender.State(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, "failed to fetch learning state")
		return
	}
	response.OK(c, "learning state fetched", state)
}

// GetAgentStats returns aggregate Learning Agent metrics for the admin page.
func (h *LearningHandler) GetAgentStats(c *gin.Context) {
	stats, err := h.recommender.Stats(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to fetch agent stats")
		return
	}
	response.OK(c, "agent stats fetched", stats)
}

// GetRecommendations returns the active set, recomputing only when stale.
func (h *LearningHandler) GetRecommendations(c *gin.Context) {
	userID := c.GetString("user_id")
	recs, err := h.recommender.Get(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, "failed to fetch recommendations")
		return
	}
	response.OK(c, "recommendations fetched", recs)
}
