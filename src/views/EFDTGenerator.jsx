// src/views/EFDTGenerator.jsx
import { useState, useCallback } from 'react'
import {
  Upload, Button, Select, Input, Steps, Tag, Alert, Spin,
  Typography, Space, Badge, Collapse, Table, Tooltip, message,
  Divider, Card, InputNumber, Switch
} from 'antd'
import {
  InboxOutlined, FileTextOutlined, FilePdfOutlined, FileWordOutlined,
  MailOutlined, DeleteOutlined, RobotOutlined, EditOutlined,
  DownloadOutlined, CheckCircleOutlined, WarningOutlined,
  ReloadOutlined, FileOutlined, InfoCircleOutlined, ThunderboltOutlined,
  PlusOutlined, SaveOutlined, SendOutlined
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
  const [refinePrompt, setRefinePrompt]         = useState('')
  const [refining, setRefining]                 = useState(false)

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

  // ── EDICIÓN DIRECTA DE DATOS ────────────────────────────────────────────────
  const updateCliente = (field, value) => {
    setProjectData(prev => ({ ...prev, cliente: { ...prev.cliente, [field]: value } }))
  }

  const updateProyecto = (field, value) => {
    setProjectData(prev => ({ ...prev, proyecto: { ...prev.proyecto, [field]: value } }))
  }

  const updateTarea = (idx, field, value) => {
    setProjectData(prev => {
      const tareas = [...(prev.estimacion?.tareas || [])]
      tareas[idx] = { ...tareas[idx], [field]: value }
      // Recalcular totales automáticamente
      const confirmed = tareas.filter(t => !t.pendiente)
      const totalHoras   = confirmed.reduce((s, t) => s + (Number(t.horas) || 0), 0)
      const totalDias    = parseFloat((totalHoras / 8).toFixed(1))
      const totalImporte = totalDias * 800
      const totalConIva  = Math.round(totalImporte * 1.21)
      return {
        ...prev,
        estimacion: { ...prev.estimacion, tareas, totalHoras, totalDias, totalImporte, totalConIva }
      }
    })
  }

  const addTarea = () => {
    setProjectData(prev => ({
      ...prev,
      estimacion: {
        ...prev.estimacion,
        tareas: [...(prev.estimacion?.tareas || []), { descripcion: 'Nueva tarea', dias: 0.5, horas: 4, importe: 400, pendiente: false }]
      }
    }))
  }

  const removeTarea = (idx) => {
    setProjectData(prev => {
      const tareas = prev.estimacion?.tareas?.filter((_, i) => i !== idx) || []
      const confirmed = tareas.filter(t => !t.pendiente)
      const totalHoras   = confirmed.reduce((s, t) => s + (Number(t.horas) || 0), 0)
      const totalDias    = parseFloat((totalHoras / 8).toFixed(1))
      const totalImporte = totalDias * 800
      const totalConIva  = Math.round(totalImporte * 1.21)
      return { ...prev, estimacion: { ...prev.estimacion, tareas, totalHoras, totalDias, totalImporte, totalConIva } }
    })
  }

  const updateLicencia = (field, value) => {
    setProjectData(prev => ({ ...prev, licencias: { ...prev.licencias, [field]: value } }))
  }

  // ── REFINAR CON PROMPT ADICIONAL ─────────────────────────────────────────────
  const handleRefine = async () => {
    if (!refinePrompt.trim()) return
    setRefining(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vertical: projectData?.proyecto?.vertical || vertical || 'generico',
          tipoDoc,
          extraInstructions: `DATOS ACTUALES DEL PROYECTO:\n${JSON.stringify(projectData, null, 2)}\n\nINSTRUCCIONES DE REFINADO:\n${refinePrompt}\n\nMantén todos los datos que ya existen y aplica solo los cambios indicados.`,
          files: []
        })
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error)
      setProjectData(data.data)
      setRefinePrompt('')
      message.success('Datos actualizados correctamente')
    } catch (err) {
      message.error('Error al refinar: ' + err.message)
    } finally {
      setRefining(false)
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

      {/* ── STEP 1: REVISIÓN Y EDICIÓN ───────────────────────────────────── */}
      {currentStep === 1 && projectData && (
        <div className="efdt-content">

          {/* Meta / confianza */}
          {projectData.meta && (
            <div className="efdt-meta-bar">
              <Badge
                status={projectData.meta.confianza === 'alta' ? 'success' : projectData.meta.confianza === 'media' ? 'warning' : 'error'}
                text={<Text style={{ fontSize: 11 }}>Confianza del análisis: <strong>{projectData.meta.confianza || 'media'}</strong></Text>}
              />
              {projectData.meta.referenciaUsada && (
                <Tag color="green" style={{ fontSize: 10 }}>📄 Referencia: {projectData.meta.referenciaUsada}</Tag>
              )}
              {projectData.meta.datosIncompletos?.length > 0 && (
                <Tag color="orange" icon={<WarningOutlined />} style={{ fontSize: 10 }}>
                  {projectData.meta.datosIncompletos.length} dato{projectData.meta.datosIncompletos.length > 1 ? 's' : ''} incompleto{projectData.meta.datosIncompletos.length > 1 ? 's' : ''}
                </Tag>
              )}
            </div>
          )}

          <Collapse defaultActiveKey={['cliente', 'estimacion']} className="efdt-collapse">

            {/* ── CLIENTE Y PROYECTO (editable) ── */}
            <Panel header="👤 Datos del cliente y proyecto" key="cliente">
              <div className="efdt-grid-2" style={{ gap: 8 }}>
                {[
                  { label: 'Cliente',      field: 'nombre',       obj: 'cliente' },
                  { label: 'Razón social', field: 'razonSocial',  obj: 'cliente' },
                  { label: 'Sector',       field: 'sector',       obj: 'cliente' },
                  { label: 'Interlocutor', field: 'interlocutor', obj: 'cliente' },
                  { label: 'Versión',      field: 'version',      obj: 'proyecto' },
                  { label: 'Fecha',        field: 'fecha',        obj: 'proyecto' },
                ].map(({ label, field, obj }) => (
                  <div key={field} className="efdt-field">
                    <label>{label}</label>
                    <Input
                      size="small"
                      value={obj === 'cliente' ? projectData.cliente?.[field] : projectData.proyecto?.[field]}
                      onChange={e => obj === 'cliente' ? updateCliente(field, e.target.value) : updateProyecto(field, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <div className="efdt-field" style={{ marginTop: 12 }}>
                <label>Descripción del proyecto (portada)</label>
                <Input.TextArea
                  size="small" rows={2}
                  value={projectData.proyecto?.descripcion}
                  onChange={e => updateProyecto('descripcion', e.target.value)}
                />
              </div>
            </Panel>

            {/* ── ALCANCE ── */}
            <Panel header="🎯 Alcance y claves del proyecto" key="alcance">
              <div className="efdt-field">
                <label>Descripción general</label>
                <Input.TextArea
                  size="small" rows={3}
                  value={projectData.alcance?.descripcionGeneral}
                  onChange={e => setProjectData(prev => ({ ...prev, alcance: { ...prev.alcance, descripcionGeneral: e.target.value } }))}
                />
              </div>
              {projectData.alcance?.clavesProyecto?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Claves del proyecto:</Text>
                  {projectData.alcance.clavesProyecto.map((c, i) => (
                    <div key={i} className="efdt-field" style={{ marginTop: 6 }}>
                      <Input
                        size="small" value={c}
                        onChange={e => {
                          const claves = [...projectData.alcance.clavesProyecto]
                          claves[i] = e.target.value
                          setProjectData(prev => ({ ...prev, alcance: { ...prev.alcance, clavesProyecto: claves } }))
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            {/* ── LICENCIAS (editable) ── */}
            <Panel header="📦 Licencias" key="licencias">
              <div className="efdt-grid-3">
                {[
                  { label: 'Servidor',     field: 'servidor' },
                  { label: 'Concurrentes', field: 'concurrentes' },
                  { label: 'Nominativas',  field: 'nominativas' },
                  { label: 'Read-Only',    field: 'readOnly' },
                ].map(({ label, field }) => (
                  <div key={field} className="efdt-field">
                    <label>{label}</label>
                    <InputNumber
                      size="small" min={0} style={{ width: '100%' }}
                      value={projectData.licencias?.[field] || 0}
                      onChange={v => updateLicencia(field, v)}
                    />
                  </div>
                ))}
              </div>
              {projectData.licencias?.modulosAdicionales?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Módulos adicionales: </Text>
                  {projectData.licencias.modulosAdicionales.map((m, i) => (
                    <Tag key={i} color="purple" closable style={{ fontSize: 11 }}
                      onClose={() => {
                        const mods = projectData.licencias.modulosAdicionales.filter((_, j) => j !== i)
                        updateLicencia('modulosAdicionales', mods)
                      }}
                    >{m}</Tag>
                  ))}
                </div>
              )}
            </Panel>

            {/* ── ESTIMACIÓN (editable fila a fila) ── */}
            <Panel header="💰 Estimación de esfuerzo" key="estimacion">
              <div style={{ overflowX: 'auto' }}>
                <table className="efdt-est-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45%' }}>Actividad</th>
                      <th style={{ width: '9%' }}>Días</th>
                      <th style={{ width: '9%' }}>Horas</th>
                      <th style={{ width: '14%' }}>Importe</th>
                      <th style={{ width: '12%' }}>Estado</th>
                      <th style={{ width: '11%' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(projectData.estimacion?.tareas || []).map((tarea, i) => (
                      <tr key={i} style={{ background: tarea.pendiente ? '#fffbf0' : 'inherit' }}>
                        <td>
                          <Input
                            size="small" value={tarea.descripcion}
                            onChange={e => updateTarea(i, 'descripcion', e.target.value)}
                            style={{ fontSize: 11 }}
                          />
                        </td>
                        <td>
                          <InputNumber
                            size="small" min={0} step={0.25} style={{ width: '100%' }}
                            value={tarea.pendiente ? null : tarea.dias}
                            disabled={tarea.pendiente}
                            onChange={v => {
                              updateTarea(i, 'dias', v)
                              updateTarea(i, 'horas', Math.round(v * 8))
                              updateTarea(i, 'importe', v * 800)
                            }}
                          />
                        </td>
                        <td>
                          <InputNumber
                            size="small" min={0} step={1} style={{ width: '100%' }}
                            value={tarea.pendiente ? null : tarea.horas}
                            disabled={tarea.pendiente}
                            onChange={v => {
                              updateTarea(i, 'horas', v)
                              updateTarea(i, 'dias', parseFloat((v / 8).toFixed(2)))
                              updateTarea(i, 'importe', parseFloat(((v / 8) * 800).toFixed(2)))
                            }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', fontSize: 11, fontWeight: 600 }}>
                          {tarea.pendiente ? '—' : `${(tarea.importe || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`}
                        </td>
                        <td>
                          <Switch
                            size="small"
                            checkedChildren="Pend."
                            unCheckedChildren="OK"
                            checked={tarea.pendiente}
                            onChange={v => updateTarea(i, 'pendiente', v)}
                            style={{ background: tarea.pendiente ? '#faad14' : '#52c41a' }}
                          />
                        </td>
                        <td>
                          <Button
                            size="small" danger type="text" icon={<DeleteOutlined />}
                            onClick={() => removeTarea(i)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="efdt-est-total">
                      <td><strong>TOTAL (sin pendientes)</strong></td>
                      <td><strong>{projectData.estimacion?.totalDias || 0} días</strong></td>
                      <td><strong>{projectData.estimacion?.totalHoras || 0} h</strong></td>
                      <td style={{ textAlign: 'right' }}>
                        <strong style={{ color: '#C00000' }}>
                          {(projectData.estimacion?.totalImporte || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                        </strong>
                      </td>
                      <td colSpan={2} style={{ textAlign: 'right', fontSize: 11 }}>
                        con IVA: <strong>{(projectData.estimacion?.totalConIva || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <Button
                size="small" icon={<PlusOutlined />} onClick={addTarea}
                style={{ marginTop: 10 }}
              >
                Añadir tarea
              </Button>
            </Panel>

            {/* ── ESTRUCTURA ── */}
            {projectData.estructura && (
              <Panel header="🏗️ Estructura documental y workflows" key="estructura">
                {projectData.estructura.categoriasPrincipales?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <Text strong style={{ fontSize: 12 }}>Categorías:</Text>
                    <div style={{ marginTop: 6 }}>
                      {projectData.estructura.categoriasPrincipales.map((c, i) => (
                        <Tag key={i} style={{ margin: '2px', fontSize: 11 }}>{c.nombre} ({c.campos?.length || c.numCampos || '?'} campos)</Tag>
                      ))}
                    </div>
                  </div>
                )}
                {projectData.estructura.workflows?.length > 0 && (
                  <div>
                    <Text strong style={{ fontSize: 12 }}>Workflows:</Text>
                    <div style={{ marginTop: 6 }}>
                      {projectData.estructura.workflows.map((w, i) => (
                        <Tag key={i} color="green" style={{ margin: '2px', fontSize: 11 }}>{w.nombre}</Tag>
                      ))}
                    </div>
                  </div>
                )}
              </Panel>
            )}

            {/* ── ADVERTENCIAS ── */}
            {(projectData.meta?.datosIncompletos?.length > 0 || projectData.meta?.advertencias?.length > 0) && (
              <Panel header={<span><WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />Datos incompletos</span>} key="meta">
                {projectData.meta.datosIncompletos?.map((d, i) => (
                  <Alert key={i} type="warning" message={d} showIcon style={{ marginBottom: 8, fontSize: 11 }} />
                ))}
                {projectData.meta.advertencias?.map((a, i) => (
                  <Alert key={i} type="info" message={a} showIcon style={{ marginBottom: 8, fontSize: 11 }} />
                ))}
              </Panel>
            )}
          </Collapse>

          {/* ── PROMPT DE REFINADO ── */}
          <div className="efdt-refine-box">
            <div className="efdt-refine-title">
              <SendOutlined style={{ color: '#C00000' }} />
              <Text strong style={{ fontSize: 12 }}>Instrucciones de ajuste (opcional)</Text>
            </div>
            <div className="efdt-refine-body">
              <Input.TextArea
                value={refinePrompt}
                onChange={e => setRefinePrompt(e.target.value)}
                placeholder={`Ej: "Reduce la estimación a un máximo de 8 días", "El cliente tiene 3 CIFs, actualiza las premisas", "Añade un workflow de escalado por vencimiento", "La fecha es 20.05.2026"...`}
                rows={3} style={{ fontSize: 12 }}
              />
              <Button
                type="default" icon={refining ? <Spin size="small" /> : <RobotOutlined />}
                onClick={handleRefine} disabled={refining || !refinePrompt.trim()}
                style={{ marginTop: 8 }}
              >
                {refining ? 'Ajustando...' : 'Aplicar ajustes con IA'}
              </Button>
            </div>
          </div>

          {buildError && <Alert type="error" message={buildError} showIcon style={{ margin: '12px 0 0' }} />}

          <div className="efdt-actions" style={{ marginTop: 16 }}>
            <Button size="large" icon={<ReloadOutlined />} onClick={() => setCurrentStep(0)}>
              Volver
            </Button>
            <Button
              type="primary" size="large"
              icon={building ? <Spin size="small" /> : <FileTextOutlined />}
              onClick={handleBuildDocx} disabled={building}
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
