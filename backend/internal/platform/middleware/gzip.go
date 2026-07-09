package middleware

import (
	"compress/gzip"
	"io"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
)

// gzipPool reuses gzip writers across requests to avoid per-request allocation.
var gzipPool = sync.Pool{
	New: func() any {
		gz, _ := gzip.NewWriterLevel(io.Discard, gzip.DefaultCompression)
		return gz
	},
}

type gzipWriter struct {
	gin.ResponseWriter
	writer *gzip.Writer
}

func (g *gzipWriter) WriteHeader(code int) {
	g.Header().Del("Content-Length")
	g.ResponseWriter.WriteHeader(code)
}

func (g *gzipWriter) Write(data []byte) (int, error) {
	g.Header().Del("Content-Length")
	return g.writer.Write(data)
}

func (g *gzipWriter) WriteString(s string) (int, error) {
	g.Header().Del("Content-Length")
	return g.writer.Write([]byte(s))
}

func shouldCompress(c *gin.Context) bool {
	req := c.Request
	if !strings.Contains(req.Header.Get("Accept-Encoding"), "gzip") {
		return false
	}
	// Never compress streaming / upgraded connections.
	if strings.Contains(req.Header.Get("Connection"), "Upgrade") ||
		req.Header.Get("Sec-WebSocket-Key") != "" ||
		strings.Contains(req.Header.Get("Accept"), "text/event-stream") {
		return false
	}
	return true
}

func Gzip() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !shouldCompress(c) {
			c.Next()
			return
		}

		gz := gzipPool.Get().(*gzip.Writer)
		gz.Reset(c.Writer)

		c.Header("Content-Encoding", "gzip")
		c.Header("Vary", "Accept-Encoding")
		original := c.Writer
		c.Writer = &gzipWriter{ResponseWriter: c.Writer, writer: gz}

		defer func() {
			_ = gz.Close() // flush remaining bytes + gzip trailer
			gz.Reset(io.Discard)
			gzipPool.Put(gz)
			c.Writer = original
		}()

		c.Next()
	}
}
