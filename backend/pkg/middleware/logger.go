package middleware

import (
	"context"
	"log/slog"
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

func RealIP(r *http.Request) string {
	// X-Real-IP preferred
	if ip := strings.TrimSpace(r.Header.Get("X-Real-IP")); ip != "" {
		return ip
	}

	// X-Forwarded-For: first IP in the list
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		if len(parts) > 0 {
			return strings.TrimSpace(parts[0])
		}
	}

	// fallback to RemoteAddr (strip port if present)
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		// if SplitHostPort fails, return the whole RemoteAddr
		return r.RemoteAddr
	}
	return host
}

func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		id := uuid.New().String()

		ctx := context.WithValue(r.Context(), "requestID", requestID(id))
		ctx = context.WithValue(r.Context(), "real_ip", RealIP(r))

		w.Header().Set("X-Request-ID", id)
		if strings.HasPrefix(r.URL.Path, "/api/") {
			w.Header().Set("Cache-Control", "no-store")
		} else {
			w.Header().Set("Cache-Control", "public, max-age=31536000")
		}

		var counter *countReadCloser
		if r.Body != nil {
			counter = &countReadCloser{rc: r.Body}
			r.Body = counter
		}

		cw := &countingResponseWriter{ResponseWriter: w}

		var bytesReceived int64
		if counter != nil {
			bytesReceived = counter.n
		}
		if bytesReceived == 0 {
			if cl := strings.TrimSpace(r.Header.Get("Content-Length")); cl != "" {
				if v, err := strconv.ParseInt(cl, 10, 64); err == nil {
					bytesReceived = v
				}
			}
		}

		next.ServeHTTP(cw, r.WithContext(ctx))

		bytesSent := cw.n
		status := cw.status
		if status == 0 {
			status = http.StatusOK
		}

		origin := r.Header.Get("Origin")
		realIP := RealIP(r)

		slog.Info("handled requests",
			slog.String("id", id),
			slog.String("method", r.Method),
			slog.String("path", r.URL.Path),
			slog.Int("status", status),
			slog.Duration("duration", time.Since(start)),
			slog.String("bytes_received", BytesRead(bytesReceived)),
			slog.String("bytes_received_human", BytesRead(bytesReceived)),
			slog.String("bytes_sent", BytesRead(bytesSent)),
			slog.String("bytes_sent_human", BytesRead(bytesSent)), slog.String("origin", origin),
			slog.String("real_ip", realIP),
		)
	})
}
