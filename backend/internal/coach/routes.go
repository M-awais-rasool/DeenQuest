package coach

import "github.com/gin-gonic/gin"

//	POST /telemetry/events
//	GET  /coach/insights
//	GET  /coach/practice?insight_id=…
//	POST /coach/practice/complete
func RegisterRoutes(authed *gin.RouterGroup, h *Handler) {
	authed.POST("/telemetry/events", h.PostEvents)

	coach := authed.Group("/coach")
	coach.GET("/insights", h.GetInsights)
	coach.GET("/practice", h.GetPractice)
	coach.POST("/practice/complete", h.CompletePractice)
}

//	GET /admin/learning/stats
//	GET /admin/learning/curriculum
func RegisterAdminRoutes(admin *gin.RouterGroup, h *AdminHandler) {
	learning := admin.Group("/learning")
	learning.GET("/stats", h.GetStats)
	learning.GET("/curriculum", h.GetCurriculum)
}
