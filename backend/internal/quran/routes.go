package quran

import "github.com/gin-gonic/gin"

// RegisterRoutes mounts the public Quran reading endpoints on a group
// (mounted twice by the app: /api/v1/quran and the legacy /api/quran):
//
//	GET /surahs
//	GET /surah/:id
//	GET /surah/:id/audio
func RegisterRoutes(group *gin.RouterGroup, h *Handler) {
	group.GET("/surahs", h.GetSurahList)
	group.GET("/surah/:id", h.GetSurahByID)
	group.GET("/surah/:id/audio", h.GetSurahAudio)
}
