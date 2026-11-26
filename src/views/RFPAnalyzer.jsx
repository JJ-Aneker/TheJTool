import { useState, useEffect } from 'react'
import {
  Upload, Spin, Button, Table, Select, Tag, Card, message, Modal,
  Row, Col, Statistic, Timeline, Dropdown, Space, Input, Badge, Empty
} from 'antd'
import {
  InboxOutlined, FileTextOutlined, CheckCircleOutlined,
  CloseCircleOutlined, ExclamationCircleOutlined, DownloadOutlined,
  FilterOutlined, SearchOutlined, MoreOutlined, FileWordOutlined,
  ClockCircleOutlined, CheckOutlined, SyncOutlined, InboxOutlined as ArchiveOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { supabase } from '../config/supabaseClient'
import axios from 'axios'
import '../styles/rfp-analyzer.css'

const { Dragger } = Upload
const { Option } = Select

// Mapeo de estados
const STATUS_CONFIG = {
  nueva: { label: 'Nueva', color: 'blue', icon: <InboxOutlined /> },
  analizada: { label: 'Analizada', color: 'orange', icon: <SyncOutlined /> },
  revisada: { label: 'Revisada', color: 'purple', icon: <CheckCircleOutlined /> },
  en_decision: { label: 'En decisión', color: 'cyan', icon: <ClockCircleOutlined /> },
  archivada: { label: 'Archivada', color: 'default', icon: <ArchiveOutlined /> }
}

const VIABILITY_CONFIG = {
  alta: { label: 'Alta', color: 'success', icon: <CheckCircleOutlined /> },
  media: { label: 'Media', color: 'warning', icon: <ExclamationCircleOutlined /> },
  baja: { label: 'Baja', color: 'error', icon: <CloseCircleOutlined /> }
}

export default function RFPAnalyzerV2() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [dashboardLoading, setDashboardLoading] = useState(false)

  // Dashboard stats
  const [stats, setStats] = useState(null)
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([])

  // RFPs
  const [rfps, setRfps] = useState([])
  const [currentRfp, setCurrentRfp] = useState(null)
  const [sections, setSections] = useState([])

  // Upload
  const [fileList, setFileList] = useState([])
  const [rfpName, setRfpName] = useState('')

  // Filtros
  const [filters, setFilters] = useState({
    viability: null,
    status: null,
    search: ''
  })

  useEffect(() => {
    if (!currentRfp) {
      loadDashboard()
      loadRfps()
    }
  }, [currentRfp])

  const loadDashboard = async () => {
    try {
      setDashboardLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        message.error('No estás autenticado')
        return
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'}/api/rfp-dashboard`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )

      setStats(response.data.stats)
      setUpcomingDeadlines(response.data.upcomingDeadlines)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setDashboardLoading(false)
    }
  }

  const loadRfps = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        message.error('No estás autenticado')
        return
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'}/api/analyze-rfp`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )

      setRfps(response.data)
    } catch (error) {
      console.error('Error loading RFPs:', error)
      message.error('Error al cargar las RFPs')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('Selecciona al menos un archivo')
      return
    }

    if (!rfpName.trim()) {
      message.warning('Ingresa un nombre para la RFP')
      return
    }

    try {
      setAnalyzing(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        message.error('No estás autenticado')
        return
      }

      const formData = new FormData()
      formData.append('name', rfpName)
      fileList.forEach(file => {
        formData.append('files', file)
      })

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'}/api/analyze-rfp`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )

      message.success('RFP analizada correctamente')

      // Limpiar form
      setFileList([])
      setRfpName('')

      // Recargar lista y abrir la nueva RFP
      await loadRfps()
      loadRfpDetails(response.data.rfp_id)

    } catch (error) {
      console.error('Error analyzing RFP:', error)
      message.error(error.response?.data?.error || 'Error al analizar la RFP')
    } finally {
      setAnalyzing(false)
    }
  }

  const loadRfpDetails = async (rfpId) => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'}/api/analyze-rfp/${rfpId}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )

      setCurrentRfp(response.data)
      setSections(response.data.sections || [])
    } catch (error) {
      console.error('Error loading RFP details:', error)
      message.error('Error al cargar los detalles de la RFP')
    } finally {
      setLoading(false)
    }
  }

  const updateRfpStatus = async (rfpId, status) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'}/api/rfp-status/${rfpId}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )

      message.success('Estado actualizado')

      if (currentRfp && currentRfp.id === rfpId) {
        setCurrentRfp({ ...currentRfp, status })
      }

      loadRfps()
      loadDashboard()
    } catch (error) {
      console.error('Error updating status:', error)
      message.error('Error al actualizar el estado')
    }
  }

  const updateSection = async (sectionId, field, value) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'}/api/rfp-sections/${sectionId}`,
        { [field]: value },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )

      setSections(sections.map(s =>
        s.id === sectionId ? { ...s, [field]: value } : s
      ))

      message.success('Sección actualizada')
    } catch (error) {
      console.error('Error updating section:', error)
      message.error('Error al actualizar la sección')
    }
  }

  const generateDocument = async (rfpId, type) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const endpoint = type === 'viability'
        ? `/api/rfp-generate-viability/${rfpId}`
        : `/api/rfp-generate-tasks/${rfpId}`

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'}${endpoint}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          },
          responseType: 'blob'
        }
      )

      // Descargar archivo
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = type === 'viability'
        ? `Informe_Viabilidad_${currentRfp.name}.docx`
        : `Plan_Reparto_Tareas_${currentRfp.name}.docx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      message.success('Documento generado y descargado')
    } catch (error) {
      console.error('Error generating document:', error)
      message.error('Error al generar el documento')
    }
  }

  const uploadProps = {
    accept: '.pdf,.docx',
    fileList,
    beforeUpload: (file) => {
      const isPdfOrDocx = file.type === 'application/pdf' ||
                          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

      if (!isPdfOrDocx) {
        message.error('Solo se permiten archivos PDF o DOCX')
        return false
      }

      const isLt25M = file.size / 1024 / 1024 < 25
      if (!isLt25M) {
        message.error('El archivo debe ser menor a 25MB')
        return false
      }

      setFileList([...fileList, file])
      return false
    },
    onRemove: (file) => {
      setFileList(fileList.filter(f => f.uid !== file.uid))
    }
  }

  // Filtrar RFPs
  const filteredRfps = rfps.filter(rfp => {
    if (filters.viability && rfp.viability !== filters.viability) return false
    if (filters.status && rfp.status !== filters.status) return false
    if (filters.search && !rfp.name.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  const sectionsColumns = [
    {
      title: 'Sección',
      dataIndex: 'section_name',
      key: 'section_name',
      width: '30%'
    },
    {
      title: 'Área',
      dataIndex: 'area',
      key: 'area',
      width: '20%',
      render: (area, record) => (
        <Select
          value={area}
          onChange={(value) => updateSection(record.id, 'area', value)}
          style={{ width: '100%' }}
          size="small"
        >
          <Option value="Comercial">Comercial</Option>
          <Option value="Técnica">Técnica</Option>
          <Option value="Legal">Legal</Option>
          <Option value="Marketing">Marketing</Option>
          <Option value="Seguridad IT / GDPR">Seguridad IT / GDPR</Option>
          <Option value="Medio Ambiente">Medio Ambiente</Option>
          <Option value="Operaciones">Operaciones</Option>
          <Option value="Otra">Otra</Option>
        </Select>
      )
    },
    {
      title: 'Prioridad',
      dataIndex: 'priority',
      key: 'priority',
      width: '15%',
      render: (priority, record) => (
        <Select
          value={priority}
          onChange={(value) => updateSection(record.id, 'priority', value)}
          style={{ width: '100%' }}
          size="small"
        >
          <Option value="critical">Crítica</Option>
          <Option value="optional">Opcional</Option>
        </Select>
      )
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      width: '20%',
      render: (status, record) => (
        <Select
          value={status}
          onChange={(value) => updateSection(record.id, 'status', value)}
          style={{ width: '100%' }}
          size="small"
        >
          <Option value="pending">Pendiente</Option>
          <Option value="in_progress">En curso</Option>
          <Option value="completed">Completado</Option>
        </Select>
      )
    }
  ]

  // Vista de detalle de RFP
  if (currentRfp) {
    const statusConfig = STATUS_CONFIG[currentRfp.status] || STATUS_CONFIG.nueva

    return (
      <div className="rfp-analyzer">
        <div className="rfp-header">
          <div>
            <Button onClick={() => setCurrentRfp(null)} style={{ marginBottom: '8px' }}>
              ← Volver a lista
            </Button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h1 style={{ margin: 0 }}>{currentRfp.name}</h1>
              <Tag icon={statusConfig.icon} color={statusConfig.color}>
                {statusConfig.label}
              </Tag>
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              Creado el {new Date(currentRfp.created_at).toLocaleDateString('es-ES')}
            </p>
          </div>
          <Space>
            <Dropdown
              menu={{
                items: Object.keys(STATUS_CONFIG).map(key => ({
                  key,
                  icon: STATUS_CONFIG[key].icon,
                  label: STATUS_CONFIG[key].label,
                  onClick: () => updateRfpStatus(currentRfp.id, key)
                }))
              }}
            >
              <Button>Cambiar estado</Button>
            </Dropdown>
            <Button
              icon={<FileWordOutlined />}
              onClick={() => generateDocument(currentRfp.id, 'viability')}
            >
              Informe de Viabilidad
            </Button>
            <Button
              icon={<FileWordOutlined />}
              onClick={() => generateDocument(currentRfp.id, 'tasks')}
            >
              Plan de Tareas
            </Button>
          </Space>
        </div>

        <div className="rfp-content">
          {/* Viabilidad Card */}
          <Card
            className={`viability-card viability-${currentRfp.viability}`}
            style={{ marginBottom: '24px' }}
          >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
              <div style={{ fontSize: '32px' }}>
                {VIABILITY_CONFIG[currentRfp.viability]?.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h3>Viabilidad: {currentRfp.viability?.toUpperCase()}</h3>
                <p>{currentRfp.viability_reason}</p>
              </div>
            </div>
          </Card>

          {/* Plazos y Riesgos */}
          <Row gutter={24} style={{ marginBottom: '24px' }}>
            {currentRfp.deadlines && (
              <Col span={12}>
                <Card title="📅 Plazos Críticos">
                  {currentRfp.deadlines.deadline && (
                    <p><strong>Deadline:</strong> {currentRfp.deadlines.deadline}</p>
                  )}
                  {currentRfp.deadlines.milestones?.map((m, i) => (
                    <p key={i}><strong>{m.date}:</strong> {m.description}</p>
                  ))}
                </Card>
              </Col>
            )}

            {currentRfp.risks && currentRfp.risks.length > 0 && (
              <Col span={12}>
                <Card title="🚨 Riesgos Principales">
                  {currentRfp.risks.slice(0, 3).map((risk, i) => (
                    <div key={i} style={{ marginBottom: '8px' }}>
                      <Tag color={risk.severity === 'high' ? 'error' : risk.severity === 'medium' ? 'warning' : 'default'}>
                        {risk.severity}
                      </Tag>
                      <span>{risk.risk}</span>
                    </div>
                  ))}
                </Card>
              </Col>
            )}
          </Row>

          {/* Requisitos Técnicos */}
          {currentRfp.technical_requirements && currentRfp.technical_requirements.length > 0 && (
            <Card title="🔧 Requisitos Técnicos" style={{ marginBottom: '24px' }}>
              <ul style={{ marginLeft: '20px' }}>
                {currentRfp.technical_requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Secciones */}
          <Card title="📋 Secciones de Trabajo">
            <Table
              columns={sectionsColumns}
              dataSource={sections}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </div>
      </div>
    )
  }

  // Vista principal con dashboard
  return (
    <div className="rfp-analyzer">
      <div className="rfp-header">
        <div>
          <h1>RFP Analyzer</h1>
          <p>Análisis automático de RFPs con IA para decisión go/no-go</p>
        </div>
      </div>

      {/* Dashboard */}
      <Spin spinning={dashboardLoading}>
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total RFPs"
                value={stats?.total_rfps || 0}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Viabilidad Alta"
                value={stats?.viability_alta || 0}
                valueStyle={{ color: '#10b981' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Viabilidad Media"
                value={stats?.viability_media || 0}
                valueStyle={{ color: '#f59e0b' }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Viabilidad Baja"
                value={stats?.viability_baja || 0}
                valueStyle={{ color: '#ef4444' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Próximos Deadlines */}
        {upcomingDeadlines.length > 0 && (
          <Card title="⏰ Próximos Deadlines (30 días)" style={{ marginBottom: '24px' }}>
            <Timeline
              items={upcomingDeadlines.map(item => ({
                color: item.daysUntil <= 7 ? 'red' : item.daysUntil <= 15 ? 'orange' : 'blue',
                children: (
                  <div>
                    <strong>{item.name}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {item.deadline} ({item.daysUntil} días)
                    </div>
                  </div>
                )
              }))}
            />
          </Card>
        )}
      </Spin>

      {/* Upload */}
      <Card title="Nueva RFP" style={{ marginBottom: '24px' }}>
        <Input
          placeholder="Nombre de la RFP (ej: VWFS - Facturación Electrónica)"
          value={rfpName}
          onChange={(e) => setRfpName(e.target.value)}
          style={{ marginBottom: '16px' }}
        />

        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click o arrastra archivos aquí</p>
          <p className="ant-upload-hint">
            Soporta PDF y DOCX (máx 25MB por archivo)
          </p>
        </Dragger>

        <Button
          type="primary"
          onClick={handleUpload}
          loading={analyzing}
          disabled={fileList.length === 0 || !rfpName.trim()}
          style={{ marginTop: '16px', width: '100%' }}
        >
          {analyzing ? 'Analizando con IA...' : 'Analizar RFP'}
        </Button>
      </Card>

      {/* Filtros */}
      <Card title="📋 RFPs Analizadas" style={{ marginBottom: '24px' }}>
        <Space style={{ marginBottom: '16px', width: '100%' }} wrap>
          <Input
            placeholder="Buscar por nombre..."
            prefix={<SearchOutlined />}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ width: 200 }}
          />
          <Select
            placeholder="Filtrar por viabilidad"
            allowClear
            onChange={(value) => setFilters({ ...filters, viability: value })}
            style={{ width: 180 }}
          >
            <Option value="alta">Alta</Option>
            <Option value="media">Media</Option>
            <Option value="baja">Baja</Option>
          </Select>
          <Select
            placeholder="Filtrar por estado"
            allowClear
            onChange={(value) => setFilters({ ...filters, status: value })}
            style={{ width: 180 }}
          >
            {Object.keys(STATUS_CONFIG).map(key => (
              <Option key={key} value={key}>{STATUS_CONFIG[key].label}</Option>
            ))}
          </Select>
        </Space>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin />
          </div>
        ) : filteredRfps.length === 0 ? (
          <Empty description="No hay RFPs que coincidan con los filtros" />
        ) : (
          <div className="rfp-list">
            {filteredRfps.map(rfp => {
              const statusConfig = STATUS_CONFIG[rfp.status] || STATUS_CONFIG.nueva
              const viabilityConfig = VIABILITY_CONFIG[rfp.viability]

              return (
                <div
                  key={rfp.id}
                  className="rfp-list-item"
                  onClick={() => loadRfpDetails(rfp.id)}
                >
                  <FileTextOutlined style={{ fontSize: '20px', color: 'var(--accent-primary)' }} />
                  <div className="rfp-list-info">
                    <div className="rfp-list-name">{rfp.name}</div>
                    <div className="rfp-list-date">
                      {new Date(rfp.created_at).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                  <Space>
                    <Tag icon={statusConfig.icon} color={statusConfig.color}>
                      {statusConfig.label}
                    </Tag>
                    <Tag icon={viabilityConfig?.icon} color={viabilityConfig?.color}>
                      {rfp.viability?.toUpperCase() || 'N/A'}
                    </Tag>
                  </Space>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
