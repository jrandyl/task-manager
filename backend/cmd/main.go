package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"

	"github.com/jrandyl/task-manager/backend/internal/server"
	"github.com/jrandyl/task-manager/backend/pkg"
)

func main() {
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt)
	defer cancel()

	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	migrations := pkg.LoadMigrations()

	server := server.New(logger, migrations)
	if err := server.Start(ctx, "11000"); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
