import { getDashboardData } from "./actions";
import {
  Clock,
  MessageCircle,
  CheckSquare,
  Bell,
  ArrowRight,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { clsx } from "clsx";
import { dictionaries, Language } from "@/lib/data";

export default async function Home() {
  const data = await getDashboardData();
  const t = dictionaries[(data.user.language as Language) || "tr"];
  const firstName = data.user.name ? data.user.name.split(" ")[0] : "User";

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      {/* HEADER */}
      <header className="bg-white px-6 pt-12 pb-6 border-b border-slate-100 sticky top-0 z-20">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-blue-200 shadow-lg">
              <span className="font-extrabold text-xl">C+</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-none">
                Cultura+
              </h1>
              <span className="text-[10px] font-semibold text-blue-600 tracking-wider uppercase bg-blue-50 px-2 py-0.5 rounded-full">
                Enterprise
              </span>
            </div>
          </div>
          <div className="p-1 rounded-full border border-slate-200 hover:border-blue-400 transition cursor-pointer">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">
              {t.welcome}
            </p>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {firstName} 👋
            </h2>
          </div>
          <button className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
        </div>
      </header>

      {/* İÇERİK */}
      <div className="px-6 py-8 space-y-6">
        {/* Mola Durumu */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl shadow-slate-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>

          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                {t.companyStatus}
              </p>
              <h3 className="text-3xl font-bold mb-1">{data.nextBreak}</h3>
              <p className="text-slate-300 text-sm font-medium">
                {t.breakTime}
              </p>
            </div>
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/10">
              <Clock size={24} />
            </div>
          </div>
          <div className="mt-6 w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full w-[60%] bg-blue-500 rounded-full"></div>
          </div>
        </div>

        {/* Kartlar */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/communication" className="group">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition duration-300 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div
                  className={clsx(
                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
                    data.messageCount > 0
                      ? "bg-blue-50 text-blue-600"
                      : "bg-slate-50 text-slate-400",
                  )}
                >
                  <MessageCircle size={20} />
                </div>
                {data.messageCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {data.messageCount}
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-2xl font-bold text-slate-900">
                  {data.messageCount}
                </h4>
                <p className="text-slate-500 text-xs font-semibold mt-1 group-hover:text-blue-600 transition-colors">
                  {t.unreadMessages}
                </p>
              </div>
            </div>
          </Link>

          <Link href="/tasks" className="group">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-green-100 transition duration-300 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div
                  className={clsx(
                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
                    data.pendingTaskCount > 0
                      ? "bg-green-50 text-green-600"
                      : "bg-slate-50 text-slate-400",
                  )}
                >
                  <CheckSquare size={20} />
                </div>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-slate-900">
                  {data.pendingTaskCount}
                </h4>
                <p className="text-slate-500 text-xs font-semibold mt-1 group-hover:text-green-600 transition-colors">
                  {t.pendingTasks}
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Quiz Link */}
        <Link href="/learn" className="block">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-purple-200 transition">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                <span className="font-bold text-lg">IQ</span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{t.cultureTest}</h4>
                <p className="text-xs text-slate-500">{t.completeSimulation}</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition">
              <ArrowRight size={16} />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
