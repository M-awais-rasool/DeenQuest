package middleware

import (
	"context"
	"net/http"
	"strconv"
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

func RateLimitByIP(redisClient *cache.RedisClient, limit int, window time.Duration, prefix string) gin.HandlerFunc {
	return rateLimit(redisClient, limit, window, prefix, func(c *gin.Context) string {
		return "ip:" + c.ClientIP()
	})
}

func RateLimitByUser(redisClient *cache.RedisClient, limit int, window time.Duration, prefix string) gin.HandlerFunc {
	return rateLimit(redisClient, limit, window, prefix, func(c *gin.Context) string {
		if userID, ok := c.Get("user_id"); ok {
			if id, ok := userID.(string); ok && id != "" {
				return "user:" + id
			}
		}
		return "ip:" + c.ClientIP()
	})
}

func rateLimit(
	redisClient *cache.RedisClient,
	limit int,
	window time.Duration,
	prefix string,
	subject func(*gin.Context) string,
) gin.HandlerFunc {
	windowMS := window.Milliseconds()
	retryAfter := strconv.Itoa(int(window.Seconds()))

	return func(c *gin.Context) {
		// Bound the limiter so a slow/unreachable Redis can never stall the request.
		ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
		defer cancel()

		key := "rate_limit:" + prefix + ":" + subject(c)
		count, err := rateLimitScript.Run(ctx, redisClient.Client, []string{key}, windowMS).Int64()
		if err != nil {
			// Fail open: never reject traffic because the limiter backend is degraded.
			c.Next()
			return
		}

		if count > int64(limit) {
			c.Header("Retry-After", retryAfter)
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"error":   "Rate limit exceeded. Try again later.",
			})
			return
		}

		c.Next()
	}
}
