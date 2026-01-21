import { ClipboardCheck, Video, AlertCircle, Check } from "lucide-react";
import { dictionaries, Language } from "@/lib/data";
import { getDashboardData } from "@/app/actions";

export default async function RulesPage() {
  const data = await getDashboardData();
  const t = dictionaries[(data.user.language as Language) || "tr"];

  return (
    <div className="p-4 pb-24 space-y-6">
      <h1 className="text-2xl font-bold flex gap-2 items-center text-gray-800">
        <ClipboardCheck className="text-green-600" /> {t.rulesTitle}
      </h1>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="bg-gray-50 p-3 border-b font-bold text-gray-700">
          {t.expectations}
        </div>
        <div className="p-4 border-b flex gap-3 items-start">
          <div className="bg-red-100 p-1 rounded text-red-600 mt-1">
            <AlertCircle size={18} />
          </div>
          <div>
            <h3 className="font-bold text-red-700">{t.mandatory}</h3>
          </div>
        </div>
        <div className="p-4 flex gap-3 items-start">
          <div className="bg-green-100 p-1 rounded text-green-600 mt-1">
            <Check size={18} />
          </div>
          <div>
            <h3 className="font-bold text-green-700">{t.flexible}</h3>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="font-bold text-gray-700">{t.videos}</h3>
        <div className="bg-white p-3 rounded-xl border shadow-sm flex gap-3 items-center cursor-pointer hover:bg-gray-50 transition">
          <div className="w-20 h-14 bg-gray-800 rounded-lg flex items-center justify-center text-white">
            <Video size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-800">
              Feedback Culture
            </h4>
            <p className="text-xs text-gray-500">2 min</p>
          </div>
        </div>
      </div>
    </div>
  );
}
