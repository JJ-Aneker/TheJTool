import { useState, useEffect } from 'react'
import { Row, Col, Card, Spin } from 'antd'
import {
  FormOutlined,
  FileTextOutlined,
  CloudOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
  UserOutlined,
  DatabaseOutlined,
  ApiOutlined,
  BellOutlined,
  CheckCircleOutlined
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
  formatTimeAgo
} from '../services/dashboardService'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import '../styles/home-compact.css'

// Helper: saludo dinámico según hora
const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

// Helper: fecha formateada
const getFormattedDate = () => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const now = new Date()
  return `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`
}

export default function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // State for real data
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
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
        const { data: { user: authUser } } = await supabase.auth.getUser()
        const userId = authUser?.id

        // Save user data
        if (authUser) setUser(authUser)

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

  // Extract user name
  const userName = user?.email?.split('@')[0] || 'Usuario'
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1)

  // Quick Actions Data (chips format)
  const quickActions = [
    {
      icon: <FileTextOutlined />,
      label: 'Ejecutar Consulta',
      path: '/reporter',
      primary: true,
      color: '#3b82f6'
    },
    {
      icon: <FormOutlined />,
      label: 'Crear eForm',
      path: '/eforms',
      primary: false,
      color: '#10b981'
    },
    {
      icon: <ThunderboltOutlined />,
      label: 'Generar Documento',
      path: '/document-generator',
      primary: false,
      color: '#f59e0b'
    },
    {
      icon: <AppstoreOutlined />,
      label: 'Nueva Categoría',
      path: '/category-builder',
      primary: false,
      color: '#ec4899'
    }
  ]

  // Helper: badge color based on count
  const getBadgeColor = (count) => {
    if (count > 200) return '#3b82f6'
    if (count < 100) return '#10b981'
    return '#f59e0b'
  }

  // Helper: file type badge color
  const getFileTypeBadgeColor = (type) => {
    if (type === 'PDF' || type === 'pdf') return '#3b82f6'
    if (type === 'XLS' || type === 'xlsx') return '#10b981'
    return '#f59e0b'
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="home-compact">
      {/* CAMBIO 1: Hero zone compacta con KPIs integrados */}
      <div className="hero-band">
        <div className="hero-band-top">
          <div className="hero-band-left">
            <div className="hero-greeting">{getGreeting()}, {displayName}</div>
            <div className="hero-subtitle">
              {getFormattedDate()} · buildingcenter.thereforeonline.com
            </div>
          </div>
          <div className="hero-band-right">
            <div className="system-status-badge">
              <CheckCircleOutlined style={{ color: '#10b981', fontSize: '14px' }} />
              <span>Sistema operativo</span>
            </div>
            <div className="notifications-icon">
              <BellOutlined style={{ fontSize: '16px' }} />
            </div>
          </div>
        </div>

        <div className="kpi-cards-row">
          <div className="kpi-card-compact">
            <UserOutlined className="kpi-icon" style={{ color: '#60a5fa' }} />
            <div className="kpi-label">Tenants Activos</div>
            <div className="kpi-value">{stats.activeTenantsCount}</div>
            <div className="kpi-delta">—</div>
          </div>
          <div className="kpi-card-compact">
            <AppstoreOutlined className="kpi-icon" style={{ color: '#fb923c' }} />
            <div className="kpi-label">Categorías</div>
            <div className="kpi-value">{stats.categoriesCount}</div>
            <div className="kpi-delta">—</div>
          </div>
          <div className="kpi-card-compact">
            <FormOutlined className="kpi-icon" style={{ color: '#34d399' }} />
            <div className="kpi-label">Formularios</div>
            <div className="kpi-value">{stats.eformsCount}</div>
            <div className="kpi-delta">—</div>
          </div>
          <div className="kpi-card-compact">
            <FileTextOutlined className="kpi-icon" style={{ color: '#a78bfa' }} />
            <div className="kpi-label">Docs este mes</div>
            <div className="kpi-value">{stats.docsThisMonth}</div>
            <div className="kpi-delta">—</div>
          </div>
          <div className="kpi-card-compact">
            <ApiOutlined className="kpi-icon" style={{ color: '#f472b6' }} />
            <div className="kpi-label">Integraciones</div>
            <div className="kpi-value">3</div>
            <div className="kpi-delta">—</div>
          </div>
        </div>
      </div>

      {/* CAMBIO 2: Acciones rápidas como chips/pills horizontales */}
      <div className="quick-actions-chips">
        {quickActions.map((action, index) => (
          <div
            key={index}
            className={action.primary ? 'action-chip action-chip-primary' : 'action-chip action-chip-secondary'}
            onClick={() => navigate(action.path)}
          >
            <span className="action-chip-icon" style={{ color: action.color }}>
              {action.icon}
            </span>
            <span>{action.label}</span>
          </div>
        ))}
      </div>

      {/* CAMBIO 3: Listas de reports y documentos como filas densas tipo tabla */}
      <Row gutter={[16, 16]}>
        {/* Recent Reports - Dense Table Style */}
        <Col xs={24} lg={12}>
          <div className="table-card">
            <div className="table-card-header">
              <div className="table-card-title">ÚLTIMOS REPORTS</div>
              <a className="table-card-link" onClick={() => navigate('/reporter')}>Ver todos →</a>
            </div>
            <div className="table-card-body">
              {recentReports.length > 0 ? (
                recentReports.slice(0, 5).map((report, index) => (
                  <div
                    key={report.id || index}
                    className="table-row"
                    onClick={() => navigate('/reporter')}
                  >
                    <div className="table-row-left">
                      <div className="table-row-name">{report.report_name || 'Sin nombre'}</div>
                      <div className="table-row-meta">
                        {report.tenant_name} · {formatTimeAgo((Date.now() - new Date(report.executed_at)) / 1000)}
                      </div>
                    </div>
                    <div className="table-row-right">
                      <div
                        className="table-badge"
                        style={{ backgroundColor: getBadgeColor(report.result_count || 0) }}
                      >
                        {report.result_count || 0}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="table-empty">No hay reports ejecutados aún</div>
              )}
            </div>
          </div>
        </Col>

        {/* Recent Documents - Dense Table Style */}
        <Col xs={24} lg={12}>
          <div className="table-card">
            <div className="table-card-header">
              <div className="table-card-title">DOCUMENTOS GENERADOS</div>
              <a className="table-card-link" onClick={() => navigate('/document-generator')}>Ver todos →</a>
            </div>
            <div className="table-card-body">
              {recentDocs.length > 0 ? (
                recentDocs.slice(0, 5).map((doc, index) => (
                  <div
                    key={doc.id || index}
                    className="table-row"
                    onClick={() => navigate('/document-generator')}
                  >
                    <div className="table-row-left">
                      <div className="table-row-name">{doc.title}</div>
                      <div className="table-row-meta">
                        {formatTimeAgo((Date.now() - new Date(doc.generated_at)) / 1000)} · {doc.pages} páginas
                      </div>
                    </div>
                    <div className="table-row-right">
                      <div
                        className="table-badge"
                        style={{ backgroundColor: getFileTypeBadgeColor(doc.file_type || 'PDF') }}
                      >
                        {(doc.file_type || 'PDF').toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="table-empty">No hay documentos generados aún</div>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* CAMBIO 4: Estado del sistema como strip de una sola línea */}
      <div className="system-status-strip">
        <div className="system-status-left">
          <div className="status-dot-item">
            <span className="status-dot status-dot-online"></span>
            <span className="status-label">Therefore Tenants</span>
          </div>
          <div className="status-dot-item">
            <span className="status-dot status-dot-online"></span>
            <span className="status-label">Database</span>
          </div>
          <div className="status-dot-item">
            <span className="status-dot status-dot-online"></span>
            <span className="status-label">Storage</span>
          </div>
          <div className="status-dot-item">
            <span className="status-dot status-dot-online"></span>
            <span className="status-label">AWS Bedrock</span>
          </div>
        </div>
        <div className="system-status-right">
          {performanceMetrics && (
            <>
              <span className="metric-inline">
                <span className="metric-value">{performanceMetrics.avgExecutionTime}ms</span> avg
              </span>
              <span className="metric-inline">
                <span className="metric-value">{performanceMetrics.totalDocsProcessed.toLocaleString()}</span> docs procesados
              </span>
            </>
          )}
          <a className="table-card-link">Detalles →</a>
        </div>
      </div>

      {/* Gráfico de actividad movido al final como sección independiente */}
      {statsHistory.length > 0 && (
        <div className="activity-chart-section">
          <div className="table-card-header" style={{ marginBottom: '16px' }}>
            <div className="table-card-title">ACTIVIDAD (ÚLTIMOS 7 DÍAS)</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={statsHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
              <XAxis
                dataKey="date"
                stroke="var(--color-text-secondary)"
                tick={{ fontSize: 11 }}
                tickFormatter={(date) => new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
              />
              <YAxis stroke="var(--color-text-secondary)" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-background-primary)',
                  border: '1px solid var(--color-border-tertiary)',
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
    </div>
  )
}
