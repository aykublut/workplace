"use client";
import { Trash2, Check } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";
import { deleteTask, toggleTaskStatus } from "@/app/actions";

type TaskProps = {
  task: { id: string; title: string; isCompleted: boolean };
  confirmText: string;
};

export default function TaskItem({ task, confirmText }: TaskProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    await toggleTaskStatus(task.id, task.isCompleted);
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm(confirmText)) return;
    setIsLoading(true);
    await deleteTask(task.id);
    setIsLoading(false);
  };

  return (
    <div
      className={clsx(
        "flex items-center gap-3 p-4 bg-white rounded-xl border shadow-sm transition-all",
        task.isCompleted
          ? "border-green-100 bg-green-50/30"
          : "border-gray-100",
        isLoading && "opacity-50 pointer-events-none",
      )}
    >
      <button
        onClick={handleToggle}
        className={clsx(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
          task.isCompleted
            ? "bg-green-500 border-green-500 text-white"
            : "border-gray-300 text-transparent hover:border-green-400",
        )}
      >
        <Check size={14} strokeWidth={3} />
      </button>
      <span
        className={clsx(
          "flex-1 font-medium transition-all text-sm",
          task.isCompleted ? "text-gray-400 line-through" : "text-gray-800",
        )}
      >
        {task.title}
      </span>
      <button
        onClick={handleDelete}
        className="text-gray-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
