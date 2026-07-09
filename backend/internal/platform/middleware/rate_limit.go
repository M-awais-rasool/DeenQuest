package middleware

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"

	"github.com/chawais/deenquest/backend/internal/platform/cache"
)

var rateLimitScript = redis.NewScript(`
local current = redis.call("INCR", KEYS[1])
if current == 1 then
	redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
return current
`)

func RateLimit(redisClient *cache.RedisClient, limit int, window time.Duration) gin.HandlerFunc {
	windowMS := window.Milliseconds()
	return func(c *gin.Context) {
		// Bound the limiter so a slow/unreachable Redis can never stall the request.
		ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
		defer cancel()

		key := "rate_limit:" + c.ClientIP()
		count, err := rateLimitScript.Run(ctx, redisClient.Client, []string{key}, windowMS).Int64()
		if err != nil {
			// Fail open: never reject traffic because the limiter backend is degraded.
			c.Next()
			return
		}

		if count > int64(limit) {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"error":   "Rate limit exceeded. Try again later.",
			})
			return
		}

		c.Next()
	}
}
