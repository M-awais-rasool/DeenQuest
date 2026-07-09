package progress

import "github.com/gin-gonic/gin"

// RegisterRoutes mounts the progress endpoints (streaks, daily tasks, levels,
// rewards, leaderboard) plus recitation checking.
//
// Public:
//
//	GET /progress/user/:id
//
// Authenticated:
//
//	GET  /progress/me
//	GET  /leaderboard
//	GET  /daily-tasks
//	POST /daily-tasks/:id/complete
//	GET  /levels
//	GET  /levels/:id
//	POST /levels/:id/lessons/complete
//	POST /levels/:id/complete
//	GET  /rewards
//	POST /recitation/check
func RegisterRoutes(public, authed *gin.RouterGroup, core *CoreHandler, recitation *RecitationHandler) {
	public.GET("/progress/user/:id", core.GetPublicProgress)

	authed.GET("/progress/me", core.GetProgress)
	authed.GET("/leaderboard", core.GetLeaderboard)

	authed.GET("/daily-tasks", core.GetDailyTasks)
	authed.POST("/daily-tasks/:id/complete", core.CompleteDailyTask)

	authed.GET("/levels", core.GetLevels)
	authed.GET("/levels/:id", core.GetLevelDetail)
	authed.POST("/levels/:id/lessons/complete", core.CompleteLesson)
	authed.POST("/levels/:id/complete", core.CompleteLevel)

	authed.GET("/rewards", core.GetRewards)

	authed.POST("/recitation/check", recitation.CheckRecitation)
}

// RegisterAdminRoutes mounts the admin-panel CRUD endpoints for content
// (levels, tasks, rewards) plus the user registry and analytics dashboards.
func RegisterAdminRoutes(admin *gin.RouterGroup, h *AdminHandler) {
	admin.GET("/registry", h.GetRegistry)
	admin.GET("/analytics", h.GetAnalytics)

	admin.GET("/levels", h.ListLevels)
	admin.POST("/levels", h.CreateLevel)
	admin.GET("/levels/:id", h.GetLevel)
	admin.PUT("/levels/:id", h.UpdateLevel)
	admin.DELETE("/levels/:id", h.DeleteLevel)

	admin.GET("/tasks", h.ListTasks)
	admin.POST("/tasks", h.CreateTask)
	admin.GET("/tasks/:id", h.GetTask)
	admin.PUT("/tasks/:id", h.UpdateTask)
	admin.DELETE("/tasks/:id", h.DeleteTask)

	admin.GET("/rewards", h.ListRewards)
	admin.POST("/rewards", h.CreateReward)
	admin.GET("/rewards/:id", h.GetReward)
	admin.PUT("/rewards/:id", h.UpdateReward)
	admin.DELETE("/rewards/:id", h.DeleteReward)
}
