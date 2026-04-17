package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/chawais/talent-flow/backend/pkg/cache"
	"github.com/chawais/talent-flow/backend/pkg/config"
	"github.com/chawais/talent-flow/backend/pkg/logger"
	"github.com/chawais/talent-flow/backend/pkg/middleware"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	logger.Init(cfg.AppEnv)
	defer logger.Sync()

	logger.Info("Starting API Gateway...")

	// Connect to Redis for rate limiting
	redisClient, err := cache.NewRedisClient(cfg.GetRedisAddr(), cfg.RedisPassword, cfg.RedisDB)
	if err != nil {
		logger.Warn(fmt.Sprintf("Redis not available for rate limiting: %v", err))
		redisClient = nil
	} else {
		defer redisClient.Close()
	}

	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(middleware.Recovery())
	r.Use(middleware.RequestLogger())
	r.Use(middleware.CORS(cfg.AllowedOrigins()))

	if redisClient != nil {
		r.Use(middleware.RateLimit(redisClient, 100, time.Minute))
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "api-gateway"})
	})

	// Proxy routes
	setupProxyRoutes(r, cfg)

	addr := fmt.Sprintf("%s:%s", cfg.GatewayHost, cfg.GatewayPort)
	srv := &http.Server{
		Addr:    addr,
		Handler: r,
	}

	go func() {
		logger.Info(fmt.Sprintf("API Gateway listening on %s", addr))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal(fmt.Sprintf("Failed to start gateway: %v", err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down API Gateway...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatal(fmt.Sprintf("Gateway forced to shutdown: %v", err))
	}
	logger.Info("API Gateway stopped")
}

func setupProxyRoutes(r *gin.Engine, cfg *config.Config) {
	// Auth service routes
	r.Any("/api/v1/auth/*path", createReverseProxy(cfg.AuthServiceURL))
	r.Any("/api/v1/users/*path", createReverseProxy(cfg.AuthServiceURL))

	// Core service routes
	r.Any("/api/v1/progress/*path", createReverseProxy(cfg.CoreServiceURL))
	r.Any("/api/v1/daily-tasks", createReverseProxy(cfg.CoreServiceURL))
	r.Any("/api/v1/daily-tasks/*path", createReverseProxy(cfg.CoreServiceURL))
	r.Any("/api/v1/levels", createReverseProxy(cfg.CoreServiceURL))
	r.Any("/api/v1/levels/*path", createReverseProxy(cfg.CoreServiceURL))
}

func createReverseProxy(target string) gin.HandlerFunc {
	return func(c *gin.Context) {
		targetURL, err := url.Parse(target)
		if err != nil {
			logger.Error(fmt.Sprintf("Failed to parse target URL: %v", err))
			c.JSON(http.StatusBadGateway, gin.H{"error": "Service unavailable"})
			return
		}

		proxy := httputil.NewSingleHostReverseProxy(targetURL)

		proxy.ModifyResponse = func(resp *http.Response) error {
			// CORS is handled at gateway middleware. Remove upstream CORS headers
			// to avoid duplicate values like "*, *" in proxied responses.
			resp.Header.Del("Access-Control-Allow-Origin")
			resp.Header.Del("Access-Control-Allow-Credentials")
			resp.Header.Del("Access-Control-Allow-Methods")
			resp.Header.Del("Access-Control-Allow-Headers")
			resp.Header.Del("Access-Control-Expose-Headers")
			resp.Header.Del("Access-Control-Max-Age")
			return nil
		}

		proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
			logger.Error(fmt.Sprintf("Proxy error: %v", err))
			w.WriteHeader(http.StatusBadGateway)
			w.Write([]byte(`{"success":false,"error":"Service unavailable"}`))
		}

		c.Request.Host = targetURL.Host
		proxy.ServeHTTP(c.Writer, c.Request)
	}
}
