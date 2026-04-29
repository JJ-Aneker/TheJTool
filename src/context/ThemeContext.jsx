import { createContext, useState, useCallback } from 'react'
import { createTheme } from '../config/antdTheme'

export const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    // Recuperar preferencia guardada, por defecto tema oscuro
    const saved = localStorage.getItem('theme-mode')
    return saved ? JSON.parse(saved) : true
  })

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const newValue = !prev
      localStorage.setItem('theme-mode', JSON.stringify(newValue))
      // Actualizar atributo data-theme para CSS
      document.documentElement.setAttribute('data-theme', newValue ? 'dark' : 'light')
      return newValue
    })
  }, [])

  // Establecer tema inicial en HTML
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }

  const theme = createTheme(isDark)

  const value = {
    isDark,
    toggleTheme,
    theme
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
