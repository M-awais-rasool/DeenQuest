package app

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/platform/config"
	"github.com/chawais/deenquest/backend/internal/platform/logger"
)

type App struct {
	cfg     *config.Config
	infra   *Infra
	modules *Modules
	router  *gin.Engine
}

func New(cfg *config.Config) (*App, error) {
	logger.Init(cfg.AppEnv)

	infra, err := connectInfra(cfg)
	if err != nil {
		return nil, err
	}

	modules, err := buildModules(cfg, infra)
	if err != nil {
		infra.Close()
		return nil, err
	}

	if err := seedStartupData(cfg, modules); err != nil {
		infra.Close()
		return nil, err
	}

	lifecycleCtx, cancelLifecycle := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancelLifecycle()
	err = prepareDataLifecycle(lifecycleCtx,
		modules.AnalyticsRoller.Backfill,
		func(ctx context.Context) error { return applyRetention(ctx, infra.DB) },
	)
	if err != nil {
		infra.Close()
		return nil, err
	}

	return &App{
		cfg:     cfg,
		infra:   infra,
		modules: modules,
		router:  buildRouter(cfg, infra, modules),
	}, nil
}

func (a *App) Run() error {
	defer logger.Sync()

	runCtx, stop := context.WithCancel(context.Background())
	defer stop()

	closeConsumers := startWorkers(runCtx, a.cfg, a.infra, a.modules)
	defer closeConsumers()
	defer a.infra.Close()

	addr := fmt.Sprintf("%s:%s", a.cfg.Host, a.cfg.Port)

	srv := &http.Server{
		Addr:              addr,
		Handler:           a.router,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       90 * time.Second,
		MaxHeaderBytes:    1 << 20,
	}

	serverErr := make(chan error, 1)
	go func() {
		logger.Info(fmt.Sprintf("DeenQuest API listening on %s", addr))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			serverErr <- err
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-serverErr:
		return fmt.Errorf("HTTP server failed: %w", err)
	case <-quit:
	}

	logger.Info("Shutting down DeenQuest API...")
	stop() // stops all workers

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		return fmt.Errorf("server forced to shutdown: %w", err)
	}

	logger.Info("DeenQuest API stopped")
	return nil
}
