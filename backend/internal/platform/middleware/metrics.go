package middleware

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

// Labelled by the route *template* — "/api/v1/quran/surah/:id", never the
// resolved path. A label that carries user input turns one time series into one
// per value, which is how a free-tier metrics budget disappears in a day.
var (
	requestDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "http_request_duration_seconds",
		Help:    "Request latency by route and status.",
		Buckets: []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10},
	}, []string{"method", "route", "status"})

	requestsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "http_requests_total",
		Help: "Requests served by route and status.",
	}, []string{"method", "route", "status"})

	requestsInFlight = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "http_requests_in_flight",
		Help: "Requests currently being served.",
	})
)

// Metrics records latency, outcome and concurrency for every handled request.
func Metrics() gin.HandlerFunc {
	return func(c *gin.Context) {
		route := c.FullPath()
		if route == "" {
			// No route matched. Grouping these under one label keeps a scanner
			// probing random URLs from creating a series per attempt.
			route = "<unmatched>"
		}

		requestsInFlight.Inc()
		start := time.Now()
		c.Next()
		requestsInFlight.Dec()

		status := strconv.Itoa(c.Writer.Status())
		elapsed := time.Since(start).Seconds()
		requestDuration.WithLabelValues(c.Request.Method, route, status).Observe(elapsed)
		requestsTotal.WithLabelValues(c.Request.Method, route, status).Inc()
	}
}
