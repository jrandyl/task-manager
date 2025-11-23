import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import type { Task } from "../models/types";
import {
  CheckCircle2,
  Circle,
  X,
  Calendar,
  Clock,
  FileText,
} from "lucide-react";

function SideBar({
  selectedTask,
  setSelectedTask,
  toggleTaskCompletion,
  formatDateTime,
  handleDeleteTask,
}: {
  selectedTask: Task | null;
  setSelectedTask: React.Dispatch<React.SetStateAction<Task | null>>;
  toggleTaskCompletion: (task: Task) => void;
  formatDateTime: (dateString?: string | null) => string;
  handleDeleteTask: (id: string | number) => void;
}) {
  return (
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
                    selectedTask.completed ? "line-through text-slate-400" : ""
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
                  <h3 className="font-semibold text-slate-700">Description</h3>
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
  );
}

export default SideBar;
