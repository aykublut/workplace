import { Globe } from "lucide-react";

export default function Loading() {
  return (
    // 1. Düz Arka Plan (En hızlı render için solid renk)
    <div
      className="flex h-screen w-full items-center justify-center bg-[#f8fafc] dark:bg-[#020617]"
      aria-label="Loading" // Görme engelliler için etiket (görünmez)
    >
      <div className="relative flex items-center justify-center">
        {/* 2. Dış Halka (Spinner) */}
        {/* Saf CSS border animasyonu. Resim yüklemesi beklemez. */}
        <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-slate-200 border-t-blue-600 dark:border-slate-800 dark:border-t-blue-500" />

        {/* 3. Sabit Merkez İkon */}
        <div className="absolute">
          <Globe className="h-5 w-5 text-slate-400 dark:text-slate-600 opacity-80" />
        </div>
      </div>
    </div>
  );
}
