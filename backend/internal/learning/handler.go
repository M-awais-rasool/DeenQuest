package learning

import (
	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/platform/response"
)

// Handler exposes the Learning Agent's read surface: the user's evolving
// state, next-best-action recommendations, the daily review set, and the mistake
// notebook.
type Handler struct {
	recommender *RecommenderService
	mistakes    *MistakeService
	curriculum  *CurriculumService
	report      *ReportService
}

func NewHandler(
	recommender *RecommenderService,
	mistakes *MistakeService,
	curriculum *CurriculumService,
	report *ReportService,
) *Handler {
	return &Handler{
		recommender: recommender,
		mistakes:    mistakes,
		curriculum:  curriculum,
		report:      report,
	}
}

// GetState returns the user's LearnerState (null for users with no events yet).
func (h *Handler) GetState(c *gin.Context) {
	userID := c.GetString("user_id")
	state, err := h.recommender.State(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, "failed to fetch learning state")
		return
	}
	response.OK(c, "learning state fetched", state)
}

// GetAgentStats returns aggregate Learning Agent metrics for the admin page.
func (h *Handler) GetAgentStats(c *gin.Context) {
	stats, err := h.recommender.Stats(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to fetch agent stats")
		return
	}
	response.OK(c, "agent stats fetched", stats)
}

// GetRecommendations returns the active set, recomputing only when stale.
func (h *Handler) GetRecommendations(c *gin.Context) {
	userID := c.GetString("user_id")
	recs, err := h.recommender.Get(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, "failed to fetch recommendations")
		return
	}
	response.OK(c, "recommendations fetched", recs)
}

// GetReport returns the current user's weekly report (parent/teacher friendly).
func (h *Handler) GetReport(c *gin.Context) {
	userID := c.GetString("user_id")
	rep, err := h.report.Weekly(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, "failed to build report")
		return
	}
	response.OK(c, "report built", rep)
}

// GetUserReport returns any learner's weekly report (admin / teacher view).
func (h *Handler) GetUserReport(c *gin.Context) {
	userID := c.Param("userId")
	if userID == "" {
		response.BadRequest(c, "user id is required")
		return
	}
	rep, err := h.report.Weekly(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, "failed to build report")
		return
	}
	response.OK(c, "report built", rep)
}

// GetCurriculum returns the admin Curriculum Agent insights (struggle hotspots).
func (h *Handler) GetCurriculum(c *gin.Context) {
	insights, err := h.curriculum.Insights(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to fetch curriculum insights")
		return
	}
	response.OK(c, "curriculum insights fetched", insights)
}

// GetReview returns just the due-revision set — the Daily Review.
func (h *Handler) GetReview(c *gin.Context) {
	userID := c.GetString("user_id")
	recs, err := h.recommender.Review(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, "failed to fetch review")
		return
	}
	response.OK(c, "review fetched", recs)
}

// GetMistakes returns the learner's mistake notebook (open by default; ?all=true
// includes resolved ones).
func (h *Handler) GetMistakes(c *gin.Context) {
	userID := c.GetString("user_id")
	includeResolved := c.Query("all") == "true"
	items, err := h.mistakes.List(c.Request.Context(), userID, includeResolved)
	if err != nil {
		response.InternalError(c, "failed to fetch mistakes")
		return
	}
	response.OK(c, "mistakes fetched", items)
}

// ResolveMistake marks a mistake as revisited.
func (h *Handler) ResolveMistake(c *gin.Context) {
	userID := c.GetString("user_id")
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "mistake id is required")
		return
	}
	if err := h.mistakes.Resolve(c.Request.Context(), userID, id); err != nil {
		response.InternalError(c, "failed to resolve mistake")
		return
	}
	response.OK(c, "mistake resolved", gin.H{"id": id})
}
