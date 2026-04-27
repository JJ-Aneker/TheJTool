import { Card, Row, Col, Statistic, Timeline, Alert } from 'antd'
import {
  FormOutlined,
  CopyOutlined,
  CloudOutlined,
  ApiOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  SettingOutlined
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
    <div>
      <Alert
        message="TheJToolbox - Therefore™ Administration Panel"
        description="Panel central para administración de proyectos y configuraciones en Therefore™ DMS"
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} md={6}>
          <Statistic title="Instancias Activas" value={2} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic title="Categorías" value={45} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic title="Formularios" value={128} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic title="Workflows" value={67} />
        </Col>
      </Row>

      <h2 style={{ marginBottom: '16px' }}>Herramientas Disponibles</h2>
      <Row gutter={[16, 16]}>
        {tools.map((tool) => (
          <Col xs={24} sm={12} md={8} lg={6} key={tool.title}>
            <Card
              hoverable
              onClick={() => window.location.pathname = tool.path}
              style={{ textAlign: 'center', cursor: 'pointer' }}
            >
              <div style={{ marginBottom: '12px' }}>
                {tool.icon}
              </div>
              <h3 style={{ marginBottom: '8px' }}>{tool.title}</h3>
              <p style={{ color: '#8c8c8c', fontSize: '12px' }}>
                {tool.description}
              </p>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ marginTop: '32px' }}>
        <h2 style={{ marginBottom: '16px' }}>Últimas Actividades</h2>
        <Timeline items={[
          { children: 'Sincronización de categorías completada' },
          { children: 'Nuevo formulario eForms importado' },
          { children: 'Configuración de workflows actualizada' },
          { children: 'Backup de instancias generado' }
        ]} />
      </div>
    </div>
  )
}
