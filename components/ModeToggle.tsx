"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Hydration hatasını önlemek için
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
        {theme === "dark" ? "Aydınlık Mod" : "Karanlık Mod"}
      </span>
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-yellow-500" />
      ) : (
        <Moon className="h-5 w-5 text-indigo-600" />
      )}
    </button>
  );
}
