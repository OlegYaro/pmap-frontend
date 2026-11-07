import { createContext } from 'react'

export type Theme = 'light' | 'dark' | 'system'

/** localStorage key for the theme choice. The inline script in index.html uses the same key. */
export const THEME_STORAGE_KEY = 'pmap-theme'

export interface ThemeContextValue {
  /** What the user picked. */
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system'
}
