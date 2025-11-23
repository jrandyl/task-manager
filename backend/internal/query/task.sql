-- name: CreateTask :one
INSERT INTO tasks (
	title,
	description
) VALUES (
	$1, $2
)
RETURNING *;

-- name: GetTask :one
SELECT * FROM tasks
WHERE id = $1 LIMIT 1;

-- name: ListTasks :many
SELECT * FROM tasks
ORDER BY created_at DESC
LIMIT $1
OFFSET $2;

-- name: ListTasksByCompletion :many
SELECT * FROM tasks
WHERE completed = $1
ORDER BY created_at DESC
LIMIT $2
OFFSET $3;

-- name: UpdateTaskCompletion :one
UPDATE tasks
  set completed = $2
WHERE id = $1
RETURNING *;

-- name: DeleteTask :exec
DELETE FROM tasks
WHERE id = $1;
