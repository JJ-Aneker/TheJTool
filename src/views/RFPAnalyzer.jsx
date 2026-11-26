import { useState, useEffect } from 'react'
import { Upload, Spin, Button, Table, Select, Tag, Card, message, Modal } from 'antd'
import {
  InboxOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { supabase } from '../config/supabaseClient'
import axios from 'axios'
import '../styles/rfp-analyzer.css'

const { Dragger } = Upload
const { Option } = Select

export default function RFPAnalyzer() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [rfps, setRfps] = useState([])
  const [currentRfp, setCurrentRfp] = useState(null)
  const [sections, setSections] = useState([])
  const [fileList, setFileList] = useState([])
  const [rfpName, setRfpName] = useState('')

  useEffect(() => {
    loadRfps()
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

      // Actualizar local
      setSections(sections.map(s =>
        s.id === sectionId ? { ...s, [field]: value } : s
      ))

      message.success('Sección actualizada')
    } catch (error) {
      console.error('Error updating section:', error)
      message.error('Error al actualizar la sección')
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

  const getViabilityColor = (viability) => {
    switch (viability) {
      case 'alta': return 'success'
      case 'media': return 'warning'
      case 'baja': return 'error'
      default: return 'default'
    }
  }

  const getViabilityIcon = (viability) => {
    switch (viability) {
      case 'alta': return <CheckCircleOutlined />
      case 'media': return <ExclamationCircleOutlined />
      case 'baja': return <CloseCircleOutlined />
      default: return null
    }
  }

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
        >
          <Option value="pending">Pendiente</Option>
          <Option value="in_progress">En curso</Option>
          <Option value="completed">Completado</Option>
        </Select>
      )
    },
    {
      title: 'Responsable',
      dataIndex: 'responsible_user_id',
      key: 'responsible_user_id',
      width: '15%',
      render: (userId, record) => (
        <span style={{ color: '#6b7280', fontSize: '12px' }}>
          {userId ? 'Asignado' : 'Sin asignar'}
        </span>
      )
    }
  ]

  if (!currentRfp) {
    return (
      <div className="rfp-analyzer">
        <div className="rfp-header">
          <h1>RFP Analyzer</h1>
          <p>Análisis automático de RFPs con IA para decisión go/no-go</p>
        </div>

        <div className="rfp-upload-container">
          <Card title="Nueva RFP">
            <input
              type="text"
              placeholder="Nombre de la RFP (ej: VWFS - Facturación Electrónica)"
              value={rfpName}
              onChange={(e) => setRfpName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                marginBottom: '16px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
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

          {rfps.length > 0 && (
            <Card title="RFPs Recientes" style={{ marginTop: '24px' }}>
              <div className="rfp-list">
                {rfps.map(rfp => (
                  <div
                    key={rfp.id}
                    className="rfp-list-item"
                    onClick={() => loadRfpDetails(rfp.id)}
                  >
                    <FileTextOutlined style={{ fontSize: '20px', color: '#3663FF' }} />
                    <div className="rfp-list-info">
                      <div className="rfp-list-name">{rfp.name}</div>
                      <div className="rfp-list-date">
                        {new Date(rfp.created_at).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                    <Tag color={getViabilityColor(rfp.viability)}>
                      {rfp.viability?.toUpperCase() || 'N/A'}
                    </Tag>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rfp-analyzer">
      <div className="rfp-header">
        <div>
          <Button onClick={() => setCurrentRfp(null)} style={{ marginBottom: '8px' }}>
            ← Volver a lista
          </Button>
          <h1>{currentRfp.name}</h1>
          <p>Creado el {new Date(currentRfp.created_at).toLocaleDateString('es-ES')}</p>
        </div>
      </div>

      <div className="rfp-content">
        {/* Viabilidad Card */}
        <Card
          className={`viability-card viability-${currentRfp.viability}`}
          style={{ marginBottom: '24px' }}
        >
          <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
            <div style={{ fontSize: '32px' }}>
              {getViabilityIcon(currentRfp.viability)}
            </div>
            <div style={{ flex: 1 }}>
              <h3>Viabilidad: {currentRfp.viability?.toUpperCase()}</h3>
              <p>{currentRfp.viability_reason}</p>
            </div>
          </div>
        </Card>

        {/* Plazos y Riesgos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {currentRfp.deadlines && (
            <Card title="📅 Plazos Críticos">
              {currentRfp.deadlines.deadline && (
                <p><strong>Deadline:</strong> {currentRfp.deadlines.deadline}</p>
              )}
              {currentRfp.deadlines.milestones?.map((m, i) => (
                <p key={i}><strong>{m.date}:</strong> {m.description}</p>
              ))}
            </Card>
          )}

          {currentRfp.risks && currentRfp.risks.length > 0 && (
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
          )}
        </div>

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
