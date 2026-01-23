import { Moon } from "lucide-react";
import { Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "../utils/cn";

export function ThemeToggle() {
  // Initialize state by checking DOM immediately (SSR-safe)
  // The blocking script in __root.tsx sets the class before React hydrates
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      // Check what the blocking script already set
      const isDark = document.documentElement.classList.contains("dark");
      return isDark ? "dark" : "light";
    }
    return "light";
  });

  useEffect(() => {
    // Sync state with DOM on mount (in case blocking script ran)
    const isDark = document.documentElement.classList.contains("dark");
    const currentTheme = isDark ? "dark" : "light";
    if (currentTheme !== theme) {
      setTheme(currentTheme);
    }
  }, []); // Only run once on mount

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";

    // 1. Update DOM first (immediate visual feedback)
    const html = document.documentElement;
    if (nextTheme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }

    // 2. Update LocalStorage
    localStorage.setItem("theme", nextTheme);

    // 3. Update State (triggers re-render)
    setTheme(nextTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        `
          cursor-pointer rounded-full border border-black/5 bg-slate-200 p-3
          transition-all
          hover:scale-110
          dark:border-white/5 dark:bg-[#1A1A1A]
        `
      )}
      aria-label="Toggle Theme"
      type="button"
    >
      <Sun
        className="
          size-[18px] text-slate-400
          dark:hidden
        "
        strokeWidth={2}
      />
      <Moon
        className="
          hidden size-[18px] text-slate-300
          dark:block
        "
        strokeWidth={2}
      />
    </button>
  );
}
