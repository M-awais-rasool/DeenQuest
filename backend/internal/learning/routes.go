package learning

import "github.com/gin-gonic/gin"

// RegisterRoutes mounts the Learning Agent endpoints for authenticated users:
//
//	POST /events                          behavior-event ingestion (Kafka)
//	GET  /learning/state                  learner state (mastery, streak risk)
//	GET  /learning/recommendations        next-best-action set
//	GET  /learning/review                 spaced-repetition review queue
//	GET  /learning/report                 weekly parent/teacher report
//	GET  /learning/mistakes               mistake notebook
//	POST /learning/mistakes/:id/resolve   mark a mistake as resolved
func RegisterRoutes(authed *gin.RouterGroup, h *Handler, events *EventsHandler) {
	authed.POST("/events", events.Ingest)

	authed.GET("/learning/state", h.GetState)
	authed.GET("/learning/recommendations", h.GetRecommendations)
	authed.GET("/learning/review", h.GetReview)
	authed.GET("/learning/report", h.GetReport)
	authed.GET("/learning/mistakes", h.GetMistakes)
	authed.POST("/learning/mistakes/:id/resolve", h.ResolveMistake)
}

// RegisterAdminRoutes mounts Learning Agent monitoring and Curriculum Agent
// insights for the admin panel:
//
//	GET /learning/stats
//	GET /learning/curriculum
//	GET /learning/report/:userId
func RegisterAdminRoutes(admin *gin.RouterGroup, h *Handler) {
	admin.GET("/learning/stats", h.GetAgentStats)
	admin.GET("/learning/curriculum", h.GetCurriculum)
	admin.GET("/learning/report/:userId", h.GetUserReport)
}
