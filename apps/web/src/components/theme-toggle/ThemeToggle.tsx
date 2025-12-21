import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/utils/providers/theme-provider'

export const ThemeToggle = () => {
  const { userTheme, appTheme, setTheme } = useTheme()

  const toggleTheme = () => {
    // If currently on system, switch to light
    // Otherwise toggle between light and dark
    if (userTheme === 'system') {
      setTheme('light')
    } else if (userTheme === 'light') {
      setTheme('dark')
    } else {
      setTheme('light')
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className="cursor-pointer bg-slate-900 dark:bg-[#1A1A1A] hover:bg-black dark:hover:bg-[#252525] text-white dark:text-slate-300 text-xs font-bold p-3 rounded-full transition-all border border-white/5 shadow-sm dark:shadow-black/20"
      aria-label="Toggle theme"
    >
      {appTheme === 'light' ? (
        <Sun className="h-[18px] w-[18px] stroke-2" />
      ) : (
        <Moon className="h-[18px] w-[18px] stroke-2 text-slate-300" />
      )}
    </button>
  )
}
