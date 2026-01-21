import { getDashboardData, updateProfileSettings } from "@/app/actions";
import { User, Globe2, Moon, Save, BookOpen } from "lucide-react";
import { dictionaries, Language } from "@/lib/data";

export default async function ProfilePage() {
  const data = await getDashboardData();
  const user = data.user;
  const currentLang = (user.language as Language) || "tr";
  const t = dictionaries[currentLang];

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-24 p-6">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t.profile}</h1>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center w-full">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-50 mb-3 shadow-lg">
            <img
              src={user.imageUrl || ""}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="text-sm text-slate-500 mb-4">{user.email}</p>
          <p className="text-xs text-blue-500 bg-blue-50 px-3 py-1 rounded-full text-center">
            {t.photoNotice}
          </p>
        </div>
      </div>

      <form
        action={updateProfileSettings}
        className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-6"
      >
        <h3 className="font-bold border-b pb-2 text-slate-800">{t.settings}</h3>

        {/* DİL SEÇİMİ - LEHÇE EKLENDİ */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
            <Globe2 size={18} className="text-blue-600" /> {t.language}
          </label>
          <select
            name="language"
            defaultValue={user.language}
            className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition font-medium text-slate-800"
          >
            <option value="tr">Türkçe 🇹🇷</option>
            <option value="en">English 🇬🇧</option>
            <option value="es">Español 🇪🇸</option>
            <option value="fr">Français 🇫🇷</option>
            <option value="pl">Polski 🇵🇱</option> {/* EKLENDİ */}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
            <BookOpen size={18} className="text-purple-600" /> {t.culture}
          </label>
          <select
            name="culture"
            defaultValue={user.cultureContext}
            className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-purple-500 transition font-medium text-slate-800"
          >
            <option value="Turkey">Türkiye / Ortadoğu</option>
            <option value="Europe">Avrupa (Europe)</option>
            <option value="USA">Amerika (USA)</option>
            <option value="Asia">Asya (Asia)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
            <Moon size={18} className="text-indigo-600" /> {t.religion}
          </label>
          <select
            name="religion"
            defaultValue={user.religion}
            className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 transition font-medium text-slate-800"
          >
            <option value="Belirtilmemiş">Belirtilmemiş</option>
            <option value="Islam">İslam</option>
            <option value="Christianity">Hristiyanlık</option>
            <option value="Judaism">Yahudilik</option>
            <option value="Hinduism">Hinduizm</option>
            <option value="Buddhism">Budizm</option>
            <option value="Secular">Seküler / Diğer</option>
          </select>
          <p className="text-[10px] text-slate-400 pl-1">{t.religionNotice}</p>
        </div>

        <button
          type="submit"
          className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-black shadow-lg shadow-slate-200 transition transform active:scale-95"
        >
          <Save size={18} /> {t.save}
        </button>
      </form>
    </div>
  );
}
