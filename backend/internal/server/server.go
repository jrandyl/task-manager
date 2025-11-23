package server

import (
	"context"
	"fmt"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jrandyl/task-manager/backend/internal/db"
	"github.com/jrandyl/task-manager/backend/internal/handler"
)

type Server struct {
	handler handler.Context
	conn    *pgxpool.Pool
	logger  *slog.Logger
	files   fs.FS
}

func New(logger *slog.Logger, files fs.FS) *Server {
	return &Server{
		logger: logger,
		files:  files,
	}
}

func (s *Server) Start(ctx context.Context, port string) error {
	conn, err := db.Connect(ctx, s.logger, s.files)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	s.conn = conn

	store := db.NewStore(conn)

	s.handler = handler.New(store)
	server := &http.Server{
		Addr:    fmt.Sprintf(":%v", port),
		Handler: s.routes(),
	}

	sErr := make(chan error, 1)

	go func() {
		slog.Info("server running:", slog.String("port", port))
		err := server.ListenAndServe()
		if err == http.ErrServerClosed {
			sErr <- nil
			return
		}
		sErr <- err
	}()

	select {
	case <-ctx.Done():
		fmt.Fprintln(os.Stderr)
		slog.Info("cancellation detected, shutting down server")
		shutdownCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
		defer cancel()

		slog.Info("shutting down server:", slog.String("timeout", (15*time.Second).String()))
		if err := server.Shutdown(shutdownCtx); err != nil {
			return fmt.Errorf("server shutdown failed: %w", err)
		}

		if err := <-sErr; err != nil {
			return err
		}

		slog.Info("server shutdown complete")
		return nil

	case err := <-sErr:
		if err != nil {
			return fmt.Errorf("listen and serve failed: %w", err)
		}
		return nil
	}
}
