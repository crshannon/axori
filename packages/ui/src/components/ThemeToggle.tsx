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
    console.log(
      "ThemeToggle useEffect - DOM theme:",
      currentTheme,
      "State theme:",
      theme
    );
    if (currentTheme !== theme) {
      console.log("Syncing state to match DOM");
      setTheme(currentTheme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const toggleTheme = () => {
    console.log("toggleTheme called, current theme:", theme);
    const nextTheme = theme === "light" ? "dark" : "light";
    console.log("Switching to theme:", nextTheme);

    // 1. Update DOM first (immediate visual feedback)
    const html = document.documentElement;
    if (nextTheme === "dark") {
      html.classList.add("dark");
      console.log("Added 'dark' class to HTML");
    } else {
      html.classList.remove("dark");
      console.log("Removed 'dark' class from HTML");
    }
    console.log("HTML classes after toggle:", html.className);

    // 2. Update LocalStorage
    localStorage.setItem("theme", nextTheme);
    console.log("Saved to localStorage:", nextTheme);

    // 3. Update State (triggers re-render)
    setTheme(nextTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "cursor-pointer p-3 color-white rounded-full bg-slate-200 dark:bg-[#1A1A1A] hover:scale-110 transition-all border border-black/5 dark:border-white/5"
      )}
      aria-label="Toggle Theme"
      type="button"
    >
      <Sun
        className="w-[18px] h-[18px] text-slate-400 dark:hidden"
        strokeWidth={2}
      />
      <Moon
        className="w-[18px] h-[18px] text-slate-300 hidden dark:block"
        strokeWidth={2}
      />
    </button>
  );
}
