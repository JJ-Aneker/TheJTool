// src/views/DocumentGenerator.jsx
// Generador de documentos: Briefing → Revisión → Documento
import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import pako from 'pako'
import { Upload, Select, Input, Alert, Spin, InputNumber, Modal, Radio, Tooltip, Button } from 'antd'
import { message } from '../utils/message'
import HelpButton from '../components/HelpButton'
import {
  InboxOutlined, FileTextOutlined, FilePdfOutlined, FileWordOutlined,
  MailOutlined, DeleteOutlined, DownloadOutlined, CheckOutlined, CheckCircleFilled,
  WarningOutlined, InfoCircleOutlined, ThunderboltOutlined, PlusOutlined, FileExcelOutlined,
  LoadingOutlined, PictureOutlined, ArrowLeftOutlined, RobotOutlined, UndoOutlined, CloseOutlined, FileOutlined
} from '@ant-design/icons'
import { DOCUMENT_TYPES, getDocumentTypeOptions } from '../constants/documentTypes.js'
import { ganttService } from '../services/ganttService.js'
import { verticalesService } from '../services/verticalesService.js'
import { storageService } from '../services/storageService.js'
import { supabase } from '../config/supabaseClient'
import GanttViewer, { defaultGanttStart } from '../components/GanttViewer.jsx'
import '../styles/document-generator.css'

const { TextArea } = Input
const { Dragger } = Upload

const TIPOS_DOC = getDocumentTypeOptions()
const DEFAULT_RATE = 800
const IVA = 0.21

const STEPS = [
  { key: 0, label: 'Briefing' },
  { key: 1, label: 'Revisión' },
  { key: 2, label: 'Documento' }
]

const SECTIONS = [
  { id: 'cliente', label: 'Cliente y proyecto' },
  { id: 'alcance', label: 'Alcance' },
  { id: 'licencias', label: 'Licencias' },
  { id: 'estimacion', label: 'Estimación' },
  { id: 'estructura', label: 'Estructura' },
  { id: 'avisos', label: 'Avisos' },
  { id: 'planificacion', label: 'Planificación' }
]

const eur = n => `${(Number(n) || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' })} €`
const num = n => (Number(n) || 0).toLocaleString('es-ES', { maximumFractionDigits: 2, useGrouping: 'always' })

const getFileIcon = (type) => {
  if (type === 'application/pdf') return <FilePdfOutlined />
  if (type?.includes('word') || type?.includes('document')) return <FileWordOutlined />
  if (type === 'text/html' || type === 'message/rfc822') return <MailOutlined />
  return <FileOutlined />
}

// Recalcula importes y totales con la tarifa indicada.
// Las horas mandan; si una tarea no tiene horas se usan los días.
function recalcEstimacion(estimacion = {}, rate = DEFAULT_RATE) {
  const tareas = (estimacion.tareas || []).map(t => {
    const horas = t.horas != null && t.horas !== '' ? Number(t.horas) || 0 : (Number(t.dias) || 0) * 8
    const dias = parseFloat((horas / 8).toFixed(2))
    return { ...t, horas, dias, importe: t.pendiente ? 0 : parseFloat((dias * rate).toFixed(2)) }
  })
  const confirmed = tareas.filter(t => !t.pendiente)
  const totalHoras = confirmed.reduce((s, t) => s + (Number(t.horas) || 0), 0)
  const totalDias = parseFloat((totalHoras / 8).toFixed(1))
  const totalImporte = parseFloat((totalDias * rate).toFixed(2))
  const totalConIva = Math.round(totalImporte * (1 + IVA))
  return { ...estimacion, tareas, totalHoras, totalDias, totalImporte, totalConIva, tarifaDia: rate }
}

// ── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function DocumentGenerator() {
  const [currentStep, setCurrentStep] = useState(0)
  const [files, setFiles] = useState([])
  const [verticales, setVerticales] = useState([])
  const [loadingVerticales, setLoadingVerticales] = useState(false)
  const [vertical, setVertical] = useState(null)
  const [tipoDoc, setTipoDoc] = useState('efdt')
  const [otrosDocDescription, setOtrosDocDescription] = useState('')
  const [extraInstructions, setExtraInstructions] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisError, setAnalysisError] = useState(null)
  const [projectData, setProjectData] = useState(null)
  const [building, setBuilding] = useState(false)
  const [buildError, setBuildError] = useState(null)
  const [docxUrl, setDocxUrl] = useState(null)
  const [docxFilename, setDocxFilename] = useState(null)
  const [generatingGantt, setGeneratingGantt] = useState(false)
  const [refining, setRefining] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiInstruction, setAiInstruction] = useState('')
  const [undoState, setUndoState] = useState(null)
  const [portada, setPortada] = useState(null)
  const [portadaPreview, setPortadaPreview] = useState(null)
  const [useDefaultPortada, setUseDefaultPortada] = useState(false)
  const [savedCovers, setSavedCovers] = useState([])
  const [loadingCovers, setLoadingCovers] = useState(false)
  const [portadaModalOpen, setPortadaModalOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('cliente')
  const [ganttStart, setGanttStart] = useState(defaultGanttStart)
  const reviewRef = useRef(null)

  const analysisMessages = [
    'Leyendo el briefing…',
    'Extrayendo requisitos…',
    'Definiendo la estructura del proyecto…',
    'Redactando el alcance…',
    'Diseñando los workflows…',
    'Estimando el esfuerzo…',
    'Terminando el análisis…'
  ]
  const [analysisMessageIdx, setAnalysisMessageIdx] = useState(0)

  useEffect(() => {
    loadVerticales()
    loadSavedCovers()
  }, [])

  const loadVerticales = async () => {
    setLoadingVerticales(true)
    try {
      const data = await verticalesService.getAllVerticals()
      setVerticales((data || []).map(v => ({
        value: v.nombre,
        label: v.titulo || v.nombre,
        desc: v.descripcion_intro || v.descripcion_implementacion || '',
        tarifa: Number(v.tarifa_diaria) || null
      })))
    } catch (err) {
      message.error('No se pudieron cargar las verticales: ' + err.message)
      setVerticales([])
    } finally {
      setLoadingVerticales(false)
    }
  }

  const rateForVertical = (v) => verticales.find(x => x.value === v)?.tarifa || DEFAULT_RATE

  const loadSavedCovers = async () => {
    setLoadingCovers(true)
    try {
      setSavedCovers(await storageService.listAllCovers())
    } catch (err) {
      console.error('[DocumentGenerator] Error cargando portadas:', err)
    } finally {
      setLoadingCovers(false)
    }
  }

  const selectSavedCover = async (cover) => {
    try {
      message.loading({ content: 'Cargando portada…', key: 'cover' })
      const response = await fetch(cover.url)
      const blob = await response.blob()
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          setPortada({ name: cover.name, base64: e.target.result.split(',')[1], storagePath: cover.path, storageUrl: cover.url, width: img.width, height: img.height })
          setPortadaPreview(e.target.result)
          setUseDefaultPortada(false)
          setPortadaModalOpen(false)
          message.success({ content: 'Portada elegida', key: 'cover' })
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(blob)
    } catch (err) {
      message.error({ content: 'No se pudo cargar la portada', key: 'cover' })
    }
  }

  // ── ARCHIVOS ────────────────────────────────────────────────────────────────
  const handleFileAdd = useCallback(async (file) => {
    try {
      message.loading({ content: `Subiendo ${file.name}…`, key: file.name })
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')
      const uploadedFile = await storageService.uploadDocument(file, user.id)

      let textContent = null
      if (file.type === 'text/html' || file.type === 'text/plain') {
        textContent = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target.result)
          reader.readAsText(file)
        })
      }
      setFiles(prev => [...prev, {
        uid: `${Date.now()}-${Math.random()}`,
        name: uploadedFile.name,
        type: uploadedFile.type,
        size: uploadedFile.size,
        storagePath: uploadedFile.path,
        storageUrl: uploadedFile.url,
        textContent
      }])
      message.success({ content: `${file.name} subido`, key: file.name })
    } catch (err) {
      message.error({ content: `No se pudo subir ${file.name}`, key: file.name })
    }
    return false
  }, [])

  const removeFile = (uid) => {
    const f = files.find(x => x.uid === uid)
    if (f?.storagePath) storageService.deleteDocuments([f.storagePath]).catch(() => {})
    setFiles(prev => prev.filter(x => x.uid !== uid))
  }

  const clearFiles = async () => {
    const storagePaths = files.map(f => f.storagePath).filter(Boolean)
    if (storagePaths.length) await storageService.deleteDocuments(storagePaths).catch(() => {})
    setFiles([])
  }

  // ── PORTADA ─────────────────────────────────────────────────────────────────
  const handlePortadaUpload = useCallback(async (file) => {
    if (file.type !== 'image/png') {
      message.error('La portada tiene que ser una imagen PNG')
      return false
    }
    try {
      message.loading({ content: 'Subiendo portada…', key: 'portada' })
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')
      const uploadedFile = await storageService.uploadDocument(file, user.id)
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          if (img.width !== 794 || img.height !== 1123) {
            message.warning(`La imagen mide ${img.width}×${img.height} px. Lo recomendado es 794×1123 px (A4).`)
          }
          setPortada({ name: file.name, base64: e.target.result.split(',')[1], storagePath: uploadedFile.path, storageUrl: uploadedFile.url, width: img.width, height: img.height })
          setPortadaPreview(e.target.result)
          setUseDefaultPortada(false)
          setPortadaModalOpen(false)
          message.success({ content: 'Portada subida', key: 'portada' })
          loadSavedCovers()
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    } catch (err) {
      message.error({ content: 'No se pudo subir la portada', key: 'portada' })
    }
    return false
  }, [])

  // Las portadas son reutilizables: quitarla de este documento no la borra
  const clearPortada = () => { setPortada(null); setPortadaPreview(null) }

  const portadaMode = portada ? 'custom' : useDefaultPortada ? 'default' : 'none'
  const setPortadaMode = (mode) => {
    if (mode === 'none') { clearPortada(); setUseDefaultPortada(false) }
    if (mode === 'default') { clearPortada(); setUseDefaultPortada(true) }
    if (mode === 'custom') setPortadaModalOpen(true)
  }

  // ── ANALIZAR ────────────────────────────────────────────────────────────────
  const canAnalyze = (files.length > 0 || extraInstructions.trim()) && !(tipoDoc === 'otros' && !otrosDocDescription.trim())
  const analyzeHint = files.length === 0 && !extraInstructions.trim()
    ? 'Sube el briefing o escribe instrucciones para empezar.'
    : (tipoDoc === 'otros' && !otrosDocDescription.trim())
      ? 'Describe el tipo de documento que necesitas.'
      : null

  const handleAnalyze = async () => {
    if (!canAnalyze) return
    setAnalyzing(true)
    setAnalysisProgress(0)
    setAnalysisError(null)
    setAnalysisMessageIdx(0)

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => (prev >= 90 ? 90 : prev + Math.random() * 12))
      setAnalysisMessageIdx(prev => Math.min(prev + 1, analysisMessages.length - 1))
    }, 1500)

    const finalInstructions = tipoDoc === 'otros'
      ? `TIPO DE DOCUMENTO PERSONALIZADO: ${otrosDocDescription}\n\n${extraInstructions}`
      : extraInstructions

    try {
      const payload = {
        vertical: vertical || 'generico',
        tipoDoc,
        extraInstructions: finalInstructions,
        files: files.map(f => ({ name: f.name, type: f.type, storageUrl: f.storageUrl, textContent: f.textContent })),
        portada: portada ? { name: portada.name, storageUrl: portada.storageUrl || null, base64: portada.base64, width: portada.width, height: portada.height } : null,
        useDefaultPortada
      }

      // Se comprime para no superar el límite de 4,5 MB de Vercel
      const compressed = pako.gzip(JSON.stringify(payload))
      let binaryString = ''
      for (let i = 0; i < compressed.length; i++) binaryString += String.fromCharCode(compressed[i])

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Compressed': 'gzip' },
        body: JSON.stringify({ _compressed: btoa(binaryString) })
      })
      clearInterval(progressInterval)
      setAnalysisProgress(100)
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'No se pudo analizar el briefing')

      const rate = rateForVertical(data.data?.proyecto?.vertical || vertical)
      setProjectData({ ...data.data, estimacion: recalcEstimacion(data.data?.estimacion, rate) })
      setUndoState(null)

      // Los documentos de referencia se borran del almacenamiento tras analizar (la portada no)
      const storagePaths = files.map(f => f.storagePath).filter(Boolean)
      if (storagePaths.length) storageService.deleteDocuments(storagePaths).catch(() => {})
      setFiles([])
      setActiveSection('cliente')
      setCurrentStep(1)
    } catch (err) {
      setAnalysisError(err.message)
      clearInterval(progressInterval)
    } finally {
      setAnalyzing(false)
      setTimeout(() => setAnalysisProgress(0), 500)
    }
  }

  // ── EDICIÓN ─────────────────────────────────────────────────────────────────
  const rate = projectData?.estimacion?.tarifaDia || DEFAULT_RATE
  const est = projectData?.estimacion || {}
  const tareas = est.tareas || []

  const updateCliente = (field, value) => setProjectData(prev => ({ ...prev, cliente: { ...prev.cliente, [field]: value } }))
  const updateProyecto = (field, value) => setProjectData(prev => ({ ...prev, proyecto: { ...prev.proyecto, [field]: value } }))
  const updateAlcance = (patch) => setProjectData(prev => ({ ...prev, alcance: { ...prev.alcance, ...patch } }))
  const updateLicencia = (field, value) => setProjectData(prev => ({ ...prev, licencias: { ...prev.licencias, [field]: value } }))

  const setTareas = (fn) => setProjectData(prev => {
    const list = fn([...(prev.estimacion?.tareas || [])])
    return { ...prev, estimacion: recalcEstimacion({ ...prev.estimacion, tareas: list }, prev.estimacion?.tarifaDia || DEFAULT_RATE) }
  })
  const updateTarea = (idx, patch) => setTareas(list => { list[idx] = { ...list[idx], ...patch }; return list })
  const addTarea = () => setTareas(list => [...list, { descripcion: 'Nueva tarea', dias: 0.5, horas: 4, pendiente: false }])
  const removeTarea = (idx) => setTareas(list => list.filter((_, i) => i !== idx))
  const setRate = (v) => setProjectData(prev => ({ ...prev, estimacion: recalcEstimacion(prev.estimacion, Number(v) || DEFAULT_RATE) }))

  // ── AJUSTES CON IA ──────────────────────────────────────────────────────────
  const openAi = (prefill = '') => { setAiInstruction(prefill); setAiOpen(true) }

  const handleRefine = async () => {
    const instruction = aiInstruction.trim()
    if (!instruction) return
    setRefining(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vertical: projectData?.proyecto?.vertical || vertical || 'generico',
          tipoDoc,
          extraInstructions: `DATOS ACTUALES DEL PROYECTO:\n${JSON.stringify(projectData, null, 2)}\n\nINSTRUCCIONES DE REFINADO:\n${instruction}\n\nMantén todos los datos que ya existen y aplica solo los cambios indicados.`,
          files: []
        })
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'La IA no pudo aplicar los cambios')
      setUndoState({ data: projectData, instruction })
      setProjectData({ ...data.data, estimacion: recalcEstimacion(data.data?.estimacion, rate) })
      setAiOpen(false)
      setAiInstruction('')
    } catch (err) {
      message.error('No se pudieron aplicar los cambios: ' + err.message)
    } finally {
      setRefining(false)
    }
  }

  const undoRefine = () => {
    if (!undoState) return
    setProjectData(undoState.data)
    setUndoState(null)
    message.success('Cambios de la IA deshechos')
  }

  // ── GANTT Y WORD ────────────────────────────────────────────────────────────
  const handleGenerateGantt = async () => {
    if (!projectData) return
    setGeneratingGantt(true)
    try {
      await ganttService.generateGantt(projectData, ganttStart.format('YYYY-MM-DD'))
      message.success('Diagrama Gantt descargado')
    } catch (err) {
      message.error('No se pudo generar el Gantt: ' + err.message)
    } finally {
      setGeneratingGantt(false)
    }
  }

  const handleBuildDocx = async () => {
    setBuilding(true)
    setBuildError(null)
    setDocxUrl(null)
    try {
      const res = await fetch('/api/build-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectData,
          tipoDoc,
          portada: portada ? { storageUrl: portada.storageUrl || null, base64: portada.base64, width: portada.width, height: portada.height } : null,
          useDefaultPortada
        })
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'No se pudo generar el documento')
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

  const downloadDocx = () => {
    if (!docxUrl) return
    const a = document.createElement('a')
    a.href = docxUrl
    a.download = docxFilename || 'documento.docx'
    a.click()
  }

  const handleReset = () => {
    setCurrentStep(0); setFiles([]); setVertical(null); setTipoDoc('efdt'); setOtrosDocDescription('')
    setExtraInstructions(''); setAnalysisError(null); setProjectData(null); setUndoState(null)
    setBuildError(null); setDocxUrl(null); setDocxFilename(null)
    setPortada(null); setPortadaPreview(null); setUseDefaultPortada(false)
  }

  // ── NAVEGACIÓN ENTRE PASOS ──────────────────────────────────────────────────
  const goToStep = (step) => {
    if (step === currentStep || analyzing || building) return
    if (step === 1 && !projectData) return
    if (step === 2 && !docxUrl) return
    if (step === 0 && projectData) {
      Modal.confirm({
        title: '¿Volver al briefing?',
        content: 'La revisión actual se conserva hasta que analices de nuevo. Los documentos que subiste ya se borraron tras el análisis: si quieres volver a analizar, tendrás que subirlos otra vez.',
        okText: 'Volver al briefing',
        cancelText: 'Seguir revisando',
        onOk: () => setCurrentStep(0)
      })
      return
    }
    setCurrentStep(step)
  }

  // Índice de la revisión: resalta la sección visible
  useEffect(() => {
    if (currentStep !== 1 || !reviewRef.current) return
    const root = reviewRef.current
    const onScroll = () => {
      const top = root.getBoundingClientRect().top
      let current = SECTIONS[0].id
      for (const s of SECTIONS) {
        const el = root.querySelector(`#dg-${s.id}`)
        if (el && el.getBoundingClientRect().top - top < 120) current = s.id
      }
      setActiveSection(current)
    }
    root.addEventListener('scroll', onScroll, { passive: true })
    return () => root.removeEventListener('scroll', onScroll)
  }, [currentStep, projectData != null])

  const scrollToSection = (id) => {
    const root = reviewRef.current
    const el = root?.querySelector(`#dg-${id}`)
    if (!root || !el) return
    root.scrollTo({ top: el.offsetTop - root.offsetTop - 8, behavior: 'smooth' })
    setActiveSection(id)
  }

  const meta = projectData?.meta || {}
  const avisos = [...(meta.datosIncompletos || []).map(t => ({ type: 'missing', text: t })), ...(meta.advertencias || []).map(t => ({ type: 'info', text: t }))]
  const pendientes = tareas.filter(t => t.pendiente).length
  const tipoLabel = DOCUMENT_TYPES[tipoDoc]?.label || tipoDoc
  const verticalLabel = useMemo(() => verticales.find(v => v.value === (projectData?.proyecto?.vertical || vertical))?.label, [verticales, projectData, vertical])

  // ── RENDER ──────────────────────────────────────────────────────────────────
  const primaryAction = currentStep === 0 ? (
    <Tooltip title={analyzeHint}>
      <button className="btn-primary dg-primary" onClick={handleAnalyze} disabled={analyzing || !canAnalyze}>
        {analyzing ? <><LoadingOutlined /> Analizando…</> : <><ThunderboltOutlined /> Analizar briefing</>}
      </button>
    </Tooltip>
  ) : currentStep === 1 ? (
    <button className="btn-primary dg-primary" onClick={handleBuildDocx} disabled={building || refining}>
      {building ? <><LoadingOutlined /> Generando…</> : <><FileTextOutlined /> Generar documento</>}
    </button>
  ) : (
    <button className="btn-primary dg-primary" onClick={downloadDocx}>
      <DownloadOutlined /> Descargar Word
    </button>
  )

  return (
    <div className="dg-root">
      <div className="header-main">
        <div>
          <h1 className="header-title">Generador de documentos</h1>
          <p className="header-subtitle">De un briefing a un documento Word: analiza, revisa y genera.</p>
        </div>
        <div className="header-actions">
          <HelpButton section="documentGenerator" />
          {currentStep === 1 && (
            <button className="btn-default" onClick={() => openAi()} disabled={refining || building}>
              <RobotOutlined /> Pedir cambios a la IA
            </button>
          )}
          {primaryAction}
        </div>
      </div>

      {/* Pasos */}
      <nav className="dg-steps" aria-label="Pasos">
        {STEPS.map((s, i) => {
          const done = (s.key === 0 && projectData) || (s.key === 1 && docxUrl)
          const reachable = s.key === 0 || (s.key === 1 && projectData) || (s.key === 2 && docxUrl)
          return (
            <div key={s.key} className="dg-step-wrap">
              {i > 0 && <span className="dg-step-line" aria-hidden="true" />}
              <button
                type="button"
                className={`dg-step ${currentStep === s.key ? 'is-current' : ''} ${done && currentStep !== s.key ? 'is-done' : ''}`}
                onClick={() => goToStep(s.key)}
                disabled={!reachable || analyzing || building}
                aria-current={currentStep === s.key ? 'step' : undefined}
              >
                <span className="dg-step-num">{done && currentStep !== s.key ? <CheckOutlined /> : i + 1}</span>
                <span className="dg-step-label">{s.label}</span>
              </button>
            </div>
          )
        })}
        {currentStep === 0 && analyzeHint && !analyzing && <span className="dg-steps-hint">{analyzeHint}</span>}
      </nav>

      {/* Progreso del análisis */}
      {analyzing && (
        <div className="dg-progress" role="status">
          <div className="dg-progress-row">
            <span>{analysisMessages[analysisMessageIdx]}</span>
            <span className="cell-muted">{Math.round(analysisProgress)} %</span>
          </div>
          <div className="dg-progress-track"><div className="dg-progress-bar" style={{ width: `${analysisProgress}%` }} /></div>
        </div>
      )}

      {/* ── PASO 1: BRIEFING ─────────────────────────────────────────────── */}
      {currentStep === 0 && (
        <div className="dg-brief">
          <section className="dg-card" aria-labelledby="dg-what">
            <header className="dg-card-head"><h2 id="dg-what">Qué documento</h2></header>
            <div className="dg-card-body">
              <div className="dg-field">
                <span className="dg-label">Tipo de documento</span>
                <Radio.Group value={tipoDoc} onChange={e => setTipoDoc(e.target.value)} className="dg-types">
                  {TIPOS_DOC.map(t => (
                    <label key={t.value} className={`dg-type ${tipoDoc === t.value ? 'is-selected' : ''}`}>
                      <Radio value={t.value} />
                      <span className="dg-type-text">
                        <span className="dg-type-label">{t.label}</span>
                        <span className="dg-type-desc">{t.description}</span>
                      </span>
                    </label>
                  ))}
                </Radio.Group>
              </div>

              {tipoDoc === 'otros' && (
                <label className="dg-field">
                  <span className="dg-label">Describe el documento que necesitas</span>
                  <TextArea value={otrosDocDescription} onChange={e => setOtrosDocDescription(e.target.value)} rows={2}
                    placeholder="p. ej. Plan de pruebas, manual de usuario, documento de riesgos…" />
                </label>
              )}

              <label className="dg-field">
                <span className="dg-label">Vertical del proyecto</span>
                <Select
                  value={vertical} onChange={setVertical} allowClear showSearch optionFilterProp="label"
                  placeholder="Se detecta automáticamente si la dejas vacía"
                  loading={loadingVerticales}
                  notFoundContent={loadingVerticales ? <Spin size="small" /> : 'No hay verticales configuradas'}
                  options={verticales.map(v => ({
                    value: v.value,
                    label: v.label,
                    title: v.desc
                  }))}
                  optionRender={(o) => (
                    <div className="dg-opt">
                      <span>{o.data.label}</span>
                      <span className="cell-muted">{num(rateForVertical(o.data.value))} €/día</span>
                    </div>
                  )}
                />
                {vertical && <span className="dg-help">Tarifa de la vertical: {num(rateForVertical(vertical))} €/día. Podrás cambiarla en la revisión.</span>}
              </label>

              <label className="dg-field">
                <span className="dg-label">Instrucciones para la IA <span className="cell-muted">(opcional)</span></span>
                <TextArea
                  value={extraInstructions} onChange={e => setExtraInstructions(e.target.value)} rows={6}
                  placeholder="p. ej. El cliente tiene 3 CIFs, quiere integración con SAP, presupuesto máximo 15.000 €, licencias: 5 concurrentes + 1 nominativa…"
                />
              </label>
            </div>
          </section>

          <section className="dg-card" aria-labelledby="dg-material">
            <header className="dg-card-head"><h2 id="dg-material">Material de partida</h2></header>
            <div className="dg-card-body">
              <div className="dg-field">
                <span className="dg-label">Briefing y documentos del cliente</span>
                <Dragger multiple beforeUpload={handleFileAdd} showUploadList={false} accept=".pdf,.docx,.doc,.txt,.html,.eml" className="dg-dragger">
                  <InboxOutlined className="dg-dragger-icon" />
                  <span className="dg-dragger-title">Arrastra aquí los archivos o haz clic para elegirlos</span>
                  <span className="dg-dragger-sub">PDF, Word, TXT, HTML o correos (.eml)</span>
                </Dragger>
                {files.length > 0 && (
                  <ul className="dg-files" aria-label="Archivos subidos">
                    {files.map(f => (
                      <li key={f.uid} className="dg-file">
                        <span className="dg-file-icon">{getFileIcon(f.type)}</span>
                        <span className="dg-file-name" title={f.name}>{f.name}</span>
                        {f.size ? <span className="cell-muted dg-file-size">{(f.size / 1024).toFixed(0)} KB</span> : null}
                        <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => removeFile(f.uid)} aria-label={`Quitar ${f.name}`} />
                      </li>
                    ))}
                    {files.length > 1 && (
                      <li className="dg-files-foot">
                        <span className="cell-muted">{files.length} archivos</span>
                        <button className="btn-link danger" onClick={clearFiles}>Quitar todos</button>
                      </li>
                    )}
                  </ul>
                )}
              </div>

              <div className="dg-field">
                <span className="dg-label">Portada</span>
                <div className="dg-cover">
                  <button type="button" className={`dg-cover-thumb ${portadaPreview ? 'has-image' : ''}`} onClick={() => setPortadaModalOpen(true)} aria-label="Elegir portada">
                    {portadaPreview ? <img src={portadaPreview} alt="Portada elegida" /> : (
                      <span className="dg-cover-empty">{useDefaultPortada ? 'Por defecto' : 'Sin portada'}</span>
                    )}
                  </button>
                  <div className="dg-cover-options">
                    <Radio.Group value={portadaMode} onChange={e => setPortadaMode(e.target.value)}>
                      <div className="dg-cover-radio"><Radio value="none">Sin portada</Radio></div>
                      <div className="dg-cover-radio"><Radio value="default">Portada por defecto</Radio></div>
                      <div className="dg-cover-radio"><Radio value="custom">Personalizada</Radio></div>
                    </Radio.Group>
                    {portada ? (
                      <div className="dg-cover-actions">
                        <span className="cell-muted dg-cover-name" title={portada.name}>{portada.name}</span>
                        <button className="btn-link" onClick={() => setPortadaModalOpen(true)}>Cambiar</button>
                      </div>
                    ) : (
                      <button className="btn-default dg-cover-btn" onClick={() => setPortadaModalOpen(true)}>
                        <PictureOutlined /> {savedCovers.length ? `Elegir entre ${savedCovers.length} guardadas` : 'Subir una portada'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {analysisError && <Alert className="dg-span" type="error" showIcon message="No se pudo analizar el briefing" description={analysisError} />}
        </div>
      )}

      {/* ── PASO 2: REVISIÓN ─────────────────────────────────────────────── */}
      {currentStep === 1 && projectData && (
        <div className="dg-review">
          <nav className="dg-index" aria-label="Secciones">
            {SECTIONS.map(s => (
              <button key={s.id} type="button" className={`dg-index-item ${activeSection === s.id ? 'is-active' : ''}`} onClick={() => scrollToSection(s.id)}>
                {s.label}
                {s.id === 'avisos' && avisos.length > 0 && <span className="dg-index-count">{avisos.length}</span>}
                {s.id === 'estimacion' && pendientes > 0 && <span className="dg-index-count is-muted">{pendientes}</span>}
              </button>
            ))}
          </nav>

          <div className="dg-sections" ref={reviewRef}>
            {undoState && (
              <Alert
                type="info" showIcon
                message="La IA ha aplicado tus cambios"
                description={<span className="cell-muted">«{undoState.instruction}»</span>}
                action={<button className="btn-default" onClick={undoRefine}><UndoOutlined /> Deshacer</button>}
                closable onClose={() => setUndoState(null)}
              />
            )}
            {buildError && <Alert type="error" showIcon message="No se pudo generar el documento" description={buildError} />}

            {/* Cliente y proyecto */}
            <section id="dg-cliente" className="dg-section">
              <h2 className="dg-section-title">Cliente y proyecto</h2>
              <div className="dg-grid-2">
                {[
                  { label: 'Cliente', field: 'nombre', obj: 'cliente' },
                  { label: 'Razón social', field: 'razonSocial', obj: 'cliente' },
                  { label: 'Sector', field: 'sector', obj: 'cliente' },
                  { label: 'Interlocutor', field: 'interlocutor', obj: 'cliente' },
                  { label: 'Versión', field: 'version', obj: 'proyecto' },
                  { label: 'Fecha', field: 'fecha', obj: 'proyecto' }
                ].map(({ label, field, obj }) => (
                  <label key={field} className="dg-field">
                    <span className="dg-label">{label}</span>
                    <Input
                      value={obj === 'cliente' ? projectData.cliente?.[field] : projectData.proyecto?.[field]}
                      onChange={e => (obj === 'cliente' ? updateCliente(field, e.target.value) : updateProyecto(field, e.target.value))}
                    />
                  </label>
                ))}
              </div>
              <label className="dg-field">
                <span className="dg-label">Descripción del proyecto <span className="cell-muted">(aparece en la portada)</span></span>
                <TextArea autoSize={{ minRows: 2, maxRows: 5 }} value={projectData.proyecto?.descripcion} onChange={e => updateProyecto('descripcion', e.target.value)} />
              </label>
            </section>

            {/* Alcance */}
            <section id="dg-alcance" className="dg-section">
              <h2 className="dg-section-title">Alcance</h2>
              <label className="dg-field">
                <span className="dg-label">Descripción general</span>
                <TextArea autoSize={{ minRows: 3, maxRows: 10 }} value={projectData.alcance?.descripcionGeneral} onChange={e => updateAlcance({ descripcionGeneral: e.target.value })} />
              </label>
              <div className="dg-field">
                <span className="dg-label">Claves del proyecto</span>
                <ul className="dg-keys">
                  {(projectData.alcance?.clavesProyecto || []).map((c, i) => (
                    <li key={i} className="dg-key">
                      <span className="dg-key-num">{i + 1}</span>
                      <Input value={c} onChange={e => {
                        const claves = [...projectData.alcance.clavesProyecto]; claves[i] = e.target.value
                        updateAlcance({ clavesProyecto: claves })
                      }} />
                      <Button type="text" size="small" icon={<CloseOutlined />} aria-label="Quitar clave"
                        onClick={() => updateAlcance({ clavesProyecto: projectData.alcance.clavesProyecto.filter((_, j) => j !== i) })} />
                    </li>
                  ))}
                </ul>
                <button className="btn-link dg-add" onClick={() => updateAlcance({ clavesProyecto: [...(projectData.alcance?.clavesProyecto || []), ''] })}>
                  <PlusOutlined /> Añadir clave
                </button>
              </div>
            </section>

            {/* Licencias */}
            <section id="dg-licencias" className="dg-section">
              <h2 className="dg-section-title">Licencias</h2>
              <div className="dg-grid-4">
                {[
                  { label: 'Servidor', field: 'servidor' },
                  { label: 'Concurrentes', field: 'concurrentes' },
                  { label: 'Nominativas', field: 'nominativas' },
                  { label: 'Solo lectura', field: 'readOnly' }
                ].map(({ label, field }) => (
                  <label key={field} className="dg-field">
                    <span className="dg-label">{label}</span>
                    <InputNumber min={0} style={{ width: '100%' }} value={projectData.licencias?.[field] || 0} onChange={v => updateLicencia(field, v)} />
                  </label>
                ))}
              </div>
              {projectData.licencias?.modulosAdicionales?.length > 0 && (
                <div className="dg-field">
                  <span className="dg-label">Módulos adicionales</span>
                  <div className="dg-chips">
                    {projectData.licencias.modulosAdicionales.map((m, i) => (
                      <span key={i} className="dg-chip">
                        {m}
                        <button type="button" aria-label={`Quitar ${m}`} onClick={() => updateLicencia('modulosAdicionales', projectData.licencias.modulosAdicionales.filter((_, j) => j !== i))}>
                          <CloseOutlined />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Estimación */}
            <section id="dg-estimacion" className="dg-section">
              <div className="dg-section-head">
                <h2 className="dg-section-title">Estimación de esfuerzo</h2>
                <span className="cell-muted">{num(rate)} €/día · 8 h/día</span>
              </div>
              <div className="dg-table-wrap">
                <table className="dg-table">
                  <thead>
                    <tr>
                      <th>Actividad</th>
                      <th className="is-num">Días</th>
                      <th className="is-num">Horas</th>
                      <th className="is-num">Importe</th>
                      <th>Estado</th>
                      <th aria-label="Acciones" />
                    </tr>
                  </thead>
                  <tbody>
                    {tareas.map((t, i) => (
                      <tr key={i} className={t.pendiente ? 'is-pending' : ''}>
                        <td className="dg-td-desc">
                          <Input variant="borderless" value={t.descripcion} onChange={e => updateTarea(i, { descripcion: e.target.value })} aria-label="Actividad" />
                        </td>
                        <td className="is-num">
                          <InputNumber variant="borderless" controls={false} decimalSeparator="," min={0} step={0.25} value={t.pendiente ? null : t.dias} disabled={t.pendiente}
                            onChange={v => updateTarea(i, { horas: Math.round((Number(v) || 0) * 8 * 100) / 100 })} aria-label="Días" />
                        </td>
                        <td className="is-num">
                          <InputNumber variant="borderless" controls={false} decimalSeparator="," min={0} step={1} value={t.pendiente ? null : t.horas} disabled={t.pendiente}
                            onChange={v => updateTarea(i, { horas: Number(v) || 0 })} aria-label="Horas" />
                        </td>
                        <td className="is-num dg-td-amount">{t.pendiente ? <span className="cell-muted">—</span> : eur(t.importe)}</td>
                        <td>
                          <button type="button" className={`dg-status ${t.pendiente ? 'is-pending' : ''}`} onClick={() => updateTarea(i, { pendiente: !t.pendiente })}
                            title={t.pendiente ? 'Pasar a incluida' : 'Marcar como pendiente de valorar'}>
                            {t.pendiente ? 'Pendiente' : 'Incluida'}
                          </button>
                        </td>
                        <td className="dg-td-act">
                          <Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => removeTarea(i)} aria-label={`Eliminar ${t.descripcion}`} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Total incluido</td>
                      <td className="is-num">{num(est.totalDias)}</td>
                      <td className="is-num">{num(est.totalHoras)}</td>
                      <td className="is-num">{eur(est.totalImporte)}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
              <button className="btn-link dg-add" onClick={addTarea}><PlusOutlined /> Añadir tarea</button>
              {pendientes > 0 && <p className="dg-note">Las tareas pendientes aparecen en el documento sin importe y no suman al total.</p>}
            </section>

            {/* Estructura */}
            <section id="dg-estructura" className="dg-section">
              <h2 className="dg-section-title">Estructura documental y workflows</h2>
              {!(projectData.estructura?.categoriasPrincipales?.length || projectData.estructura?.workflows?.length) ? (
                <p className="cell-muted">El análisis no propone categorías ni workflows para este documento.</p>
              ) : (
                <div className="dg-grid-2">
                  <div className="dg-field">
                    <span className="dg-label">Categorías</span>
                    <ul className="dg-list">
                      {(projectData.estructura?.categoriasPrincipales || []).map((c, i) => (
                        <li key={i}><span>{c.nombre}</span><span className="cell-muted">{c.campos?.length || c.numCampos || '—'} campos</span></li>
                      ))}
                      {!projectData.estructura?.categoriasPrincipales?.length && <li className="cell-muted">Ninguna</li>}
                    </ul>
                  </div>
                  <div className="dg-field">
                    <span className="dg-label">Workflows</span>
                    <ul className="dg-list">
                      {(projectData.estructura?.workflows || []).map((w, i) => <li key={i}><span>{w.nombre}</span></li>)}
                      {!projectData.estructura?.workflows?.length && <li className="cell-muted">Ninguno</li>}
                    </ul>
                  </div>
                </div>
              )}
            </section>

            {/* Avisos */}
            <section id="dg-avisos" className="dg-section">
              <div className="dg-section-head">
                <h2 className="dg-section-title">Avisos del análisis</h2>
                {meta.datosIncompletos?.length > 0 && (
                  <button className="btn-default" onClick={() => openAi(`Completa estos datos que faltan:\n${meta.datosIncompletos.map(d => `- ${d}: `).join('\n')}`)}>
                    <RobotOutlined /> Completar con la IA
                  </button>
                )}
              </div>
              {avisos.length === 0 ? (
                <p className="cell-muted">Sin avisos: el análisis no ha detectado datos que falten.</p>
              ) : (
                <ul className="dg-notices">
                  {avisos.map((a, i) => (
                    <li key={i} className={`dg-notice is-${a.type}`}>
                      {a.type === 'missing' ? <WarningOutlined /> : <InfoCircleOutlined />}
                      <span>{a.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Planificación */}
            <section id="dg-planificacion" className="dg-section">
              <h2 className="dg-section-title">Planificación</h2>
              <GanttViewer projectData={projectData} startDate={ganttStart} onStartDateChange={setGanttStart} />
            </section>
          </div>

          {/* Resumen fijo */}
          <aside className="dg-summary" aria-label="Resumen">
            <div className="dg-summary-block">
              <span className="dg-summary-kicker">{tipoLabel}</span>
              <span className="dg-summary-title">{projectData.cliente?.nombre || 'Cliente sin nombre'}</span>
              {verticalLabel && <span className="cell-muted">{verticalLabel}</span>}
            </div>

            <dl className="dg-summary-list">
              <div><dt>Esfuerzo</dt><dd>{num(est.totalDias)} días · {num(est.totalHoras)} h</dd></div>
              <div>
                <dt>Tarifa</dt>
                <dd>
                  <InputNumber size="small" min={0} step={50} value={rate} onChange={setRate} className="dg-rate" aria-label="Tarifa por día"
                    formatter={v => `${v}`} /> €/día
                </dd>
              </div>
              <div><dt>Importe</dt><dd>{eur(est.totalImporte)}</dd></div>
              <div><dt>IVA 21 %</dt><dd>{eur((est.totalImporte || 0) * IVA)}</dd></div>
              <div className="is-total"><dt>Total con IVA</dt><dd>{eur(est.totalConIva)}</dd></div>
            </dl>

            <dl className="dg-summary-list">
              <div>
                <dt>Confianza</dt>
                <dd className="dg-conf">
                  <span className={`status-dot ${meta.confianza === 'alta' ? 'status-dot--active' : meta.confianza === 'baja' ? 'status-dot--error' : 'status-dot--pending'}`} />
                  {meta.confianza || 'media'}
                </dd>
              </div>
              {pendientes > 0 && <div><dt>Pendientes</dt><dd>{pendientes} {pendientes === 1 ? 'tarea' : 'tareas'}</dd></div>}
              {avisos.length > 0 && (
                <div>
                  <dt>Avisos</dt>
                  <dd><button className="btn-link" onClick={() => scrollToSection('avisos')}>{avisos.length} por revisar</button></dd>
                </div>
              )}
              {meta.referenciaUsada && <div><dt>Referencia</dt><dd className="dg-ref" title={meta.referenciaUsada}>{meta.referenciaUsada}</dd></div>}
            </dl>
          </aside>
        </div>
      )}

      {/* ── PASO 3: DOCUMENTO ────────────────────────────────────────────── */}
      {currentStep === 2 && docxUrl && (
        <div className="dg-done">
          <section className="dg-card dg-done-card">
            <div className="dg-done-head">
              <CheckCircleFilled className="dg-done-icon" />
              <div>
                <h2>Documento generado</h2>
                <p className="cell-muted">{tipoLabel}{projectData?.cliente?.nombre ? ` · ${projectData.cliente.nombre}` : ''}</p>
              </div>
            </div>

            <div className="dg-done-file">
              <FileWordOutlined className="dg-done-file-icon" />
              <span className="dg-done-file-name" title={docxFilename}>{docxFilename}</span>
              <button className="btn-link" onClick={downloadDocx}><DownloadOutlined /> Descargar</button>
            </div>

            <div className="dg-done-actions">
              <button className="btn-default" onClick={handleGenerateGantt} disabled={generatingGantt}>
                {generatingGantt ? <LoadingOutlined /> : <FileExcelOutlined />} Descargar Gantt (.xlsm)
              </button>
              <button className="btn-default" onClick={() => setCurrentStep(1)}><ArrowLeftOutlined /> Volver a la revisión</button>
              <button className="btn-default" onClick={handleReset}><PlusOutlined /> Nuevo documento</button>
            </div>

            <div className="dg-done-tips">
              <h3>Antes de enviarlo</h3>
              <ol>
                <li>Abre el documento en Word.</li>
                <li>Pulsa <kbd>Ctrl</kbd>+<kbd>A</kbd> y después <kbd>F9</kbd> para actualizar el índice.</li>
                <li>Sustituye los marcadores como <code>&lt;&lt;EMPRESA CLIENT&gt;&gt;</code>.</li>
                <li>Revisa el contenido y guárdalo como versión definitiva.</li>
              </ol>
            </div>
          </section>
        </div>
      )}

      {/* ── Modal: pedir cambios a la IA ─────────────────────────────────── */}
      <Modal
        open={aiOpen}
        title="Pedir cambios a la IA"
        onCancel={() => !refining && setAiOpen(false)}
        onOk={handleRefine}
        okText={refining ? 'Aplicando…' : 'Aplicar cambios'}
        cancelText="Cancelar"
        okButtonProps={{ disabled: !aiInstruction.trim() || refining, loading: refining }}
        cancelButtonProps={{ disabled: refining }}
        width={600}
      >
        <p className="cell-muted" style={{ marginTop: 0 }}>Describe qué quieres cambiar. La IA mantiene el resto de los datos y podrás deshacerlo.</p>
        <TextArea autoFocus rows={5} value={aiInstruction} onChange={e => setAiInstruction(e.target.value)}
          placeholder="p. ej. Reduce la estimación a un máximo de 8 días. Añade un workflow de escalado por vencimiento." />
        <div className="dg-ai-examples">
          {['Reduce la estimación a un máximo de 8 días', 'El cliente tiene 3 CIFs: actualiza las premisas', 'Añade una tarea de migración de documentos', 'Redacta el alcance de forma más concisa'].map(ex => (
            <button key={ex} type="button" className="dg-chip dg-chip--button" onClick={() => setAiInstruction(v => (v ? `${v}\n${ex}` : ex))}>{ex}</button>
          ))}
        </div>
      </Modal>

      {/* ── Modal: portadas ──────────────────────────────────────────────── */}
      <Modal open={portadaModalOpen} onCancel={() => setPortadaModalOpen(false)} title="Elegir portada" footer={null} width={620}>
        <p className="cell-muted" style={{ marginTop: 0 }}>Imagen PNG en tamaño A4 (794 × 1123 px). Las portadas que subas quedan guardadas para otros documentos.</p>
        <div className="dg-covers">
          <Dragger multiple={false} beforeUpload={handlePortadaUpload} showUploadList={false} accept=".png" className="dg-cover-upload">
            <PlusOutlined className="dg-dragger-icon" />
            <span className="dg-dragger-sub">Subir PNG</span>
          </Dragger>
          {savedCovers.map(cover => (
            <button key={cover.path} type="button" className={`dg-cover-item ${portada?.storagePath === cover.path ? 'is-selected' : ''}`} onClick={() => selectSavedCover(cover)} title={cover.name}>
              <img src={cover.url} alt={cover.name} loading="lazy" />
            </button>
          ))}
          {loadingCovers && <div className="dg-covers-empty"><Spin size="small" /></div>}
          {!loadingCovers && savedCovers.length === 0 && <div className="dg-covers-empty cell-muted">Aún no hay portadas guardadas.</div>}
        </div>
      </Modal>
    </div>
  )
}
