import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, App as AntdApp } from 'antd'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider, ThemeContext } from './context/ThemeContext'
import { _setMessageApi } from './utils/message'
import './App.css'
import './styles/common.css'

// Debug tools (only in development)
if (import.meta.env.DEV) {
  import('./debug.js')
}

function MessageHolder() {
  const { message } = AntdApp.useApp()
  useEffect(() => { _setMessageApi(message) }, [message])
  return null
}

function RootApp() {
  const themeContext = React.useContext(ThemeContext)

  return (
    <ConfigProvider theme={themeContext.theme}>
      <AntdApp>
        <MessageHolder />
        <AuthProvider>
          <App />
        </AuthProvider>
      </AntdApp>
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
