package http

import (
	"github.com/gin-gonic/gin"
)

//	GET /surahs
//	GET /surah/:id
//	GET /surah/:id/audio
func RegisterRoutes(group *gin.RouterGroup, h *Handler) {
	group.GET("/surahs", h.GetSurahList)
	group.GET("/surah/:id", h.GetSurahByID)
	group.GET("/surah/:id/audio", h.GetSurahAudio)
}
