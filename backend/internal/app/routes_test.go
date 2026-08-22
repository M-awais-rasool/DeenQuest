package app

import (
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	authapp "github.com/chawais/deenquest/backend/internal/auth/application"
	authhttp "github.com/chawais/deenquest/backend/internal/auth/interfaces/http"
	"github.com/chawais/deenquest/backend/internal/platform/jwt"

	analyticshttp "github.com/chawais/deenquest/backend/internal/analytics/interfaces/http"
	challengeapp "github.com/chawais/deenquest/backend/internal/challenge/application"
	challengehttp "github.com/chawais/deenquest/backend/internal/challenge/interfaces/http"
	coachapp "github.com/chawais/deenquest/backend/internal/coach/application"
	coachhttp "github.com/chawais/deenquest/backend/internal/coach/interfaces/http"
	contenthttp "github.com/chawais/deenquest/backend/internal/content/interfaces/http"
	dailytaskapp "github.com/chawais/deenquest/backend/internal/dailytask/application"
	dailytaskhttp "github.com/chawais/deenquest/backend/internal/dailytask/interfaces/http"
	hifzapp "github.com/chawais/deenquest/backend/internal/hifz/application"
	hifzhttp "github.com/chawais/deenquest/backend/internal/hifz/interfaces/http"
	levelapp "github.com/chawais/deenquest/backend/internal/level/application"
	levelhttp "github.com/chawais/deenquest/backend/internal/level/interfaces/http"
	progressapp "github.com/chawais/deenquest/backend/internal/progress/application"
	progresshttp "github.com/chawais/deenquest/backend/internal/progress/interfaces/http"
	recitationapp "github.com/chawais/deenquest/backend/internal/recitation/application"
	recitationhttp "github.com/chawais/deenquest/backend/internal/recitation/interfaces/http"
	rewardapp "github.com/chawais/deenquest/backend/internal/reward/application"
	rewardhttp "github.com/chawais/deenquest/backend/internal/reward/interfaces/http"
)

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

	hifzSvc := hifzapp.NewService(nil, nil, recSvc, progressSvc)
	hifzhttp.RegisterRoutes(authed, hifzhttp.NewHandler(hifzSvc))

	challengeSvc := challengeapp.NewService(nil, nil, progressSvc)
	challengehttp.RegisterRoutes(authed, challengehttp.NewHandler(challengeSvc))

	levelhttp.RegisterAdminRoutes(admin, levelhttp.NewAdminHandler(levelSvc))
	dailytaskhttp.RegisterAdminRoutes(admin, dailytaskhttp.NewAdminHandler(taskSvc))
	rewardhttp.RegisterAdminRoutes(admin, rewardhttp.NewAdminHandler(rewardSvc))
	contenthttp.RegisterAdminRoutes(admin, contenthttp.NewHandler())
	analyticshttp.RegisterAdminRoutes(admin, analyticshttp.NewHandler(nil))
	coachhttp.RegisterAdminRoutes(admin, coachhttp.NewAdminHandler(coachapp.NewAdminService(nil)))
	hifzhttp.RegisterAdminRoutes(admin, hifzhttp.NewAdminHandler(
		hifzapp.NewAdminService(nil, nil, hifzSvc)))

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

		"GET /api/v1/hifz/overview",
		"GET /api/v1/hifz/plans",
		"GET /api/v1/hifz/settings",
		"GET /api/v1/hifz/today",
		"GET /api/v1/hifz/mistakes",
		"POST /api/v1/hifz/enroll",
		"POST /api/v1/hifz/sessions",
		"POST /api/v1/hifz/sessions/:id/stage",
		"POST /api/v1/hifz/sessions/:id/recite",
		"POST /api/v1/hifz/sessions/:id/complete",
		"POST /api/v1/hifz/portions/:id/reset",
		"GET /api/v1/admin/hifz/plans",
		"POST /api/v1/admin/hifz/plans",
		// Static "preview" must coexist with the /:id wildcard — registering it
		// after /:id is how gin panics on a route conflict.
		"POST /api/v1/admin/hifz/plans/preview",
		"GET /api/v1/admin/hifz/plans/:id",
		"PUT /api/v1/admin/hifz/plans/:id",
		"DELETE /api/v1/admin/hifz/plans/:id",
		"GET /api/v1/admin/hifz/settings",
		"PUT /api/v1/admin/hifz/settings",
		"GET /api/v1/admin/hifz/challenges",

		"GET /api/v1/challenges",
		"POST /api/v1/challenges/duels",
		// Static "join" must coexist with the /:id wildcard — registering it
		// after /:id is how gin panics on a route conflict.
		"POST /api/v1/challenges/duels/join",
		"DELETE /api/v1/challenges/duels/:id",
		"POST /api/v1/challenges/groups",
		"POST /api/v1/challenges/groups/join",
		"POST /api/v1/challenges/encouragements",
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

// The auth routes mix static segments with wildcards under one /auth prefix,
// and are split across the public and authenticated groups. Registering them
// together is what would surface a gin route conflict as a panic.
func TestAuthRoutesRegister(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	v1 := r.Group("/api/v1")
	authed := v1.Group("")

	authSvc := authapp.NewService(nil, nil, jwt.NewJWTManager("test", time.Minute), nil, authapp.Options{})
	authhttp.RegisterRoutes(v1, authed, authhttp.NewHandler(authSvc))

	want := []string{
		"GET /api/v1/auth/providers",
		"POST /api/v1/auth/oauth/:provider",
		"POST /api/v1/auth/refresh",
		"POST /api/v1/auth/logout",
		"GET /api/v1/auth/sessions",
		"DELETE /api/v1/auth/sessions/:id",
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
