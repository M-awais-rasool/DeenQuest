package dailytask

import (
	"errors"

	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/platform/response"
)

type AdminHandler struct {
	service *Service
}

func NewAdminHandler(service *Service) *AdminHandler {
	return &AdminHandler{service: service}
}

// GET /admin/tasks
func (h *AdminHandler) ListTasks(c *gin.Context) {
	tasks, err := h.service.AdminList(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to list tasks")
		return
	}
	response.OK(c, "tasks fetched", tasks)
}

// GET /admin/tasks/:id
func (h *AdminHandler) GetTask(c *gin.Context) {
	task, err := h.service.AdminGet(c.Request.Context(), c.Param("id"))
	if err != nil {
		if errors.Is(err, ErrTaskNotFound) {
			response.NotFound(c, "task not found")
			return
		}
		response.InternalError(c, "failed to fetch task")
		return
	}
	response.OK(c, "task fetched", task)
}

// POST /admin/tasks
func (h *AdminHandler) CreateTask(c *gin.Context) {
	var in DailyTask
	if err := c.ShouldBindJSON(&in); err != nil {
		response.BadRequest(c, "invalid task payload: "+err.Error())
		return
	}
	created, err := h.service.AdminCreate(c.Request.Context(), &in)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.Created(c, "task created", created)
}

// PUT /admin/tasks/:id
func (h *AdminHandler) UpdateTask(c *gin.Context) {
	var in DailyTask
	if err := c.ShouldBindJSON(&in); err != nil {
		response.BadRequest(c, "invalid task payload: "+err.Error())
		return
	}
	updated, err := h.service.AdminUpdate(c.Request.Context(), c.Param("id"), &in)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, "task updated", updated)
}

// DELETE /admin/tasks/:id
func (h *AdminHandler) DeleteTask(c *gin.Context) {
	if err := h.service.AdminDelete(c.Request.Context(), c.Param("id")); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, "task deleted", gin.H{"id": c.Param("id")})
}
