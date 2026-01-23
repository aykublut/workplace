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
        "flex items-center gap-3 p-4 rounded-xl border shadow-sm transition-all duration-300",
        // Arka Plan & Temel Border (Light/Dark)
        "bg-white dark:bg-[#0f172a]",

        // Tamamlanma Durumuna Göre Renk Değişimi
        task.isCompleted
          ? "border-green-100 bg-green-50/30 dark:border-emerald-900/50 dark:bg-emerald-900/10"
          : "border-slate-100 dark:border-slate-800",

        isLoading && "opacity-50 pointer-events-none",
      )}
    >
      {/* CHECKBOX BUTTON */}
      <button
        onClick={handleToggle}
        className={clsx(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
          task.isCompleted
            ? "bg-emerald-500 border-emerald-500 dark:bg-emerald-600 dark:border-emerald-600 text-white"
            : "border-slate-300 dark:border-slate-600 text-transparent hover:border-emerald-400 dark:hover:border-emerald-500",
        )}
      >
        <Check size={14} strokeWidth={3} />
      </button>

      {/* TASK TEXT */}
      <span
        className={clsx(
          "flex-1 font-medium transition-all text-sm break-all",
          task.isCompleted
            ? "text-slate-400 dark:text-slate-500 line-through"
            : "text-slate-700 dark:text-slate-200",
        )}
      >
        {task.title}
      </span>

      {/* DELETE BUTTON */}
      <button
        onClick={handleDelete}
        className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
