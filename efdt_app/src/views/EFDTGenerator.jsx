// src/views/EFDTGenerator.jsx
import { useState, useCallback } from 'react'
import {
  Upload, Button, Select, Input, Steps, Tag, Alert, Spin,
  Typography, Space, Badge, Collapse, Table, Tooltip, message,
  Divider, Card, Progress
} from 'antd'
import {
  InboxOutlined, FileTextOutlined, FilePdfOutlined, FileWordOutlined,
  MailOutlined, DeleteOutlined, RobotOutlined, EditOutlined,
  DownloadOutlined, CheckCircleOutlined, WarningOutlined,
  ReloadOutlined, FileOutlined, InfoCircleOutlined, ThunderboltOutlined
} from '@ant-design/icons'
import '../styles/efdt-generator.css'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { Dragger } = Upload
const { Option } = Select
const { Panel } = Collapse

// ── CONSTANTES ────────────────────────────────────────────────────────────────
const VERTICALES = [
  { value: 'notifapp',  label: '📬 Notificaciones AAPP',        desc: 'Gestión de notificaciones de Administraciones Públicas' },
  { value: 'hr',        label: '👥 HR Expedientes',              desc: 'Gestión de expedientes digitales de empleados' },
  { value: 'facturas',  label: '🧾 Facturas de Proveedores',     desc: 'Gestión y aprobación de facturas con Smart Capture' },
  { value: 'sage',      label: '🔗 Integración SAGE X3',         desc: 'Therefore™ + ERP Sage X3 (compras y ventas)' },
  { value: 'evolutivo', label: '🔄 Change Request / Evolutivo',  desc: 'Evolutivo sobre implementación existente' },
  { value: 'generico',  label: '📄 Proyecto Genérico',           desc: 'Otro tipo de proyecto Therefore™' },
]

const TIPOS_DOC = [
  { value: 'efdt',       label: 'EFDT — Especificaciones Funcionales y Diseño Técnico' },
  { value: 'propuesta',  label: 'Propuesta Comercial' },
  { value: 'estimacion', label: 'Estimación de Esfuerzo' },
  { value: 'cr',         label: 'Change Request' },
]

