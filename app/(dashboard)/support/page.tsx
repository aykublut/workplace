import { ShieldAlert, Handshake, Phone, MessageSquare } from "lucide-react";
import { dictionaries, Language } from "@/lib/data";
import { getDashboardData } from "@/app/actions";

export default async function SupportPage() {
  const data = await getDashboardData();
  const t = dictionaries[(data.user.language as Language) || "tr"];

  return (
    <div className="p-4 pb-24 space-y-6">
      <h1 className="text-2xl font-bold flex gap-2 items-center text-gray-800">
        <Handshake className="text-red-600" /> {t.supportTitle}
      </h1>
      <div className="bg-red-50 border border-red-100 p-5 rounded-2xl text-center space-y-3">
        <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="text-red-600" />
        </div>
        <h2 className="text-lg font-bold text-red-900">{t.mediationNeed}</h2>
        <p className="text-sm text-red-800">{t.mediationDesc}</p>
        <button className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition">
          {t.createTicket}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4 hover:shadow-md transition cursor-pointer">
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            <Phone size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{t.contactHR}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4 hover:shadow-md transition cursor-pointer">
          <div className="bg-purple-100 p-3 rounded-full text-purple-600">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{t.surveys}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
