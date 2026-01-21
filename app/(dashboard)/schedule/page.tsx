import { Clock, Coffee, Moon, Briefcase, MapPin } from "lucide-react";
import { dictionaries, Language } from "@/lib/data";
import { getDashboardData } from "@/app/actions";

export default async function SchedulePage() {
  const data = await getDashboardData();
  const t = dictionaries[(data.user.language as Language) || "tr"];

  return (
    <div className="p-4 pb-24 space-y-6">
      <h1 className="text-2xl font-bold flex gap-2 items-center text-gray-800">
        <Clock className="text-orange-500" /> {t.scheduleTitle}
      </h1>
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
        <p className="text-orange-100 text-sm font-medium uppercase tracking-wider">
          {t.today}
        </p>
        <h2 className="text-3xl font-bold">2026</h2>
        <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          {t.workingHour}
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="font-bold text-gray-700 ml-1">{t.dailyFlow}</h3>
        <div className="flex gap-4">
          <div className="w-14 text-right pt-2 text-gray-400 font-mono text-sm">
            09:00
          </div>
          <div className="flex-1 bg-white p-4 rounded-xl border-l-4 border-gray-300 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-gray-800">{t.startShift}</h4>
                <p className="text-xs text-gray-500">Ofis / Desk 42</p>
              </div>
              <Briefcase size={20} className="text-gray-300" />
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-14 text-right pt-2 text-gray-800 font-bold font-mono text-sm">
            12:30
          </div>
          <div className="flex-1 bg-white p-4 rounded-xl border-l-4 border-orange-400 shadow-md transform scale-105 transition-transform">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-gray-900">{t.lunch}</h4>
                <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                  <MapPin size={12} /> Cafe
                </div>
              </div>
              <Coffee size={24} className="text-orange-500" />
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-14 text-right pt-2 text-gray-500 font-mono text-sm">
            13:15
          </div>
          <div className="flex-1 bg-white p-4 rounded-xl border-l-4 border-indigo-500 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-gray-800">{t.prayerTime}</h4>
                <div className="flex items-center gap-1 text-xs text-indigo-600 mt-1">
                  <MapPin size={12} /> Room 2
                </div>
              </div>
              <Moon size={20} className="text-indigo-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
