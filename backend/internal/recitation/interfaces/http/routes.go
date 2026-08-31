package http

import (
	"github.com/gin-gonic/gin"
)

// The two routes need opposite rate limits, so they take opposite groups.
//
//	submit — POST /recitation/check: every call costs a transcription, which is
//	         the scarcest thing on the box. Kept to a handful a minute.
//	poll   — GET /recitation/jobs/:job_id: a cheap Redis read that a waiting
//	         client makes once a second. Limiting it as tightly as the submit
//	         would cut the client off from the answer it is waiting for.
func RegisterRoutes(submit, poll *gin.RouterGroup, h *Handler) {
	submit.POST("/recitation/check", h.CheckRecitation)
	poll.GET("/recitation/jobs/:job_id", h.RecitationJob)
}
