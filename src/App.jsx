import { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Spin, Button } from 'antd'
import {
  FormOutlined,
  CopyOutlined,
  CloudOutlined,
  ApiOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  SettingOutlined,
  HomeOutlined,
  UserOutlined,
  BgColorsOutlined,
  SunOutlined,
  MoonOutlined
} from '@ant-design/icons'
import { useAuth } from './hooks/useAuth'
import { useTheme } from './hooks/useTheme'

// Componentes
import ProtectedRoute from './components/ProtectedRoute'
import UserDropdown from './components/UserDropdown'

// Vistas
import Home from './views/Home'
import Login from './views/Login'
import UserProfile from './views/UserProfile'
import EFormGenerator from './views/EFormGenerator'
import CategoryCloner from './views/CategoryCloner'
import TenantManager from './views/TenantManager'
import ApiExplorer from './views/ApiExplorer'
import CategoryBuilder from './views/CategoryBuilder'
import ProjectDocs from './views/ProjectDocs'
import WorkflowSettings from './views/WorkflowSettings'
import UserManager from './views/UserManager'
import TemplateManager from './views/TemplateManager'
import WebServicesManager from './views/WebServicesManager'

const { Header, Sider, Content, Footer } = Layout

const menuItems = [
  {
    key: 'home',
    icon: <HomeOutlined />,
    label: 'Inicio',
    path: '/'
  },
  {
    key: 'users',
    icon: <UserOutlined />,
    label: 'Gestión de Usuarios',
    path: '/users'
  },
  {
    key: 'eforms',
    icon: <FormOutlined />,
    label: 'Generador de eForms',
    path: '/eforms'
  },
  {
    key: 'category-cloner',
    icon: <CopyOutlined />,
    label: 'Clonador de Categorías',
    path: '/category-cloner'
  },
  {
    key: 'tenants',
    icon: <CloudOutlined />,
    label: 'Gestión de Tenants',
    path: '/tenants'
  },
  {
    key: 'api-explorer',
    icon: <ApiOutlined />,
    label: 'Explorador API REST',
    path: '/api-explorer'
  },
  {
    key: 'category-builder',
    icon: <AppstoreOutlined />,
    label: 'Category Builder',
    path: '/category-builder'
  },
  {
    key: 'docs',
    icon: <FileTextOutlined />,
    label: 'Documentación de Proyectos',
    path: '/docs'
  },
  {
    key: 'workflows',
    icon: <SettingOutlined />,
    label: 'Configuración de Workflows',
    path: '/workflows'
  },
  {
    key: 'templates',
    icon: <FileTextOutlined />,
    label: 'Templates',
    path: '/templates'
  },
  {
    key: 'web-services',
    icon: <CloudOutlined />,
    label: 'Servicios Web',
    path: '/web-services'
  }
]

function AppContent() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user, logout, loading } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  // Mostrar login si no está autenticado
  if (!isAuthenticated) {
    return <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<Login />} />
    </Routes>
  }

  // Mostrar loading mientras se obtiene el estado de autenticación
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <Spin size="large" />
      </div>
    )
  }

  const getSelectedKey = () => {
    const item = menuItems.find(m => m.path === location.pathname)
    return item ? [item.key] : ['home']
  }

  const handleMenuClick = (e) => {
    const item = menuItems.find(m => m.key === e.key)
    if (item) {
      navigate(item.path)
    }
  }

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={250}
        collapsedWidth={64}
        style={{
          overflow: 'auto',
          height: 'calc(100vh - 72px - 20px)',
          position: 'fixed',
          left: 0,
          top: 72,
          bottom: 20,
          zIndex: 100,
          scrollbarWidth: 'thin'
        }}
      >
        <div style={{
          color: 'white',
          padding: '16px',
          fontSize: '18px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.2)'
        }}>
          {!collapsed && 'TheJToolbox'}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKey()}
          onClick={handleMenuClick}
          items={menuItems}
        />

      </Sider>

      <Header
        className="app-header"
        style={{
          background: isDark ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '0 32px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 72,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 101,
          transition: 'all 0.3s ease',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
        }}>

          {/* Logo y Título */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <img
              src="/assets/images/logo.jpg"
              alt="TheJToolbox"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                objectFit: 'cover',
                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
              }}
            />
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0
            }}>
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                color: isDark ? '#e6e6e6' : '#000',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                TheJToolbox
              </div>
              <div style={{
                fontSize: '12px',
                color: isDark ? '#b3b3b3' : '#8c8c8c',
                marginTop: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Therefore™ Administration
              </div>
            </div>
          </div>

          {/* Controles derecha */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginLeft: 'auto'
          }}>
            <Button
              type="text"
              icon={isDark ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              title={isDark ? 'Modo claro' : 'Modo oscuro'}
              style={{
                fontSize: '18px',
                color: isDark ? '#e6e6e6' : '#000'
              }}
            />
            <UserDropdown />
          </div>
      </Header>

      <Layout style={{
        marginLeft: collapsed ? 64 : 250,
        marginTop: 72,
        marginBottom: 20,
        minHeight: 'calc(100vh - 92px)',
        transition: 'margin-left 0.2s',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Content style={{
          margin: 0,
          padding: '32px',
          background: isDark ? '#000000' : '#f5f5f5',
          minHeight: 'calc(100vh - 92px)',
          overflow: 'auto',
          flex: 1
        }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/users" element={<UserManager />} />
            <Route path="/eforms" element={<EFormGenerator />} />
            <Route path="/category-cloner" element={<CategoryCloner />} />
            <Route path="/tenants" element={<TenantManager />} />
            <Route path="/api-explorer" element={<ApiExplorer />} />
            <Route path="/category-builder" element={<CategoryBuilder />} />
            <Route path="/docs" element={<ProjectDocs />} />
            <Route path="/workflows" element={<WorkflowSettings />} />
            <Route path="/templates" element={<TemplateManager />} />
            <Route path="/web-services" element={<WebServicesManager />} />
          </Routes>
        </Content>

      </Layout>

      <Footer style={{
        textAlign: 'center',
        background: isDark ? 'rgba(20, 20, 20, 0.9)' : 'rgba(245, 245, 245, 0.9)',
        padding: '4px 24px',
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        fontSize: '11px',
        color: isDark ? '#8c8c8c' : '#8c8c8c',
        backdropFilter: 'blur(5px)',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100
      }}>
        TheJToolbox ©2025 | Powered by Aneker · Therefore™ Integration
      </Footer>
    </Layout>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
