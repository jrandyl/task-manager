# Task Manager Setup

First the backend I used was go written from scratch. 

I was more familiar with it and I haven't used or built any Django app.

If you want to try out the web app, you can visit this link: https://task-manager.jrcalderon.online

This gives you access to the webapp anywhere.

This document goes through the list of steps that I personally take to setup the whole app.

You need to have a docker inorder to start a local version of the web app.

If you already have a docker install please follow the steps below.


## 1. Clone the file and run the app using docker
```
# Clone the app
git clone https://github.com/jrandyl/task-manager.git

# Run the docker using this command to run in development to update the app everytime you change the files
docker compose -f docker-compose.dev.yaml up -d

```

## 2. Routes summary
```
# This are the routes I built in the backend
	api.HandleFunc("GET /tasks", s.handler.ListTasks)
	api.HandleFunc("POST /tasks", s.handler.CreateTask)
	api.HandleFunc("GET /tasks/{id}", s.handler.GetTask)
	api.HandleFunc("PATCH /tasks/{id}", s.handler.UpdateTaskCompleted)
	api.HandleFunc("DELETE /tasks/{id}", s.handler.DeleteTask)
	api.HandleFunc("GET /health", s.handler.Health)

# GET https://api.task-manager.jrcalderon.online/api/tasks - List all tasks
{
    "id": "ef3552a8-c48c-4563-a627-482af13e4e51",
    "title": "JRC",
    "description": "jrc@gmail.com",
    "completed": false,
    "updated_at": "2025-11-23T14:52:01.881815Z",
    "created_at": "2025-11-23T14:52:01.881815Z"
}

# POST https://api.task-manager.jrcalderon.online/api/tasks - Create task

# Request Body
{
    "title": "Sample Title",
    "description": "Sample Description"
}

# Response Body
{
    "id": "ef3552a8-c48c-4563-a627-482af13e4e51",
    "title": "Sample Title",
    "description": "Sample Description",
    "completed": false,
    "updated_at": "2025-11-23T14:52:01.881815Z",
    "created_at": "2025-11-23T14:52:01.881815Z"
}

# GET https://api.task-manager.jrcalderon.online/api/tasks/{id} - Get a Single task through ID

# Response Body
{
    "id": "ef3552a8-c48c-4563-a627-482af13e4e51",
    "title": "Sample Title",
    "description": "Sample Description",
    "completed": false,
    "updated_at": "2025-11-23T14:52:01.881815Z",
    "created_at": "2025-11-23T14:52:01.881815Z"
}

# DELETE https://api.task-manager.jrcalderon.online/api/tasks/{id} - Delete a task through ID

# Response Body
{
    "message": "Task deleted successfully"
}

# GET https://api.task-manager.jrcalderon.online/api/tasks - List All tasks
# GET https://api.task-manager.jrcalderon.online/api/tasks?completed=fasle - List all tasks depending on the filter

# Response Body
[
    {
        "id": "ef3552a8-c48c-4563-a627-482af13e4e51",
        "title": "Sample task",
        "description": "Sample Description",
        "completed": false,
        "updated_at": "2025-11-23T14:52:01.881815Z",
        "created_at": "2025-11-23T14:52:01.881815Z"
    },
    {
        "id": "bdeb756f-83af-4b8b-baf1-f266e7cffdec",
        "title": "Sample task",
        "description": "just a sample description",
        "completed": false,
        "updated_at": "2025-11-23T14:41:06.782828Z",
        "created_at": "2025-11-23T14:41:06.782828Z"
    }
]

# PATCH https://api.task-manager.jrcalderon.online/api/tasks/{id} - Update task status

# Request Body 
{
    "completed": true
}

# Response Body
{
    "id": "bdeb756f-83af-4b8b-baf1-f266e7cffdec",
    "title": "Sample task",
    "description": "just a sample description",
    "completed": true,
    "updated_at": "2025-11-23T14:41:06.782828Z",
    "created_at": "2025-11-23T14:41:06.782828Z"
}

```
