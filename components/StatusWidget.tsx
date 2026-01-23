"use client";

import { useEffect, useState } from "react";
import { updateHeartbeat, setUserStatus } from "@/app/actions";
import {
  Coffee,
  Sun,
  Moon,
  Clock,
  Briefcase,
  MoreHorizontal,
  X,
} from "lucide-react";
import Image from "next/image";

// Tipi dışarıdan veya data dosyasından alabilirsin, şimdilik any
export default function StatusWidget({ user, t }: { user: any; t: any }) {
  const [isOpen, setIsOpen] = useState(false);

  // HEARTBEAT: Her 2 dakikada bir sunucuya "Ben buradayım" der.
  useEffect(() => {
    updateHeartbeat(); // Sayfa açılınca
    const interval = setInterval(() => updateHeartbeat(), 120000); // 2 dk
    return () => clearInterval(interval);
  }, []);

  // Aktif bir özel durum var mı?
  const hasActiveStatus =
    user.customStatus && new Date(user.statusExpires) > new Date();

  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-900 dark:text-white">{t.status}</h3>
        {hasActiveStatus && (
          <form action={setUserStatus}>
            <input type="hidden" name="statusType" value="CLEAR" />
            <button
              type="submit"
              className="text-xs text-red-500 hover:underline font-medium"
            >
              {t.clearStatus}
            </button>
          </form>
        )}
      </div>

      {/* DURUM BUTONLARI */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <StatusButton
          icon={<Sun size={18} />}
          label={t.prayer}
          type="PRAYER"
          duration="15"
        />
        <StatusButton
          icon={<Coffee size={18} />}
          label={t.lunch}
          type="LUNCH"
          duration="60"
        />
        <StatusButton
          icon={<Moon size={18} />}
          label={t.siesta}
          type="SIESTA"
          duration="30"
        />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-500 dark:text-slate-400 transition-colors"
        >
          <MoreHorizontal size={18} />
          <span className="text-[9px] font-bold truncate w-full text-center">
            {t.custom}
          </span>
        </button>
      </div>

      {/* ÖZEL DURUM FORMU (Açılırsa) */}
      {isOpen && (
        <form
          action={setUserStatus}
          className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl space-y-2 mb-2 animate-in slide-in-from-top-2"
        >
          <input type="hidden" name="statusType" value="CUSTOM" />
          <input
            name="message"
            placeholder={t.statusPlaceholder}
            className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
          <div className="flex gap-2">
            <input
              name="duration"
              type="number"
              placeholder={t.durationPlaceholder}
              className="w-20 text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white outline-none"
              defaultValue="30"
            />
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white text-xs font-bold rounded-lg py-2"
            >
              {t.update}
            </button>
          </div>
        </form>
      )}

      {/* AKTİF DURUM GÖSTERGESİ */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
        <div className="relative">
          <Image
            src={user.imageUrl || "/placeholder.jpg"}
            alt="me"
            width={40}
            height={40}
            className="rounded-full border-2 border-white dark:border-slate-900"
          />
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${hasActiveStatus ? "bg-purple-500" : "bg-green-500"}`}
          ></span>
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-900 dark:text-white">
            {hasActiveStatus
              ? user.customStatus === "CUSTOM"
                ? user.statusMessage
                : t[user.customStatus.toLowerCase()]
              : t.onApp}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            {hasActiveStatus
              ? `${t.backIn} ${new Date(user.statusExpires).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : t.working}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusButton({ icon, label, type, duration }: any) {
  return (
    <form action={setUserStatus} className="w-full">
      <input type="hidden" name="statusType" value={type} />
      <input type="hidden" name="duration" value={duration} />
      <button
        type="submit"
        className="w-full flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-500 dark:text-slate-400 transition-colors"
      >
        {icon}
        <span className="text-[9px] font-bold truncate w-full text-center">
          {label}
        </span>
      </button>
    </form>
  );
}
