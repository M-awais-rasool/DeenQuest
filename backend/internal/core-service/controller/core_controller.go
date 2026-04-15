package controller

import (
	"github.com/gin-gonic/gin"

	"github.com/chawais/talent-flow/backend/internal/core-service/service"
	"github.com/chawais/talent-flow/backend/pkg/response"
)

type CoreController struct {
	service *service.CoreService
}

func NewCoreController(service *service.CoreService) *CoreController {
	return &CoreController{service: service}
}

func (h *CoreController) GetDailyTasks(c *gin.Context) {
	userID := c.GetString("user_id")
	tasks, err := h.service.GetDailyTasks(c.Request.Context(), userID)
	if err != nil {
		response.InternalError(c, "failed to fetch daily tasks")
		return
	}
	response.OK(c, "daily tasks fetched", tasks)
}

func (h *CoreController) CompleteDailyTask(c *gin.Context) {
	userID := c.GetString("user_id")
	taskID := c.Param("id")
	if taskID == "" {
		response.BadRequest(c, "task id is required")
		return
	}
	err := h.service.CompleteDailyTask(c.Request.Context(), userID, taskID)
	if err != nil {
		response.InternalError(c, "failed to complete daily task")
		return
	}
	response.OK(c, "daily task completed", gin.H{"task_id": taskID})
}
