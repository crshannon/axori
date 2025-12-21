import { useRouter } from '@tanstack/react-router'
import { createContext, use, useEffect, useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { AppTheme, UserTheme } from '@/lib/theme'
import {
  applyThemeClasses,
  getSystemTheme,
  resolveAppTheme,
  setThemeServerFn,
  setupSystemPreferenceListener,
} from '@/lib/theme'

type ThemeContextValue = {
  userTheme: UserTheme
  appTheme: AppTheme
  setTheme: (theme: UserTheme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

type ThemeProviderProps = PropsWithChildren<{
  initialTheme: UserTheme
}>

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const router = useRouter()
  const [userTheme, setUserTheme] = useState<UserTheme>(initialTheme)
  const [systemTheme, setSystemTheme] = useState<AppTheme>(() =>
    userTheme === 'system' ? getSystemTheme() : 'light',
  )

  // Set up system preference listener when userTheme is 'system'
  useEffect(() => {
    if (userTheme !== 'system') return
    return setupSystemPreferenceListener(() => {
      // When system preference changes, update systemTheme state
      const newSystemTheme = getSystemTheme()
      setSystemTheme(newSystemTheme)
    })
  }, [userTheme])

  // Compute appTheme from userTheme
  const appTheme = userTheme === 'system' ? systemTheme : userTheme

  // Apply theme classes and body background whenever userTheme or appTheme changes
  useEffect(() => {
    applyThemeClasses(userTheme, appTheme)
    // Update body background color
    const body = document.body
    if (appTheme === 'dark') {
      body.classList.remove('bg-slate-50')
      body.classList.add('bg-[#0F1115]')
    } else {
      body.classList.remove('bg-[#0F1115]')
      body.classList.add('bg-slate-50')
    }
  }, [userTheme, appTheme])

  const setTheme = async (newUserTheme: UserTheme) => {
    setUserTheme(newUserTheme)
    const newAppTheme = resolveAppTheme(newUserTheme)
    applyThemeClasses(newUserTheme, newAppTheme)
    await setThemeServerFn({ data: newUserTheme })
    router.invalidate()
  }

  return (
    <ThemeContext.Provider value={{ userTheme, appTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = use(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
