import { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Button, List, Avatar, Tag, Space } from 'antd'
import {
  FormOutlined,
  FileTextOutlined,
  CloudOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
  ArrowUpOutlined,
  DatabaseOutlined,
  FileAddOutlined,
  BarChartOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  getDashboardStats,
  getRecentActivity,
  getStatsHistory
} from '../services/dashboardService'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import '../styles/home-modern.css'

export default function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    activeTenantsCount: 0,
    categoriesCount: 0,
    eformsCount: 0,
    docsThisMonth: 0
  })
  const [activities, setActivities] = useState([])
  const [statsHistory, setStatsHistory] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [statsData, activitiesData, historyData] = await Promise.all([
        getDashboardStats(),
        getRecentActivity(),
        getStatsHistory()
      ])
      setStats(statsData)
      setActivities(activitiesData.slice(0, 5))
      setStatsHistory(historyData)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  // Extract user first name
  const userName = user?.email?.split('@')[0] || 'Usuario'
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1)

  // Quick actions
  const quickActions = [
    {
      icon: <FormOutlined style={{ fontSize: '24px' }} />,
      title: t('home.tools.eformBuilder.title'),
      color: '#10b981',
      path: '/eforms'
    },
    {
      icon: <ThunderboltOutlined style={{ fontSize: '24px' }} />,
      title: t('home.tools.documentGenerator.title'),
      color: '#f59e0b',
      path: '/document-generator'
    },
    {
      icon: <BarChartOutlined style={{ fontSize: '24px' }} />,
      title: t('home.tools.thereforeReporter.title'),
      color: '#3b82f6',
      path: '/reporter'
    },
    {
      icon: <AppstoreOutlined style={{ fontSize: '24px' }} />,
      title: t('home.tools.categoryBuilder.title'),
      color: '#ec4899',
      path: '/category-builder'
    }
  ]

  return (
    <div className="home-modern">
      {/* Welcome Header */}
      <div className="welcome-header">
        <div>
          <h1 className="welcome-title">👋 ¡Hola, {displayName}!</h1>
          <p className="welcome-subtitle">Bienvenido de vuelta a TheJToolbox</p>
        </div>
        <Button
          type="primary"
          icon={<SettingOutlined />}
          onClick={() => navigate('/configuracion')}
          className="config-button"
        >
          Configuración
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <Row gutter={[16, 16]} className="kpi-grid">
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card kpi-purple" loading={loading}>
            <div className="kpi-content">
              <div className="kpi-header">
                <CloudOutlined className="kpi-icon" />
                <Tag color="purple">ACTIVOS</Tag>
              </div>
              <Statistic
                value={stats.activeTenantsCount}
                valueStyle={{ color: '#fff', fontSize: '36px', fontWeight: 'bold' }}
              />
              <p className="kpi-label">Tenants</p>
              <div className="kpi-chart">
                <ResponsiveContainer width="100%" height={40}>
                  <LineChart data={statsHistory}>
                    <Line
                      type="monotone"
                      dataKey="tenants"
                      stroke="#fff"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card kpi-green" loading={loading}>
            <div className="kpi-content">
              <div className="kpi-header">
                <FormOutlined className="kpi-icon" />
                <Tag color="green">TOTALES</Tag>
              </div>
              <Statistic
                value={stats.eformsCount}
                valueStyle={{ color: '#fff', fontSize: '36px', fontWeight: 'bold' }}
              />
              <p className="kpi-label">eForms</p>
              <div className="kpi-chart">
                <ResponsiveContainer width="100%" height={40}>
                  <LineChart data={statsHistory}>
                    <Line
                      type="monotone"
                      dataKey="eforms"
                      stroke="#fff"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card kpi-blue" loading={loading}>
            <div className="kpi-content">
              <div className="kpi-header">
                <DatabaseOutlined className="kpi-icon" />
                <Tag color="blue">TOTALES</Tag>
              </div>
              <Statistic
                value={stats.categoriesCount}
                valueStyle={{ color: '#fff', fontSize: '36px', fontWeight: 'bold' }}
              />
              <p className="kpi-label">Categorías</p>
              <div className="kpi-chart">
                <ResponsiveContainer width="100%" height={40}>
                  <LineChart data={statsHistory}>
                    <Line
                      type="monotone"
                      dataKey="categories"
                      stroke="#fff"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card kpi-orange" loading={loading}>
            <div className="kpi-content">
              <div className="kpi-header">
                <FileTextOutlined className="kpi-icon" />
                <Tag color="orange">ESTE MES</Tag>
              </div>
              <Statistic
                value={stats.docsThisMonth}
                valueStyle={{ color: '#fff', fontSize: '36px', fontWeight: 'bold' }}
                prefix={<ArrowUpOutlined />}
              />
              <p className="kpi-label">Documentos</p>
              <div className="kpi-chart">
                <ResponsiveContainer width="100%" height={40}>
                  <LineChart data={statsHistory}>
                    <Line
                      type="monotone"
                      dataKey="documents"
                      stroke="#fff"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card className="quick-actions-card" title="⚡ Acciones Rápidas">
        <Row gutter={[16, 16]}>
          {quickActions.map((action, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Button
                className="quick-action-btn"
                style={{
                  borderColor: action.color,
                  '--action-color': action.color
                }}
                onClick={() => navigate(action.path)}
                block
                size="large"
              >
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <div style={{ color: action.color }}>{action.icon}</div>
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>{action.title}</span>
                </Space>
              </Button>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Recent Activity */}
      <Card
        className="activity-card"
        title="📋 Actividad Reciente"
        extra={
          <Button type="link" onClick={() => navigate('/activity')}>
            Ver todo
          </Button>
        }
      >
        <List
          dataSource={activities}
          loading={loading}
          locale={{ emptyText: 'No hay actividad reciente' }}
          renderItem={(item) => (
            <List.Item className="activity-item">
              <List.Item.Meta
                avatar={
                  <Avatar
                    style={{
                      backgroundColor: item.color || '#1890ff',
                      fontSize: '18px'
                    }}
                    icon={item.icon}
                  >
                    {item.icon ? null : item.type?.charAt(0).toUpperCase()}
                  </Avatar>
                }
                title={
                  <Space>
                    <span>{item.description}</span>
                    {item.badge && <Tag color={item.badgeColor}>{item.badge}</Tag>}
                  </Space>
                }
                description={item.timestamp}
              />
              {item.value && (
                <div className="activity-value">{item.value}</div>
              )}
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}
