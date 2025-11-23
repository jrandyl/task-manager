package middleware

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"slices"
)

type requestID string

type Middleware func(http.Handler) http.Handler

func Use(next http.Handler, m ...Middleware) http.Handler {
	for _, x := range slices.Backward(m) {
		next = x(next)
	}

	return next
}

func GetRequestID(ctx context.Context) requestID {
	if id, ok := ctx.Value("requestID").(requestID); ok {
		return id
	}
	return ""
}

type countReadCloser struct {
	rc io.ReadCloser
	n  int64
}

func (c *countReadCloser) Read(p []byte) (int, error) {
	n, err := c.rc.Read(p)
	c.n += int64(n)
	return n, err
}

func (c *countReadCloser) Close() error {
	return c.rc.Close()
}

type countingResponseWriter struct {
	http.ResponseWriter
	status int
	n      int64
}

func (w *countingResponseWriter) Header() http.Header {
	return w.ResponseWriter.Header()
}
func (w *countingResponseWriter) WriteHeader(status int) {
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}

func (w *countingResponseWriter) Write(b []byte) (int, error) {
	// Ensure we have a default status if Write is called without WriteHeader
	if w.status == 0 {
		w.status = http.StatusOK
	}
	n, err := w.ResponseWriter.Write(b)
	w.n += int64(n)
	return n, err
}

func BytesRead(b int64) string {
	if b < 0 {
		return "0B"
	}
	const unit = 1024
	if b < unit {
		return fmt.Sprintf("%dB", b)
	}
	div, exp := float64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	// suffixes: KB, MB, GB, TB, PB (we'll support up to TB/PB)
	suffixes := []string{"KB", "MB", "GB", "TB", "PB"}
	val := float64(b) / div
	suffix := "KB"
	if exp >= 0 && exp < len(suffixes) {
		suffix = suffixes[exp]
	}
	return fmt.Sprintf("%.2f%s", val, suffix)
}
