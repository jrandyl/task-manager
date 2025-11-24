import React, { useEffect, useState } from "react";
import { Filter, Plus, RefreshCw } from "lucide-react";
import { API } from "../utils/constants";
import type { NewTask, Task } from "../models/types";
import TasksTable from "../components/TasksTable";
import SideBar from "../components/SideBar";
import CreateTask from "../components/CreateTask";

export default function TaskTable() {
  const [filter, setFilter] = useState<"all" | "completed" | "incomplete">(
    "all",
  );
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<NewTask>({
    title: "",
    description: "",
  });
  const [tasks, setTasks] = useState<Task[]>([]);

  // Fetch tasks from database
  const fetchTasks = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API}/api/tasks`); // Replace with your API endpoint
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = (await response.json()) as Task[];
      setTasks(data);
    } catch (err: any) {
      setError(err?.message ?? String(err));
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load tasks on mount
  useEffect(() => {
    void fetchTasks();
  }, []);

  // Toggle task completion
  const toggleTaskCompletion = async (
    task: Task,
    e?: React.MouseEvent<HTMLButtonElement>,
  ): Promise<void> => {
    e?.stopPropagation(); // prevent parent row click
    try {
      const response = await fetch(`${API}/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });

      if (!response.ok) throw new Error("Failed to update task");

      // Update local state safely using functional update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                completed: !t.completed,
                updated_at: new Date().toISOString(),
              }
            : t,
        ),
      );

      // Update selected task if it's open
      setSelectedTask((prev) =>
        prev && prev.id === task.id
          ? {
              ...prev,
              completed: !prev.completed,
              updated_at: new Date().toISOString(),
            }
          : prev,
      );
    } catch (err) {
      console.error("Error updating task:", err);
      alert("Failed to update task. Please try again.");
    }
  };

  // Create new task
  const handleCreateTask = async (): Promise<void> => {
    if (!newTask.title.trim()) {
      alert("Please enter a task title");
      return;
    }

    try {
      const response = await fetch(`${API}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description || "",
        }),
      });

      if (!response.ok) throw new Error("Failed to create task");

      const createdTask = (await response.json()) as Task;
      setTasks((prev) => [...prev, createdTask]);
      setShowCreateModal(false);
      setNewTask({ title: "", description: "" });
    } catch (err) {
      console.error("Error creating task:", err);
      alert("Failed to create task. Please try again.");
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string | number): Promise<void> => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`${API}/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete task");

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setSelectedTask((prev) => (prev && prev.id === taskId ? null : prev));
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("Failed to delete task. Please try again.");
    }
  };

  const filteredTasks: Task[] = tasks.filter((task) => {
    if (filter === "completed") return task.completed;
    if (filter === "incomplete") return !task.completed;
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const incompleteCount = tasks.filter((t) => !t.completed).length;

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString?: string | null): string => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              Task Manager
            </h1>
            <p className="text-slate-600">
              Organize and track your tasks efficiently
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => void fetchTasks()}
              className="flex items-center gap-2 px-4 py-3 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors shadow-md hover:shadow-lg"
              disabled={loading}
              aria-disabled={loading}
            >
              <RefreshCw
                className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create Task
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-semibold">Error loading tasks</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-600" />
            <span className="font-semibold text-slate-700">Filter Tasks</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter("all")}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                filter === "all"
                  ? "bg-slate-800 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All Tasks{" "}
              <span className="ml-2 text-sm opacity-75">({tasks.length})</span>
            </button>
            <button
              onClick={() => setFilter("incomplete")}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                filter === "incomplete"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              Incomplete{" "}
              <span className="ml-2 text-sm opacity-75">
                ({incompleteCount})
              </span>
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                filter === "completed"
                  ? "bg-green-600 text-white shadow-md"
                  : "bg-green-50 text-green-700 hover:bg-green-100"
              }`}
            >
              {" "}
              Complete
              <span className="ml-2 text-sm opacity-75">
                ({completedCount})
              </span>
            </button>
          </div>
        </div>

        <TasksTable
          filteredTasks={filteredTasks}
          loading={loading}
          setSelectedTask={setSelectedTask}
          toggleTaskCompletion={toggleTaskCompletion}
          formatDate={formatDate}
        />

        {/* Stats Footer */}
        <div className="mt-6 flex justify-between items-center text-sm text-slate-600">
          <span>
            Showing {filteredTasks.length} of {tasks.length} tasks
          </span>
          <span>
            {tasks.length > 0
              ? Math.round((completedCount / tasks.length) * 100)
              : 0}
            % completed
          </span>
        </div>
      </div>

      {/* Sidebar */}

      <SideBar
        setSelectedTask={setSelectedTask}
        formatDateTime={formatDateTime}
        handleDeleteTask={handleDeleteTask}
        toggleTaskCompletion={toggleTaskCompletion}
        selectedTask={selectedTask}
      />
      <CreateTask
        handleCreateTask={handleCreateTask}
        newTask={newTask}
        setNewTask={setNewTask}
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
      />
    </div>
  );
}
