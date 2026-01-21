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
    <div className="bg-gray-50 min-h-screen pb-24">
      <header className="bg-white p-6 shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold flex gap-2 items-center text-gray-800">
          <CheckSquare className="text-green-600" /> {t.myTasks}
        </h1>
        <p className="text-sm text-gray-500 mt-1 flex gap-1 items-center">
          <CalendarDays size={14} /> {t.todayTasks} {pendingTasks.length}
        </p>
      </header>

      <div className="p-5 space-y-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <form action={createTask} className="flex gap-2">
            <input
              name="title"
              type="text"
              placeholder={t.addTaskPlaceholder}
              className="flex-1 bg-gray-50 border-0 rounded-xl p-3 outline-none focus:ring-2 focus:ring-green-500 transition"
              autoComplete="off"
              required
            />
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-xl transition"
            >
              <Plus size={24} />
            </button>
          </form>
        </div>

        <div>
          <h3 className="font-bold text-gray-700 mb-3 ml-1">{t.todo}</h3>
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                confirmText={t.confirmDelete}
              />
            ))}
            {pendingTasks.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                {t.greatJob}
              </div>
            )}
          </div>
        </div>

        {completedTasks.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-400 mb-3 ml-1 text-sm uppercase">
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
