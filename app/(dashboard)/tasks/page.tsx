import { createTask, getTasks, getDashboardData } from "@/app/actions";
import { CheckSquare, Plus, CalendarDays } from "lucide-react";
import TaskItem from "./TaskItem";
import { dictionaries, Language } from "@/lib/data";

export default async function TasksPage() {
  const tasks = await getTasks();
  const data = await getDashboardData();
  const t = dictionaries[(data.user.language as Language) || "tr"];

  const pendingTasks = tasks.filter((t) => !t.isCompleted);
  const completedTasks = tasks.filter((t) => t.isCompleted);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] transition-colors duration-300 pb-24 font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h1 className="text-2xl font-bold flex gap-2 items-center text-slate-900 dark:text-white">
          <CheckSquare className="text-emerald-600 dark:text-emerald-400" />{" "}
          {t.myTasks}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex gap-1 items-center">
          <CalendarDays size={14} /> {t.todayTasks} {pendingTasks.length}
        </p>
      </header>

      <div className="p-5 space-y-6">
        {/* YENİ GÖREV EKLEME FORMU */}
        <div className="bg-white dark:bg-[#0f172a] p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <form action={createTask} className="flex gap-2">
            <input
              name="title"
              type="text"
              placeholder={t.addTaskPlaceholder}
              className="flex-1 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white border border-transparent dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition placeholder:text-slate-400"
              autoComplete="off"
              required
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl transition shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              <Plus size={24} />
            </button>
          </form>
        </div>

        {/* YAPILACAKLAR LİSTESİ */}
        <div>
          <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-3 ml-1 text-sm uppercase tracking-wider">
            {t.todo}
          </h3>
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                confirmText={t.confirmDelete}
              />
            ))}

            {/* BOŞ STATE */}
            {pendingTasks.length === 0 && (
              <div className="text-center py-10 text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                <p>{t.greatJob}</p>
              </div>
            )}
          </div>
        </div>

        {/* TAMAMLANANLAR LİSTESİ */}
        {completedTasks.length > 0 && (
          <div>
            <h3 className="font-bold text-slate-400 dark:text-slate-500 mb-3 ml-1 text-sm uppercase tracking-wider">
              {t.completed}
            </h3>
            <div className="space-y-2 opacity-60 hover:opacity-100 transition duration-300">
              {completedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  confirmText={t.confirmDelete}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
