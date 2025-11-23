package handler

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/jrandyl/task-manager/backend/internal/db"
)

type createTaskRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

func (h *Handler) CreateTask(w http.ResponseWriter, r *http.Request) {
	var request createTaskRequest

	if r.ContentLength == 0 {
		err := fmt.Errorf("Oops, thats a bad request. No request body found")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.Bind(r, &request); err != nil {
		if errors.Is(err, io.EOF) {
			err := fmt.Errorf("Oops, thats a bad request. No request body found")
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if request.Title == "" {
		err := fmt.Errorf("Could not create task with an empty or invalid title")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if request.Description == "" {
		err := fmt.Errorf("Could not create task with an empty or invalid description")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	arg := db.CreateTaskParams{
		Title:       request.Title,
		Description: request.Description,
	}

	result, err := h.store.CreateTask(r.Context(), arg)

	if err != nil {
		errCode := db.ErrorCode(err)
		if errCode == db.ForeignKeyViolation || errCode == db.UniqueViolation {
			http.Error(w, "violated some database constraints", http.StatusForbidden)
			return
		}

		dbErr := fmt.Errorf("Something went wrong in saving the task in the database: %v", err)

		http.Error(w, dbErr.Error(), http.StatusInternalServerError)
		return
	}

	if err := h.JSON(w, http.StatusOK, result); err != nil {
		respErr := fmt.Errorf("Something went wrong with responding after creating the task: %v", err)
		http.Error(w, respErr.Error(), http.StatusInternalServerError)
		return
	}

}

func (h *Handler) GetTask(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	if id == "" {
		err := fmt.Errorf("Could not get task with an empty or invalid id")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	result, err := h.store.GetTask(r.Context(), uuid.MustParse(id))
	if err != nil {
		if errors.Is(err, db.ErrRecordNotFound) {
			respErr := fmt.Errorf("Task not found")
			http.Error(w, respErr.Error(), http.StatusNotFound)
			return
		}

		respErr := fmt.Errorf("Could not get task with error: %v", err)
		http.Error(w, respErr.Error(), http.StatusInternalServerError)
		return
	}

	if err := h.JSON(w, http.StatusOK, result); err != nil {
		respErr := fmt.Errorf("Something went wrong with responding after getting the task: %v", err)
		http.Error(w, respErr.Error(), http.StatusInternalServerError)
		return
	}
}

type updateTaskCompletedRequest struct {
	Completed bool `json:"completed"`
}

func (h *Handler) UpdateTaskCompleted(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	var request updateTaskCompletedRequest

	if id == "" {
		err := fmt.Errorf("Could not get task with an empty or invalid id")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if r.ContentLength == 0 {
		err := fmt.Errorf("Oops, thats a bad request. No request body found")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.Bind(r, &request); err != nil {
		if errors.Is(err, io.EOF) {
			err := fmt.Errorf("Oops, thats a bad request. No request body found")
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	result, err := h.store.GetTask(r.Context(), uuid.MustParse(id))
	if err != nil {
		if errors.Is(err, db.ErrRecordNotFound) {
			respErr := fmt.Errorf("Task not found")
			http.Error(w, respErr.Error(), http.StatusNotFound)
			return
		}

		respErr := fmt.Errorf("Could not get task with error: %v", err)
		http.Error(w, respErr.Error(), http.StatusInternalServerError)
		return
	}

	arg := db.UpdateTaskCompletionParams{
		ID:        result.ID,
		Completed: request.Completed,
	}

	result, err = h.store.UpdateTaskCompletion(r.Context(), arg)
	if err != nil {
		if errors.Is(err, db.ErrRecordNotFound) {
			respErr := fmt.Errorf("Task not found")
			http.Error(w, respErr.Error(), http.StatusNotFound)
			return
		}

		respErr := fmt.Errorf("Could not update task with error: %v", err)
		http.Error(w, respErr.Error(), http.StatusInternalServerError)
		return
	}

	if err := h.JSON(w, http.StatusOK, result); err != nil {
		respErr := fmt.Errorf("Something went wrong with responding after getting the task: %v", err)
		http.Error(w, respErr.Error(), http.StatusInternalServerError)
		return
	}
}

func (h *Handler) ListTasks(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	// defaults
	pageID := 1
	pageSize := 100

	if v := query.Get("page_id"); v != "" {
		pi, err := strconv.Atoi(v)
		if err != nil || pi < 1 {
			http.Error(w, "invalid page_id (must be positive integer)", http.StatusBadRequest)
			return
		}
		pageID = pi
	}

	if v := query.Get("page_size"); v != "" {
		ps, err := strconv.Atoi(v)
		if err != nil || ps < 1 {
			http.Error(w, "invalid page_size (must be positive integer)", http.StatusBadRequest)
			return
		}
		// optional: max cap
		if ps > 100 {
			ps = 100
		}
		pageSize = ps
	}

	if v := query.Get("completed"); v != "" {
		b, err := strconv.ParseBool(v)

		if err != nil {
			http.Error(w, "invalid filter please check", http.StatusBadRequest)
			return
		}
		arg := db.ListTasksByCompletionParams{
			Completed: b,
			Limit:     int32(pageSize),
			Offset:    int32(pageID-1) * int32(pageSize),
		}

		result, err := h.store.ListTasksByCompletion(r.Context(), arg)

		if err != nil {
			http.Error(w, "could not get a list of tasks due to error: %v", http.StatusInternalServerError)
			return
		}

		if err := h.JSON(w, http.StatusOK, result); err != nil {
			respErr := fmt.Errorf("Something went wrong with responding after getting a list tasks: %v", err)
			http.Error(w, respErr.Error(), http.StatusInternalServerError)
			return
		}

		return

	}

	arg := db.ListTasksParams{
		Limit:  int32(pageSize),
		Offset: int32(pageID-1) * int32(pageSize),
	}

	result, err := h.store.ListTasks(r.Context(), arg)
	if err != nil {
		http.Error(w, "could not get a list of tasks due to error: %v", http.StatusInternalServerError)
		return
	}

	if err := h.JSON(w, http.StatusOK, result); err != nil {
		respErr := fmt.Errorf("Something went wrong with responding after getting a list tasks: %v", err)
		http.Error(w, respErr.Error(), http.StatusInternalServerError)
		return
	}
}

type deleteResponse struct {
	Message string `json:"message"`
}

func (h *Handler) DeleteTask(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	if id == "" {
		err := fmt.Errorf("Could not get task with an empty or invalid id")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	result, err := h.store.GetTask(r.Context(), uuid.MustParse(id))
	if err != nil {
		if errors.Is(err, db.ErrRecordNotFound) {
			respErr := fmt.Errorf("Task not found")
			http.Error(w, respErr.Error(), http.StatusNotFound)
			return
		}

		respErr := fmt.Errorf("Could not get task with error: %v", err)
		http.Error(w, respErr.Error(), http.StatusInternalServerError)
		return
	}

	err = h.store.DeleteTask(r.Context(), result.ID)
	if err != nil {
		respErr := fmt.Errorf("Could not delete a task with error: %v", err)
		http.Error(w, respErr.Error(), http.StatusInternalServerError)
		return
	}

	resp := deleteResponse{
		Message: "Task deleted successfully",
	}

	if err := h.JSON(w, http.StatusOK, resp); err != nil {
		respErr := fmt.Errorf("Something went wrong with responding after deleting the task: %v", err)
		http.Error(w, respErr.Error(), http.StatusInternalServerError)
		return
	}
}
