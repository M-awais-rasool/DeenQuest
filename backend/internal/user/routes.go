package user

import "github.com/gin-gonic/gin"

// RegisterRoutes mounts the user-profile endpoints.
//
// Public:
//
//	GET /users/:id/public
//
// Authenticated:
//
//	GET    /users/me
//	PUT    /users/me
//	PUT    /users/me/password
//	DELETE /users/me
func RegisterRoutes(public, authed *gin.RouterGroup, h *Handler) {
	public.GET("/users/:id/public", h.GetPublicProfile)

	authed.GET("/users/me", h.GetProfile)
	authed.PUT("/users/me", h.UpdateProfile)
	authed.PUT("/users/me/password", h.ChangePassword)
	authed.DELETE("/users/me", h.DeleteAccount)
}

//	GET /admin/users?search=&limit=
//	PUT /admin/users/:id/app-icon
func RegisterAdminRoutes(admin *gin.RouterGroup, h *AdminHandler) {
	admin.GET("/users", h.ListUsers)
	admin.PUT("/users/:id/app-icon", h.SetAppIcon)
}
