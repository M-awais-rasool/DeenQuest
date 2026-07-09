package scheduling

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/platform/response"
)

// Handler exposes the Scheduling / Prayer-aware Agent.
type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// Plan returns today's prayer times + a suggested study slot for ?lat=&lng=&tz=.
func (h *Handler) Plan(c *gin.Context) {
	lat, err1 := strconv.ParseFloat(c.Query("lat"), 64)
	lng, err2 := strconv.ParseFloat(c.Query("lng"), 64)
	if err1 != nil || err2 != nil || lat < -90 || lat > 90 || lng < -180 || lng > 180 {
		response.BadRequest(c, "valid lat and lng are required")
		return
	}
	tz := 0.0
	if v := c.Query("tz"); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil && f >= -12 && f <= 14 {
			tz = f
		}
	}

	localNow := time.Now().UTC().Add(time.Duration(tz * float64(time.Hour)))
	response.OK(c, "study plan", h.svc.Plan(lat, lng, tz, localNow))
}
