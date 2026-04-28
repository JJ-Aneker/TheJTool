import { createContext, useState, useCallback } from 'react'

export const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    // Recuperar preferencia guardada
    const saved = localStorage.getItem('theme-mode')
    return saved ? JSON.parse(saved) : false
  })

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const newValue = !prev
      localStorage.setItem('theme-mode', JSON.stringify(newValue))
      return newValue
    })
  }, [])

  const theme = {
    token: {
      colorPrimary: isDark ? '#177ddc' : '#1890ff',
      colorBgBase: isDark ? '#141414' : '#ffffff',
      colorTextBase: isDark ? '#e6e6e6' : 'rgba(0, 0, 0, 0.85)',
      colorBorder: isDark ? '#434343' : '#d9d9d9',
      colorBgContainer: isDark ? '#1f1f1f' : '#fafafa',
      colorBgElevated: isDark ? '#262626' : '#ffffff',
      colorBgLayout: isDark ? '#000000' : '#f5f5f5',
    },
    algorithm: isDark ? undefined : undefined // Ant Design maneja los algoritmos internamente
  }

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
