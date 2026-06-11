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
import { useTranslation } from 'react-i18next'

export default function Home() {
  const { t } = useTranslation()

  const tools = [
    {
      icon: <FormOutlined style={{ fontSize: '32px', color: 'var(--kpi-blue)' }} />,
      title: t('home.tools.eformBuilder.title'),
      description: t('home.tools.eformBuilder.description'),
      path: '/eforms'
    },
    {
      icon: <CopyOutlined style={{ fontSize: '32px', color: 'var(--kpi-green)' }} />,
      title: t('home.tools.categoryCloner.title'),
      description: t('home.tools.categoryCloner.description'),
      path: '/category-cloner'
    },
    {
      icon: <CloudOutlined style={{ fontSize: '32px', color: 'var(--kpi-amber)' }} />,
      title: t('home.tools.tenantManager.title'),
      description: t('home.tools.tenantManager.description'),
      path: '/tenants'
    },
    {
      icon: <ApiOutlined style={{ fontSize: '32px', color: 'var(--kpi-pink)' }} />,
      title: t('home.tools.apiExplorer.title'),
      description: t('home.tools.apiExplorer.description'),
      path: '/api-explorer'
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      <Alert
        message={t('home.title')}
        description={t('home.description')}
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
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 200ms ease'
          }}>
            <div className="kpi-label">{t('home.activeInstances')}</div>
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
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 200ms ease'
          }}>
            <div className="kpi-label">{t('home.categories')}</div>
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
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 200ms ease'
          }}>
            <div className="kpi-label">{t('home.forms')}</div>
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
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 200ms ease'
          }}>
            <div className="kpi-label">{t('home.workflows')}</div>
            <div className="kpi-value">67</div>
          </div>
        </Col>
      </Row>

      {/* Herramientas */}
      <div>
        <h2 style={{ marginBottom: '16px', marginTop: 0, fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{t('home.availableTools')}</h2>
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
                  gap: '8px',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-hover)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-card)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                }}
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
        <h2 style={{ marginBottom: '16px', marginTop: 0, fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{t('home.recentActivity')}</h2>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 200ms ease'
        }}>
          <Timeline items={[
            { children: t('home.activities.categoriesSync') },
            { children: t('home.activities.eformImported') },
            { children: t('home.activities.workflowsUpdated') },
            { children: t('home.activities.backupGenerated') }
          ]} />
        </div>
      </div>
    </div>
  )
}
