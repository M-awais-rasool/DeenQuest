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

	return &App{
		cfg:     cfg,
		infra:   infra,
		modules: modules,
		router:  buildRouter(cfg, infra, modules),
	}, nil
}

// Run starts the background workers and the HTTP server, then blocks until
// SIGINT/SIGTERM and shuts everything down gracefully.
func (a *App) Run() error {
	defer logger.Sync()

	runCtx, stop := context.WithCancel(context.Background())
	defer stop()

	closeConsumers := startWorkers(runCtx, a.cfg, a.infra, a.modules)
	defer closeConsumers()
	defer a.infra.Close()

	addr := fmt.Sprintf("%s:%s", a.cfg.Host, a.cfg.Port)
	srv := &http.Server{Addr: addr, Handler: a.router}

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
