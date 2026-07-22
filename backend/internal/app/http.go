package app

import (
	"time"

	"github.com/gin-gonic/gin"

	analyticshttp "github.com/chawais/deenquest/backend/internal/analytics/interfaces/http"
	authhttp "github.com/chawais/deenquest/backend/internal/auth/interfaces/http"
	coachhttp "github.com/chawais/deenquest/backend/internal/coach/interfaces/http"
	contenthttp "github.com/chawais/deenquest/backend/internal/content/interfaces/http"
	dailytaskhttp "github.com/chawais/deenquest/backend/internal/dailytask/interfaces/http"
	levelhttp "github.com/chawais/deenquest/backend/internal/level/interfaces/http"
	notifhttp "github.com/chawais/deenquest/backend/internal/notification/interfaces/http"
	"github.com/chawais/deenquest/backend/internal/platform/config"
	"github.com/chawais/deenquest/backend/internal/platform/middleware"
	progresshttp "github.com/chawais/deenquest/backend/internal/progress/interfaces/http"
	quranhttp "github.com/chawais/deenquest/backend/internal/quran/interfaces/http"
	recitationhttp "github.com/chawais/deenquest/backend/internal/recitation/interfaces/http"
	rewardhttp "github.com/chawais/deenquest/backend/internal/reward/interfaces/http"
	userhttp "github.com/chawais/deenquest/backend/internal/user/interfaces/http"
)

// buildRouter assembles the HTTP surface: global middleware, the three route
// groups (public /api/v1, JWT-authenticated, admin-only), and each module's
// routes. The actual endpoints live in every module's routes.go.
func buildRouter(cfg *config.Config, infra *Infra, m *Modules) *gin.Engine {
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(middleware.Recovery())
	r.Use(middleware.RequestLogger())
	r.Use(middleware.CORS(cfg.AllowedOrigins()))
	r.Use(middleware.Gzip())
	if infra.Redis != nil {
		r.Use(middleware.RateLimit(infra.Redis, 100, time.Minute))
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "deenquest-api"})
	})

	v1 := r.Group("/api/v1")

	authed := v1.Group("")
	authed.Use(middleware.JWTAuth(infra.JWT))

	admin := v1.Group("/admin")
	admin.Use(middleware.JWTAuth(infra.JWT), middleware.AdminOnly(cfg.AdminEmailList()))

	authhttp.RegisterRoutes(v1, m.AuthHandler)
	userhttp.RegisterRoutes(v1, authed, m.UserHandler)

	// learning features (formerly the single "progress" module)
	progresshttp.RegisterRoutes(v1, authed, m.ProgressHandler)
	levelhttp.RegisterRoutes(authed, m.LevelHandler)
	dailytaskhttp.RegisterRoutes(authed, m.TaskHandler)
	rewardhttp.RegisterRoutes(authed, m.RewardHandler)
	recitationhttp.RegisterRoutes(authed, m.RecitationHandler)
	if m.CoachHandler != nil {
		coachhttp.RegisterRoutes(authed, m.CoachHandler)
	}

	userhttp.RegisterAdminRoutes(admin, m.UserAdminHandler)
	levelhttp.RegisterAdminRoutes(admin, m.LevelAdminHandler)
	dailytaskhttp.RegisterAdminRoutes(admin, m.TaskAdminHandler)
	rewardhttp.RegisterAdminRoutes(admin, m.RewardAdminHandler)
	contenthttp.RegisterAdminRoutes(admin, m.ContentHandler)
	analyticshttp.RegisterAdminRoutes(admin, m.AnalyticsHandler)
	if m.CoachAdminHandler != nil {
		coachhttp.RegisterAdminRoutes(admin, m.CoachAdminHandler)
	}

	quranhttp.RegisterRoutes(v1.Group("/quran"), m.QuranHandler)
	quranhttp.RegisterRoutes(r.Group("/api/quran"), m.QuranHandler) // legacy path used by older clients

	notifhttp.RegisterRoutes(authed, m.NotificationHandler)

	return r
}
