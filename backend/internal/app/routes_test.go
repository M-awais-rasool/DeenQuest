package app

import (
	"testing"

	"github.com/gin-gonic/gin"

	analyticshttp "github.com/chawais/deenquest/backend/internal/analytics/interfaces/http"
	coachapp "github.com/chawais/deenquest/backend/internal/coach/application"
	coachhttp "github.com/chawais/deenquest/backend/internal/coach/interfaces/http"
	contenthttp "github.com/chawais/deenquest/backend/internal/content/interfaces/http"
	dailytaskapp "github.com/chawais/deenquest/backend/internal/dailytask/application"
	dailytaskhttp "github.com/chawais/deenquest/backend/internal/dailytask/interfaces/http"
	levelapp "github.com/chawais/deenquest/backend/internal/level/application"
	levelhttp "github.com/chawais/deenquest/backend/internal/level/interfaces/http"
	progressapp "github.com/chawais/deenquest/backend/internal/progress/application"
	progresshttp "github.com/chawais/deenquest/backend/internal/progress/interfaces/http"
	recitationapp "github.com/chawais/deenquest/backend/internal/recitation/application"
	recitationhttp "github.com/chawais/deenquest/backend/internal/recitation/interfaces/http"
	rewardapp "github.com/chawais/deenquest/backend/internal/reward/application"
	rewardhttp "github.com/chawais/deenquest/backend/internal/reward/interfaces/http"
	userapp "github.com/chawais/deenquest/backend/internal/user/application"
	userhttp "github.com/chawais/deenquest/backend/internal/user/interfaces/http"
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

	progressSvc := progressapp.NewService(nil)
	rewardSvc := rewardapp.NewService(nil)
	levelSvc := levelapp.NewService(nil, progressSvc, rewardSvc)
	taskSvc := dailytaskapp.NewService(nil, progressSvc)
	recSvc := recitationapp.NewService(nil, "", levelSvc, progressSvc)

	progresshttp.RegisterRoutes(v1, authed, progresshttp.NewHandler(progressSvc))
	levelhttp.RegisterRoutes(authed, levelhttp.NewHandler(levelSvc))
	dailytaskhttp.RegisterRoutes(authed, dailytaskhttp.NewHandler(taskSvc))
	rewardhttp.RegisterRoutes(authed, rewardhttp.NewHandler(rewardSvc))
	recitationhttp.RegisterRoutes(authed, recitationhttp.NewHandler(recSvc))

	userhttp.RegisterAdminRoutes(admin, userhttp.NewAdminHandler(userapp.NewService(nil)))
	levelhttp.RegisterAdminRoutes(admin, levelhttp.NewAdminHandler(levelSvc))
	dailytaskhttp.RegisterAdminRoutes(admin, dailytaskhttp.NewAdminHandler(taskSvc))
	rewardhttp.RegisterAdminRoutes(admin, rewardhttp.NewAdminHandler(rewardSvc))
	contenthttp.RegisterAdminRoutes(admin, contenthttp.NewHandler())
	analyticshttp.RegisterAdminRoutes(admin, analyticshttp.NewHandler(nil))
	coachhttp.RegisterAdminRoutes(admin, coachhttp.NewAdminHandler(coachapp.NewAdminService(nil)))

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
