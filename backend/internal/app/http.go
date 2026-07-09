package app

import (
	"time"

	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/auth"
	"github.com/chawais/deenquest/backend/internal/notification"
	"github.com/chawais/deenquest/backend/internal/platform/config"
	"github.com/chawais/deenquest/backend/internal/platform/middleware"
	"github.com/chawais/deenquest/backend/internal/progress"
	"github.com/chawais/deenquest/backend/internal/quran"
	"github.com/chawais/deenquest/backend/internal/user"
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

	auth.RegisterRoutes(v1, m.AuthHandler)
	user.RegisterRoutes(v1, authed, m.UserHandler)

	progress.RegisterRoutes(v1, authed, m.CoreHandler, m.RecitationHandler)
	progress.RegisterAdminRoutes(admin, m.AdminHandler)

	quran.RegisterRoutes(v1.Group("/quran"), m.QuranHandler)
	quran.RegisterRoutes(r.Group("/api/quran"), m.QuranHandler) // legacy path used by older clients

	notification.RegisterRoutes(authed, m.NotificationHandler)

	return r
}
