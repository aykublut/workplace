import { getDashboardData } from "@/app/actions";
import {
  MessageCircle,
  CheckSquare,
  MessageSquareHeart,
  ArrowRight,
  Briefcase,
  Coffee,
  Moon,
  Sun,
} from "lucide-react";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { clsx } from "clsx";
import { dictionaries, Language } from "@/lib/data";
import Image from "next/image";
import StatusWidget from "@/components/StatusWidget";

// Sayfanın her girişte güncel saati hesaplaması için önbelleği devre dışı bırakıyoruz.
export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getDashboardData();
  const t = dictionaries[(data.user.language as Language) || "tr"];
  const firstName = data.user.name ? data.user.name.split(" ")[0] : "User";
  const { companyStatus } = data;

  // --- 1. ŞİRKET KARTI STİLİ ---
  let StatusIcon = Briefcase;
  let cardStyle = "bg-blue-600 dark:bg-blue-900"; // Sabah Mesaisi (Mavi)
  let progressColor = "bg-white";

  if (companyStatus.color === "orange") {
    StatusIcon = Coffee; // Öğle Arası
    cardStyle = "bg-orange-500 dark:bg-orange-900";
  } else if (companyStatus.color === "gray") {
    StatusIcon = Moon; // Mesai Dışı
    cardStyle = "bg-slate-800 dark:bg-[#0B1120]";
    progressColor = "bg-slate-600";
  } else if (companyStatus.color === "green") {
    StatusIcon = Sun; // Öğleden Sonra
    cardStyle = "bg-emerald-600 dark:bg-emerald-900";
  }

  // --- 2. TAKIM DURUM MANTIĞI ---
  const getColleagueStatus = (colleague: any) => {
    const now = new Date();

    const isCustomActive =
      colleague.customStatus &&
      colleague.statusExpires &&
      new Date(colleague.statusExpires) > now;

    const isOnline =
      new Date(colleague.lastActiveAt).getTime() > now.getTime() - 5 * 60000;

    // A. Özel Durum
    if (isCustomActive) {
      let label =
        colleague.customStatus === "CUSTOM"
          ? colleague.statusMessage
          : t[colleague.customStatus.toLowerCase() as keyof typeof t] ||
            colleague.customStatus;

      const backTime = new Date(colleague.statusExpires).toLocaleTimeString(
        [],
        { hour: "2-digit", minute: "2-digit" },
      );

      return {
        label,
        color: "bg-purple-500",
        borderColor: "border-purple-500",
        sub: `${t.backIn} ${backTime}`,
      };
    }

    // B. Online
    if (isOnline) {
      return {
        label: t.onApp,
        color: "bg-green-500",
        borderColor: "border-green-500",
        sub: "Online",
      };
    }

    // C. Offline (Şirket Kapalıysa Herkes Kapalı)
    if (companyStatus.color === "gray") {
      return {
        label: t.status_off,
        color: "bg-slate-500",
        borderColor: "border-slate-500",
        sub: "Offline",
      };
    }

    // D. Mesai Saati + Offline = Meşgul
    return {
      label: t.working,
      color: "bg-blue-400",
      borderColor: "border-blue-400",
      sub: "Busy",
    };
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] transition-colors duration-300 font-sans pb-24">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              {/* Logo görselin yoksa placeholder koyar */}
              <img
                src="/thumbnail.jpg"
                className="rounded-xl w-full h-full object-cover"
                alt="Logo"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-none">
                Workplace+
              </h1>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full mt-1 inline-block bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30">
                Enterprise
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* <button className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
              <Bell size={20} />
              {data.messageCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-800"></span>
              )}
            </button> */}
            <Link
              target="_blank" // Yeni sekmede açar
              rel="noopener noreferrer" // Güvenlik ve performans için şart
              href="https://docs.google.com/forms/d/e/1FAIpQLSee9KNr0NvPoYen9LzbHswEZ-CS9Pb1OZeyqBFRmVTKkani8A/viewform?usp=header" // Tıklayınca mail atsınlar
              className="group relative h-10 pl-3 pr-3 rounded-full flex items-center gap-2 transition-all duration-300
              bg-white border border-slate-200 text-slate-500 shadow-sm
              hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-indigo-500/20 hover:scale-105 active:scale-95
              dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-300"
            >
              {/* İkon: Hover olunca hafif döner ve büyür */}
              <MessageSquareHeart
                size={18}
                className="transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110"
              />

              {/* Yazı: Mobilde de görünsün, çok yer kaplamaz */}
              <span className="text-xs font-bold tracking-wide hidden sm:inline-block">
                Feedback
              </span>

              {/* MAGIC TOUCH: Köşedeki minik "Beni Tıkla" pırıltısı */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500 border-2 border-white dark:border-slate-900"></span>
              </span>
            </Link>
            <div className="pl-4 border-l border-slate-200 dark:border-slate-700">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* SELAMLAMA */}
        <div>
          <p className="text-sm font-medium mb-1 text-slate-500 dark:text-slate-400">
            {t.welcome}
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {firstName} 👋
          </h2>
        </div>

        {/* DURUM AYARLAMA WIDGETI */}
        <StatusWidget user={data.user} t={t} />

        {/* --- DİNAMİK ŞİRKET KARTI (HERO) --- */}
        <div
          className={clsx(
            "rounded-3xl p-6 text-white shadow-xl relative overflow-hidden transition-all duration-500",
            cardStyle,
          )}
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10 animate-pulse"></div>

          <div className="flex justify-between items-start relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {companyStatus.color !== "gray" && (
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse shadow-sm shadow-white/50"></span>
                )}
                {/* Durum Başlığı (Şu an: Mesai Saati) */}
                <p className="text-xs font-bold uppercase tracking-wider opacity-90">
                  {t[companyStatus.stateKey as keyof typeof t]}
                </p>
              </div>

              <div className="flex items-end gap-2 mb-1">
                {/* CANLI SAAT (Varşova Saati) */}
                <h3 className="text-4xl font-black tracking-tight drop-shadow-sm">
                  {companyStatus.currentTime}
                </h3>
              </div>

              {/* ALT AÇIKLAMA: Örn. "Öğle Yemeği Başlangıcı: 12:00" */}
              <p className="text-sm font-medium opacity-80 flex items-center gap-1">
                {t[companyStatus.nextLabelKey as keyof typeof t]}
                <span className="font-bold bg-white/20 px-1.5 py-0.5 rounded text-xs ml-1">
                  {companyStatus.nextTime}
                </span>
              </p>
            </div>

            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
              <StatusIcon size={24} />
            </div>
          </div>

          <div className="mt-6 w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
            <div
              className={clsx(
                "h-full rounded-full transition-all duration-1000 ease-out",
                progressColor,
              )}
              style={{ width: `${companyStatus.progress}%` }}
            ></div>
          </div>
        </div>

        {/* TAKIM LİSTESİ */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1">
            {t.teamStatus}
          </h3>
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-2 divide-y divide-slate-100 dark:divide-slate-800/50 shadow-sm max-h-[320px] overflow-y-auto custom-scrollbar">
            {data.colleagues.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 italic">
                Henüz başka ekip üyesi yok.
              </p>
            ) : (
              data.colleagues.map((colleague: any) => {
                const status = getColleagueStatus(colleague);
                return (
                  <div
                    key={colleague.id}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Image
                          src={colleague.imageUrl || "/placeholder.jpg"}
                          alt={colleague.name}
                          width={40}
                          height={40}
                          className="rounded-full border border-slate-100 dark:border-slate-700 object-cover w-10 h-10"
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-[2px] border-white dark:border-[#0f172a] ${status.color}`}
                        ></span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex flex-wrap items-center gap-1.5 dark:text-white leading-tight">
                          {colleague.name}
                          <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {colleague.cultureContext} / {colleague.religion}
                          </span>
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                          {status.label}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 min-w-[60px] text-center">
                      {status.sub}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* GRID MENÜ */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/communication"
            prefetch={true}
            className="block h-full group"
          >
            <div className="bg-white dark:bg-[#0f172a] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-800 transition-all hover:-translate-y-1 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start mb-3">
                <div
                  className={clsx(
                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
                    data.messageCount > 0
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500",
                  )}
                >
                  <MessageCircle size={20} />
                </div>
                {data.messageCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    {data.messageCount}
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {data.messageCount}
                </h4>
                <p className="text-xs font-semibold text-slate-500 group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-400 transition-colors">
                  {t.unreadMessages}
                </p>
              </div>
            </div>
          </Link>

          <Link href="/tasks" prefetch={true} className="block h-full group">
            <div className="bg-white dark:bg-[#0f172a] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800 transition-all hover:-translate-y-1 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start mb-3">
                <div
                  className={clsx(
                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
                    data.pendingTaskCount > 0
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500",
                  )}
                >
                  <CheckSquare size={20} />
                </div>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {data.pendingTaskCount}
                </h4>
                <p className="text-xs font-semibold text-slate-500 group-hover:text-emerald-600 dark:text-slate-400 dark:group-hover:text-emerald-400 transition-colors">
                  {t.pendingTasks}
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* QUIZ LINK */}
        <Link href="/learn" prefetch={true} className="block group">
          <div className="bg-white dark:bg-[#0f172a] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between hover:border-purple-300 dark:hover:border-purple-800 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30">
                <span className="font-bold text-lg">IQ</span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  {t.cultureTest}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {t.completeSimulation}
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-purple-600 group-hover:text-white dark:group-hover:text-white transition-colors">
              <ArrowRight size={16} />
            </div>
          </div>
        </Link>
      </main>
    </div>
  );
}
