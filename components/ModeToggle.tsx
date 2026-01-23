"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { dictionaries, Language } from "@/lib/data"; // Sözlüğü import et

// Bileşene prop olarak dil bilgisini alacağız
interface ModeToggleProps {
  lang: Language;
}

export function ModeToggle({ lang }: ModeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Seçili dilin sözlüğünü al
  const t = dictionaries[lang];

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-3 rounded-xl bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)] hover:bg-gray-200 dark:hover:bg-slate-800 transition flex items-center justify-between w-full"
    >
      <span className="font-medium text-sm">
        {/* Dil dosyasından gelen metni kullan */}
        {theme === "dark" ? t.lightMode : t.darkMode}
      </span>
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-yellow-500" />
      ) : (
        <Moon className="h-5 w-5 text-indigo-600" />
      )}
    </button>
  );
}
