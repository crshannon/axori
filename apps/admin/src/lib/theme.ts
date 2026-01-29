import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import * as z from "zod";

// Zod schemas - Forge defaults to dark mode
export const UserThemeSchema = z
  .enum(["light", "dark", "system"])
  .catch("dark");
export const AppThemeSchema = z.enum(["light", "dark"]).catch("dark");

export type UserTheme = z.infer<typeof UserThemeSchema>;
export type AppTheme = z.infer<typeof AppThemeSchema>;

const themeStorageKey = "_forge-theme";

export const getThemeServerFn = createServerFn().handler(() => {
  const cookieValue = getCookie(themeStorageKey);
  return UserThemeSchema.parse(cookieValue || "dark");
});

export const setThemeServerFn = createServerFn({ method: "POST" })
  .inputValidator(UserThemeSchema)
  .handler(({ data }) => {
    setCookie(themeStorageKey, data);
    return data;
  });

export function getSystemTheme(): AppTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function resolveAppTheme(userTheme: UserTheme): AppTheme {
  if (userTheme === "system") {
    return getSystemTheme();
  }
  return userTheme;
}

export function applyThemeClasses(
  userTheme: UserTheme,
  appTheme: AppTheme
): void {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  root.classList.remove("light", "dark", "system");
  root.classList.add(appTheme);

  if (userTheme === "system") {
    root.classList.add("system");
  }
}

export function setupSystemPreferenceListener(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => callback();
  mediaQuery.addEventListener("change", handler);
  return () => mediaQuery.removeEventListener("change", handler);
}
