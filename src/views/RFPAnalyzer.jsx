// src/views/RFPAnalyzer.jsx
// Análisis automático de RFPs con IA para decisión go/no-go
import { useState, useEffect } from 'react'
import { Upload, Card, Tag, Button, Timeline, Select, Input, Table, Spin, Dropdown, message as antdMessage, Empty, Progress, Tabs } from 'antd'
import {
  InboxOutlined, FileTextOutlined, DownloadOutlined, CheckCircleOutlined,
  ClockCircleOutlined, ExclamationCircleOutlined, FilterOutlined,
  SearchOutlined, PlusOutlined, ArrowLeftOutlined, FileWordOutlined,
  FilePdfOutlined, LoadingOutlined, DeleteOutlined, TrophyOutlined,
  FileSearchOutlined, WarningOutlined, BellOutlined
} from '@ant-design/icons'
import { supabase } from '../config/supabaseClient'
import { message } from '../utils/message'
import axios from 'axios'
import RFPTags from '../components/RFPTags'
import RFPScoring from '../components/RFPScoring'
import RFPRequirements from '../components/RFPRequirements'
import RFPRiskAnalysis from '../components/RFPRiskAnalysis'
import '../styles/rfp-analyzer.css'

const { Dragger } = Upload
const { Search } = Input

const STATUS_CONFIG = {
  nueva: { label: 'Nueva', color: 'blue', icon: <FileTextOutlined /> },
  analizada: { label: 'Analizada', color: 'green', icon: <CheckCircleOutlined /> },
  revisada: { label: 'Revisada', color: 'purple', icon: <CheckCircleOutlined /> },
  en_decision: { label: 'En decisión', color: 'orange', icon: <ClockCircleOutlined /> },
  archivada: { label: 'Archivada', color: 'default', icon: <ExclamationCircleOutlined /> }
}

const VIABILITY_CONFIG = {
  alta: { label: 'Alta', color: '#10b981', icon: '✓' },
  media: { label: 'Media', color: '#f59e0b', icon: '~' },
  baja: { label: 'Baja', color: '#ef4444', icon: '✗' }
}

