import { useState, useEffect } from 'react'
import { Spin } from 'antd'
import {
  FormOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
  KeyOutlined,
  RightOutlined
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
import '../styles/home.css'

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

        // Save user data (nombre del perfil si existe)
        if (authUser) {
          let profileName = null
          try {
            const { data: profile } = await supabase.from('profiles').select('name').eq('user_id', authUser.id).single()
            profileName = profile?.name || null
          } catch {
            // sin perfil: se usa el email
          }
          setUser({ ...authUser, profileName })
        }

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

  // Nombre para el saludo: el del perfil; si no, la parte local del email
  const emailName = user?.email?.split('@')[0] || ''
  const displayName = user?.profileName
    || (emailName.length <= 3 ? emailName.toUpperCase() : emailName.charAt(0).toUpperCase() + emailName.slice(1))
    || 'Usuario'

  const quickActions = [
    { icon: <ThunderboltOutlined />, label: 'Generar un documento', hint: 'De un briefing a un Word', path: '/document-generator' },
    { icon: <KeyOutlined />, label: 'Preparar una cotización', hint: 'Configurador de licencias', path: '/license-configurator' },
    { icon: <FileTextOutlined />, label: 'Ejecutar un informe', hint: 'Consultas a una instancia', path: '/reporter' },
    { icon: <FormOutlined />, label: 'Crear un eForm', hint: 'Constructor de eForms', path: '/eforms' },
    { icon: <AppstoreOutlined />, label: 'Crear una categoría', hint: 'Constructor de categorías', path: '/category-builder' }
  ]

  const statsLine = [
    `${stats.activeTenantsCount} ${stats.activeTenantsCount === 1 ? 'instancia activa' : 'instancias activas'}`,
    `${stats.categoriesCount} ${stats.categoriesCount === 1 ? 'categoría' : 'categorías'}`,
    `${stats.eformsCount} ${stats.eformsCount === 1 ? 'formulario' : 'formularios'}`,
    `${stats.docsThisMonth} ${stats.docsThisMonth === 1 ? 'documento' : 'documentos'} este mes`
  ].join(' · ')

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="home">
      <div className="header-main">
        <div>
          <h1 className="header-title">{getGreeting()}, {displayName}</h1>
          <p className="header-subtitle">{getFormattedDate()} · {statsLine}</p>
        </div>
      </div>

      <div className="home-grid">
        <section className="home-section" aria-labelledby="home-start">
          <h2 id="home-start" className="home-section-title">Empezar</h2>
          <ul className="home-actions">
            {quickActions.map(action => (
              <li key={action.path}>
                <button type="button" className="home-action" onClick={() => navigate(action.path)}>
                  <span className="home-action-icon" aria-hidden="true">{action.icon}</span>
                  <span className="cell-stack" style={{ flex: 1, textAlign: 'left' }}>
                    <span className="cell-title">{action.label}</span>
                    <span className="cell-sub">{action.hint}</span>
                  </span>
                  <RightOutlined className="home-action-chevron" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="home-section" aria-labelledby="home-recent">
          <div className="home-section-head">
            <h2 id="home-recent" className="home-section-title">Documentos recientes</h2>
            <button type="button" className="btn-link" onClick={() => navigate('/document-generator')}>Ver todos</button>
          </div>
          {recentDocs.length > 0 ? (
            <ul className="row-list">
              {recentDocs.slice(0, 5).map((doc, index) => (
                <li key={doc.id || index} className="row-list-item">
                  <div className="cell-stack" style={{ flex: 1 }}>
                    <span className="cell-title">{doc.title}</span>
                    <span className="cell-sub">
                      {formatTimeAgo((Date.now() - new Date(doc.generated_at)) / 1000)}{doc.pages ? ` · ${doc.pages} páginas` : ''}
                    </span>
                  </div>
                  <span className="tag-neutral-inline">{(doc.file_type || 'DOCX').toUpperCase()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="home-empty">Aún no has generado documentos. Empieza con «Generar un documento».</p>
          )}

          <div className="home-section-head" style={{ marginTop: 24 }}>
            <h2 className="home-section-title">Informes recientes</h2>
            <button type="button" className="btn-link" onClick={() => navigate('/reporter')}>Ver todos</button>
          </div>
          {recentReports.length > 0 ? (
            <ul className="row-list">
              {recentReports.slice(0, 5).map((report, index) => (
                <li key={report.id || index} className="row-list-item">
                  <div className="cell-stack" style={{ flex: 1 }}>
                    <span className="cell-title">{report.report_name || 'Sin nombre'}</span>
                    <span className="cell-sub">
                      {report.tenant_name} · {formatTimeAgo((Date.now() - new Date(report.executed_at)) / 1000)}
                    </span>
                  </div>
                  <span className="cell-muted row-list-meta">{report.result_count || 0} resultados</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="home-empty">Aún no has ejecutado informes.</p>
          )}
        </section>
      </div>

      {statsHistory.length > 0 && (
        <section className="home-section" style={{ marginTop: 24 }} aria-labelledby="home-activity">
          <h2 id="home-activity" className="home-section-title">Actividad de los últimos 7 días</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={statsHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="var(--text-muted)"
                tick={{ fontSize: 12 }}
                tickFormatter={(date) => new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
              />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} allowDecimals={false} />
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
              <Line type="monotone" dataKey="documents" stroke="var(--accent-primary)" name="Documentos" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="reports" stroke="var(--text-muted)" name="Informes" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}
    </div>
  )
}
