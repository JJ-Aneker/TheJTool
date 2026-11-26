import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Spin, Dropdown } from 'antd'
import { SwapOutlined,
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
  GlobalOutlined,
  BookOutlined,
  MenuOutlined,
  FileExcelOutlined,
  BgColorsOutlined,
  CheckOutlined
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
const Manual = lazy(() => import('./views/Manual'))
const QuestionnaireManager = lazy(() => import('./views/QuestionnaireManager'))
const LicenseConfigurator = lazy(() => import('./views/LicenseConfigurator'))
const ThereforeMigrator = lazy(() => import('./views/ThereforeMigrator'))
const RFPAnalyzer = lazy(() => import('./views/RFPAnalyzer'))

const { Content } = Layout

const MOBILE_BREAKPOINT = 768

const getMenuItems = (isAdmin = false, t = (key) => key) => {
  const items = [
    // Inicio
    { key: 'home', icon: <HomeOutlined />, label: t('nav.home'), path: '/' },

    // ADMINISTRACIÓN (solo admin)
    { type: 'divider', adminOnly: true },
    { key: 'admin-header', type: 'group', label: t('nav.groupAdmin'), adminOnly: true },
    { key: 'users',        icon: <UserOutlined />,      label: t('nav.userManager'),       path: '/users',        adminOnly: true },
    { key: 'verticales',   icon: <AppstoreOutlined />,  label: t('nav.verticalesManager'), path: '/verticales',   adminOnly: true },
    { key: 'tenants',      icon: <CloudOutlined />,     label: t('nav.tenantManager'),     path: '/tenants',      adminOnly: true },
    { key: 'bedrock',      icon: <CloudOutlined />,     label: t('nav.bedrock'),           path: '/bedrock',      adminOnly: true },
    { key: 'web-services', icon: <CloudOutlined />,     label: t('nav.webServices'),       path: '/web-services', adminOnly: true },

    // CONSULTORÍA (todos)
    { type: 'divider' },
    { key: 'consulting-header', type: 'group', label: t('nav.groupConsulting') },
    { key: 'document-generator', icon: <ThunderboltOutlined />, label: t('nav.documentGenerator'), path: '/document-generator' },
    { key: 'questionnaires',     icon: <FileExcelOutlined />,    label: t('nav.questionnaires'), path: '/questionnaires' },
    { key: 'reporter',           icon: <FileTextOutlined />,     label: t('nav.thereforeReporter'), path: '/reporter' },
    { key: 'license-config',     icon: <KeyOutlined />,          label: t('nav.licenseConfig'),  path: '/license-configurator' },
    { key: 'rfp-analyzer',       icon: <FileTextOutlined />,     label: t('nav.rfpAnalyzer'),    path: '/rfp-analyzer' },
    { key: 'manual',             icon: <BookOutlined />,         label: t('nav.manual'),           path: '/manual' },

    // DESARROLLO TÉCNICO (todos)
    { type: 'divider' },
    { key: 'dev-header', type: 'group', label: t('nav.groupDev') },
    { key: 'eforms',             icon: <FormOutlined />,         label: t('nav.eformBuilder'),    path: '/eforms' },
    { key: 'category-builder',   icon: <AppstoreOutlined />,     label: t('nav.categoryBuilder'), path: '/category-builder' },
    { key: 'migrator',           icon: <SwapOutlined />,         label: t('nav.migrator'),        path: '/migrator' },
    { key: 'api-explorer',       icon: <ApiOutlined />,          label: t('nav.apiExplorer'),     path: '/api-explorer' },
  ]

  return items
    .filter(item => !item.adminOnly || isAdmin)
    .map(({ adminOnly, ...rest }) => rest)
}

function AppContent() {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed')
    return saved ? JSON.parse(saved) : false
  })
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user, logout, loading } = useAuth()
  const { isAdmin } = useRole()
  const { themeMode, setThemeMode } = useTheme()

  // Detect viewport changes
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT
      setIsMobile(mobile)
      if (!mobile) setMobileOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleSidebarToggle = (value) => {
    setCollapsed(value)
    localStorage.setItem('sidebar_collapsed', JSON.stringify(value))
  }

  if (!isAuthenticated) {
    return <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<Login />} />
    </Routes>
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
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
      if (isMobile) setMobileOpen(false)
    }
  }

  const handleProfileClick = () => {
    navigate('/profile')
    if (isMobile) setMobileOpen(false)
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserSwitchOutlined />,
      label: t('nav.userProfile'),
      onClick: handleProfileClick
    },
    { type: 'divider' },
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
          onClick: () => { i18n.changeLanguage('es'); localStorage.setItem('i18nextLng', 'es') }
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
          onClick: () => { i18n.changeLanguage('en'); localStorage.setItem('i18nextLng', 'en') }
        }
      ]
    },
    {
      key: 'theme',
      icon: <BgColorsOutlined />,
      label: t('common.appearance'),
      children: [
        { key: 'theme-dark', icon: <MoonOutlined />, label: t('common.themeDark') },
        { key: 'theme-light', icon: <SunOutlined />, label: t('common.themeLight') },
        { key: 'theme-executive', icon: <FileTextOutlined />, label: t('common.themeExecutive') }
      ].map(item => {
        const mode = item.key.replace('theme-', '')
        return {
          ...item,
          label: (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between', minWidth: 150 }}>
              {item.label}
              {themeMode === mode && <CheckOutlined style={{ color: 'var(--accent-primary)' }} />}
            </span>
          ),
          onClick: () => setThemeMode(mode)
        }
      })
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('nav.logout'),
      onClick: () => logout()
    }
  ]

  // On mobile: sidebar is an overlay drawer
  const sidebarWidth = isMobile ? 240 : (collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-expanded)')
  const sidebarVisible = isMobile ? mobileOpen : true
  const sidebarPosition = isMobile ? 'fixed' : 'fixed'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-page)', color: 'var(--text-primary)' }}>

      {/* Mobile overlay backdrop */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 99,
            background: 'rgba(0,0,0,0.45)',
            transition: 'opacity 200ms ease'
          }}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          height: '100vh',
          position: 'fixed',
          left: 0, top: 0, bottom: 0,
          zIndex: 100,
          background: 'var(--bg-sidebar)',
          borderRight: isMobile ? '1px solid var(--sidebar-border)' : 'none',
          transition: isMobile ? 'transform 250ms ease' : 'var(--sidebar-transition)',
          transform: isMobile && !mobileOpen ? 'translateX(-100%)' : 'translateX(0)',
          display: 'flex',
          flexDirection: 'column',
          width: sidebarWidth,
          overflow: 'hidden'
        }}
      >
        {/* Sidebar Header */}
        <div style={{
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: (!isMobile && collapsed) ? 'center' : 'space-between',
          minHeight: '48px',
          flexShrink: 0
        }}>
          <div
            onClick={() => !isMobile && collapsed && handleSidebarToggle(false)}
            style={{ cursor: (!isMobile && collapsed) ? 'pointer' : 'default', transition: 'opacity 200ms ease' }}
          >
            <img
              src="/assets/images/logo.png"
              alt="TheJ - ToolBox"
              style={{ width: '37px', height: '50px', borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0 }}
            />
          </div>
          {(isMobile || !collapsed) && (
            <>
              <div style={{ flex: 1, marginLeft: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px' }}>
                <span style={{ color: 'var(--sidebar-fg-active)', fontSize: '30px', fontWeight: '600', lineHeight: '1' }}>theJay</span>
                <span style={{ color: 'var(--accent-primary)', fontSize: '11px', letterSpacing: '6.5px', lineHeight: '1' }}>······</span>
              </div>
              <button
                onClick={() => isMobile ? setMobileOpen(false) : handleSidebarToggle(true)}
                className="sidebar-icon-btn"
                aria-label="Contraer menú"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '4px', marginLeft: '8px'
                }}
              >
                <MenuFoldOutlined style={{ fontSize: 16 }} />
              </button>
            </>
          )}
        </div>

        {/* Sidebar Menu */}
        <div style={{ flex: 1, overflow: 'auto', scrollbarWidth: 'thin' }}>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={getSelectedKey()}
            onClick={handleMenuClick}
            items={getMenuItems(isAdmin, t)}
            style={{ background: 'var(--bg-sidebar)', borderRight: 'none', margin: 0 }}
            inlineCollapsed={!isMobile && collapsed}
          />
        </div>

        {/* Sidebar Footer — User Avatar */}
        <Dropdown menu={{ items: userMenuItems }} placement="topLeft" trigger={['click']}>
          <div
            className="sidebar-user"
            style={{
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: (!isMobile && collapsed) ? 'center' : 'flex-start',
              gap: '12px',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--accent-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '12px', fontWeight: '600', flexShrink: 0
            }}>
              {user?.email ? user.email.substring(0, 1).toUpperCase() : 'U'}
            </div>
            {(isMobile || !collapsed) && (
              <div style={{
                fontSize: '12px', color: 'var(--sidebar-fg)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1
              }}>
                {user?.email || 'Usuario'}
              </div>
            )}
          </div>
        </Dropdown>
      </div>

      {/* Main Content Area */}
      <div style={{
        marginLeft: isMobile ? 0 : (collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-expanded)'),
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        transition: isMobile ? 'none' : 'var(--sidebar-transition)',
        background: 'var(--bg-page)',
        minWidth: 0
      }}>
        {/* Mobile top bar with hamburger */}
        {isMobile && (
          <div style={{
            height: 48,
            background: 'var(--bg-sidebar)',
            borderBottom: '1px solid var(--sidebar-border)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            gap: 12,
            flexShrink: 0,
            zIndex: 10
          }}>
            <button
              onClick={() => setMobileOpen(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--sidebar-fg-active)',
                display: 'flex', alignItems: 'center', padding: '4px'
              }}
            >
              <MenuOutlined style={{ fontSize: 20 }} />
            </button>
            <img src="/assets/images/logo.png" alt="logo" style={{ width: 28, height: 38, objectFit: 'cover', borderRadius: 4 }} />
            <span style={{ color: 'var(--sidebar-fg-active)', fontSize: 18, fontWeight: 600 }}>theJay</span>
          </div>
        )}

        <Content className="app-panel" style={{
          padding: isMobile ? '12px' : '20px 28px',
          background: 'var(--bg-canvas)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'auto'
        }}>
          <Suspense fallback={
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '400px', gap: 16 }}>
              <Spin size="large" />
              <div>Cargando...</div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/users" element={<AdminRoute><UserManager /></AdminRoute>} />
              <Route path="/verticales" element={<AdminRoute><VerticalesManager /></AdminRoute>} />
              <Route path="/bedrock" element={<AdminRoute><BedrrockPanel /></AdminRoute>} />
              <Route path="/eform-generator-ai" element={<Navigate to="/eforms?nuevo=ia" replace />} />
              <Route path="/eforms" element={<EFormBuilder />} />
              <Route path="/category-builder" element={<CategoryBuilder />} />
              <Route path="/migrator" element={<ThereforeMigrator />} />
              <Route path="/tenants" element={<TenantManager />} />
              <Route path="/questionnaires" element={<QuestionnaireManager />} />
              <Route path="/document-generator" element={<DocumentGenerator />} />
              <Route path="/reporter" element={<ThereforeReporter />} />
              <Route path="/license-configurator" element={<LicenseConfigurator />} />
              <Route path="/rfp-analyzer" element={<RFPAnalyzer />} />
              <Route path="/web-services" element={<WebServicesManager />} />
              <Route path="/manual" element={<Manual />} />
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
