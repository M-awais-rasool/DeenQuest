package http

import (
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/tester/application"
)

// Track records that an authenticated request happened, after the handler has
// run so an aborted one (expired token, rate limit) never counts as a session.
//
// This is the whole reason the tester report needs no app release: every build
// already in the store calls these endpoints the moment it is opened.
func Track(rec *application.Recorder) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if rec == nil || c.IsAborted() {
			return
		}
		if userID := c.GetString("user_id"); userID != "" {
			rec.Touch(userID, clientFrom(c.Request.UserAgent()))
		}
	}
}

// clientFrom names the platform from the user agent. React Native on Android
// goes out through okhttp and on iOS through CFNetwork/Darwin; a browser is the
// admin panel, not a tester.
func clientFrom(agent string) string {
	switch {
	case agent == "":
		return ""
	case strings.Contains(agent, "okhttp"), strings.Contains(agent, "Android"):
		return "android"
	case strings.Contains(agent, "CFNetwork"), strings.Contains(agent, "Darwin"),
		strings.Contains(agent, "iPhone"), strings.Contains(agent, "iPad"):
		return "ios"
	case strings.Contains(agent, "Mozilla"):
		return "web"
	default:
		return ""
	}
}
