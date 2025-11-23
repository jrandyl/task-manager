package server

import (
	"net/http"

	"github.com/jrandyl/task-manager/backend/pkg/middleware"
)

func (s *Server) routes() http.Handler {
	router := http.NewServeMux()
	api := http.NewServeMux()
	api.HandleFunc("GET /tasks", s.handler.ListTasks)
	api.HandleFunc("POST /tasks", s.handler.CreateTask)
	api.HandleFunc("GET /tasks/{id}", s.handler.GetTask)
	api.HandleFunc("PATCH /tasks/{id}", s.handler.UpdateTaskCompleted)
	api.HandleFunc("DELETE /tasks/{id}", s.handler.DeleteTask)
	api.HandleFunc("GET /health", s.handler.Health)

	router.Handle("/api/", http.StripPrefix("/api", api))

	middleware := middleware.Use(
		router,
		middleware.CORS("https://task-manager.jrcalderon.online"),
		middleware.GzipMiddleware,
		middleware.Logger,
		middleware.Recover,
		middleware.Secure(),
	)
	return middleware
}
