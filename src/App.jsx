import { useState, lazy, Suspense } from 'react'
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
  MoonOutlined,
  ThunderboltOutlined,
  KeyOutlined,
  GlobalOutlined
} from '@ant-design/icons'
import { useAuth } from './hooks/useAuth'
import { useRole } from './hooks/useRole'
import { useTheme } from './hooks/useTheme'
import { useTranslation } from 'react-i18next'
import './styles/design-tokens.css'
import i18n from './i18n'

// Componentes
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

// Vistas - Carga inmediata (pequeñas, usadas frecuentemente)
import Home from './views/Home'
import Login from './views/Login'
import Placeholder from './views/Placeholder'

// Vistas - Lazy Loading (grandes, usadas bajo demanda)
const UserProfile = lazy(() => import('./views/UserProfile'))
const UserManager = lazy(() => import('./views/UserManager'))
const VerticalesManager = lazy(() => import('./views/VerticalesManager'))
const TenantManager = lazy(() => import('./views/TenantManager'))
const WebServicesManager = lazy(() => import('./views/WebServicesManager'))
const EFormBuilder = lazy(() => import('./views/EFormBuilder'))
const CategoryBuilder = lazy(() => import('./views/CategoryBuilder'))
const DocumentGenerator = lazy(() => import('./views/DocumentGenerator'))
const ThereforeReporter = lazy(() => import('./views/ThereforeReporter'))
const BedrrockPanel = lazy(() => import('./views/BedrrockPanel'))

const { Sider, Content } = Layout

// Menu items flat structure
const getMenuItems = (isAdmin = false, t = (key) => key) => {
  const activeItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: t('nav.home'),
      path: '/'
    },
    {
      key: 'users',
      icon: <UserOutlined />,
      label: t('nav.userManager'),
      path: '/users',
      adminOnly: true
    },
    {
      key: 'verticales',
      icon: <AppstoreOutlined />,
      label: t('nav.verticalesManager'),
      path: '/verticales',
      adminOnly: true
    },
    {
      key: 'bedrock',
      icon: <CloudOutlined />,
      label: t('nav.bedrock'),
      path: '/bedrock',
      adminOnly: true
    },
    {
      key: 'eforms',
      icon: <FormOutlined />,
      label: t('nav.eformBuilder'),
      path: '/eforms'
    },
    {
      key: 'category-builder',
      icon: <AppstoreOutlined />,
      label: t('nav.categoryBuilder'),
      path: '/category-builder'
    },
    {
      key: 'tenants',
      icon: <CloudOutlined />,
      label: t('nav.tenantManager'),
      path: '/tenants'
    },
    {
      key: 'document-generator',
      icon: <ThunderboltOutlined />,
      label: t('nav.documentGenerator'),
      path: '/document-generator'
    },
    {
      key: 'reporter',
      icon: <FileTextOutlined />,
      label: t('nav.thereforeReporter'),
      path: '/reporter'
    },
    {
      key: 'web-services',
      icon: <CloudOutlined />,
      label: t('nav.webServices'),
      path: '/web-services'
    }
  ]

  const constructionItems = [
    {
      type: 'divider'
    },
    {
      key: 'api-explorer',
      icon: <ApiOutlined />,
      label: 'Explorador API REST',
      path: '/api-explorer'
    },
    {
      key: 'workflows',
      icon: <SettingOutlined />,
      label: 'Configuración de Workflows',
      path: '/workflows'
    },
    {
      key: 'docs',
      icon: <FileTextOutlined />,
      label: 'Documentación de Proyectos',
      path: '/docs'
    }
  ]

  const allItems = [...activeItems, ...constructionItems]
  return allItems
    .filter(item => !item.adminOnly || isAdmin)
    .map(item => {
      const { adminOnly, ...rest } = item
      return rest
    })
}

