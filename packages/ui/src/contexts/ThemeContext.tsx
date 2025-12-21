import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  const applyTheme = useCallback((newTheme: Theme) => {
    console.log("applyTheme called with:", newTheme);
    const html = document.documentElement;
    console.log("HTML element:", html);
    console.log("Current classes before:", html.className);
    
    if (newTheme === "dark") {
      html.classList.add("dark");
      console.log("Added 'dark' class");
    } else {
      html.classList.remove("dark");
      console.log("Removed 'dark' class");
    }
    
    console.log("Current classes after:", html.className);
    console.log("Has dark class?", html.classList.contains("dark"));
    localStorage.setItem("theme", newTheme);
    console.log("Saved to localStorage:", newTheme);
  }, []);

  useEffect(() => {
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    setThemeState(initialTheme);
    applyTheme(initialTheme);
  }, [applyTheme]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      applyTheme(newTheme);
    },
    [applyTheme]
  );

  const toggleTheme = useCallback(() => {
    console.log("toggleTheme called, current theme:", theme);
    const newTheme = theme === "light" ? "dark" : "light";
    console.log("Switching to theme:", newTheme);
    setThemeState(newTheme);
    applyTheme(newTheme);
  }, [theme, applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