const getFileIcon = (type) => {
  if (type === 'application/pdf') return <FilePdfOutlined style={{ color: '#ff4d4f' }} />
  if (type?.includes('word') || type?.includes('document')) return <FileWordOutlined style={{ color: '#1677ff' }} />
  if (type === 'text/html') return <MailOutlined style={{ color: '#52c41a' }} />
  return <FileOutlined style={{ color: '#faad14' }} />
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function EFDTGenerator() {
  const [currentStep, setCurrentStep]           = useState(0)
  const [files, setFiles]                       = useState([])
  const [vertical, setVertical]                 = useState(null)
  const [tipoDoc, setTipoDoc]                   = useState('efdt')
  const [extraInstructions, setExtraInstructions] = useState('')
  const [analyzing, setAnalyzing]               = useState(false)
  const [analysisError, setAnalysisError]       = useState(null)
  const [projectData, setProjectData]           = useState(null)
  const [building, setBuilding]                 = useState(false)
  const [buildError, setBuildError]             = useState(null)
  const [docxUrl, setDocxUrl]                   = useState(null)
  const [docxFilename, setDocxFilename]         = useState(null)

  // ── FILE HANDLING ───────────────────────────────────────────────────────────
  const handleFileAdd = useCallback((file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1]
      const newFile = { uid: `${Date.now()}-${Math.random()}`, name: file.name, type: file.type, size: file.size, base64, textContent: null }

      if (file.type === 'text/html' || file.type === 'text/plain') {
        const tr = new FileReader()
        tr.onload = (te) => { newFile.textContent = te.target.result; setFiles(prev => [...prev, newFile]) }
        tr.readAsText(file)
      } else {
        setFiles(prev => [...prev, newFile])
      }
    }
    reader.readAsDataURL(file)
    return false
  }, [])

  const removeFile = (uid) => setFiles(prev => prev.filter(f => f.uid !== uid))

  // ── ANALYZE ─────────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    setAnalyzing(true)
    setAnalysisError(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vertical: vertical || 'generico',
          tipoDoc,
          extraInstructions,
          files: files.map(f => ({ name: f.name, type: f.type, base64: f.base64, textContent: f.textContent }))
        })
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Error al analizar')
      setProjectData(data.data)
      setCurrentStep(1)
    } catch (err) {
      setAnalysisError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  // ── BUILD DOCX ──────────────────────────────────────────────────────────────
  const handleBuildDocx = async () => {
    setBuilding(true)
    setBuildError(null)
    setDocxUrl(null)
    try {
      const res = await fetch('/api/build-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectData, tipoDoc })
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Error al generar el documento')

      const bytes = atob(data.docxBase64)
      const arr = new Uint8Array(bytes.length)
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
      const blob = new Blob([arr], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      setDocxUrl(URL.createObjectURL(blob))
      setDocxFilename(data.filename)
      setCurrentStep(2)
    } catch (err) {
      setBuildError(err.message)
    } finally {
      setBuilding(false)
    }
  }

  const handleReset = () => {
    setCurrentStep(0); setFiles([]); setVertical(null); setTipoDoc('efdt')
    setExtraInstructions(''); setAnalysisError(null); setProjectData(null)
    setBuildError(null); setDocxUrl(null); setDocxFilename(null)
  }

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="efdt-root">

      {/* Header */}
      <div className="efdt-header">
        <div className="efdt-header-left">
          <div className="efdt-logo-icon"><ThunderboltOutlined /></div>
          <div>
            <div className="efdt-title">Generador de Documentos EFDT</div>
            <div className="efdt-subtitle">Canon España · Therefore™ Solutions</div>
          </div>
        </div>
        <div className="efdt-header-right">
          <Badge status="processing" />
          <Text style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 6 }}>Claude Sonnet 4</Text>
          <Tag color="red" style={{ marginLeft: 8, fontSize: 10 }}>Therefore™</Tag>
        </div>
      </div>

      {/* Steps */}
      <div className="efdt-steps-bar">
        <Steps current={currentStep} size="small" items={[
          { title: 'Briefing',   description: 'Sube documentos',       icon: <InboxOutlined /> },
          { title: 'Revisión',   description: 'Revisa y ajusta',        icon: <EditOutlined /> },
          { title: 'Documento',  description: 'Descarga el EFDT',       icon: <DownloadOutlined /> },
        ]} />
      </div>

      {/* ── STEP 0: BRIEFING ──────────────────────────────────────────────── */}
      {currentStep === 0 && (
        <div className="efdt-content">
          <div className="efdt-grid-2">

            {/* Config panel */}
            <div className="efdt-panel">
              <div className="efdt-panel-title">Configuración</div>
              <div className="efdt-panel-body">

                <div className="efdt-field">
                  <label>Tipo de documento</label>
                  <Select value={tipoDoc} onChange={setTipoDoc} style={{ width: '100%' }} size="small">
                    {TIPOS_DOC.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
                  </Select>
                </div>

                <div className="efdt-field">
                  <label>Vertical del proyecto</label>
                  <Select
                    value={vertical} onChange={setVertical}
                    placeholder="Selecciona la vertical..." style={{ width: '100%' }} size="small" allowClear
                  >
                    {VERTICALES.map(v => (
                      <Option key={v.value} value={v.value}>
                        <div style={{ lineHeight: 1.3 }}>
                          <div>{v.label}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{v.desc}</div>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </div>

                <div className="efdt-field">
                  <label>Instrucciones adicionales</label>
                  <TextArea
                    value={extraInstructions} onChange={e => setExtraInstructions(e.target.value)}
                    placeholder={`Ej: El cliente tiene 3 CIFs, quiere integración con SAP, presupuesto máximo 15.000€, reunión de análisis el 20 de mayo, licencias: 5 concurrentes + 1 nominativa...`}
                    rows={6} style={{ fontSize: 12 }}
                  />
                </div>

                {/* File list */}
                {files.length > 0 && (
                  <div className="efdt-file-list">
                    <div className="efdt-file-list-title">{files.length} fichero{files.length > 1 ? 's' : ''} adjunto{files.length > 1 ? 's' : ''}</div>
                    {files.map(f => (
                      <div key={f.uid} className="efdt-file-item">
                        {getFileIcon(f.type)}
                        <span className="efdt-file-name">{f.name}</span>
                        <span className="efdt-file-size">{(f.size / 1024).toFixed(0)}KB</span>
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => removeFile(f.uid)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Upload panel */}
            <div className="efdt-panel">
              <div className="efdt-panel-title">Documentos de briefing</div>
              <div className="efdt-panel-body">
                <Dragger
                  multiple beforeUpload={handleFileAdd} showUploadList={false}
                  accept=".pdf,.docx,.doc,.txt,.html,.eml" className="efdt-dragger"
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined style={{ color: 'var(--accent-primary)', fontSize: 36 }} />
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', margin: '8px 0 4px' }}>
                    Arrastra aquí los documentos del proyecto
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>
                    PDF · Word · HTML (email) · TXT · múltiples ficheros
                  </p>
                </Dragger>

                <div className="efdt-hints">
                  {[
                    { icon: <MailOutlined />,      text: 'Email del cliente con requisitos (.html, .eml)' },
                    { icon: <FilePdfOutlined />,   text: 'Cualificación de oportunidad (PDF)' },
                    { icon: <FileWordOutlined />,  text: 'Propuesta anterior o documento de referencia' },
                    { icon: <FileTextOutlined />,  text: 'Notas de reunión o descripción del proyecto' },
                  ].map((h, i) => (
                    <div key={i} className="efdt-hint-row">
                      <span style={{ color: 'var(--accent-primary)', fontSize: 13 }}>{h.icon}</span>
                      <Text style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{h.text}</Text>
                    </div>
                  ))}
                </div>

                <div className="efdt-tip">
                  <InfoCircleOutlined style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                  <Text style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    Claude analizará los documentos y extraerá automáticamente los datos del proyecto.
                    Cuanta más información proporciones, más completo será el EFDT generado.
                  </Text>
                </div>
              </div>
            </div>
          </div>

          {analysisError && <Alert type="error" message={analysisError} showIcon style={{ margin: '0 0 16px' }} />}

          <div className="efdt-actions">
            <Button
              type="primary" size="large"
              icon={analyzing ? <Spin size="small" /> : <RobotOutlined />}
              onClick={handleAnalyze}
              disabled={analyzing || (files.length === 0 && !extraInstructions.trim())}
              className="efdt-btn-primary"
            >
              {analyzing ? 'Analizando briefing...' : 'Analizar y extraer datos'}
            </Button>
            <Text style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {files.length === 0 && !extraInstructions ? 'Añade documentos o instrucciones para continuar' : `${files.length} fichero${files.length !== 1 ? 's' : ''} · vertical: ${vertical || 'auto-detectar'}`}
            </Text>
          </div>
        </div>
      )}

      {/* ── STEP 1: REVISIÓN ──────────────────────────────────────────────── */}
      {currentStep === 1 && projectData && (
        <div className="efdt-content">

          {/* Meta / confianza */}
          {projectData.meta && (
            <div className="efdt-meta-bar">
              <Badge
                status={projectData.meta.confianza === 'alta' ? 'success' : projectData.meta.confianza === 'media' ? 'warning' : 'error'}
                text={<Text style={{ fontSize: 11 }}>Confianza del análisis: <strong>{projectData.meta.confianza || 'media'}</strong></Text>}
              />
              {projectData.meta.datosIncompletos?.length > 0 && (
                <Tag color="orange" icon={<WarningOutlined />} style={{ fontSize: 10 }}>
                  {projectData.meta.datosIncompletos.length} dato{projectData.meta.datosIncompletos.length > 1 ? 's' : ''} incompleto{projectData.meta.datosIncompletos.length > 1 ? 's' : ''}
                </Tag>
              )}
            </div>
          )}

          <Collapse defaultActiveKey={['cliente', 'alcance', 'estimacion']} className="efdt-collapse">

            {/* Cliente */}
            <Panel header="👤 Datos del cliente y proyecto" key="cliente">
              <div className="efdt-grid-3">
                {[
                  ['Cliente', projectData.cliente?.nombre],
                  ['Razón social', projectData.cliente?.razonSocial],
                  ['Sector', projectData.cliente?.sector],
                  ['Interlocutor', projectData.cliente?.interlocutor],
                  ['Vertical', projectData.proyecto?.vertical],
                  ['Versión', projectData.proyecto?.version],
                  ['Fecha', projectData.proyecto?.fecha],
                  ['Tipo documento', projectData.proyecto?.tipoDoc],
                ].map(([label, value]) => (
                  <div key={label} className="efdt-data-field">
                    <div className="efdt-data-label">{label}</div>
                    <div className="efdt-data-value">{value || '—'}</div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Alcance */}
            <Panel header="🎯 Alcance y claves del proyecto" key="alcance">
              <Paragraph style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                {projectData.alcance?.descripcionGeneral || '—'}
              </Paragraph>
              {projectData.alcance?.clavesProyecto?.length > 0 && (
                <div>
                  <Text strong style={{ fontSize: 12 }}>Claves del proyecto:</Text>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                    {projectData.alcance.clavesProyecto.map((c, i) => (
                      <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              {projectData.alcance?.exclusiones?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <Text strong style={{ fontSize: 12 }}>Exclusiones:</Text>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                    {projectData.alcance.exclusiones.map((e, i) => (
                      <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Panel>

            {/* Estructura */}
            {projectData.estructura && (
              <Panel header="🏗️ Estructura documental y workflows" key="estructura">
                {projectData.estructura.categoriasPrincipales?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ fontSize: 12 }}>Categorías principales:</Text>
                    <div style={{ marginTop: 8 }}>
                      {projectData.estructura.categoriasPrincipales.map((c, i) => (
                        <Tag key={i} style={{ margin: '2px', fontSize: 11 }}>{c.nombre} ({c.numCampos || c.campos?.length || '?'} campos)</Tag>
                      ))}
                    </div>
                  </div>
                )}
                {projectData.estructura.tablasMaestras?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ fontSize: 12 }}>Tablas maestras:</Text>
                    <div style={{ marginTop: 8 }}>
                      {projectData.estructura.tablasMaestras.map((t, i) => (
                        <Tag key={i} color="blue" style={{ margin: '2px', fontSize: 11 }}>{t.nombre}</Tag>
                      ))}
                    </div>
                  </div>
                )}
                {projectData.estructura.workflows?.length > 0 && (
                  <div>
                    <Text strong style={{ fontSize: 12 }}>Workflows:</Text>
                    <div style={{ marginTop: 8 }}>
                      {projectData.estructura.workflows.map((w, i) => (
                        <Tag key={i} color="green" style={{ margin: '2px', fontSize: 11 }}>{w.nombre}</Tag>
                      ))}
                    </div>
                  </div>
                )}
              </Panel>
            )}

            {/* Licencias */}
            <Panel header="📦 Licencias" key="licencias">
              <div className="efdt-grid-3">
                {[
                  ['Servidor', projectData.licencias?.servidor || 1],
                  ['Concurrentes', projectData.licencias?.concurrentes || 0],
                  ['Nominativas', projectData.licencias?.nominativas || 0],
                  ['Read-Only', projectData.licencias?.readOnly || 0],
                ].map(([label, value]) => (
                  <div key={label} className="efdt-data-field">
                    <div className="efdt-data-label">{label}</div>
                    <div className="efdt-data-value">{value}</div>
                  </div>
                ))}
              </div>
              {projectData.licencias?.modulosAdicionales?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 12 }}>Módulos adicionales: </Text>
                  {projectData.licencias.modulosAdicionales.map((m, i) => (
                    <Tag key={i} color="purple" style={{ fontSize: 11 }}>{m}</Tag>
                  ))}
                </div>
              )}
            </Panel>

            {/* Estimación */}
            <Panel header="💰 Estimación de esfuerzo" key="estimacion">
              {projectData.estimacion?.tareas?.length > 0 && (
                <Table
                  size="small"
                  dataSource={projectData.estimacion.tareas.map((t, i) => ({ ...t, key: i }))}
                  columns={[
                    { title: 'Actividad', dataIndex: 'descripcion', key: 'desc', render: (text, r) => <Text style={{ fontSize: 11, color: r.pendiente ? '#faad14' : 'inherit' }}>{text}{r.pendiente ? ' ⏳' : ''}</Text> },
                    { title: 'Días', dataIndex: 'dias', key: 'dias', width: 60, align: 'center', render: (v, r) => <Text style={{ fontSize: 11 }}>{r.pendiente ? 'P' : v}</Text> },
                    { title: 'Horas', dataIndex: 'horas', key: 'horas', width: 60, align: 'center', render: (v, r) => <Text style={{ fontSize: 11 }}>{r.pendiente ? 'P' : `${v}h`}</Text> },
                    { title: 'Importe', dataIndex: 'importe', key: 'importe', width: 100, align: 'right', render: (v, r) => <Text strong style={{ fontSize: 11 }}>{r.pendiente ? 'P' : `${(v || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`}</Text> },
                  ]}
                  pagination={false}
                  style={{ fontSize: 11 }}
                  summary={() => (
                    <Table.Summary.Row style={{ background: 'var(--bg-canvas)' }}>
                      <Table.Summary.Cell><Text strong style={{ fontSize: 11 }}>TOTAL</Text></Table.Summary.Cell>
                      <Table.Summary.Cell align="center"><Text strong style={{ fontSize: 11 }}>{projectData.estimacion.totalDias} días</Text></Table.Summary.Cell>
                      <Table.Summary.Cell align="center"><Text strong style={{ fontSize: 11 }}>{projectData.estimacion.totalHoras}h</Text></Table.Summary.Cell>
                      <Table.Summary.Cell align="right"><Text strong style={{ fontSize: 11, color: 'var(--accent-primary)' }}>{(projectData.estimacion.totalImporte || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</Text></Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
              )}
              <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-canvas)', borderRadius: 8, border: '1px solid var(--border-default)' }}>
                <Space>
                  <Text style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Total sin IVA:</Text>
                  <Text strong style={{ fontSize: 13 }}>{(projectData.estimacion?.totalImporte || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</Text>
                  <Divider type="vertical" />
                  <Text style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Total con IVA (21%):</Text>
                  <Text strong style={{ fontSize: 13, color: 'var(--accent-primary)' }}>{(projectData.estimacion?.totalConIva || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</Text>
                </Space>
              </div>
            </Panel>

            {/* Advertencias */}
            {(projectData.meta?.datosIncompletos?.length > 0 || projectData.meta?.advertencias?.length > 0) && (
              <Panel header={<span><WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />Datos incompletos / advertencias</span>} key="meta">
                {projectData.meta.datosIncompletos?.map((d, i) => (
                  <Alert key={i} type="warning" message={d} showIcon style={{ marginBottom: 8, fontSize: 11 }} />
                ))}
                {projectData.meta.advertencias?.map((a, i) => (
                  <Alert key={i} type="info" message={a} showIcon style={{ marginBottom: 8, fontSize: 11 }} />
                ))}
              </Panel>
            )}
          </Collapse>

          {buildError && <Alert type="error" message={buildError} showIcon style={{ margin: '16px 0 0' }} />}

          <div className="efdt-actions" style={{ marginTop: 20 }}>
            <Button size="large" icon={<ReloadOutlined />} onClick={() => setCurrentStep(0)}>
              Volver y modificar
            </Button>
            <Button
              type="primary" size="large"
              icon={building ? <Spin size="small" /> : <FileTextOutlined />}
              onClick={handleBuildDocx}
              disabled={building}
              className="efdt-btn-primary"
            >
              {building ? 'Generando documento...' : 'Generar documento Word'}
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2: DESCARGA ──────────────────────────────────────────────── */}
      {currentStep === 2 && docxUrl && (
        <div className="efdt-content">
          <div className="efdt-success-card">
            <CheckCircleOutlined className="efdt-success-icon" />
            <Title level={4} style={{ margin: '16px 0 8px', color: 'var(--text-primary)' }}>
              Documento generado correctamente
            </Title>
            <Text style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 24 }}>
              {docxFilename}
            </Text>

            <Space direction="vertical" style={{ width: '100%', maxWidth: 400 }}>
              <a href={docxUrl} download={docxFilename} style={{ display: 'block' }}>
                <Button type="primary" size="large" icon={<DownloadOutlined />} block className="efdt-btn-primary">
                  Descargar {docxFilename}
                </Button>
              </a>
              <Button size="large" icon={<ReloadOutlined />} onClick={handleReset} block>
                Generar otro documento
              </Button>
            </Space>

            <div className="efdt-post-download-tips">
              <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Pasos finales en Word:</Text>
              {[
                'Abre el documento en Word',
                'Ctrl+A para seleccionar todo → F9 para actualizar campos (TOC)',
                'Revisa y ajusta el contenido según sea necesario',
                'Sustituye los placeholders <<EMPRESA CLIENT>> y similares',
                'Guarda como versión definitiva',
              ].map((tip, i) => (
                <div key={i} className="efdt-tip-row">
                  <Tag color="red" style={{ fontSize: 10, minWidth: 20, textAlign: 'center' }}>{i + 1}</Tag>
                  <Text style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{tip}</Text>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
