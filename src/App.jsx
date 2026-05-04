import { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Spin, Dropdown } from 'antd'
import {
  FormOutlined,
  CloudOutlined,
  ApiOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  SettingOutlined,
  HomeOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  UserSwitchOutlined,
  SunOutlined,
  MoonOutlined
} from '@ant-design/icons'
import { useAuth } from './hooks/useAuth'
import { useTheme } from './hooks/useTheme'
import './styles/design-tokens.css'

// Componentes
import ProtectedRoute from './components/ProtectedRoute'

// Vistas
import Home from './views/Home'
import Login from './views/Login'
import UserProfile from './views/UserProfile'
import UserManager from './views/UserManager'
import WebServicesManager from './views/WebServicesManager'
import EFormBuilder from './views/EFormBuilder'
import CategoryBuilder from './views/CategoryBuilder'
import Placeholder from './views/Placeholder'

const { Sider, Content } = Layout

// Menu items flat structure
const getMenuItems = () => [
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
    key: 'category-builder',
    icon: <AppstoreOutlined />,
    label: 'Category Builder',
    path: '/category-builder'
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
    const items = getMenuItems()
    const item = items.find(m => m.path === location.pathname)
    return item ? [item.key] : ['home']
  }

  const handleMenuClick = (e) => {
    const items = getMenuItems()
    const item = items.find(m => m.key === e.key)
    if (item) {
      navigate(item.path)
    }
  }

  const handleProfileClick = () => {
    navigate('/profile')
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserSwitchOutlined />,
      label: 'Mi Perfil',
      onClick: handleProfileClick
    },
    {
      type: 'divider'
    },
    {
      key: 'theme',
      icon: isDark ? <SunOutlined /> : <MoonOutlined />,
      label: isDark ? 'Modo Claro' : 'Modo Oscuro',
      onClick: toggleTheme
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar Sesión',
      onClick: () => logout()
    }
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-canvas)', color: 'var(--text-primary)' }}>
      {/* Sidebar - 100% height with internal header and footer */}
      <div
        style={{
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-default)',
          transition: 'var(--sidebar-transition)',
          display: 'flex',
          flexDirection: 'column',
          width: collapsed ? 48 : 210,
          overflow: 'hidden'
        }}
      >
        {/* Sidebar Header */}
        <div style={{
          padding: '12px',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          height: 'fit-content',
          minHeight: '48px',
          flexShrink: 0
        }}>
          <div
            onClick={() => collapsed && handleSidebarToggle(!collapsed)}
            style={{
              cursor: collapsed ? 'pointer' : 'default',
              transition: 'opacity 200ms ease',
              opacity: collapsed ? 0.7 : 1
            }}
            onMouseEnter={(e) => collapsed && (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => collapsed && (e.currentTarget.style.opacity = '0.7')}
          >
            <img
              src="/assets/images/logo.png"
              alt="TheJ - ToolBox"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-md)',
                objectFit: 'cover',
                flexShrink: 0
              }}
            />
          </div>
          {!collapsed && (
            <>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                flex: 1,
                marginLeft: '12px',
                transition: 'color 200ms ease'
              }}>
                TheJ - ToolBox
              </div>
              <button
                onClick={() => handleSidebarToggle(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  transition: 'color 200ms ease',
                  marginLeft: '8px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <MenuFoldOutlined size={18} />
              </button>
            </>
          )}
        </div>

        {/* Sidebar Menu - scrollable */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          scrollbarWidth: 'thin'
        }}>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={getSelectedKey()}
            onClick={handleMenuClick}
            items={getMenuItems()}
            style={{
              background: 'var(--bg-sidebar)',
              borderRight: 'none',
              margin: 0,
              padding: '4px 0'
            }}
          />
        </div>

        {/* Sidebar Footer - User Avatar */}
        <Dropdown menu={{ items: userMenuItems }} placement="topLeft" trigger={['click']}>
          <div style={{
            padding: '12px',
            borderTop: '1px solid var(--border-default)',
            background: 'var(--bg-sidebar)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '12px',
            cursor: 'pointer',
            transition: 'background 200ms ease',
            flexShrink: 0
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-sidebar)'}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: '600',
              flexShrink: 0
            }}>
              {user?.email ? user.email.substring(0, 1).toUpperCase() : 'U'}
            </div>
            {!collapsed && (
              <div style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                transition: 'color 200ms ease'
              }}>
                {user?.email || 'Usuario'}
              </div>
            )}
          </div>
        </Dropdown>
      </div>

      {/* Main Content Area */}
      <div style={{
        marginLeft: collapsed ? 48 : 210,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        transition: 'var(--sidebar-transition)',
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
            <Route path="/eforms" element={<EFormBuilder />} />
            <Route path="/category-builder" element={<CategoryBuilder />} />
            <Route path="/tenants" element={<Placeholder icon={<CloudOutlined />} title="Gestión de Tenants" description="Próximamente: Integración de tu Tenant Manager mejorado" />} />
            <Route path="/api-explorer" element={<Placeholder icon={<ApiOutlined />} title="Explorador API REST" description="Próximamente: Integración de tu API Explorer mejorado" />} />
            <Route path="/docs" element={<Placeholder icon={<FileTextOutlined />} title="Documentación de Proyectos" description="Próximamente: Documentación del proyecto" />} />
            <Route path="/workflows" element={<Placeholder icon={<SettingOutlined />} title="Configuración de Workflows" description="Próximamente: Integración de tu Workflow Manager mejorado" />} />
            <Route path="/web-services" element={<WebServicesManager />} />
          </Routes>
        </Content>
      </div>
    </div>
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
