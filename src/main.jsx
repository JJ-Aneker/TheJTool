import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider, ThemeContext } from './context/ThemeContext'
import './App.css'

// Debug tools (only in development)
if (import.meta.env.DEV) {
  import('./debug.js')
}

function RootApp() {
  const themeContext = React.useContext(ThemeContext)

  return (
    <ConfigProvider theme={themeContext.theme}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ConfigProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <RootApp />
    </ThemeProvider>
  </React.StrictMode>,
)
