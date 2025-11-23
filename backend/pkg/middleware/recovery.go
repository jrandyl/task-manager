package middleware

import (
	"fmt"
	"log/slog"
	"net/http"
)

func Recover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				id := GetRequestID(r.Context())

				slog.Error("server panic recovered",
					slog.String("id", string(id)),
					slog.Any("error", rec),
				)

				http.Error(w, fmt.Sprintf("server panicked with error: %v", rec), http.StatusInternalServerError)
			}
		}()

		next.ServeHTTP(w, r)
	})
}
