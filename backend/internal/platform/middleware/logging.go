package middleware

import (
	"sync/atomic"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/chawais/deenquest/backend/internal/platform/logger"
)

var successCounter atomic.Uint64

func RequestLogger(sampleEvery int) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()
		failed := status >= 400 || len(c.Errors) > 0

		if !failed && isHealthProbe(path) {
			return
		}

		if !failed && !sampled(sampleEvery) {
			return
		}

		fields := []zap.Field{
			zap.Int("status", status),
			zap.String("method", c.Request.Method),
			zap.String("path", path),
			zap.Duration("latency", latency),
		}

		if failed {
			fields = append(fields,
				zap.String("query", query),
				zap.String("ip", c.ClientIP()),
				zap.String("user_agent", c.Request.UserAgent()),
			)
		}

		switch {
		case len(c.Errors) > 0:
			logger.Error("Request error", append(fields, zap.String("errors", c.Errors.String()))...)
		case status >= 500:
			logger.Error("Server error", fields...)
		case status >= 400:
			logger.Warn("Client error", fields...)
		default:
			logger.Info("Request", fields...)
		}
	}
}

func sampled(sampleEvery int) bool {
	if sampleEvery <= 1 {
		return true
	}
	return successCounter.Add(1)%uint64(sampleEvery) == 0
}

func isHealthProbe(path string) bool {
	return path == "/health" || path == "/health/ready"
}
