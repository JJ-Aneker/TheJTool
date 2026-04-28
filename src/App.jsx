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
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={250}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100
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

      <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'margin 0.2s' }}>
        <Header style={{
          background: isDark ? '#141414' : '#fff',
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
          transition: 'background 0.3s'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '500',
            color: '#1890ff'
          }}>
            Therefore™ Administration Panel
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button
              type="text"
              icon={isDark ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              title={isDark ? 'Modo claro' : 'Modo oscuro'}
            />
            <UserDropdown />
          </div>
        </Header>

        <Content style={{
          margin: '24px 24px',
          padding: '24px',
          background: '#fff',
          borderRadius: '4px',
          minHeight: 'calc(100vh - 112px)'
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

        <Footer style={{
          textAlign: 'center',
          background: '#f0f2f5',
          marginLeft: collapsed ? 0 : 0
        }}>
          TheJToolbox ©2025 | Powered by Aneker · Therefore™ Integration
        </Footer>
      </Layout>
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
