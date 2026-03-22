'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from 'react'
import { ThemeProvider } from 'styled-components'
import { theme } from './theme'

type ThemeMode = 'light' | 'dark'

type ThemeModeContextValue = {
  mode: ThemeMode
  toggle: () => void
}

const ThemeModeContext = createContext<ThemeModeContextValue>({
  mode: 'light',
  toggle: () => {},
})

export function useThemeMode() {
  return useContext(ThemeModeContext)
}

const STORAGE_KEY = 'snip-theme'

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  // Read data-theme set by the FOUC inline script so the initial client render
  // matches the already-applied CSS variables — minimising any visible flash.
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light'
    return (document.documentElement.dataset.theme as ThemeMode) ?? 'light'
  })

  // Re-apply data-theme after hydration. React removes attributes set by the
  // FOUC inline script because they aren't in the server-rendered virtual DOM.
  // useLayoutEffect runs before paint so there is no visible flash.
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = mode
  }, [mode])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    function handleChange() {
      if (!localStorage.getItem(STORAGE_KEY)) {
        const next = mq.matches ? 'dark' : 'light'
        setMode(next)
        document.documentElement.dataset.theme = next
      }
    }
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [])

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem(STORAGE_KEY, next)
      document.documentElement.dataset.theme = next
      return next
    })
  }, [])

  // ThemeProvider always receives the same static theme object (CSS var references),
  // so styled-components generates identical class names on server and client.
  return (
    <ThemeModeContext.Provider value={{ mode, toggle }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeModeContext.Provider>
  )
}
