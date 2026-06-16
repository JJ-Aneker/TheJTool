// src/views/DocumentGenerator.jsx
import { useState, useCallback, useEffect } from 'react'
import pako from 'pako'
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
  PlusOutlined, SaveOutlined, SendOutlined, FileExcelOutlined
} from '@ant-design/icons'
import { DOCUMENT_TYPES, getDocumentTypeOptions } from '../constants/documentTypes.js'
import { ganttService } from '../services/ganttService.js'
import { verticalesService } from '../services/verticalesService.js'
import { storageService } from '../services/storageService.js'
import { supabase } from '../config/supabaseClient'
import GanttViewer from '../components/GanttViewer.jsx'
import { useTranslation } from 'react-i18next'
import { useMessages } from '../utils/i18nMessages'
import '../styles/document-generator.css'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { Dragger } = Upload
const { Option } = Select
const { Panel } = Collapse

// Document type options (generated from constants)
const TIPOS_DOC = getDocumentTypeOptions()

const getFileIcon = (type) => {
  if (type === 'application/pdf') return <FilePdfOutlined style={{ color: '#ff4d4f' }} />
  if (type?.includes('word') || type?.includes('document')) return <FileWordOutlined style={{ color: '#1677ff' }} />
  if (type === 'text/html') return <MailOutlined style={{ color: '#52c41a' }} />
  return <FileOutlined style={{ color: '#faad14' }} />
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function DocumentGenerator() {
  const { t } = useTranslation()
  const MESSAGES = useMessages()
  const [currentStep, setCurrentStep]           = useState(0)
  const [files, setFiles]                       = useState([])
  const [verticales, setVerticales]             = useState([])
  const [loadingVerticales, setLoadingVerticales] = useState(false)
  const [vertical, setVertical]                 = useState(null)
  const [tipoDoc, setTipoDoc]                   = useState('efdt')
  const [otrosDocDescription, setOtrosDocDescription] = useState('')
  const [extraInstructions, setExtraInstructions] = useState('')
  const [analyzing, setAnalyzing]               = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisError, setAnalysisError]       = useState(null)
  const [projectData, setProjectData]           = useState(null)
  const [building, setBuilding]                 = useState(false)
  const [buildError, setBuildError]             = useState(null)
  const [docxUrl, setDocxUrl]                   = useState(null)
  const [docxFilename, setDocxFilename]         = useState(null)
  const [generatingGantt, setGeneratingGantt]   = useState(false)
  const [refinePrompt, setRefinePrompt]         = useState('')
  const [refining, setRefining]                 = useState(false)
  const [portada, setPortada]                   = useState(null)
  const [portadaPreview, setPortadaPreview]     = useState(null)
  const [useDefaultPortada, setUseDefaultPortada] = useState(false)
  const [portadaDragActive, setPortadaDragActive] = useState(false)
  const [filesDragActive, setFilesDragActive]   = useState(false)
  const [savedCovers, setSavedCovers]           = useState([])
  const [loadingCovers, setLoadingCovers]       = useState(false)

  // Progress messages
  const analysisMessages = [
    'Analizando briefing...',
    'Extrayendo requerimientos...',
    'Estructura del proyecto...',
    'Generando alcance...',
    'Diseñando workflow...',
    'Estimando esfuerzo...',
    'Finalizando análisis...'
  ]
  const [analysisMessageIdx, setAnalysisMessageIdx] = useState(0)

  // ── LOAD VERTICALES FROM API ─────────────────────────────────────────────────
  useEffect(() => {
    loadVerticales()
    loadSavedCovers()
  }, [])

  const loadVerticales = async () => {
    setLoadingVerticales(true)
    try {
      console.log('[DocumentGenerator] Cargando verticales...')
      const data = await verticalesService.getAllVerticals()
      console.log('[DocumentGenerator] Verticales recibidos:', data?.length || 0, data)

      if (!data || data.length === 0) {
        console.warn('[DocumentGenerator] No se recibieron verticales')
        message.warning('No hay verticales disponibles')
        setVerticales([])
        return
      }

      // Mapa de iconos por nombre de vertical
      const iconMap = {
        'notifapp': '📬',
        'hr': '👥',
        'facturas': '🧾',
        'sage': '🔗',
        'evolutivo': '🔄',
        'generico': '📄'
      }

      // Transform DB format to component format
      const formattedVerticales = data.map(v => ({
        value: v.nombre,  // key para el backend (notifapp, hr, etc.)
        label: `${iconMap[v.nombre] || '📄'} ${v.titulo}`,  // Nombre bonito con icono
        desc: v.descripcion_intro || v.descripcion_implementacion || ''  // Descripción
      }))

      console.log('[DocumentGenerator] Verticales formateados:', formattedVerticales.length)
      setVerticales(formattedVerticales)
      message.success(`${formattedVerticales.length} verticales cargados`)
    } catch (err) {
      console.error('[DocumentGenerator] Error loading verticales:', err)
      message.error('Error al cargar verticales: ' + err.message)
      // Fallback to empty array
      setVerticales([])
    } finally {
      setLoadingVerticales(false)
    }
  }

  // ── LOAD SAVED COVERS ─────────────────────────────────────────────────────────
  const loadSavedCovers = async () => {
    setLoadingCovers(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('[DocumentGenerator] 🔍 Cargando portadas guardadas para user:', user?.id)
      if (!user) {
        console.log('[DocumentGenerator] ⚠️ No hay usuario autenticado')
        return
      }

      const covers = await storageService.listUserCovers(user.id)
      console.log('[DocumentGenerator] ✅ Portadas encontradas:', covers.length)
      console.log('[DocumentGenerator] Portadas:', covers)
      setSavedCovers(covers)
    } catch (err) {
      console.error('[DocumentGenerator] ❌ Error cargando portadas:', err)
    } finally {
      setLoadingCovers(false)
    }
  }

  // Seleccionar portada guardada
  const selectSavedCover = async (cover) => {
    try {
      message.loading({ content: 'Cargando portada...', key: 'cover' })

      // Descargar imagen para obtener dimensiones
      const response = await fetch(cover.url)
      const blob = await response.blob()
      const reader = new FileReader()

      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const base64 = e.target.result.split(',')[1]
          setPortada({
            name: cover.name,
            base64,
            storagePath: cover.path,
            storageUrl: cover.url,
            width: img.width,
            height: img.height
          })
          setPortadaPreview(e.target.result)
          setUseDefaultPortada(false)
          message.success({ content: 'Portada cargada', key: 'cover' })
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(blob)
    } catch (err) {
      console.error('[DocumentGenerator] Error cargando portada guardada:', err)
      message.error({ content: 'Error cargando portada', key: 'cover' })
    }
  }

  // ── FILE HANDLING ───────────────────────────────────────────────────────────
  const handleFileAdd = useCallback(async (file) => {
    try {
      console.log('[DocumentGenerator] Subiendo archivo a Storage:', file.name)
      message.loading({ content: `Subiendo ${file.name}...`, key: file.name })

      // Obtener userId
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      // Subir a Supabase Storage
      const uploadedFile = await storageService.uploadDocument(file, user.id)

      // Leer texto si es HTML/TXT para análisis
      let textContent = null
      if (file.type === 'text/html' || file.type === 'text/plain') {
        const reader = new FileReader()
        textContent = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result)
          reader.readAsText(file)
        })
      }

      // Agregar a la lista con datos de Storage
      const newFile = {
        uid: `${Date.now()}-${Math.random()}`,
        name: uploadedFile.name,
        type: uploadedFile.type,
        size: uploadedFile.size,
        storagePath: uploadedFile.path,  // Path en Storage para eliminar después
        storageUrl: uploadedFile.url,    // URL para el backend
        textContent
      }

      setFiles(prev => [...prev, newFile])
      message.success({ content: `${file.name} subido`, key: file.name })
    } catch (err) {
      console.error('[DocumentGenerator] Error subiendo archivo:', err)
      message.error({ content: `Error al subir ${file.name}`, key: file.name })
    }

    return false
  }, [])

  const removeFile = (uid) => setFiles(prev => prev.filter(f => f.uid !== uid))

  // ── PORTADA HANDLING ────────────────────────────────────────────────────────
  const handlePortadaUpload = useCallback(async (file) => {
    if (file.type !== 'image/png') {
      message.error('Solo se aceptan archivos PNG para la portada')
      return false
    }

    try {
      message.loading({ content: 'Subiendo portada...', key: 'portada' })

      // Obtener userId
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      // Subir a Supabase Storage
      const uploadedFile = await storageService.uploadDocument(file, user.id)

      // Leer imagen para obtener dimensiones y preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target.result.split(',')[1]
        const img = new Image()
        img.onload = () => {
          if (img.width !== 794 || img.height !== 1123) {
            message.warning(`Dimensiones detectadas: ${img.width}×${img.height}px. Recomendado: 794×1123px (A4 a 96dpi)`)
          }
          setPortada({
            name: file.name,
            base64: base64,  // Solo para preview local
            storagePath: uploadedFile.path,
            storageUrl: uploadedFile.url,
            width: img.width,
            height: img.height
          })
          setPortadaPreview(e.target.result)
          setUseDefaultPortada(false)
          message.success({ content: 'Portada subida', key: 'portada' })
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('[DocumentGenerator] Error subiendo portada:', err)
      message.error({ content: 'Error al subir portada', key: 'portada' })
    }

    return false
  }, [])

  const removePortada = async () => {
    // Eliminar de Storage si existe
    if (portada?.storagePath) {
      await storageService.deleteDocuments([portada.storagePath])
    }
    setPortada(null)
    setPortadaPreview(null)
  }

  // ── ANALYZE ─────────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (tipoDoc === 'otros' && !otrosDocDescription.trim()) {
      setAnalysisError('Por favor describe qué tipo de documento necesitas generar')
      return
    }

    setAnalyzing(true)
    setAnalysisProgress(0)
    setAnalysisError(null)
    setAnalysisMessageIdx(0)

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) return 90
        return prev + Math.random() * 20
      })
      setAnalysisMessageIdx(prev => (prev + 1) % analysisMessages.length)
    }, 400)

    const finalInstructions = tipoDoc === 'otros'
      ? `TIPO DE DOCUMENTO PERSONALIZADO: ${otrosDocDescription}\n\n${extraInstructions}`
      : extraInstructions

    try {
      const payload = {
        vertical: vertical || 'generico',
        tipoDoc,
        extraInstructions: finalInstructions,
        files: files.map(f => ({
          name: f.name,
          type: f.type,
          storageUrl: f.storageUrl,  // URL en Storage en lugar de base64
          textContent: f.textContent
        })),
        portada: portada ? {
          name: portada.name,
          storageUrl: portada.storageUrl || null,  // URL en Storage
          base64: portada.base64,  // Fallback por si es preview local
          width: portada.width,
          height: portada.height
        } : null,
        useDefaultPortada
      }

      // Compress payload for Vercel (4.5MB limit)
      const jsonStr = JSON.stringify(payload)
      const compressed = pako.gzip(jsonStr)

      // Safe base64 conversion (avoids stack overflow on large data)
      let binaryString = '';
      for (let i = 0; i < compressed.length; i++) {
        binaryString += String.fromCharCode(compressed[i]);
      }
      const base64Compressed = btoa(binaryString)

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Compressed': 'gzip'
        },
        body: JSON.stringify({ _compressed: base64Compressed })
      })
      clearInterval(progressInterval)
      setAnalysisProgress(100)
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Error al analizar')
      setProjectData(data.data)

      // Limpiar archivos después de análisis exitoso
      // Eliminar SOLO documentos de referencia (PDFs, DOCX), NO portadas
      const storagePaths = files.map(f => f.storagePath).filter(Boolean)
      // NOTA: NO eliminamos portada - las portadas son permanentes para reutilizar
      if (storagePaths.length > 0) {
        storageService.deleteDocuments(storagePaths).catch(err =>
          console.error('[DocumentGenerator] Error limpiando Storage:', err)
        )
      }

      // Limpiar estado local
      setFiles([])
      setPortada(null)
      setPortadaPreview(null)

      setCurrentStep(1)
    } catch (err) {
      setAnalysisError(err.message)
      clearInterval(progressInterval)
    } finally {
      setAnalyzing(false)
      setTimeout(() => setAnalysisProgress(0), 500)
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

  // ── GENERATE GANTT ──────────────────────────────────────────────────────────
  const handleGenerateGantt = async () => {
    if (!projectData) {
      message.error('No hay datos del proyecto para generar Gantt');
      return;
    }

    setGeneratingGantt(true);
    try {
      await ganttService.generateGantt(projectData);
      message.success('Diagrama Gantt generado y descargado exitosamente');
    } catch (err) {
      message.error('Error al generar Gantt: ' + err.message);
    } finally {
      setGeneratingGantt(false);
    }
  };

  // ── BUILD DOCX ──────────────────────────────────────────────────────────────
  const handleBuildDocx = async () => {
    setBuilding(true)
    setBuildError(null)
    setDocxUrl(null)

    // Obtener usuario para logging
    const { data: { user } } = await supabase.auth.getUser()

    try {
      const res = await fetch('/api/build-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectData,
          tipoDoc,
          portada: portada ? {
            storageUrl: portada.storageUrl || null,  // CRÍTICO: URL en Storage
            base64: portada.base64,  // Fallback
            width: portada.width,
            height: portada.height
          } : null,
          useDefaultPortada
        })
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

      // Log document generation
      if (user) {
        const documentTypeMap = {
          'efdt': 'EFDT',
          'requirements': 'Requirements',
          'budget': 'Budget',
          'commercial': 'Commercial',
          'cr': 'CR'
        }

        const title = projectData?.titulo || data.filename || 'Documento sin título'
        const estimatedPages = data.pages || Math.ceil(blob.size / 50000) // Rough estimate: 50KB per page

        await logDocumentGeneration({
          userId: user.id,
          userName: user.email?.split('@')[0] || 'Usuario',
          documentType: documentTypeMap[tipoDoc] || tipoDoc.toUpperCase(),
          title: title,
          pages: estimatedPages,
          status: 'completed',
          metadata: {
            vertical: vertical,
            has_cover: !!portada || useDefaultPortada,
            file_size_bytes: blob.size
          }
        })
      }
    } catch (err) {
      setBuildError(err.message)

      // Log failed generation
      if (user) {
        const documentTypeMap = {
          'efdt': 'EFDT',
          'requirements': 'Requirements',
          'budget': 'Budget',
          'commercial': 'Commercial',
          'cr': 'CR'
        }

        await logDocumentGeneration({
          userId: user.id,
          userName: user.email?.split('@')[0] || 'Usuario',
          documentType: documentTypeMap[tipoDoc] || tipoDoc.toUpperCase(),
          title: projectData?.titulo || 'Documento',
          pages: 0,
          status: 'failed',
          metadata: {
            error: err.message,
            vertical: vertical
          }
        })
      }
    } finally {
      setBuilding(false)
    }
  }

  const handleReset = () => {
    setCurrentStep(0); setFiles([]); setVertical(null); setTipoDoc('efdt')
    setExtraInstructions(''); setAnalysisError(null); setProjectData(null)
    setBuildError(null); setDocxUrl(null); setDocxFilename(null)
    setPortada(null); setPortadaPreview(null); setUseDefaultPortada(false)
  }

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="efdt-root">

      {/* Header */}
      <div className="efdt-header">
        <div className="efdt-header-left">
          <div className="efdt-logo-icon"><FileTextOutlined /></div>
          <div className="efdt-header-content">
            <div className="efdt-header-title">Generador de Documentación</div>
          </div>
        </div>
      </div>

      {/* Progress bar during analysis */}
      {analyzing && (
        <div className="efdt-progress-container">
          <div className="efdt-progress-bar">
            <div className="efdt-progress-fill" style={{ width: `${analysisProgress}%` }}></div>
          </div>
          <div className="efdt-progress-message">
            <span>{analysisMessages[analysisMessageIdx]}</span>
            <span className="efdt-progress-percent">{Math.round(analysisProgress)}%</span>
          </div>
        </div>
      )}


      {/* ── STEP 0: BRIEFING ──────────────────────────────────────────────── */}
      {currentStep === 0 && (
        <div className="efdt-content">
          {/* Top action bar */}
          <div className="efdt-top-actions">
            <button
              className="btn-primary"
              onClick={handleAnalyze}
              disabled={analyzing || (files.length === 0 && !extraInstructions.trim()) || (tipoDoc === 'otros' && !otrosDocDescription.trim())}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '13px' }}
            >
              {analyzing ? '⏳ Analizando...' : '🤖 Analizar briefing'}
            </button>
            {files.length > 0 && (
              <Text style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {files.length} fichero{files.length !== 1 ? 's' : ''} · vertical: {vertical || 'auto-detectar'}
              </Text>
            )}
          </div>

          <div className="efdt-grid-briefing">

            {/* Config panel */}
            <div className="efdt-panel efdt-panel-config">
              <div className="efdt-panel-title">Configuración</div>
              <div className="efdt-panel-body">

                <div className="efdt-field">
                  <label>Tipo de documento</label>
                  <Select value={tipoDoc} onChange={setTipoDoc} style={{ width: '100%' }} size="small">
                    {TIPOS_DOC.map(t => (
                      <Option key={t.value} value={t.value}>
                        <div style={{ lineHeight: 1.3 }}>
                          <div>{t.label}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{t.description}</div>
                        </div>
                      </Option>
                    ))}
                  </Select>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: '6px', padding: '8px', background: 'var(--bg-hover)', borderRadius: '4px' }}>
                    {DOCUMENT_TYPES[tipoDoc]?.description}
                  </div>
                </div>

                {tipoDoc === 'otros' && (
                  <div className="efdt-field">
                    <label>Describe el tipo de documento que necesitas</label>
                    <TextArea
                      value={otrosDocDescription}
                      onChange={e => setOtrosDocDescription(e.target.value)}
                      placeholder="Ej: Propuesta técnica para migración de datos, Manual de usuario, Plan de testing, Documento de riesgos, etc."
                      rows={3}
                      style={{ fontSize: 12 }}
                    />
                  </div>
                )}

                <div className="efdt-field">
                  <label>Vertical del proyecto</label>
                  <Select
                    value={vertical} onChange={setVertical}
                    placeholder="Selecciona la vertical..." style={{ width: '100%' }} size="small" allowClear
                    loading={loadingVerticales}
                    notFoundContent={loadingVerticales ? <Spin size="small" /> : 'No hay verticales configuradas'}
                  >
                    {verticales.map(v => (
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
              </div>
            </div>

            {/* Portada panel - A4 vertical */}
            <div className="efdt-panel efdt-panel-portada-mini">
              <div className="efdt-panel-title">Portada</div>
              <div className="efdt-panel-body" style={{ gap: 4, padding: '8px' }}>
                {portadaPreview ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className="efdt-portada-container">
                      <img src={portadaPreview} alt="Portada preview" className="efdt-portada-image" />
                    </div>
                    <button className="btn-danger" style={{ fontSize: 10, padding: '4px 6px', width: '100%' }} onClick={removePortada}>
                      <DeleteOutlined style={{ marginRight: 3, fontSize: '10px' }} /> Quitar portada
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {/* Checkbox Default */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '0 4px' }}>
                      <input
                        type="checkbox" id="use-default-portada"
                        checked={useDefaultPortada} onChange={e => setUseDefaultPortada(e.target.checked)}
                        style={{ cursor: 'pointer', width: 11, height: 11 }}
                      />
                      <label htmlFor="use-default-portada" style={{ fontSize: 8, color: 'var(--text-secondary)', cursor: 'pointer', margin: 0 }}>
                        Default
                      </label>
                    </div>

                    {/* Mosaico de portadas guardadas */}
                    {savedCovers.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ fontSize: 8, color: 'var(--text-secondary)', padding: '0 4px', fontWeight: 500 }}>
                          Portadas guardadas:
                        </div>
                        <div style={{
                          display: 'flex',
                          gap: 6,
                          flexWrap: 'wrap',
                          padding: '4px'
                        }}>
                          {savedCovers.map(cover => (
                            <div
                              key={cover.path}
                              onClick={() => selectSavedCover(cover)}
                              style={{
                                position: 'relative',
                                width: '60px',
                                height: '85px',
                                border: '1.5px solid var(--color-border-secondary)',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)'
                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)'
                                e.currentTarget.style.borderColor = 'var(--accent-primary)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)'
                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'
                                e.currentTarget.style.borderColor = 'var(--color-border-secondary)'
                              }}
                            >
                              <img
                                src={cover.url}
                                alt={cover.name}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                            </div>
                          ))}
                          {/* Botón Nueva Portada */}
                          <Dragger
                            multiple={false}
                            beforeUpload={handlePortadaUpload}
                            showUploadList={false}
                            accept=".png"
                            style={{
                              width: '60px',
                              height: '85px',
                              padding: 0,
                              margin: 0,
                              border: '1.5px dashed var(--color-border-secondary)',
                              borderRadius: '4px',
                              background: 'var(--color-background-tertiary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                            className="cover-upload-btn"
                          >
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 2
                            }}>
                              <PlusOutlined style={{ fontSize: 16, color: 'var(--accent-primary)' }} />
                              <span style={{ fontSize: 7, color: 'var(--text-secondary)' }}>Nueva</span>
                            </div>
                          </Dragger>
                        </div>
                      </div>
                    )}

                    {/* Dropzone grande (solo si no hay portadas guardadas) */}
                    {savedCovers.length === 0 && (
                      <div className="efdt-portada-dropzone">
                        <Dragger
                          multiple={false} beforeUpload={handlePortadaUpload} showUploadList={false}
                          accept=".png" className={`efdt-dragger ${portadaDragActive ? 'efdt-dragger-active' : ''}`}
                          style={{ padding: 0, minHeight: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', border: 'none', background: 'transparent' }}
                          onDragEnter={() => setPortadaDragActive(true)}
                          onDragLeave={() => setPortadaDragActive(false)}
                          onDrop={() => setPortadaDragActive(false)}
                        >
                          <p className="ant-upload-drag-icon">
                            <InboxOutlined style={{ color: 'var(--accent-primary)', fontSize: 16 }} />
                          </p>
                          <p style={{ fontSize: 9, fontWeight: 500, color: 'var(--text-primary)', margin: '3px 0 0', textAlign: 'center' }}>
                            PNG A4
                          </p>
                        </Dragger>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Upload panel - compact */}
            <div className="efdt-panel efdt-panel-files">
              <div className="efdt-panel-title">Documentos</div>
              <div className="efdt-panel-body" style={{ gap: 6 }}>
                <Dragger
                  multiple beforeUpload={handleFileAdd} showUploadList={false}
                  accept=".pdf,.docx,.doc,.txt,.html,.eml" className={`efdt-dragger ${filesDragActive ? 'efdt-dragger-active' : ''}`}
                  style={{ padding: '8px' }}
                  onDragEnter={() => setFilesDragActive(true)}
                  onDragLeave={() => setFilesDragActive(false)}
                  onDrop={() => setFilesDragActive(false)}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined style={{ color: 'var(--accent-primary)', fontSize: 18 }} />
                  </p>
                  <p style={{ fontSize: 9, fontWeight: 500, color: 'var(--text-primary)', margin: '2px 0 0' }}>
                    Arrastra aquí
                  </p>
                </Dragger>

                {/* File list */}
                {files.length > 0 && (
                  <div className="efdt-file-list">
                    <div className="efdt-file-list-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{files.length} fichero{files.length > 1 ? 's' : ''}</span>
                      <button
                        className="btn-link danger"
                        onClick={async () => {
                          // Eliminar de Storage
                          const storagePaths = files.map(f => f.storagePath).filter(Boolean)
                          if (storagePaths.length > 0) {
                            await storageService.deleteDocuments(storagePaths)
                          }
                          // Limpiar estado
                          setFiles([])
                          setPortada(null)
                          setPortadaPreview(null)
                          message.success('Archivos limpiados')
                        }}
                        style={{ fontSize: '10px', padding: '2px 6px' }}
                        title="Limpiar todos los archivos"
                      >
                        <DeleteOutlined /> Limpiar todos
                      </button>
                    </div>
                    {files.map(f => (
                      <div key={f.uid} className="efdt-file-item" style={{ padding: '5px 8px', gap: 6 }}>
                        {getFileIcon(f.type)}
                        <span className="efdt-file-name" style={{ fontSize: 9 }}>{f.name}</span>
                        <button className="btn-link danger" onClick={() => removeFile(f.uid)} style={{ display: 'flex', alignItems: 'center', padding: '2px 4px' }}>
                          <DeleteOutlined style={{ fontSize: '10px' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {analysisError && <Alert type="error" message={analysisError} showIcon style={{ marginTop: 16 }} />}
        </div>
      )}

      {/* ── STEP 1: REVISIÓN Y EDICIÓN ───────────────────────────────────── */}
      {currentStep === 1 && projectData && (
        <div className="efdt-content">

          {/* Top action bar */}
          <div className="efdt-top-actions">
            <button
              className="btn-primary"
              onClick={handleBuildDocx}
              disabled={building}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '13px' }}
            >
              {building ? '⏳ Generando...' : '📄 Generar documento'}
            </button>
            <button
              className="btn-default"
              onClick={() => setCurrentStep(0)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '13px' }}
            >
              🔄 Volver a editar briefing
            </button>
          </div>

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
                          <button
                            className="btn-link danger"
                            onClick={() => removeTarea(i)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}
                          >
                            <DeleteOutlined style={{ fontSize: '12px' }} />
                          </button>
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
              <button
                className="btn-default"
                onClick={addTarea}
                style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <PlusOutlined style={{ fontSize: '12px' }} /> Añadir tarea
              </button>
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
              <button
                className="btn-default"
                onClick={handleRefine}
                disabled={refining || !refinePrompt.trim()}
                style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {refining ? '⏳ Ajustando...' : '🤖 Aplicar ajustes con IA'}
              </button>
            </div>
          </div>

          {buildError && <Alert type="error" message={buildError} showIcon style={{ margin: '12px 0 0' }} />}

          {/* ── GANTT VIEWER ── */}
          <Divider />
          <GanttViewer projectData={projectData} />
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: 400 }}>
              <a href={docxUrl} download={docxFilename} style={{ display: 'block' }}>
                <button className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 20px', fontSize: '14px' }}>
                  <DownloadOutlined style={{ fontSize: '14px' }} /> Descargar {docxFilename}
                </button>
              </a>
              <button
                className="btn-default"
                onClick={handleGenerateGantt}
                disabled={generatingGantt}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 20px', fontSize: '14px' }}>
                <FileExcelOutlined style={{ fontSize: '14px' }} /> {generatingGantt ? 'Generando Gantt...' : 'Descargar Diagrama Gantt'}
              </button>
              <button
                className="btn-default"
                onClick={() => setCurrentStep(1)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 20px', fontSize: '14px' }}>
                <ReloadOutlined style={{ fontSize: '14px' }} /> Volver al análisis
              </button>
              <button className="btn-default" onClick={handleReset} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 20px', fontSize: '14px' }}>
                <ReloadOutlined style={{ fontSize: '14px' }} /> Generar otro documento
              </button>
            </div>

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
