import { CheckCircle2, Circle, RefreshCw } from "lucide-react";
import type { Task } from "../models/types";
import type React from "react";

function TasksTable({
  loading,
  filteredTasks,
  setSelectedTask,
  toggleTaskCompletion,
  formatDate,
}: {
  loading: boolean;
  filteredTasks: Task[];
  setSelectedTask: (task: Task) => void;
  toggleTaskCompletion: (
    task: Task,
    e?: React.MouseEvent<HTMLButtonElement>,
  ) => void;
  formatDate: (dateString?: string | null) => string;
}) {
  return (
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
  );
}

export default TasksTable;
