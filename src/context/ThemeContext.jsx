import { createContext, useState, useCallback, useEffect } from 'react'
import { createTheme } from '../config/antdTheme'

export const ThemeContext = createContext()

// Tres temas con la misma estructura (estilo Linear); solo cambia la paleta.
export const THEME_MODES = ['dark', 'light', 'executive']

const STORAGE_KEY = 'theme-variant'

function readInitialMode() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (THEME_MODES.includes(saved)) return saved
    // Migración desde el interruptor antiguo (true = oscuro, false = claro)
    const legacy = localStorage.getItem('theme-mode')
    if (legacy !== null) return JSON.parse(legacy) ? 'dark' : 'light'
  } catch {
    // localStorage no disponible: usar el tema por defecto
  }
  return 'dark'
}

function applyToDocument(mode) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  // "executive" es una variante del tema claro: hereda sus ajustes y cambia la paleta
  root.setAttribute('data-theme', mode === 'dark' ? 'dark' : 'light')
  if (mode === 'executive') root.setAttribute('data-palette', 'executive')
  else root.removeAttribute('data-palette')
}

export function ThemeProvider({ children }) {
  const [themeMode, setThemeModeState] = useState(readInitialMode)

  // Aplicar antes del primer pintado para evitar parpadeo
  applyToDocument(themeMode)

  useEffect(() => {
    applyToDocument(themeMode)
    try { localStorage.setItem(STORAGE_KEY, themeMode) } catch { /* sin persistencia */ }
  }, [themeMode])

  const setThemeMode = useCallback((mode) => {
    if (THEME_MODES.includes(mode)) setThemeModeState(mode)
  }, [])

  // Compatibilidad con código que aún alterna claro/oscuro
  const toggleTheme = useCallback(() => {
    setThemeModeState(prev => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = {
    themeMode,
    setThemeMode,
    isDark: themeMode === 'dark',
    toggleTheme,
    theme: createTheme(themeMode)
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
