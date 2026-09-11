package http

import "github.com/gin-gonic/gin"

// RegisterAdminRoutes mounts the closed-testing dashboard.
//
//	GET    /admin/testers
//	GET    /admin/testers/roster
//	POST   /admin/testers/roster
//	DELETE /admin/testers/roster/:email
func RegisterAdminRoutes(admin *gin.RouterGroup, h *AdminHandler) {
	admin.GET("/testers", h.Report)
	admin.GET("/testers/roster", h.Roster)
	admin.POST("/testers/roster", h.SaveRoster)
	admin.DELETE("/testers/roster/:email", h.DeleteRoster)
}
