package app

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	analyticshttp "github.com/chawais/deenquest/backend/internal/analytics/interfaces/http"
	authhttp "github.com/chawais/deenquest/backend/internal/auth/interfaces/http"
	challengehttp "github.com/chawais/deenquest/backend/internal/challenge/interfaces/http"
	coachhttp "github.com/chawais/deenquest/backend/internal/coach/interfaces/http"
	contenthttp "github.com/chawais/deenquest/backend/internal/content/interfaces/http"
	dailytaskhttp "github.com/chawais/deenquest/backend/internal/dailytask/interfaces/http"
	hifzhttp "github.com/chawais/deenquest/backend/internal/hifz/interfaces/http"
	levelhttp "github.com/chawais/deenquest/backend/internal/level/interfaces/http"
	notifhttp "github.com/chawais/deenquest/backend/internal/notification/interfaces/http"
	"github.com/chawais/deenquest/backend/internal/platform/config"
	"github.com/chawais/deenquest/backend/internal/platform/logger"
	"github.com/chawais/deenquest/backend/internal/platform/middleware"
	progresshttp "github.com/chawais/deenquest/backend/internal/progress/interfaces/http"
	quranhttp "github.com/chawais/deenquest/backend/internal/quran/interfaces/http"
	recitationhttp "github.com/chawais/deenquest/backend/internal/recitation/interfaces/http"
	rewardhttp "github.com/chawais/deenquest/backend/internal/reward/interfaces/http"
	userhttp "github.com/chawais/deenquest/backend/internal/user/interfaces/http"
)

func buildRouter(cfg *config.Config, infra *Infra, m *Modules) *gin.Engine {
	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	if err := r.SetTrustedProxies(cfg.TrustedProxyList()); err != nil {
		logger.Warn("invalid TRUSTED_PROXIES, falling back to trusting no proxy", zap.Error(err))
		_ = r.SetTrustedProxies(nil)
	}
	if cfg.IsProduction() {
		r.TrustedPlatform = gin.PlatformCloudflare
	}

	r.Use(middleware.Recovery())
	r.Use(middleware.RequestLogger(cfg.AccessLogSampleEvery))
	r.Use(middleware.CORS(cfg.AllowedOrigins()))

	if !cfg.IsProduction() {
		r.Use(middleware.Gzip())
	}

	if infra.Redis != nil {
		r.Use(middleware.RateLimitByIP(infra.Redis, 1000, time.Minute, "global"))
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "deenquest-api"})
	})

	r.GET("/health/ready", func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()

		checks := gin.H{"mongo": "ok", "redis": "ok"}
		status := http.StatusOK
		state := "ready"

		if err := infra.Mongo.Ping(ctx, nil); err != nil {
			checks["mongo"] = err.Error()
			status = http.StatusServiceUnavailable
			state = "not ready"
		}

		if infra.Redis == nil {
			checks["redis"] = "unavailable — caching and rate limiting are off"
		} else if err := infra.Redis.Client.Ping(ctx).Err(); err != nil {
			checks["redis"] = err.Error()
		}

		c.JSON(status, gin.H{"status": state, "checks": checks})
	})

	v1 := r.Group("/api/v1")

	authed := v1.Group("")
	authed.Use(middleware.JWTAuth(infra.JWT))
	if infra.Redis != nil {
		authed.Use(middleware.RateLimitByUser(infra.Redis, 300, time.Minute, "api"))
	}

	admin := v1.Group("/admin")
	admin.Use(middleware.JWTAuth(infra.JWT), middleware.AdminOnly(cfg.AdminEmailList()))

	authPublic := v1.Group("")
	if infra.Redis != nil {
		authPublic.Use(middleware.RateLimitByIP(infra.Redis, 20, time.Minute, "auth"))
	}
	authhttp.RegisterRoutes(authPublic, authed, m.AuthHandler)
	userhttp.RegisterRoutes(v1, authed, m.UserHandler)

	// learning features (formerly the single "progress" module)
	progresshttp.RegisterRoutes(v1, authed, m.ProgressHandler)
	levelhttp.RegisterRoutes(authed, m.LevelHandler)
	dailytaskhttp.RegisterRoutes(authed, m.TaskHandler)
	rewardhttp.RegisterRoutes(authed, m.RewardHandler)
	// Submitting a clip is limited hard — each one costs a transcription. The
	// poll that follows it rides the ordinary authed budget, because a client
	// waiting in the queue has to ask about once a second.
	recite := authed.Group("")
	if infra.Redis != nil {
		recite.Use(middleware.RateLimitByUser(infra.Redis, 10, time.Minute, "recite"))
	}
	recitationhttp.RegisterRoutes(recite, authed, m.RecitationHandler)
	hifzhttp.RegisterRoutes(authed, m.HifzHandler)
	challengehttp.RegisterRoutes(authed, m.ChallengeHandler)
	if m.CoachHandler != nil {
		coachhttp.RegisterRoutes(authed, m.CoachHandler)
	}

	levelhttp.RegisterAdminRoutes(admin, m.LevelAdminHandler)
	dailytaskhttp.RegisterAdminRoutes(admin, m.TaskAdminHandler)
	rewardhttp.RegisterAdminRoutes(admin, m.RewardAdminHandler)
	contenthttp.RegisterAdminRoutes(admin, m.ContentHandler)
	analyticshttp.RegisterAdminRoutes(admin, m.AnalyticsHandler)
	hifzhttp.RegisterAdminRoutes(admin, m.HifzAdminHandler)
	if m.CoachAdminHandler != nil {
		coachhttp.RegisterAdminRoutes(admin, m.CoachAdminHandler)
	}

	quranhttp.RegisterRoutes(v1.Group("/quran"), m.QuranHandler)
	quranhttp.RegisterRoutes(r.Group("/api/quran"), m.QuranHandler) // legacy path used by older clients

	notifhttp.RegisterRoutes(authed, m.NotificationHandler)

	return r
}
