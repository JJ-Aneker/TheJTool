import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import {
  FormOutlined,
  CopyOutlined,
  CloudOutlined,
  ApiOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  HomeOutlined
} from '@ant-design/icons'

// Vistas
import Home from './views/Home'
import EFormGenerator from './views/EFormGenerator'
import CategoryCloner from './views/CategoryCloner'
import TenantManager from './views/TenantManager'
import ApiExplorer from './views/ApiExplorer'
import CategoryBuilder from './views/CategoryBuilder'
import ProjectDocs from './views/ProjectDocs'
import WorkflowSettings from './views/WorkflowSettings'

const { Header, Sider, Content, Footer } = Layout

function App() {
  const [collapsed, setCollapsed] = useState(false)
  const [selectedKey, setSelectedKey] = useState(['home'])

  const menuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: 'Inicio',
      path: '/'
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
    }
  ]

  const handleMenuClick = (e) => {
    setSelectedKey([e.key])
    const item = menuItems.find(m => m.key === e.key)
    if (item) {
      window.location.pathname = item.path
    }
  }

  return (
    <BrowserRouter>
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
            selectedKeys={selectedKey}
            onClick={handleMenuClick}
            items={menuItems}
          />

          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            borderTop: '1px solid rgba(255,255,255,0.2)',
            padding: '16px'
          }}>
            <Menu
              theme="dark"
              mode="inline"
              items={[
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: 'Salir',
                  onClick: () => window.location.href = '/logout'
                }
              ]}
            />
          </div>
        </Sider>

        <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'margin 0.2s' }}>
          <Header style={{
            background: '#fff',
            padding: '0 24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            height: 64
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '500',
              color: '#1890ff'
            }}>
              Therefore™ Administration Panel
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
              <Route path="/eforms" element={<EFormGenerator />} />
              <Route path="/category-cloner" element={<CategoryCloner />} />
              <Route path="/tenants" element={<TenantManager />} />
              <Route path="/api-explorer" element={<ApiExplorer />} />
              <Route path="/category-builder" element={<CategoryBuilder />} />
              <Route path="/docs" element={<ProjectDocs />} />
              <Route path="/workflows" element={<WorkflowSettings />} />
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
    </BrowserRouter>
  )
}

export default App
