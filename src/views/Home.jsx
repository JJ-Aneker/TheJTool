import { Row, Col, Statistic, Timeline, Alert } from 'antd'
import {
  FormOutlined,
  CopyOutlined,
  CloudOutlined,
  ApiOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  SettingOutlined,
  HomeOutlined
} from '@ant-design/icons'

export default function Home() {
  const tools = [
    {
      icon: <FormOutlined style={{ fontSize: '32px', color: '#1890ff' }} />,
      title: 'Generador de eForms',
      description: 'Crea y gestiona formularios electrónicos',
      path: '/eforms'
    },
    {
      icon: <CopyOutlined style={{ fontSize: '32px', color: '#52c41a' }} />,
      title: 'Clonador de Categorías',
      description: 'Replica estructuras de categorías existentes',
      path: '/category-cloner'
    },
    {
      icon: <CloudOutlined style={{ fontSize: '32px', color: '#faad14' }} />,
      title: 'Gestión de Tenants',
      description: 'Administra instancias de Therefore',
      path: '/tenants'
    },
    {
      icon: <ApiOutlined style={{ fontSize: '32px', color: '#f5222d' }} />,
      title: 'Explorador API REST',
      description: 'Explora y prueba endpoints de la API',
      path: '/api-explorer'
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      <Alert
        message="TheJToolbox - Therefore™ Administration Panel"
        description="Panel central para administración de proyectos y configuraciones en Therefore™ DMS"
        type="info"
        showIcon
        style={{ margin: 0, borderRadius: 'var(--radius-lg)' }}
      />

      {/* KPI Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderTop: '3px solid var(--kpi-blue)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div className="kpi-label">Instancias Activas</div>
            <div className="kpi-value">2</div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderTop: '3px solid var(--kpi-green)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div className="kpi-label">Categorías</div>
            <div className="kpi-value">45</div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderTop: '3px solid var(--kpi-amber)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div className="kpi-label">Formularios</div>
            <div className="kpi-value">128</div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderTop: '3px solid var(--kpi-pink)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div className="kpi-label">Workflows</div>
            <div className="kpi-value">67</div>
          </div>
        </Col>
      </Row>

      {/* Herramientas */}
      <div>
        <h2 style={{ marginBottom: '16px', marginTop: 0, fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Herramientas Disponibles</h2>
        <Row gutter={[16, 16]}>
          {tools.map((tool) => (
            <Col xs={24} sm={12} md={8} lg={6} key={tool.title}>
              <div
                onClick={() => window.location.pathname = tool.path}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  height: '100%',
                  transition: 'all 200ms ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
              >
                <div style={{ marginBottom: '4px' }}>
                  {tool.icon}
                </div>
                <h3 style={{ marginBottom: '4px', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{tool.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>
                  {tool.description}
                </p>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* Actividades */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <h2 style={{ marginBottom: '16px', marginTop: 0, fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Últimas Actividades</h2>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px'
        }}>
          <Timeline items={[
            { children: 'Sincronización de categorías completada' },
            { children: 'Nuevo formulario eForms importado' },
            { children: 'Configuración de workflows actualizada' },
            { children: 'Backup de instancias generado' }
          ]} />
        </div>
      </div>
    </div>
  )
}
