package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/jrandyl/task-manager/backend/internal/db"
)

const (
	_  = iota
	KB = 1 << (10 * iota)
	MB
	GB
	TB
	PB
	EB
	ZB
	YB
)

type Context interface {
	Bind(r *http.Request, v any) error
	JSON(w http.ResponseWriter, status int, v any) error
	Health(w http.ResponseWriter, r *http.Request)
	CreateTask(w http.ResponseWriter, r *http.Request)
	GetTask(w http.ResponseWriter, r *http.Request)
	ListTasks(w http.ResponseWriter, r *http.Request)
	DeleteTask(w http.ResponseWriter, r *http.Request)
	UpdateTaskCompleted(w http.ResponseWriter, r *http.Request)
}

type Handler struct {
	store db.Store
}

func New(store db.Store) Context {
	return &Handler{
		store: store,
	}
}

func (h *Handler) JSON(w http.ResponseWriter, status int, v any) error {

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	b, err := json.Marshal(v)

	if err != nil {
		return fmt.Errorf("encoding error: %v", err)
	}

	w.Write(b)

	return nil
}

func (h *Handler) Bind(r *http.Request, v any) error {

	dec := json.NewDecoder(r.Body)

	dec.DisallowUnknownFields()
	if err := dec.Decode(v); err != nil {
		return fmt.Errorf("decoding error: %v", err)
	}

	return nil
}
