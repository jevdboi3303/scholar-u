'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'dark'

interface ThemeCtx {
  theme: Theme
  toggle: () => void
}

const Context = createContext<ThemeCtx>({ theme: 'light', toggle: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Read the current class from <html> so we're always in sync with the
  // inline script that runs before hydration (see layout.tsx <head>).
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document === 'undefined') return 'light'
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  })

  // Keep state in sync on mount (handles SSR mismatch)
  useEffect(() => {
    const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    setTheme(current)
  }, [])

  const toggle = useCallback(() => {
    const next: Theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', next === 'dark')
    localStorage.setItem('scholar-u:theme', next)
    setTheme(next)
  }, [])

  return <Context.Provider value={{ theme, toggle }}>{children}</Context.Provider>
}

export const useTheme = () => useContext(Context)
