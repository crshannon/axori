import { useRouter } from "@tanstack/react-router";
import { createContext, use, useEffect, useState } from "react";
import type { PropsWithChildren } from "react";
import type { AppTheme, UserTheme } from "@/lib/theme";
import {
  applyThemeClasses,
  getSystemTheme,
  resolveAppTheme,
  setThemeServerFn,
  setupSystemPreferenceListener,
} from "@/lib/theme";

type ThemeContextValue = {
  userTheme: UserTheme;
  appTheme: AppTheme;
  setTheme: (theme: UserTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = PropsWithChildren<{
  initialTheme: UserTheme;
}>;

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const router = useRouter();
  const [userTheme, setUserTheme] = useState<UserTheme>(initialTheme);
  const [systemTheme, setSystemTheme] = useState<AppTheme>(() =>
    userTheme === "system" ? getSystemTheme() : "dark"
  );

  useEffect(() => {
    if (userTheme !== "system") return;
    return setupSystemPreferenceListener(() => {
      const newSystemTheme = getSystemTheme();
      setSystemTheme(newSystemTheme);
    });
  }, [userTheme]);

  const appTheme = userTheme === "system" ? systemTheme : userTheme;

  useEffect(() => {
    applyThemeClasses(userTheme, appTheme);
    const body = document.body;
    if (appTheme === "dark") {
      body.classList.remove("bg-slate-50");
      body.classList.add("bg-[#0f172a]");
    } else {
      body.classList.remove("bg-[#0f172a]");
      body.classList.add("bg-slate-50");
    }
  }, [userTheme, appTheme]);

  const setTheme = async (newUserTheme: UserTheme) => {
    setUserTheme(newUserTheme);
    const newAppTheme = resolveAppTheme(newUserTheme);
    applyThemeClasses(newUserTheme, newAppTheme);
    await setThemeServerFn({ data: newUserTheme });
    router.invalidate();
  };

  return (
    <ThemeContext value={{ userTheme, appTheme, setTheme }}>
      {children}
    </ThemeContext>
  );
}

export function useTheme() {
  const context = use(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
