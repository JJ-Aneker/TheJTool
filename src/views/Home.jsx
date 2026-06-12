import { useState, useEffect } from 'react'
import { Row, Col, Card, Timeline, Badge, Statistic, Spin } from 'antd'
import {
  FormOutlined,
  FileTextOutlined,
  CloudOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  DatabaseOutlined,
  ApiOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabaseClient'
import {
  getDashboardStats,
  getRecentReports,
  getRecentDocuments,
  getRecentActivity,
  getSystemStatus,
  getStatsHistory,
  getPerformanceMetrics,
  formatTimeAgo,
  documentTypeIcons
} from '../services/dashboardService'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import '../styles/home-pro.css'

export default function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // State for real data
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    activeTenantsCount: 0,
    categoriesCount: 0,
    eformsCount: 0,
    docsThisMonth: 0
  })
  const [recentReports, setRecentReports] = useState([])
  const [recentDocs, setRecentDocs] = useState([])
  const [activities, setActivities] = useState([])
  const [systemStatus, setSystemStatus] = useState([])
  const [statsHistory, setStatsHistory] = useState([])
  const [performanceMetrics, setPerformanceMetrics] = useState(null)

  // Load all dashboard data
  useEffect(() => {
    async function loadDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        const userId = user?.id

        // Load all data in parallel
        const [statsData, reportsData, docsData, activityData, statusData, historyData, metricsData] = await Promise.all([
          getDashboardStats(userId),
          getRecentReports(userId),
          getRecentDocuments(userId),
          getRecentActivity(),
          getSystemStatus(),
          getStatsHistory(),
          getPerformanceMetrics()
        ])

        if (statsData) setStats(statsData)
        if (reportsData) setRecentReports(reportsData)
        if (docsData) setRecentDocs(docsData)
        if (activityData) setActivities(activityData)
        if (statusData) setSystemStatus(statusData)
        if (historyData) setStatsHistory(historyData)
        if (metricsData) setPerformanceMetrics(metricsData)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  // Quick Actions Data
  const quickActions = [
    {
      icon: <FileTextOutlined style={{ fontSize: '48px', color: '#3b82f6' }} />,
      title: t('home.tools.apiExplorer.title'),
      description: 'Ejecutar consulta',
      path: '/reporter',
      color: '#3b82f6'
    },
    {
      icon: <FormOutlined style={{ fontSize: '48px', color: '#10b981' }} />,
      title: 'Crear eForm',
      description: 'Diseñar formulario',
      path: '/eforms',
      color: '#10b981'
    },
    {
      icon: <ThunderboltOutlined style={{ fontSize: '48px', color: '#f59e0b' }} />,
      title: 'Generar Documento',
      description: 'Con IA',
      path: '/document-generator',
      color: '#f59e0b'
    },
    {
      icon: <AppstoreOutlined style={{ fontSize: '48px', color: '#ec4899' }} />,
      title: 'Nueva Categoría',
      description: 'Category Builder',
      path: '/category-builder',
      color: '#ec4899'
    }
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="home-pro">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-background"></div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <p className="hero-subtitle">Therefore™ Administration Panel</p>

          <div className="hero-stats">
            <div className="hero-stat">
              <UserOutlined className="hero-stat-icon" style={{ color: '#60a5fa' }} />
              <div className="hero-stat-content">
                <div className="hero-stat-value">{stats.activeTenantsCount}</div>
                <div className="hero-stat-label">Tenants Activos</div>
              </div>
            </div>
            <div className="hero-stat">
              <AppstoreOutlined className="hero-stat-icon" style={{ color: '#fb923c' }} />
              <div className="hero-stat-content">
                <div className="hero-stat-value">{stats.categoriesCount}</div>
                <div className="hero-stat-label">{t('home.categories')}</div>
              </div>
            </div>
            <div className="hero-stat">
              <FormOutlined className="hero-stat-icon" style={{ color: '#34d399' }} />
              <div className="hero-stat-content">
                <div className="hero-stat-value">{stats.eformsCount}</div>
                <div className="hero-stat-label">{t('home.forms')}</div>
              </div>
            </div>
            <div className="hero-stat">
              <FileTextOutlined className="hero-stat-icon" style={{ color: '#a78bfa' }} />
              <div className="hero-stat-content">
                <div className="hero-stat-value">{stats.docsThisMonth}</div>
                <div className="hero-stat-label">Docs este mes</div>
              </div>
            </div>
            <div className="hero-stat">
              <ApiOutlined className="hero-stat-icon" style={{ color: '#f472b6' }} />
              <div className="hero-stat-content">
                <div className="hero-stat-value">3</div>
                <div className="hero-stat-label">Integraciones</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section">
        <h2 className="section-title">
          <ThunderboltOutlined style={{ color: '#f59e0b' }} />
          Acciones Rápidas
        </h2>
        <div className="quick-actions-grid">
          {quickActions.map((action, index) => (
            <div
              key={index}
              className="action-card"
              onClick={() => navigate(action.path)}
              style={{ '--hover-color': action.color }}
            >
              <div className="action-icon">{action.icon}</div>
              <div className="action-title">{action.title}</div>
              <div className="action-description">{action.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Dashboard Grid */}
      <Row gutter={[24, 24]}>

        {/* Recent Reports */}
        <Col xs={24} lg={12}>
          <Card className="dashboard-card">
            <div className="card-header">
              <div className="card-title">
                <FileTextOutlined style={{ color: '#3b82f6' }} />
                📊 Últimos Reports
                {recentReports.length > 0 && (
                  <Badge count={`${recentReports.length} recientes`} style={{ backgroundColor: '#10b981', marginLeft: '8px' }} />
                )}
              </div>
              <a className="card-action" onClick={() => navigate('/reporter')}>Ver todos →</a>
            </div>
            <div className="reports-list">
              {recentReports.length > 0 ? (
                recentReports.slice(0, 4).map((report, index) => (
                  <div
                    key={report.id || index}
                    className="report-item"
                    onClick={() => navigate('/reporter')}
                    title="Haz click para ir a Therefore Reporter"
                  >
                    <div className="report-info">
                      <div className="report-name">{report.report_name || 'Sin nombre'}</div>
                      <div className="report-meta">
                        {report.tenant_name} • {formatTimeAgo((Date.now() - new Date(report.executed_at)) / 1000)}
                      </div>
                    </div>
                    <Badge
                      count={`${report.result_count} docs`}
                      style={{ backgroundColor: report.status === 'success' ? '#3b82f6' : '#f59e0b' }}
                    />
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', opacity: 0.5 }}>
                  No hay reports ejecutados aún
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* Recent Documents */}
        <Col xs={24} lg={12}>
          <Card className="dashboard-card">
            <div className="card-header">
              <div className="card-title">
                <FileTextOutlined style={{ color: '#10b981' }} />
                📄 Documentos Generados
              </div>
              <a className="card-action" onClick={() => navigate('/document-generator')}>Ver todos →</a>
            </div>
            <div className="documents-list">
              {recentDocs.length > 0 ? (
                recentDocs.slice(0, 4).map((doc, index) => (
                  <div
                    key={doc.id || index}
                    className="doc-item"
                    onClick={() => navigate('/document-generator')}
                    title="Haz click para ir a Document Generator"
                  >
                    <div className="doc-icon">{documentTypeIcons[doc.document_type] || '📄'}</div>
                    <div className="doc-info">
                      <div className="doc-name">{doc.title}</div>
                      <div className="doc-meta">
                        {formatTimeAgo((Date.now() - new Date(doc.generated_at)) / 1000)} • {doc.pages} páginas
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', opacity: 0.5 }}>
                  No hay documentos generados aún
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* System Status */}
        <Col xs={24} lg={12}>
          <Card className="dashboard-card">
            <div className="card-header">
              <div className="card-title">
                <DatabaseOutlined style={{ color: '#ec4899' }} />
                🔧 Estado del Sistema
              </div>
              <a className="card-action">Detalles →</a>
            </div>
            <div className="status-grid">
              {systemStatus.length > 0 ? (
                systemStatus.map((item, index) => (
                  <div key={index} className="status-item">
                    <div className="status-label">{item.label}</div>
                    <div className="status-value">
                      <span className={`status-dot status-${item.status}`}></span>
                      {item.value}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', opacity: 0.5, gridColumn: '1 / -1' }}>
                  Cargando estado del sistema...
                </div>
              )}
            </div>

            {/* Performance Metrics */}
            {performanceMetrics && (
              <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-canvas)', borderRadius: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  📊 Métricas de Performance
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '12px' }}>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Tiempo Promedio</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {performanceMetrics.avgExecutionTime}ms
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Docs Procesados</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {performanceMetrics.totalDocsProcessed.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Activity Chart */}
            {statsHistory.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  📈 Actividad (últimos 7 días)
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={statsHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                    <XAxis
                      dataKey="date"
                      stroke="var(--text-secondary)"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(date) => new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    />
                    <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      labelFormatter={(date) => new Date(date).toLocaleDateString('es-ES')}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="reports" stroke="#3b82f6" name="Reportes" strokeWidth={2} />
                    <Line type="monotone" dataKey="documents" stroke="#10b981" name="Documentos" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>

        {/* Recent Activity & Top Users */}
        <Col xs={24} lg={12}>
          <Card className="dashboard-card">
            <div className="card-header">
              <div className="card-title">
                <ClockCircleOutlined style={{ color: '#f59e0b' }} />
                ⚡ Actividad Reciente
                <Badge dot status="processing" style={{ marginLeft: '8px' }} />
              </div>
              <a className="card-action">Ver todo →</a>
            </div>
            <div className="activity-list">
              {activities.length > 0 ? (
                activities.slice(0, 4).map((activity, index) => {
                  const iconMap = {
                    report_executed: '📊',
                    eform_created: '📝',
                    eform_updated: '✏️',
                    category_created: '🗂️',
                    document_generated: '📄'
                  }
                  return (
                    <div key={activity.id || index} className="activity-item">
                      <div className="activity-icon">{iconMap[activity.action_type] || '⚡'}</div>
                      <div className="activity-content">
                        <div className="activity-text">
                          <strong>{activity.user_name}</strong> {activity.action_description}
                        </div>
                        <div className="activity-time">
                          {formatTimeAgo((Date.now() - new Date(activity.created_at)) / 1000)}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', opacity: 0.5 }}>
                  No hay actividad reciente
                </div>
              )}
            </div>

            {/* Top Users Chart */}
            {performanceMetrics?.topUsers && performanceMetrics.topUsers.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  👥 Usuarios Más Activos (últimos 7 días)
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={performanceMetrics.topUsers} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                    <XAxis type="number" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="var(--text-secondary)"
                      tick={{ fontSize: 11 }}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="count" fill="#f59e0b" name="Acciones" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>

      </Row>
    </div>
  )
}
