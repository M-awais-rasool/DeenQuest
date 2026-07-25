package http

import (
	"github.com/gin-gonic/gin"
)

// GET  /hifz/overview
// GET  /hifz/plans
// GET  /hifz/settings
// POST /hifz/enroll
// GET  /hifz/today
// POST /hifz/sessions
// POST /hifz/sessions/:id/stage
// POST /hifz/sessions/:id/recite
// POST /hifz/sessions/:id/complete
// POST /hifz/portions/:id/reset
// GET  /hifz/mistakes
func RegisterRoutes(authed *gin.RouterGroup, h *Handler) {
	hifz := authed.Group("/hifz")

	hifz.GET("/overview", h.GetOverview)
	hifz.GET("/plans", h.GetPlans)
	hifz.GET("/settings", h.GetSettings)
	hifz.POST("/enroll", h.PostEnroll)
	hifz.GET("/today", h.GetToday)
	hifz.GET("/mistakes", h.GetMistakes)

	sessions := hifz.Group("/sessions")
	sessions.POST("", h.PostSession)
	sessions.POST("/:id/stage", h.PostStage)
	sessions.POST("/:id/recite", h.PostRecite)
	sessions.POST("/:id/complete", h.PostComplete)

	hifz.POST("/portions/:id/reset", h.PostResetPortion)
}

// GET    /admin/hifz/plans
// POST   /admin/hifz/plans
// POST   /admin/hifz/plans/preview
// GET    /admin/hifz/plans/:id
// PUT    /admin/hifz/plans/:id
// DELETE /admin/hifz/plans/:id
// GET    /admin/hifz/settings
// PUT    /admin/hifz/settings
// GET    /admin/hifz/challenges
func RegisterAdminRoutes(admin *gin.RouterGroup, h *AdminHandler) {
	hifz := admin.Group("/hifz")

	plans := hifz.Group("/plans")
	plans.GET("", h.ListPlans)
	plans.POST("", h.CreatePlan)
	// Registered before /:id so "preview" is not swallowed as a plan id.
	plans.POST("/preview", h.PreviewPortions)
	plans.GET("/:id", h.GetPlan)
	plans.PUT("/:id", h.UpdatePlan)
	plans.DELETE("/:id", h.DeletePlan)

	hifz.GET("/settings", h.GetSettings)
	hifz.PUT("/settings", h.UpdateSettings)
	hifz.GET("/challenges", h.GetChallenges)
}
