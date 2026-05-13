"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-base ease-apple hover:rotate-12 active-press"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5 text-text-200 animate-in fade-in zoom-in duration-base ease-apple" />
      ) : (
        <Sun className="w-5 h-5 text-text-100 animate-in fade-in zoom-in duration-base ease-apple" />
      )}
    </button>
  );
}
