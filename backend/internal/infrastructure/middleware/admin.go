package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/chawais/talent-flow/backend/internal/infrastructure/response"
)

func AdminOnly(allowedEmails []string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(allowedEmails))
	for _, e := range allowedEmails {
		if v := strings.ToLower(strings.TrimSpace(e)); v != "" {
			allowed[v] = struct{}{}
		}
	}

	return func(c *gin.Context) {
		if len(allowed) == 0 {
			c.Next()
			return
		}

		email := strings.ToLower(strings.TrimSpace(c.GetString("email")))
		if _, ok := allowed[email]; !ok {
			response.Forbidden(c, "admin access required")
			c.Abort()
			return
		}
		c.Next()
	}
}
