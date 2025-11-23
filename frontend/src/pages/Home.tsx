import React, { useEffect, useState } from "react";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  Circle,
  Filter,
  X,
  Calendar,
  Clock,
  FileText,
  Plus,
  RefreshCw,
} from "lucide-react";
import { API } from "../utils/constants";

interface Task {
  id: string | number;
  title: string;
  description?: string | null;
  completed: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

interface NewTask {
  title: string;
  description: string;
}

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

  const filteredTasks = tasks.filter((task) => {
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
              Completed{" "}
              <span className="ml-2 text-sm opacity-75">
                ({completedCount})
              </span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading tasks...
                    </td>
                  </tr>
                ) : filteredTasks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No tasks found
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr
                      key={String(task.id)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedTask(task)}
                    >
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => void toggleTaskCompletion(task, e)}
                          className="hover:scale-110 transition-transform"
                          aria-label={
                            task.completed ? "Mark incomplete" : "Mark complete"
                          }
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                          ) : (
                            <Circle className="w-6 h-6 text-slate-300 hover:text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-slate-800 font-medium ${
                            task.completed ? "line-through text-slate-400" : ""
                          }`}
                        >
                          {task.title}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm">
                        {formatDate(task.created_at)}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm">
                        {formatDate(task.updated_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

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

      <AnimatePresence>
        {selectedTask && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
              onClick={() => setSelectedTask(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Sidebar Panel */}
            <motion.div
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25 }}
            >
              {/* Sidebar Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-start">
                <div className="flex-1">
                  <h2
                    className={`text-2xl font-bold text-slate-800 mb-2 ${
                      selectedTask.completed
                        ? "line-through text-slate-400"
                        : ""
                    }`}
                  >
                    {selectedTask.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="ml-4 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="p-6 space-y-6">
                {/* Status Toggle */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <button
                    onClick={() => void toggleTaskCompletion(selectedTask)}
                    className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-medium transition-all ${
                      selectedTask.completed
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    {selectedTask.completed ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Mark as Incomplete
                      </>
                    ) : (
                      <>
                        <Circle className="w-5 h-5" />
                        Mark as Complete
                      </>
                    )}
                  </button>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-slate-600" />
                    <h3 className="font-semibold text-slate-700">
                      Description
                    </h3>
                  </div>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {selectedTask.description || "No description provided"}
                  </p>
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-slate-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        Created
                      </p>
                      <p className="text-slate-600">
                        {formatDateTime(selectedTask.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-slate-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        Last Updated
                      </p>
                      <p className="text-slate-600">
                        {formatDateTime(selectedTask.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 mb-2">Current Status</p>
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                      selectedTask.completed
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-blue-100 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {selectedTask.completed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-semibold">Completed</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4" />
                        <span className="font-semibold">In Progress</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Delete Button */}
                <div className="pt-4 border-t border-slate-200">
                  <button
                    onClick={() => void handleDeleteTask(selectedTask.id)}
                    className="w-full py-3 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors border border-red-200"
                  >
                    Delete Task
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create Task Modal */}
      {showCreateModal && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
            onClick={() => setShowCreateModal(false)}
          />

          {/* Modal */}
          <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center rounded-t-xl">
              <h2 className="text-2xl font-bold text-slate-800">
                Create New Task
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Enter task title"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter task description (optional)"
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => void handleCreateTask()}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Create Task
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
