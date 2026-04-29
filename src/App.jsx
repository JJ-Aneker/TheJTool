import { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Spin, Dropdown } from 'antd'
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
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  UserSwitchOutlined
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

const { Sider, Content } = Layout

// Menu items organized by sections
const getMenuItems = () => [
  {
    type: 'group',
    label: 'GENERAL',
    children: [
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
      }
    ]
  },
  {
    type: 'group',
    label: 'HERRAMIENTAS',
    children: [
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
      }
    ]
  },
  {
    type: 'group',
    label: 'SOPORTE',
    children: [
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
  }
]

// Flatten menu items for finding by path
const getAllMenuItems = () => {
  const items = getMenuItems()
  const flattened = []
  items.forEach(group => {
    if (group.children) {
      flattened.push(...group.children)
    }
  })
  return flattened
}

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
    const items = getAllMenuItems()
    const item = items.find(m => m.path === location.pathname)
    return item ? [item.key] : ['home']
  }

  const handleMenuClick = (e) => {
    const items = getAllMenuItems()
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
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar Sesión',
      onClick: () => logout()
    }
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-canvas)' }}>
      {/* Sidebar - 100% height with internal header and footer */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={handleSidebarToggle}
        theme="dark"
        width={210}
        collapsedWidth={48}
        style={{
          overflow: 'hidden',
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
          flexDirection: 'column'
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
          minHeight: '48px'
        }}>
          <img
            src="/assets/images/logo.png"
            alt="NewLead"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-md)',
              objectFit: 'cover',
              flexShrink: 0
            }}
          />
          {!collapsed && (
            <>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                flex: 1,
                marginLeft: '12px'
              }}>
                NewLead
              </div>
              <button
                onClick={() => handleSidebarToggle(!collapsed)}
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
                onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
              >
                {collapsed ? <MenuUnfoldOutlined size={18} /> : <MenuFoldOutlined size={18} />}
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
              borderRight: 'none'
            }}
          />
        </div>

        {/* Sidebar Footer - User Avatar */}
        <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
          <div style={{
            padding: '12px',
            borderTop: '1px solid var(--border-default)',
            background: 'var(--bg-sidebar)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '12px',
            cursor: 'pointer',
            transition: 'background 200ms ease'
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
                flex: 1
              }}>
                {user?.email || 'Usuario'}
              </div>
            )}
          </div>
        </Dropdown>
      </Sider>

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
