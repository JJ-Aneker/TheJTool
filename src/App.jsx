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
  MoonOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import { useAuth } from './hooks/useAuth'
import { useTheme } from './hooks/useTheme'
import './styles/design-tokens.css'

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
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed')
    return saved ? JSON.parse(saved) : false
  })
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user, logout, loading } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  const handleSidebarToggle = (value) => {
    setCollapsed(value)
    localStorage.setItem('sidebar_collapsed', JSON.stringify(value))
  }

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
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-canvas)' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={handleSidebarToggle}
        theme="dark"
        width={210}
        collapsedWidth={48}
        style={{
          overflow: 'auto',
          height: 'calc(100vh - 64px)',
          position: 'fixed',
          left: 0,
          top: 64,
          bottom: 0,
          zIndex: 100,
          scrollbarWidth: 'thin',
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-default)',
          transition: 'var(--sidebar-transition)'
        }}
      >
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKey()}
          onClick={handleMenuClick}
          items={menuItems}
          style={{
            background: 'var(--bg-sidebar)',
            borderRight: 'none'
          }}
        />

        {/* User Email Footer */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 16px',
          borderTop: '1px solid var(--border-default)',
          background: 'var(--bg-sidebar)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textAlign: collapsed ? 'center' : 'left'
        }}>
          {!collapsed && user?.email}
          {collapsed && user?.email && user.email.substring(0, 1).toUpperCase()}
        </div>
      </Sider>

      <Header
        className="app-header"
        style={{
          background: 'var(--bg-sidebar)',
          backdropFilter: 'blur(10px)',
          padding: '0 16px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 101,
          transition: 'all 220ms ease',
          borderBottom: '1px solid var(--border-default)'
        }}>

          {/* Logo y Título */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <img
              src="/assets/images/logo.png"
              alt="TheJToolbox"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                objectFit: 'cover',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                flexShrink: 0
              }}
            />
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                TheJToolbox
              </div>
            </div>
          </div>

          {/* Controles derecha */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginLeft: 'auto'
          }}>
            <UserDropdown />
          </div>
      </Header>

      <Layout style={{
        marginLeft: collapsed ? 48 : 210,
        marginTop: 64,
        width: collapsed ? 'calc(100% - 48px)' : 'calc(100% - 210px)',
        height: 'calc(100vh - 64px)',
        transition: 'var(--sidebar-transition)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-canvas)'
      }}>
        <Content style={{
          margin: 0,
          padding: 'var(--content-padding-top) var(--content-padding-x)',
          background: 'var(--bg-canvas)',
          flex: 1,
          overflow: 'hidden',
          overflowY: 'auto'
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
        background: 'var(--bg-sidebar)',
        padding: '8px 24px',
        borderTop: '1px solid var(--border-default)',
        fontSize: '11px',
        color: 'var(--text-secondary)',
        backdropFilter: 'blur(5px)',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
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
