import { getDashboardData, updateProfileSettings } from "@/app/actions";
import { User, Globe2, Moon, Save, BookOpen, Sun } from "lucide-react";
import { dictionaries, Language } from "@/lib/data";
// YENİ: ModeToggle bileşenini çağır
import { ModeToggle } from "@/components/ModeToggle";
import { ProfileAvatar } from "@/components/ProfileAvatar";

export default async function ProfilePage() {
  const data = await getDashboardData();
  const user = data.user;
  const currentLang = (user.language as Language) || "tr";
  const t = dictionaries[currentLang];

  return (
    <div className="bg-[var(--background)] min-h-screen pb-24 p-6 transition-colors duration-300">
      {/* Üst Kısım */}
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          {t.profile}
        </h1>
        <div className="bg-[var(--card)] p-6 rounded-3xl shadow-sm border border-[var(--border)] flex flex-col items-center w-full">
          {/* --- DEĞİŞTİRİLEN KISIM: RESİM YERİNE BİLEŞEN GELDİ --- */}
          <div className="mb-3">
            <ProfileAvatar
              imageUrl={user.imageUrl || ""}
              name={user.name || "User"}
            />
          </div>
          {/* ------------------------------------------------------ */}

          <h2 className="text-xl font-bold text-[var(--card-foreground)]">
            {user.name}
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            {user.email}
          </p>
          <p className="text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full text-center">
            {t.photoNotice}
          </p>
        </div>
      </div>

      {/* KARANLIK MOD BUTONU (YENİ) */}
      <div className="mb-6">
        <ModeToggle />
      </div>

      {/* Form */}
      <form
        action={updateProfileSettings}
        className="bg-[var(--card)] rounded-3xl shadow-sm border border-[var(--border)] p-6 space-y-6"
      >
        <h3 className="font-bold border-b border-[var(--border)] pb-2 text-[var(--foreground)]">
          {t.settings}
        </h3>

        {/* Dil Seçimi */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--muted-foreground)] flex items-center gap-2">
            <Globe2 size={18} className="text-blue-600" /> {t.language}
          </label>
          <select
            name="language"
            defaultValue={user.language}
            className="w-full p-4 bg-[var(--muted)] rounded-xl border border-[var(--border)] outline-none focus:border-blue-500 transition font-medium text-[var(--foreground)]"
          >
            <option value="tr">Türkçe 🇹🇷</option>
            <option value="en">English 🇬🇧</option>
            <option value="es">Español 🇪🇸</option>
            <option value="fr">Français 🇫🇷</option>
            <option value="pl">Polski 🇵🇱</option>
          </select>
        </div>

        {/* Kültür Seçimi */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--muted-foreground)] flex items-center gap-2">
            <BookOpen size={18} className="text-purple-600" /> {t.culture}
          </label>
          <select
            name="culture"
            defaultValue={user.cultureContext}
            className="w-full p-4 bg-[var(--muted)] rounded-xl border border-[var(--border)] outline-none focus:border-purple-500 transition font-medium text-[var(--foreground)]"
          >
            <option value="Turkey">Türkiye / Ortadoğu</option>
            <option value="Europe">Avrupa (Europe)</option>
            <option value="USA">Amerika (USA)</option>
            <option value="Asia">Asya (Asia)</option>
          </select>
        </div>

        {/* Din Seçimi */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--muted-foreground)] flex items-center gap-2">
            <Moon size={18} className="text-indigo-600" /> {t.religion}
          </label>
          <select
            name="religion"
            defaultValue={user.religion}
            className="w-full p-4 bg-[var(--muted)] rounded-xl border border-[var(--border)] outline-none focus:border-indigo-500 transition font-medium text-[var(--foreground)]"
          >
            <option value="Belirtilmemiş">Belirtilmemiş</option>
            <option value="Islam">İslam</option>
            <option value="Christianity">Hristiyanlık</option>
            <option value="Judaism">Yahudilik</option>
            <option value="Hinduism">Hinduizm</option>
            <option value="Buddhism">Budizm</option>
            <option value="Secular">Seküler / Diğer</option>
          </select>
          <p className="text-[10px] text-[var(--muted-foreground)] pl-1">
            {t.religionNotice}
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-slate-900 dark:bg-blue-600 text-white p-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-black dark:hover:bg-blue-700 shadow-lg shadow-slate-200 dark:shadow-none transition transform active:scale-95"
        >
          <Save size={18} /> {t.save}
        </button>
      </form>
    </div>
  );
}