function AppContent() {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed')
    return saved ? JSON.parse(saved) : false
  })
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user, logout, loading } = useAuth()
  const { isAdmin } = useRole()
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
    const items = getMenuItems(isAdmin, t)
    const item = items.find(m => m.path === location.pathname)
    return item ? [item.key] : ['home']
  }

  const handleMenuClick = (e) => {
    const items = getMenuItems(isAdmin, t)
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
      label: t('nav.userProfile'),
      onClick: handleProfileClick
    },
    {
      type: 'divider'
    },
    {
      key: 'language',
      icon: <GlobalOutlined />,
      label: t('language.selectLanguage'),
      children: [
        {
          key: 'es',
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🇪🇸</span>
              <span>{t('language.spanish')}</span>
              {i18n.language === 'es' && <span style={{ color: '#1677ff' }}>✓</span>}
            </div>
          ),
          onClick: () => {
            i18n.changeLanguage('es')
            localStorage.setItem('i18nextLng', 'es')
          }
        },
        {
          key: 'en',
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🇬🇧</span>
              <span>{t('language.english')}</span>
              {i18n.language === 'en' && <span style={{ color: '#1677ff' }}>✓</span>}
            </div>
          ),
          onClick: () => {
            i18n.changeLanguage('en')
            localStorage.setItem('i18nextLng', 'en')
          }
        }
      ]
    },
    {
      key: 'theme',
      icon: isDark ? <SunOutlined /> : <MoonOutlined />,
      label: isDark ? t('common.lightMode') : t('common.darkMode'),
      onClick: toggleTheme
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('nav.logout'),
      onClick: () => logout()
    }
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-canvas)', color: 'var(--text-primary)' }}>
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
          width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-expanded)',
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
                width: '37px',
                height: '50px',
                borderRadius: 'var(--radius-md)',
                objectFit: 'cover',
                flexShrink: 0
              }}
            />
          </div>
          {!collapsed && (
            <>
              <div style={{
                flex: 1,
                marginLeft: '12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '2px'
              }}>
                <span style={{ color: 'white', fontSize: '30px', fontWeight: '600', lineHeight: '1' }}>theJay</span>
                <span style={{ color: '#1890ff', fontSize: '11px', letterSpacing: '6.5px', lineHeight: '1' }}>······</span>
              </div>
              <button
                  onClick={() => handleSidebarToggle(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.45)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    transition: 'color 200ms ease',
                    marginLeft: '8px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.45)'}
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
            items={getMenuItems(isAdmin, t)}
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
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: '#25272D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '12px',
            cursor: 'pointer',
            transition: 'background 200ms ease',
            flexShrink: 0
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#252a3d'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#25272D'}
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
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.55)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                fontWeight: '400',
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
        marginLeft: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-expanded)',
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
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden'
        }}>
          <Suspense fallback={
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px'
            }}>
              <Spin size="large" tip="Cargando..." />
            </div>
          }>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/users" element={<AdminRoute><UserManager /></AdminRoute>} />
              <Route path="/verticales" element={<AdminRoute><VerticalesManager /></AdminRoute>} />
              <Route path="/bedrock" element={<AdminRoute><BedrrockPanel /></AdminRoute>} />
              <Route path="/eforms" element={<EFormBuilder />} />
              <Route path="/category-builder" element={<CategoryBuilder />} />
              <Route path="/tenants" element={<TenantManager />} />
              <Route path="/document-generator" element={<DocumentGenerator />} />
              <Route path="/reporter" element={<ThereforeReporter />} />
              <Route path="/web-services" element={<WebServicesManager />} />
              <Route path="/api-explorer" element={<Placeholder icon={<ApiOutlined />} title="Explorador API REST" status="construction" />} />
              <Route path="/workflows" element={<Placeholder icon={<SettingOutlined />} title="Configuración de Workflows" status="construction" />} />
              <Route path="/docs" element={<Placeholder icon={<FileTextOutlined />} title="Documentación de Proyectos" status="construction" />} />
            </Routes>
          </Suspense>
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