export default function RFPAnalyzer() {
  const [rfps, setRfps] = useState([])
  const [currentRfp, setCurrentRfp] = useState(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [dashboardStats, setDashboardStats] = useState(null)
  const [fileList, setFileList] = useState([])
  const [rfpName, setRfpName] = useState('')
  const [filters, setFilters] = useState({ viability: null, status: null, search: '' })

  useEffect(() => {
    loadRfps()
    loadDashboard()
  }, [])

  const loadRfps = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        message.error('No estás autenticado')
        return
      }

      const response = await axios.get(
        '/api/analyze-rfp',
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

  const loadDashboard = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await axios.get(
        '/api/rfp-dashboard',
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )
      setDashboardStats(response.data)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    }
  }

  const handleAnalyze = async () => {
    if (!rfpName.trim()) {
      message.error('Escribe un nombre para esta RFP')
      return
    }

    if (fileList.length === 0) {
      message.error('Sube al menos un archivo PDF o DOCX')
      return
    }

    try {
      setAnalyzing(true)
      setAnalysisProgress(0)
      const { data: { session } } = await supabase.auth.getSession()

      const formData = new FormData()
      formData.append('name', rfpName)
      fileList.forEach(file => formData.append('files', file))

      // Simular progreso
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 15
        })
      }, 500)

      const response = await axios.post(
        '/api/analyze-rfp',
        formData,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      clearInterval(progressInterval)
      setAnalysisProgress(100)

      message.success('RFP analizada correctamente')
      setFileList([])
      setRfpName('')
      await loadRfps()
      await loadDashboard()
      setCurrentRfp(response.data)
    } catch (error) {
      console.error('Error analyzing RFP:', error)
      message.error('Error al analizar la RFP: ' + (error.response?.data?.error || error.message))
    } finally {
      setAnalyzing(false)
      setAnalysisProgress(0)
    }
  }

  const loadRfpDetail = async (rfpId) => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      const response = await axios.get(
        `/api/analyze-rfp/${rfpId}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )

      setCurrentRfp(response.data)
    } catch (error) {
      console.error('Error loading RFP:', error)
      message.error('Error al cargar el detalle de la RFP')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (rfpId, newStatus) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      await axios.patch(
        `/api/rfp-status/${rfpId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )

      message.success('Estado actualizado')
      await loadRfps()
      await loadDashboard()
      if (currentRfp?.id === rfpId) {
        setCurrentRfp({ ...currentRfp, status: newStatus })
      }
    } catch (error) {
      console.error('Error updating status:', error)
      message.error('Error al actualizar el estado')
    }
  }

  const generateDocument = async (type) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const endpoint = type === 'viability'
        ? `/api/rfp-generate-viability/${currentRfp.id}`
        : `/api/rfp-generate-tasks/${currentRfp.id}`

      const response = await axios.post(
        endpoint,
        {},
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          },
          responseType: 'blob'
        }
      )

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
          <Select.Option value="Comercial">Comercial</Select.Option>
          <Select.Option value="Técnica">Técnica</Select.Option>
          <Select.Option value="Legal">Legal</Select.Option>
          <Select.Option value="Marketing">Marketing</Select.Option>
          <Select.Option value="Seguridad IT / GDPR">Seguridad IT / GDPR</Select.Option>
          <Select.Option value="Medio Ambiente">Medio Ambiente</Select.Option>
          <Select.Option value="Operaciones">Operaciones</Select.Option>
          <Select.Option value="Otra">Otra</Select.Option>
        </Select>
      )
    },
    {
      title: 'Prioridad',
      dataIndex: 'priority',
      key: 'priority',
      width: '15%',
      render: (priority) => (
        <Tag color={priority === 'critical' ? 'red' : 'default'}>
          {priority === 'critical' ? 'Crítico' : 'Opcional'}
        </Tag>
      )
    },
    {
      title: 'Responsable',
      dataIndex: 'assigned_to',
      key: 'assigned_to',
      width: '25%',
      render: (assigned, record) => (
        <Input
          value={assigned || ''}
          onChange={(e) => updateSection(record.id, 'assigned_to', e.target.value)}
          placeholder="Asignar..."
          size="small"
        />
      )
    },
    {
      title: 'Estado',
      dataIndex: 'section_status',
      key: 'section_status',
      width: '10%',
      render: (status, record) => (
        <Tag
          color={status === 'done' ? 'green' : status === 'in_progress' ? 'blue' : 'default'}
          style={{ cursor: 'pointer' }}
          onClick={() => {
            const nextStatus = status === 'pending' ? 'in_progress' : status === 'in_progress' ? 'done' : 'pending'
            updateSection(record.id, 'section_status', nextStatus)
          }}
        >
          {status === 'done' ? 'Hecho' : status === 'in_progress' ? 'En progreso' : 'Pendiente'}
        </Tag>
      )
    }
  ]

  const updateSection = async (sectionId, field, value) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      await axios.put(
        `/api/rfp-sections/${sectionId}`,
        { [field]: value },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )

      setCurrentRfp({
        ...currentRfp,
        sections: currentRfp.sections.map(s =>
          s.id === sectionId ? { ...s, [field]: value } : s
        )
      })
    } catch (error) {
      console.error('Error updating section:', error)
    }
  }

  // Función para calcular urgencia de deadline
  const getDeadlineUrgency = (deadline) => {
    if (!deadline) return null
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const hoursLeft = (deadlineDate - now) / (1000 * 60 * 60)

    if (hoursLeft < 0) return { level: 'passed', color: 'red', icon: <ExclamationCircleOutlined />, text: 'Vencido' }
    if (hoursLeft < 6) return { level: 'critical', color: 'red', icon: <BellOutlined />, text: `${Math.floor(hoursLeft)}h` }
    if (hoursLeft < 24) return { level: 'high', color: 'orange', icon: <ClockCircleOutlined />, text: `${Math.floor(hoursLeft)}h` }
    if (hoursLeft < 48) return { level: 'medium', color: 'gold', icon: <ClockCircleOutlined />, text: '< 2 días' }
    return null
  }

  // ========================================================================
  // RENDER: Vista principal (lista + carga)
  // ========================================================================
  if (!currentRfp) {
    return (
      <div className="rfp-analyzer">
        <header className="rfp-header">
          <div>
            <h1>RFP Analyzer</h1>
            <p>Análisis automático de RFPs con IA para decisión go/no-go</p>
          </div>
        </header>

        {/* Dashboard de métricas */}
        {dashboardStats && (
          <div className="rfp-metrics">
            <div className="rfp-metric-card">
              <div className="metric-value">{dashboardStats.stats.total}</div>
              <div className="metric-label">Total RFPs</div>
            </div>
            <div className="rfp-metric-card viability-alta">
              <div className="metric-value">{dashboardStats.stats.alta}</div>
              <div className="metric-label">Viabilidad Alta</div>
            </div>
            <div className="rfp-metric-card viability-media">
              <div className="metric-value">{dashboardStats.stats.media}</div>
              <div className="metric-label">Viabilidad Media</div>
            </div>
            <div className="rfp-metric-card viability-baja">
              <div className="metric-value">{dashboardStats.stats.baja}</div>
              <div className="metric-label">Viabilidad Baja</div>
            </div>
          </div>
        )}

        <div className="rfp-main-layout">
          {/* Panel izquierdo: Nueva RFP */}
          <section className="rfp-upload-panel">
            <Card title="Nueva RFP" bordered={false}>
              <div className="rfp-upload-form">
                <label className="rfp-field">
                  <span className="rfp-label">Nombre de la RFP</span>
                  <Input
                    placeholder="ej: VWFS - Test análisis"
                    value={rfpName}
                    onChange={e => setRfpName(e.target.value)}
                    size="large"
                    disabled={analyzing}
                  />
                </label>

                <div className="rfp-field">
                  <span className="rfp-label">Pliego y documentos</span>
                  <Dragger {...uploadProps} disabled={analyzing}>
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">Click o arrastra archivos aquí</p>
                    <p className="ant-upload-hint">
                      Soporta PDF y DOCX (máx 25MB por archivo)
                    </p>
                  </Dragger>
                </div>

                {analyzing && (
                  <div className="rfp-analysis-progress">
                    <div className="progress-row">
                      <span>Analizando con IA...</span>
                      <span className="cell-muted">{Math.round(analysisProgress)} %</span>
                    </div>
                    <Progress
                      percent={analysisProgress}
                      showInfo={false}
                      strokeColor="#1890ff"
                    />
                  </div>
                )}

                <Button
                  type="primary"
                  size="large"
                  block
                  icon={analyzing ? <LoadingOutlined /> : <FileTextOutlined />}
                  onClick={handleAnalyze}
                  disabled={analyzing || !rfpName.trim() || fileList.length === 0}
                >
                  {analyzing ? 'Analizando...' : 'Analizar RFP'}
                </Button>
              </div>
            </Card>

            {/* Próximas deadlines */}
            {dashboardStats?.upcoming_deadlines?.length > 0 && (
              <Card title="Próximas Deadlines" className="rfp-deadlines-card" bordered={false}>
                <Timeline
                  items={dashboardStats.upcoming_deadlines.map(rfp => ({
                    color: new Date(rfp.deadline) < new Date() ? 'red' : 'blue',
                    children: (
                      <div>
                        <div className="timeline-title">{rfp.name}</div>
                        <div className="timeline-date">
                          {new Date(rfp.deadline).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    )
                  }))}
                />
              </Card>
            )}
          </section>

          {/* Panel derecho: Lista de RFPs */}
          <section className="rfp-list-panel">
            <Card
              title="RFPs Analizadas"
              extra={
                <div className="rfp-filters">
                  <Search
                    placeholder="Buscar..."
                    allowClear
                    onChange={e => setFilters({ ...filters, search: e.target.value })}
                    style={{ width: 200 }}
                  />
                  <Select
                    placeholder="Viabilidad"
                    allowClear
                    style={{ width: 120 }}
                    onChange={value => setFilters({ ...filters, viability: value })}
                  >
                    <Select.Option value="alta">Alta</Select.Option>
                    <Select.Option value="media">Media</Select.Option>
                    <Select.Option value="baja">Baja</Select.Option>
                  </Select>
                  <Select
                    placeholder="Estado"
                    allowClear
                    style={{ width: 140 }}
                    onChange={value => setFilters({ ...filters, status: value })}
                  >
                    <Select.Option value="nueva">Nueva</Select.Option>
                    <Select.Option value="analizada">Analizada</Select.Option>
                    <Select.Option value="revisada">Revisada</Select.Option>
                    <Select.Option value="en_decision">En decisión</Select.Option>
                    <Select.Option value="archivada">Archivada</Select.Option>
                  </Select>
                </div>
              }
              bordered={false}
            >
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Spin />
                </div>
              ) : filteredRfps.length === 0 ? (
                <Empty description="No hay RFPs que mostrar" />
              ) : (
                <div className="rfp-list">
                  {filteredRfps.map(rfp => {
                    const urgency = getDeadlineUrgency(rfp.deadline)
                    return (
                      <div
                        key={rfp.id}
                        className="rfp-list-item"
                        onClick={() => loadRfpDetail(rfp.id)}
                      >
                        <div className="rfp-list-icon">
                          <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                        </div>
                        <div className="rfp-list-info">
                          <div className="rfp-list-name">{rfp.name}</div>
                          <div className="rfp-list-meta">
                            <Tag
                              color={VIABILITY_CONFIG[rfp.viability]?.color}
                              style={{ borderRadius: 4 }}
                            >
                              {VIABILITY_CONFIG[rfp.viability]?.icon} {VIABILITY_CONFIG[rfp.viability]?.label}
                            </Tag>
                            <Tag color={STATUS_CONFIG[rfp.status]?.color}>
                              {STATUS_CONFIG[rfp.status]?.icon} {STATUS_CONFIG[rfp.status]?.label}
                            </Tag>
                            {urgency && (
                              <Tag color={urgency.color} icon={urgency.icon}>
                                {urgency.text}
                              </Tag>
                            )}
                            {rfp.deadline && !urgency && (
                              <span className="cell-muted">
                                <ClockCircleOutlined /> {new Date(rfp.deadline).toLocaleDateString('es-ES')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </section>
        </div>
      </div>
    )
  }

  // ========================================================================
  // RENDER: Vista de detalle de RFP
  // ========================================================================
  return (
    <div className="rfp-analyzer">
      <header className="rfp-header">
        <div>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => setCurrentRfp(null)}
            style={{ marginRight: 16 }}
          >
            Volver
          </Button>
          <h1 style={{ display: 'inline-block', margin: 0 }}>{currentRfp.name}</h1>
        </div>
        <div>
          <Dropdown
            menu={{
              items: Object.keys(STATUS_CONFIG).map(key => ({
                key,
                label: STATUS_CONFIG[key].label,
                icon: STATUS_CONFIG[key].icon,
                onClick: () => updateStatus(currentRfp.id, key)
              }))
            }}
          >
            <Button>
              Cambiar estado: <Tag color={STATUS_CONFIG[currentRfp.status]?.color}>{STATUS_CONFIG[currentRfp.status]?.label}</Tag>
            </Button>
          </Dropdown>
        </div>
      </header>

      <div className="rfp-content">
        {/* Viabilidad */}
        <Card className={`viability-card viability-${currentRfp.viability}`}>
          <h3>
            <span className="viability-icon">{VIABILITY_CONFIG[currentRfp.viability]?.icon}</span>
            Viabilidad: {VIABILITY_CONFIG[currentRfp.viability]?.label}
          </h3>
          <p>{currentRfp.viability_reason}</p>
        </Card>

        {/* Plazos */}
        {currentRfp.deadline && (
          <Card title="Plazos Críticos">
            <p><strong>Deadline de propuesta:</strong> {new Date(currentRfp.deadline).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            {currentRfp.milestones && currentRfp.milestones.length > 0 && (
              <Timeline
                items={currentRfp.milestones.map(m => ({
                  children: (
                    <div>
                      <div><strong>{new Date(m.date).toLocaleDateString('es-ES')}</strong></div>
                      <div className="cell-muted">{m.description}</div>
                    </div>
                  )
                }))}
              />
            )}
          </Card>
        )}

        {/* Riesgos */}
        {currentRfp.risks && currentRfp.risks.length > 0 && (
          <Card title="Riesgos Principales">
            <Timeline
              items={currentRfp.risks.map(risk => ({
                color: risk.severity === 'high' ? 'red' : risk.severity === 'medium' ? 'orange' : 'blue',
                children: (
                  <div>
                    <div><strong>{risk.risk}</strong></div>
                    <div className="cell-muted">{risk.description}</div>
                  </div>
                )
              }))}
            />
          </Card>
        )}

        {/* Requisitos Técnicos */}
        {currentRfp.technical_requirements && currentRfp.technical_requirements.length > 0 && (
          <Card title="Requisitos Técnicos">
            <ul>
              {currentRfp.technical_requirements.map((req, idx) => (
                <li key={idx}>{req}</li>
              ))}
            </ul>
          </Card>
        )}

        {/* Tabs con funcionalidades avanzadas */}
        <Card>
          <Tabs
            defaultActiveKey="overview"
            items={[
              {
                key: 'overview',
                label: (
                  <span>
                    <FileTextOutlined /> Resumen
                  </span>
                ),
                children: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Requisitos Técnicos */}
                    {currentRfp.technical_requirements && currentRfp.technical_requirements.length > 0 && (
                      <Card title="🔧 Requisitos Técnicos">
                        <ul style={{ marginLeft: '20px' }}>
                          {currentRfp.technical_requirements.map((req, i) => (
                            <li key={i}>{req}</li>
                          ))}
                        </ul>
                      </Card>
                    )}

                    {/* Secciones de trabajo */}
                    {currentRfp.sections && currentRfp.sections.length > 0 && (
                      <Card title="Reparto de Trabajo por Áreas">
                        <Table
                          columns={sectionsColumns}
                          dataSource={currentRfp.sections}
                          rowKey="id"
                          pagination={false}
                          size="small"
                        />
                      </Card>
                    )}

                    {/* Generar Documentos */}
                    <Card title="Generar Documentos">
                      <div style={{ display: 'flex', gap: 12 }}>
                        <Button
                          type="primary"
                          icon={<FileWordOutlined />}
                          onClick={() => generateDocument('viability')}
                        >
                          Informe de Viabilidad (.docx)
                        </Button>
                        <Button
                          icon={<FileWordOutlined />}
                          onClick={() => generateDocument('tasks')}
                        >
                          Plan de Reparto de Tareas (.docx)
                        </Button>
                      </div>
                    </Card>
                  </div>
                )
              },
              {
                key: 'scoring',
                label: (
                  <span>
                    <TrophyOutlined /> Scoring
                  </span>
                ),
                children: <RFPScoring rfpId={currentRfp.id} />
              },
              {
                key: 'requirements',
                label: (
                  <span>
                    <FileSearchOutlined /> Requisitos
                  </span>
                ),
                children: <RFPRequirements rfpId={currentRfp.id} />
              },
              {
                key: 'risks',
                label: (
                  <span>
                    <WarningOutlined /> Análisis de Riesgo
                  </span>
                ),
                children: <RFPRiskAnalysis rfpId={currentRfp.id} />
              }
            ]}
          />
        </Card>
      </div>
    </div>
  )
}
