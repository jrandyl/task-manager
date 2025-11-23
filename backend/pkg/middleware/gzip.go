package middleware

import (
	"bufio"
	"compress/gzip"
	"net"
	"net/http"
	"strings"
)

// gzipResponseWriter wraps http.ResponseWriter and optionally gzip.Writer.
type gzipResponseWriter struct {
	http.ResponseWriter
	gz          *gzip.Writer
	compress    bool
	wroteHeader bool
	status      int
}

func (w *gzipResponseWriter) WriteHeader(status int) {
	if w.wroteHeader {
		return
	}
	w.wroteHeader = true
	w.status = status

	// Decide whether to compress based on response Content-Type header.
	ct := w.Header().Get("Content-Type")
	if shouldSkipCompression(ct) {
		w.compress = false
		// don't set Content-Encoding
		w.ResponseWriter.WriteHeader(status)
		return
	}

	// enable compression
	w.Header().Set("Content-Encoding", "gzip")
	w.Header().Del("Content-Length") // length unknown after compression
	// tell proxies to vary by Accept-Encoding
	w.Header().Add("Vary", "Accept-Encoding")

	// lazily create gzip writer now that we decided to compress
	gz, err := gzip.NewWriterLevel(w.ResponseWriter, gzip.DefaultCompression)
	if err != nil {
		// fallback: if gzip.NewWriterLevel fails, do not compress
		w.compress = false
		w.ResponseWriter.WriteHeader(status)
		return
	}
	w.gz = gz
	w.compress = true
	w.ResponseWriter.WriteHeader(status)
}

func (w *gzipResponseWriter) Write(b []byte) (int, error) {
	if !w.wroteHeader {
		// if header hasn't been written, assume 200 OK
		w.WriteHeader(http.StatusOK)
	}

	if w.compress && w.gz != nil {
		return w.gz.Write(b)
	}
	return w.ResponseWriter.Write(b)
}

// Flush ensures both gzip writer and underlying writer are flushed.
func (w *gzipResponseWriter) Flush() {
	if w.gz != nil {
		_ = w.gz.Flush()
	}
	if fl, ok := w.ResponseWriter.(http.Flusher); ok {
		fl.Flush()
	}
}

// Hijack proxies the Hijack call if supported by the underlying writer.
func (w *gzipResponseWriter) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	hj, ok := w.ResponseWriter.(http.Hijacker)
	if !ok {
		return nil, nil, http.ErrNotSupported
	}
	return hj.Hijack()
}

// Close should be called after handler returns to close gzip writer (if used).
func (w *gzipResponseWriter) Close() error {
	if w.gz != nil {
		return w.gz.Close()
	}
	return nil
}

// shouldSkipCompression returns true for content-types that are already compressed
// or that should not be gzip-compressed.
func shouldSkipCompression(contentType string) bool {
	if contentType == "" {
		return false
	}
	ct := strings.ToLower(contentType)
	// skip json, images, video, audio, compressed archives, and some binary types
	skips := []string{
		"image/",
		"video/",
		"audio/",
		"application/zip",
		"application/x-gzip",
		"application/gzip",
		"application/x-compressed",
		"application/x-rar-compressed",
		// "application/json",
	}
	for _, s := range skips {
		if strings.HasPrefix(ct, s) {
			return true
		}
	}
	return false
}

// GzipMiddleware returns a middleware that gzips responses when appropriate.
func GzipMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Only compress if client accepts gzip
		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
			next.ServeHTTP(w, r)
			return
		}

		// You may want to skip compressing for very small responses, or for certain methods
		if r.Method == http.MethodHead {
			next.ServeHTTP(w, r)
			return
		}

		gzw := &gzipResponseWriter{ResponseWriter: w, compress: true}
		// ensure gzip writer is closed when handler returns
		defer func() {
			_ = gzw.Close()
		}()

		// If the underlying ResponseWriter supports Flusher/Hijacker, the wrapper above
		// provides those methods and forwards calls appropriately.
		next.ServeHTTP(gzw, r)
	})
}
