import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isTheme, THEME_STORAGE_KEY, ThemeContext, type Theme } from './themeContext'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (isTheme(stored)) return stored
  } catch {
    // Storage is unavailable (private mode, blocked): fall back to the system theme.
  }
  return 'system'
}

function storeTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // The choice then lasts for this session only.
  }
}

function applyTheme(theme: Theme, systemDark: boolean) {
  const dark = theme === 'dark' || (theme === 'system' && systemDark)
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)

  useEffect(() => {
    const query = window.matchMedia(DARK_QUERY)
    applyTheme(theme, query.matches)
    if (theme !== 'system') return
    const onChange = (event: MediaQueryListEvent) => applyTheme(theme, event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    storeTheme(next)
  }, [])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])
  return <ThemeContext value={value}>{children}</ThemeContext>
}
