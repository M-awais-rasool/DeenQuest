package app

import (
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/analytics"
	"github.com/chawais/deenquest/backend/internal/coach"
	"github.com/chawais/deenquest/backend/internal/content"
	"github.com/chawais/deenquest/backend/internal/dailytask"
	"github.com/chawais/deenquest/backend/internal/level"
	"github.com/chawais/deenquest/backend/internal/progress"
	"github.com/chawais/deenquest/backend/internal/recitation"
	"github.com/chawais/deenquest/backend/internal/reward"
	"github.com/chawais/deenquest/backend/internal/user"
)

// TestLearningRoutesRegister assembles the learning-feature routes on the same
// group structure buildRouter uses. It guards the package split against two
// regressions: a gin duplicate-route panic (features registering the same
// path) and a dropped endpoint. Services are built with nil repositories — the
// handlers are never invoked, only registered.
func TestLearningRoutesRegister(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	v1 := r.Group("/api/v1")
	authed := v1.Group("")
	admin := v1.Group("/admin")

	progressSvc := progress.NewService(nil)
	rewardSvc := reward.NewService(nil)
	levelSvc := level.NewService(nil, progressSvc, rewardSvc)
	taskSvc := dailytask.NewService(nil, progressSvc)
	recSvc := recitation.NewService(nil, "", levelSvc, progressSvc)

	progress.RegisterRoutes(v1, authed, progress.NewHandler(progressSvc))
	level.RegisterRoutes(authed, level.NewHandler(levelSvc))
	dailytask.RegisterRoutes(authed, dailytask.NewHandler(taskSvc))
	reward.RegisterRoutes(authed, reward.NewHandler(rewardSvc))
	recitation.RegisterRoutes(authed, recitation.NewHandler(recSvc))

	user.RegisterAdminRoutes(admin, user.NewAdminHandler(user.NewService(nil)))
	level.RegisterAdminRoutes(admin, level.NewAdminHandler(levelSvc))
	dailytask.RegisterAdminRoutes(admin, dailytask.NewAdminHandler(taskSvc))
	reward.RegisterAdminRoutes(admin, reward.NewAdminHandler(rewardSvc))
	content.RegisterAdminRoutes(admin, content.NewHandler())
	analytics.RegisterAdminRoutes(admin, analytics.NewHandler(nil))
	coach.RegisterAdminRoutes(admin, coach.NewAdminHandler(coach.NewAdminService(nil)))

	want := []string{
		"GET /api/v1/progress/user/:id",
		"GET /api/v1/progress/me",
		"GET /api/v1/leaderboard",
		"GET /api/v1/daily-tasks",
		"POST /api/v1/daily-tasks/:id/complete",
		"GET /api/v1/levels",
		"GET /api/v1/levels/:id",
		"POST /api/v1/levels/:id/lessons/complete",
		"POST /api/v1/levels/:id/complete",
		"GET /api/v1/rewards",
		"POST /api/v1/recitation/check",
		"GET /api/v1/admin/users",
		"PUT /api/v1/admin/users/:id/app-icon",
		"GET /api/v1/admin/registry",
		"GET /api/v1/admin/analytics",
		"GET /api/v1/admin/levels",
		"POST /api/v1/admin/levels",
		"GET /api/v1/admin/levels/:id",
		"PUT /api/v1/admin/levels/:id",
		"DELETE /api/v1/admin/levels/:id",
		"GET /api/v1/admin/tasks",
		"POST /api/v1/admin/tasks",
		"GET /api/v1/admin/tasks/:id",
		"PUT /api/v1/admin/tasks/:id",
		"DELETE /api/v1/admin/tasks/:id",
		"GET /api/v1/admin/rewards",
		"POST /api/v1/admin/rewards",
		"GET /api/v1/admin/rewards/:id",
		"PUT /api/v1/admin/rewards/:id",
		"DELETE /api/v1/admin/rewards/:id",
		"GET /api/v1/admin/learning/stats",
		"GET /api/v1/admin/learning/curriculum",
	}

	got := make(map[string]bool)
	for _, ri := range r.Routes() {
		got[ri.Method+" "+ri.Path] = true
	}

	for _, w := range want {
		if !got[w] {
			t.Errorf("route not registered: %s", w)
		}
	}
}
