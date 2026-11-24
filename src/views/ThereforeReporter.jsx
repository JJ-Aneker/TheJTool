import { useState, useEffect, useMemo, useRef } from 'react'
import { Table, Button, Modal, Input, Select, Spin, Tooltip, Dropdown, Segmented, Checkbox, Alert } from 'antd'
import axios from 'axios'
import { message } from '../utils/message'
import HelpButton from '../components/HelpButton'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, ArrowLeftOutlined, MoreOutlined,
  CaretRightOutlined, CaretDownOutlined, FolderOutlined, FileTextOutlined, DownloadOutlined,
  SearchOutlined, CloseOutlined, BarChartOutlined, CopyOutlined
} from '@ant-design/icons'
import { supabase } from '../config/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { handleError } from '../utils/errorHandler'
import { logger } from '../utils/logger'
import { thereforeService } from '../services/thereforeService'
import { logReportExecution } from '../services/dashboardService'
import { formatShortDate, formatFullDate } from '../utils/format'
import '../styles/reporter.css'

// ═══════════════════════════════════════════════════════════
// CONSTANTES Y UTILIDADES
// ═══════════════════════════════════════════════════════════

// Máximo de documentos que se piden por categoría. Si una categoría llega a
// este número, el informe puede estar incompleto y se avisa.
const MAX_PER_CAT = 50000
const MAX_TOTAL = 500000

// FieldType 3 = Fecha, 99 = Fecha y hora (campo personalizado).
// (El 5 es moneda: antes se trataba como fecha por error.)
const DATE_TYPES = new Set([3, 99])

const PRESETS = [
  { value: '7d', label: '7 días' },
  { value: '30d', label: '30 días' },
  { value: 'month', label: 'Este mes' },
  { value: 'lastMonth', label: 'Mes pasado' },
  { value: 'year', label: 'Este año' },
  { value: 'custom', label: 'Personalizado' }
]

const pad = n => String(n).padStart(2, '0')
const isoDay = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parseIsoDay = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }

function rangeFor(preset) {
  const today = new Date()
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  switch (preset) {
    case '7d': return { from: isoDay(new Date(t.getTime() - 6 * 86400000)), to: isoDay(t) }
    case 'month': return { from: isoDay(new Date(t.getFullYear(), t.getMonth(), 1)), to: isoDay(t) }
    case 'lastMonth': return {
      from: isoDay(new Date(t.getFullYear(), t.getMonth() - 1, 1)),
      to: isoDay(new Date(t.getFullYear(), t.getMonth(), 0))
    }
    case 'year': return { from: isoDay(new Date(t.getFullYear(), 0, 1)), to: isoDay(t) }
    case '30d':
    default: return { from: isoDay(new Date(t.getTime() - 29 * 86400000)), to: isoDay(t) }
  }
}

// Periodo inmediatamente anterior, de la misma duración
function previousRange(from, to) {
  const f = parseIsoDay(from)
  const tt = parseIsoDay(to)
  const days = Math.round((tt - f) / 86400000) + 1
  const prevTo = new Date(f.getTime() - 86400000)
  const prevFrom = new Date(prevTo.getTime() - (days - 1) * 86400000)
  return { from: isoDay(prevFrom), to: isoDay(prevTo) }
}

// Los valores de fecha que devuelve Therefore™ pueden venir como ISO o dd/mm/aaaa
function parseDateValue(v) {
  if (!v) return null
  const s = String(v).trim()
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return new Date(+m[1], +m[2] - 1, +m[3])
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/)
  if (m) return new Date(+m[3], +m[2] - 1, +m[1])
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const fmtDay = s => { const d = parseIsoDay(s); return `${d.getDate()} ${MONTHS[d.getMonth()]}` }
const fmtRange = (from, to) => {
  if (!from || !to) return '—'
  const y1 = from.slice(0, 4); const y2 = to.slice(0, 4)
  return y1 === y2 ? `${fmtDay(from)} – ${fmtDay(to)} ${y2}` : `${fmtDay(from)} ${y1} – ${fmtDay(to)} ${y2}`
}

function formatRelative(value) {
  if (!value) return ''
  const d = new Date(value)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  if (diff < 172800) return 'ayer'
  return formatShortDate(value)
}

const nf = n => Number(n || 0).toLocaleString('es-ES')

// Preferencias y último resultado, por perfil (solo en este navegador)
const store = {
  get(key) { try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null } },
  set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); return true } catch { return false } }
}
const prefsKey = id => `reporter.prefs.${id}`
const lastKey = id => `reporter.last.${id}`

function saveLastResult(profileId, result) {
  // Si el resultado es muy grande se guarda solo el resumen
  const full = JSON.stringify(result)
  if (full.length < 2_500_000 && store.set(lastKey(profileId), result)) return
  store.set(lastKey(profileId), { ...result, rows: null })
}

const getDateFields = profile => {
  const types = profile?.field_types || {}
  return (profile?.saved_fields || []).filter(f => f !== 'DocNo' && DATE_TYPES.has(types[f]))
}

const compareValues = (a, b) => String(a ?? '').localeCompare(String(b ?? ''), 'es', { numeric: true, sensitivity: 'base' })

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════

const emptyEditor = () => ({
  profileId: null,
  nombre: '',
  tenantId: '',
  connStatus: 'idle', // idle | connecting | ok | error
  connError: '',
  connectionHeaders: null,
  connectionBaseUrl: '',
  catTree: [],
  selectedCatNos: new Set(),
  catNames: {},
  catFieldOrder: {},
  captionMap: {},
  allCommonFields: [],
  loadingFields: false,
  selectedFields: new Set(['DocNo']),
  groupFields: new Set()
})

export default function ThereforeReporter() {
  const { user } = useAuth()
  const [view, setView] = useState('home') // home | editor | results
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profiles, setProfiles] = useState([])
  const [tenants, setTenants] = useState([])
  const [lastRuns, setLastRuns] = useState({})
  const [editorState, setEditorState] = useState(emptyEditor)
  const catInfoCache = useRef({})

  const [results, setResults] = useState({
    profile: null,
    dateField: '',
    preset: '30d',
    dateFrom: '',
    dateTo: '',
    running: false,
    progress: { pct: 0, label: '' },
    rows: [],
    canonicalFields: [],
    truncated: [],
    prevCount: null,
    ranAt: null,
    ranRange: null,
    fromCache: false
  })

  useEffect(() => {
    if (user) { loadTenants(); loadProfiles(); loadLastRuns() }
  }, [user])

  // ───────────────────────── Datos ─────────────────────────

  const loadTenants = async () => {
    try {
      // La contraseña no se pide: la conexión la hace el servidor
      const { data, error } = await supabase
        .from('tenants')
        .select('id, nombre, url, tenant, usuario, is_on_premise, shared, owner_id')
        .order('nombre', { ascending: true })
      if (error) throw error
      setTenants(data || [])
    } catch (err) {
      handleError(err, 'cargar las instancias')
    }
  }

  const loadProfiles = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('reporter_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setProfiles(data || [])
    } catch (err) {
      handleError(err, 'cargar los informes')
    } finally {
      setLoading(false)
    }
  }

  // Última ejecución correcta de cada informe (del registro de ejecuciones)
  const loadLastRuns = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('report_executions')
        .select('report_name, result_count, created_at, status')
        .eq('user_id', user.id)
        .eq('status', 'success')
        .order('created_at', { ascending: false })
        .limit(300)
      if (error) throw error
      const map = {}
      ;(data || []).forEach(r => { if (!map[r.report_name]) map[r.report_name] = { at: r.created_at, count: r.result_count } })
      setLastRuns(map)
    } catch (err) {
      logger.error('No se pudo leer el historial de ejecuciones:', err.message)
    }
  }

  const tenantName = id => tenants.find(t => t.id === id)?.nombre

  // ─────────────────────── Conexión ───────────────────────
  // 1) El servidor obtiene el token (la contraseña no sale del servidor).
  // 2) Si el servidor no llega a la instancia (on-premise en red interna) o el
  //    servidor local aún no tiene la ruta, se conecta directamente desde aquí.
  const connectTenant = async (tenantId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data } = await axios.post('/api/therefore-connect', { tenantId }, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
      })
      return thereforeService.fromToken(data)
    } catch (err) {
      const status = err.response?.status
      const code = err.response?.data?.code
      const fallback = !err.response || status === 404 || code === 'UNREACHABLE'
      if (!fallback) throw new Error(err.response?.data?.error || err.message)
    }

    const { data: cred, error } = await supabase
      .from('tenants')
      .select('url, tenant, usuario, password, is_on_premise')
      .eq('id', tenantId)
      .single()
    if (error || !cred) throw new Error('Instancia no encontrada')
    const { headers, baseUrl } = await thereforeService.connect(
      cred.url, cred.usuario, cred.password, cred.is_on_premise ? true : (cred.tenant || '')
    )
    return { headers, baseUrl }
  }

  // ───────────────────────── Editor ─────────────────────────

  const extractCategoryNames = (tree) => {
    const names = {}
    const traverse = (items) => {
      if (!items) return
      items.forEach(item => {
        if (item.ItemType === 2 || (!item.ChildItems && item.ItemNo !== undefined)) {
          const catNo = item.ItemNo ?? item.CategoryNo
          if (catNo !== undefined) names[catNo] = item.Name || `#${catNo}`
        }
        if (item.ChildItems) traverse(item.ChildItems)
      })
    }
    traverse(tree)
    return names
  }

  const connectEditor = async (tenantId) => {
    if (!tenantId) return
    catInfoCache.current = {}
    setEditorState(s => ({ ...s, connStatus: 'connecting', connError: '' }))
    try {
      const { headers, baseUrl } = await connectTenant(tenantId)
      const catTree = await thereforeService.getCategoryTree(baseUrl, headers)
      setEditorState(s => ({
        ...s,
        connStatus: 'ok',
        connectionHeaders: headers,
        connectionBaseUrl: baseUrl,
        catTree,
        catNames: { ...s.catNames, ...extractCategoryNames(catTree) }
      }))
    } catch (err) {
      setEditorState(s => ({ ...s, connStatus: 'error', connError: err.message }))
    }
  }

  const openEditor = (profile = null) => {
    const next = profile ? {
      ...emptyEditor(),
      profileId: profile.id,
      nombre: profile.nombre || '',
      tenantId: profile.tenant_id || '',
      selectedCatNos: new Set(profile.saved_cat_nos || []),
      catNames: profile.cat_names || {},
      catFieldOrder: profile.cat_field_order || {},
      captionMap: profile.caption_map || {},
      selectedFields: new Set(profile.saved_fields || ['DocNo']),
      groupFields: new Set(profile.group_fields || [])
    } : emptyEditor()
    setEditorState(next)
    setView('editor')
    if (next.tenantId) connectEditor(next.tenantId)
  }

  const duplicateProfile = (profile) => {
    openEditor(profile)
    setEditorState(s => ({ ...s, profileId: null, nombre: `${profile.nombre} (copia)` }))
  }

  // Carga los campos comunes a las categorías marcadas
  useEffect(() => {
    if (view !== 'editor' || editorState.connStatus !== 'ok') return
    loadCategoryFields()
  }, [view, editorState.connStatus, editorState.selectedCatNos])

  const loadCategoryFields = async () => {
    const cats = [...editorState.selectedCatNos]
    if (cats.length === 0) {
      setEditorState(s => ({ ...s, allCommonFields: [] }))
      return
    }
    setEditorState(s => ({ ...s, loadingFields: true }))
    const fieldMap = new Map()
    const captionMap = { ...editorState.captionMap }
    const catFieldOrder = { ...editorState.catFieldOrder }
    fieldMap.set('DocNo', { caption: 'Nº de documento', type: 0, catNos: cats })

    try {
      for (const catNo of cats) {
        if (!catInfoCache.current[catNo]) {
          const { fields } = await thereforeService.getCategoryInfo(editorState.connectionBaseUrl, editorState.connectionHeaders, catNo)
          catInfoCache.current[catNo] = fields
        }
        const fields = catInfoCache.current[catNo]
        catFieldOrder[catNo] = fields.map(f => f.ColName)
        fields.forEach(f => {
          const caption = f.Caption || f.ColName
          if (!fieldMap.has(f.ColName)) {
            fieldMap.set(f.ColName, { caption, type: f.FieldType || 0, catNos: [] })
            captionMap[f.ColName] = caption
          }
          fieldMap.get(f.ColName).catNos.push(catNo)
        })
      }
      const commonFields = [...fieldMap.entries()]
        .map(([name, v]) => ({ name, ...v }))
        .filter(f => f.name === 'DocNo' || f.catNos.length === cats.length)
      setEditorState(s => ({ ...s, catFieldOrder, captionMap, allCommonFields: commonFields, loadingFields: false }))
    } catch (err) {
      setEditorState(s => ({ ...s, loadingFields: false }))
      handleError(err, 'cargar los campos')
    }
  }

  const toggleCategory = (catNo, checked) => {
    setEditorState(s => {
      const next = new Set(s.selectedCatNos)
      checked ? next.add(catNo) : next.delete(catNo)
      return { ...s, selectedCatNos: next }
    })
  }

  const toggleField = (field, checked) => {
    if (field === 'DocNo') return
    setEditorState(s => {
      const next = new Set(s.selectedFields)
      const groups = new Set(s.groupFields)
      if (checked) next.add(field)
      else { next.delete(field); groups.delete(field) }
      return { ...s, selectedFields: next, groupFields: groups }
    })
  }

  const toggleGroup = (field, checked) => {
    setEditorState(s => {
      const groups = new Set(s.groupFields)
      const fields = new Set(s.selectedFields)
      if (checked) { groups.add(field); fields.add(field) } else groups.delete(field)
      return { ...s, groupFields: groups, selectedFields: fields }
    })
  }

  const saveProfile = async () => {
    const nombre = editorState.nombre.trim()
    if (!nombre) return message.error('Ponle un nombre al informe')
    if (!editorState.tenantId) return message.error('Elige la instancia de Therefore™')
    if (editorState.selectedCatNos.size === 0) return message.error('Marca al menos una categoría')

    setSaving(true)
    try {
      const fieldTypes = {}
      editorState.allCommonFields.forEach(f => { fieldTypes[f.name] = f.type })
      const data = {
        nombre,
        tenant_id: editorState.tenantId,
        saved_cat_nos: [...editorState.selectedCatNos],
        saved_fields: [...editorState.selectedFields],
        group_fields: [...editorState.groupFields],
        caption_map: editorState.captionMap,
        cat_field_order: editorState.catFieldOrder,
        cat_names: editorState.catNames,
        field_types: fieldTypes
      }
      if (editorState.profileId) {
        const { error } = await supabase.from('reporter_profiles')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', editorState.profileId)
        if (error) throw error
        message.success('Informe actualizado')
      } else {
        const { error } = await supabase.from('reporter_profiles')
          .insert([{ user_id: user.id, ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
        if (error) throw error
        message.success('Informe creado')
      }
      await loadProfiles()
      setView('home')
    } catch (err) {
      handleError(err, 'guardar el informe')
    } finally {
      setSaving(false)
    }
  }

  const confirmDeleteProfile = (profile) => Modal.confirm({
    title: `¿Eliminar el informe «${profile.nombre}»?`,
    content: 'Se borrará la selección de categorías y campos guardada. Esta acción no se puede deshacer.',
    okText: 'Eliminar', okButtonProps: { danger: true }, cancelText: 'Cancelar',
    onOk: async () => {
      try {
        const { error } = await supabase.from('reporter_profiles').delete().eq('id', profile.id)
        if (error) throw error
        try { localStorage.removeItem(prefsKey(profile.id)); localStorage.removeItem(lastKey(profile.id)) } catch { /* sin almacenamiento */ }
        setProfiles(ps => ps.filter(p => p.id !== profile.id))
        message.success('Informe eliminado')
      } catch (err) {
        handleError(err, 'eliminar el informe')
      }
    }
  })

  // ──────────────────────── Resultados ────────────────────────

  const openResults = (profile) => {
    const dateFields = getDateFields(profile)
    const prefs = store.get(prefsKey(profile.id)) || {}
    const last = store.get(lastKey(profile.id))
    const dateField = dateFields.includes(prefs.dateField) ? prefs.dateField : (dateFields[0] || '')
    const preset = prefs.preset || '30d'
    const range = preset === 'custom' && prefs.dateFrom ? { from: prefs.dateFrom, to: prefs.dateTo } : rangeFor(preset)

    const cached = last?.rows ? last : null
    setResults({
      profile,
      dateField: cached?.dateField && dateFields.includes(cached.dateField) ? cached.dateField : dateField,
      preset: cached?.preset || preset,
      dateFrom: cached?.dateFrom || range.from,
      dateTo: cached?.dateTo || range.to,
      running: false,
      progress: { pct: 0, label: '' },
      rows: cached?.rows || [],
      canonicalFields: cached?.canonicalFields || [],
      truncated: cached?.truncated || [],
      prevCount: cached?.prevCount ?? null,
      ranAt: cached?.at || null,
      ranRange: cached ? { from: cached.dateFrom, to: cached.dateTo } : null,
      fromCache: !!cached
    })
    setView('results')
    // Sin resultado guardado: se ejecuta directamente con el periodo habitual
    if (!cached && dateField) runQuery(profile, { dateField, preset, dateFrom: range.from, dateTo: range.to })
  }

  const setPreset = (preset) => {
    if (preset === 'custom') return setResults(s => ({ ...s, preset }))
    const r = rangeFor(preset)
    setResults(s => ({ ...s, preset, dateFrom: r.from, dateTo: r.to }))
  }

  const runQuery = async (profile, { dateField, preset, dateFrom, dateTo }) => {
    if (!dateField) return message.error('Elige el campo de fecha')
    if (!dateFrom || !dateTo) return message.error('Indica el periodo')
    if (dateFrom > dateTo) return message.error('La fecha «Desde» es posterior a «Hasta»')

    const onProgress = (pct, label) => setResults(s => ({ ...s, progress: { pct, label } }))
    setResults(s => ({ ...s, running: true, progress: { pct: 5, label: 'Conectando con Therefore™…' } }))
    store.set(prefsKey(profile.id), { dateField, preset, dateFrom, dateTo })

    const startTime = Date.now()
    const tenant = tenants.find(t => t.id === profile.tenant_id)
    const cats = profile.saved_cat_nos || []
    const buildQueries = (from, to) => cats.map(catNo => ({
      CategoryNo: catNo,
      Mode: 0,
      MaxRows: MAX_PER_CAT,
      Conditions: [{ FieldNoOrName: dateField, Operator: 0, Condition: `${from} TO ${to}` }]
    }))

    try {
      const { headers, baseUrl } = await connectTenant(profile.tenant_id)
      const { rows, canonicalFields, error } = await thereforeService.executeMultiQuery(
        baseUrl, headers, buildQueries(dateFrom, dateTo), profile.saved_fields || [], onProgress
      )
      if (error) throw new Error(error)

      // ¿Alguna categoría ha llegado al máximo?
      const perCat = {}
      rows.forEach(r => { perCat[r._cat] = (perCat[r._cat] || 0) + 1 })
      const truncated = Object.entries(perCat).filter(([, n]) => n >= MAX_PER_CAT).map(([c]) => c)
      if (rows.length >= MAX_TOTAL) truncated.push('*')

      // Comparación con el periodo anterior (solo se cuentan documentos)
      let prevCount = null
      try {
        onProgress(95, 'Comparando con el periodo anterior…')
        const prev = previousRange(dateFrom, dateTo)
        const r = await thereforeService.executeMultiQuery(baseUrl, headers, buildQueries(prev.from, prev.to), ['DocNo'])
        if (!r.error) prevCount = r.rows.length
      } catch { /* la comparación es opcional */ }

      const at = new Date().toISOString()
      setResults(s => ({
        ...s, running: false, progress: { pct: 100, label: 'Completado' },
        rows, canonicalFields, truncated, prevCount, ranAt: at, ranRange: { from: dateFrom, to: dateTo }, fromCache: false
      }))
      saveLastResult(profile.id, { at, dateField, preset, dateFrom, dateTo, rows, canonicalFields, truncated, prevCount, count: rows.length })

      await logReportExecution({
        userId: user.id,
        userName: user.email?.split('@')[0] || 'Usuario',
        tenantName: tenant?.nombre || '',
        reportName: profile.nombre,
        categoryNo: cats[0],
        categoryName: profile.cat_names?.[cats[0]] || 'Varias',
        condition: `${dateField}: ${dateFrom} TO ${dateTo}`,
        resultCount: rows.length,
        executionTimeMs: Date.now() - startTime,
        status: 'success'
      })
      setLastRuns(m => ({ ...m, [profile.nombre]: { at, count: rows.length } }))
    } catch (err) {
      setResults(s => ({ ...s, running: false }))
      handleError(err, 'ejecutar el informe')
      if (user) {
        await logReportExecution({
          userId: user.id,
          userName: user.email?.split('@')[0] || 'Usuario',
          tenantName: tenant?.nombre || '',
          reportName: profile.nombre,
          categoryNo: cats[0] || 0,
          categoryName: profile.cat_names?.[cats[0]] || '',
          condition: `${dateField}: ${dateFrom} TO ${dateTo}`,
          resultCount: 0,
          executionTimeMs: Date.now() - startTime,
          status: 'error',
          errorMessage: err.message
        })
      }
    }
  }

  // ───────────────────────── Vistas ─────────────────────────

  if (view === 'editor') {
    return (
      <EditorView
        state={editorState}
        tenants={tenants}
        saving={saving}
        onNameChange={nombre => setEditorState(s => ({ ...s, nombre }))}
        onTenantChange={tenantId => {
          setEditorState(s => ({ ...s, tenantId, selectedCatNos: new Set(), allCommonFields: [], catTree: [], connStatus: 'idle' }))
          connectEditor(tenantId)
        }}
        onRetry={() => connectEditor(editorState.tenantId)}
        onToggleCategory={toggleCategory}
        onToggleField={toggleField}
        onToggleGroup={toggleGroup}
        onSave={saveProfile}
        onBack={() => setView('home')}
      />
    )
  }

  if (view === 'results') {
    return (
      <ResultsView
        results={results}
        tenantName={tenantName(results.profile?.tenant_id)}
        onDateFieldChange={dateField => setResults(s => ({ ...s, dateField }))}
        onPreset={setPreset}
        onDateFrom={v => setResults(s => ({ ...s, dateFrom: v, preset: 'custom' }))}
        onDateTo={v => setResults(s => ({ ...s, dateTo: v, preset: 'custom' }))}
        onRun={() => runQuery(results.profile, results)}
        onEdit={() => openEditor(results.profile)}
        onBack={() => setView('home')}
      />
    )
  }

  // Lista de informes
  return (
    <div className="rp-page">
      <div className="header-main">
        <div>
          <h1 className="header-title">Generador de informes</h1>
          <p className="header-subtitle">Informes de documentos de Therefore™ por periodo, con gráficos y exportación a Excel.</p>
        </div>
        <div className="header-actions">
          <HelpButton section="thereforeReporter" />
          <Tooltip title="Recargar instancias y ejecuciones">
            <Button icon={<ReloadOutlined />} onClick={() => { loadTenants(); loadLastRuns() }} aria-label="Recargar" />
          </Tooltip>
          <button className="btn-primary" onClick={() => openEditor()}>
            <PlusOutlined /> Nuevo informe
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rp-center"><Spin /></div>
      ) : profiles.length === 0 ? (
        <div className="rp-empty">
          <p className="cell-title">Aún no hay informes</p>
          <p className="cell-muted">Un informe guarda qué categorías y campos consultar. Después lo ejecutas para el periodo que quieras.</p>
          <button className="btn-primary" onClick={() => openEditor()}><PlusOutlined /> Crear el primero</button>
        </div>
      ) : (
        <ul className="row-list" aria-label="Informes">
          {profiles.map(p => {
            const cats = (p.saved_cat_nos || []).length
            const fields = (p.saved_fields || []).length
            const run = lastRuns[p.nombre] || (() => { const l = store.get(lastKey(p.id)); return l ? { at: l.at, count: l.count ?? l.rows?.length } : null })()
            return (
              <li key={p.id} className="row-list-item">
                <span className="home-action-icon" aria-hidden="true"><BarChartOutlined /></span>
                <div className="cell-stack" style={{ flex: 1, minWidth: 0 }}>
                  <span className="cell-title">{p.nombre || 'Informe sin nombre'}</span>
                  <span className="cell-sub">
                    {tenantName(p.tenant_id) || 'Instancia no disponible'} · {cats} {cats === 1 ? 'categoría' : 'categorías'} · {fields} {fields === 1 ? 'campo' : 'campos'}
                  </span>
                </div>
                <span className="cell-muted row-list-meta rp-run-meta">
                  {run ? (
                    <Tooltip title={formatFullDate(run.at)}>
                      <span>{formatRelative(run.at)} · {nf(run.count)} docs</span>
                    </Tooltip>
                  ) : 'Sin ejecutar'}
                </span>
                <button className="btn-default" onClick={() => openResults(p)}>
                  <CaretRightOutlined /> Abrir
                </button>
                <Dropdown
                  trigger={['click']}
                  placement="bottomRight"
                  menu={{ items: [
                    { key: 'edit', icon: <EditOutlined />, label: 'Editar', onClick: () => openEditor(p) },
                    { key: 'dup', icon: <CopyOutlined />, label: 'Duplicar', onClick: () => duplicateProfile(p) },
                    { type: 'divider' },
                    { key: 'delete', icon: <DeleteOutlined />, label: 'Eliminar', danger: true, onClick: () => confirmDeleteProfile(p) }
                  ] }}
                >
                  <Button type="text" size="small" icon={<MoreOutlined />} aria-label={`Acciones: ${p.nombre}`} />
                </Dropdown>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// EDITOR: categorías a la izquierda, campos a la derecha
// ═══════════════════════════════════════════════════════════

function EditorView({ state, tenants, saving, onNameChange, onTenantChange, onRetry, onToggleCategory, onToggleField, onToggleGroup, onSave, onBack }) {
  const [openFolders, setOpenFolders] = useState(new Set())
  const [catSearch, setCatSearch] = useState('')
  const [fieldSearch, setFieldSearch] = useState('')

  const toggleFolder = key => setOpenFolders(prev => {
    const next = new Set(prev)
    next.has(key) ? next.delete(key) : next.add(key)
    return next
  })

  const q = catSearch.trim().toLowerCase()
  const nodeMatches = (node) => {
    const children = node.ChildItems || node.SubCategories || node.Children || []
    if ((node.Name || '').toLowerCase().includes(q)) return true
    return children.some(nodeMatches)
  }

  const renderTree = (tree, level = 0, path = '') => tree.map((node, i) => {
    const catNo = node.ItemNo ?? node.CategoryNo
    const children = node.ChildItems || node.SubCategories || node.Children || []
    const isFolder = node.ItemType === 1 || (children.length && node.ItemType !== 2)
    if (q && !nodeMatches(node)) return null
    if (isFolder) {
      const key = `${path}/${node.Name || i}`
      const open = q ? true : openFolders.has(key)
      return (
        <div key={key}>
          <button type="button" className="rp-tree-row rp-tree-folder" style={{ paddingLeft: 8 + level * 16 }} onClick={() => toggleFolder(key)} aria-expanded={open}>
            {open ? <CaretDownOutlined /> : <CaretRightOutlined />}
            <FolderOutlined />
            <span>{node.Name}</span>
          </button>
          {open && renderTree(children, level + 1, key)}
        </div>
      )
    }
    if (catNo === undefined) return null
    return (
      <label key={catNo} className="rp-tree-row" style={{ paddingLeft: 8 + level * 16 + 18 }}>
        <Checkbox checked={state.selectedCatNos.has(catNo)} onChange={e => onToggleCategory(catNo, e.target.checked)} />
        <FileTextOutlined className="cell-muted" />
        <span>{node.Name || `Categoría ${catNo}`}</span>
      </label>
    )
  })

  const fq = fieldSearch.trim().toLowerCase()
  const fields = [...state.allCommonFields]
    .sort((a, b) => (a.name === 'DocNo' ? -1 : b.name === 'DocNo' ? 1 : a.caption.localeCompare(b.caption)))
    .filter(f => !fq || f.caption.toLowerCase().includes(fq))
  const hasDateField = state.allCommonFields.some(f => DATE_TYPES.has(f.type) && state.selectedFields.has(f.name))

  return (
    <div className="rp-page">
      <div className="header-main">
        <div>
          <button className="btn-link rp-back" onClick={onBack}><ArrowLeftOutlined /> Informes</button>
          <h1 className="header-title">{state.nombre.trim() || (state.profileId ? 'Informe' : 'Nuevo informe')}</h1>
        </div>
        <div className="header-actions">
          <HelpButton section="thereforeReporter" />
          <button className="btn-default" onClick={onBack} disabled={saving}>Cancelar</button>
          <button className="btn-primary" onClick={onSave} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </div>

      <div className="rp-props">
        <label className="rp-prop">
          <span className="rp-label">Nombre</span>
          <Input value={state.nombre} onChange={e => onNameChange(e.target.value)} placeholder="p. ej. Notificaciones por estado" />
        </label>
        <label className="rp-prop">
          <span className="rp-label">Instancia de Therefore™</span>
          <Select
            value={state.tenantId || undefined}
            onChange={onTenantChange}
            placeholder="Elige una instancia"
            options={tenants.map(t => ({ label: t.nombre, value: t.id }))}
            showSearch
            optionFilterProp="label"
          />
        </label>
        <div className="rp-conn" aria-live="polite">
          {state.connStatus === 'connecting' && <><Spin size="small" /> <span className="cell-muted">Conectando…</span></>}
          {state.connStatus === 'ok' && <><span className="status-dot status-dot--active" /> <span className="cell-muted">Conectado</span></>}
          {state.connStatus === 'error' && (
            <>
              <span className="status-dot status-dot--error" />
              <span className="rp-conn-error" title={state.connError}>{state.connError || 'No se pudo conectar'}</span>
              <button className="btn-link" onClick={onRetry}>Reintentar</button>
            </>
          )}
        </div>
      </div>

      <div className="rp-editor">
        <section className="rp-col" aria-label="Categorías">
          <header className="rp-col-head">
            <span className="rp-col-title">Categorías</span>
            <span className="cell-muted">{state.selectedCatNos.size} marcadas</span>
          </header>
          {state.connStatus === 'ok' && (
            <div className="rp-col-search">
              <Input size="small" prefix={<SearchOutlined className="cell-muted" />} placeholder="Buscar categoría…" value={catSearch} onChange={e => setCatSearch(e.target.value)} allowClear />
            </div>
          )}
          <div className="rp-col-body">
            {state.connStatus === 'ok' ? renderTree(state.catTree) : (
              <div className="rp-col-empty">
                {state.tenantId ? (state.connStatus === 'connecting' ? 'Cargando categorías…' : 'Sin conexión con la instancia') : 'Elige una instancia para ver sus categorías'}
              </div>
            )}
          </div>
        </section>

        <section className="rp-col" aria-label="Campos del informe">
          <header className="rp-col-head">
            <span className="rp-col-title">Campos del informe</span>
            <span className="cell-muted">{state.selectedFields.size} campos · {state.groupFields.size} gráficos</span>
          </header>
          {state.allCommonFields.length > 0 && (
            <div className="rp-col-search">
              <Input size="small" prefix={<SearchOutlined className="cell-muted" />} placeholder="Buscar campo…" value={fieldSearch} onChange={e => setFieldSearch(e.target.value)} allowClear />
            </div>
          )}
          {state.allCommonFields.length > 0 && !hasDateField && (
            <div className="rp-col-hint">Incluye al menos un campo de fecha: es el que se usa para filtrar por periodo.</div>
          )}
          <div className="rp-col-body">
            {state.loadingFields && state.allCommonFields.length === 0 ? (
              <div className="rp-col-empty"><Spin size="small" /></div>
            ) : state.allCommonFields.length === 0 ? (
              <div className="rp-col-empty">Marca una o varias categorías. Aquí aparecen los campos que tienen en común.</div>
            ) : (
              <>
                <div className="rp-field-row rp-field-head">
                  <span />
                  <span>Campo</span>
                  <span>Gráfico</span>
                </div>
                {fields.map(f => {
                  const isDoc = f.name === 'DocNo'
                  const isDate = DATE_TYPES.has(f.type)
                  return (
                    <div key={f.name} className="rp-field-row">
                      <Checkbox checked={isDoc || state.selectedFields.has(f.name)} disabled={isDoc} onChange={e => onToggleField(f.name, e.target.checked)} aria-label={`Incluir ${f.caption}`} />
                      <span className="rp-field-name">
                        {f.caption}
                        {isDate && <span className="tag-neutral-inline">Fecha</span>}
                      </span>
                      {isDoc || isDate ? <span /> : (
                        <Checkbox checked={state.groupFields.has(f.name)} onChange={e => onToggleGroup(f.name, e.target.checked)} aria-label={`Gráfico por ${f.caption}`} />
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// RESULTADOS
// ═══════════════════════════════════════════════════════════

function ResultsView({ results, tenantName, onDateFieldChange, onPreset, onDateFrom, onDateTo, onRun, onEdit, onBack }) {
  const { profile, running, progress, rows } = results
  const captionMap = profile?.caption_map || {}
  const catNames = profile?.cat_names || {}
  const dateFields = getDateFields(profile)
  const cats = (profile?.saved_cat_nos || []).length

  return (
    <div className="rp-page">
      <div className="header-main">
        <div style={{ minWidth: 0 }}>
          <button className="btn-link rp-back" onClick={onBack}><ArrowLeftOutlined /> Informes</button>
          <h1 className="header-title">{profile?.nombre}</h1>
          <p className="header-subtitle">{tenantName || 'Instancia no disponible'} · {cats} {cats === 1 ? 'categoría' : 'categorías'}</p>
        </div>
        <div className="header-actions">
          <HelpButton section="thereforeReporter" />
          <button className="btn-default" onClick={onEdit} disabled={running}><EditOutlined /> Editar informe</button>
        </div>
      </div>

      {dateFields.length === 0 ? (
        <Alert
          type="info"
          showIcon
          message="Este informe no tiene ningún campo de fecha"
          description="Edita el informe e incluye un campo de tipo fecha: es el que se usa para elegir el periodo."
          action={<button className="btn-default" onClick={onEdit}>Editar informe</button>}
        />
      ) : (
        <div className="rp-filters">
          <label className="rp-filter">
            <span className="rp-label">Fecha</span>
            <Select value={results.dateField || undefined} onChange={onDateFieldChange} style={{ minWidth: 180 }}
              options={dateFields.map(f => ({ label: captionMap[f] || f, value: f }))} disabled={running} />
          </label>
          <div className="rp-filter">
            <span className="rp-label">Periodo</span>
            <Segmented value={results.preset} onChange={onPreset} options={PRESETS} disabled={running} />
          </div>
          <div className="rp-filter rp-dates">
            <span className="rp-label">Desde – hasta</span>
            <div className="rp-date-pair">
              <input type="date" className="rp-date" value={results.dateFrom} onChange={e => onDateFrom(e.target.value)} disabled={running} aria-label="Desde" />
              <span className="cell-muted">–</span>
              <input type="date" className="rp-date" value={results.dateTo} onChange={e => onDateTo(e.target.value)} disabled={running} aria-label="Hasta" />
            </div>
          </div>
          <button className="btn-primary rp-run" onClick={onRun} disabled={running}>
            {running ? 'Ejecutando…' : results.ranAt ? <><ReloadOutlined /> Actualizar</> : <><CaretRightOutlined /> Ejecutar</>}
          </button>
        </div>
      )}

      {running && (
        <div className="rp-progress" role="status">
          <div className="cell-muted">{progress.label}</div>
          <div className="rp-progress-track"><div className="rp-progress-bar" style={{ width: `${progress.pct}%` }} /></div>
        </div>
      )}

      {!running && results.ranAt && (
        <div className="rp-ran cell-muted">
          {results.fromCache ? 'Resultado guardado' : 'Ejecutado'} {formatRelative(results.ranAt)}
          {results.ranRange && <> · periodo {fmtRange(results.ranRange.from, results.ranRange.to)}</>}
          {results.fromCache && <> · pulsa <strong>Actualizar</strong> para volver a consultar</>}
        </div>
      )}

      {!running && results.truncated.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message="El informe puede estar incompleto"
          description={results.truncated.includes('*')
            ? `Se ha llegado al máximo de ${nf(MAX_TOTAL)} documentos. Acorta el periodo para ver todos.`
            : `${results.truncated.map(c => catNames[c] || `Categoría ${c}`).join(', ')} ${results.truncated.length === 1 ? 'ha llegado' : 'han llegado'} al máximo de ${nf(MAX_PER_CAT)} documentos por categoría. Acorta el periodo para ver todos.`}
        />
      )}

      {!running && results.ranAt && rows.length === 0 && (
        <div className="rp-empty">
          <p className="cell-title">No hay documentos en este periodo</p>
          <p className="cell-muted">Prueba con un periodo más amplio u otro campo de fecha.</p>
        </div>
      )}

      {rows.length > 0 && !running && (
        <Dashboard results={results} catNames={catNames} captionMap={captionMap} />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// PANEL: cifras, gráficos (clic = filtrar) y tabla
// ═══════════════════════════════════════════════════════════

function Dashboard({ results, catNames, captionMap }) {
  const { rows, canonicalFields, profile, dateField, prevCount, ranRange } = results
  const groupFields = (profile?.group_fields || []).filter(f => canonicalFields.includes(f))
  const [filters, setFilters] = useState([]) // [{ key, value, label }]
  const [search, setSearch] = useState('')

  useEffect(() => { setFilters([]); setSearch('') }, [rows])

  // Agrupación por fecha: por día si el periodo es corto, por mes si es largo
  const byMonth = useMemo(() => {
    if (!ranRange) return false
    return (parseIsoDay(ranRange.to) - parseIsoDay(ranRange.from)) / 86400000 > 62
  }, [ranRange])

  const dateBucket = (row) => {
    const d = parseDateValue(row[dateField])
    if (!d) return '(sin fecha)'
    return byMonth ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}` : isoDay(d)
  }
  const bucketLabel = (b) => {
    if (b === '(sin fecha)') return b
    if (byMonth) { const [y, m] = b.split('-'); return `${MONTHS[+m - 1]} ${y.slice(2)}` }
    return fmtDay(b)
  }

  const valueOf = (row, key) => {
    if (key === '_cat') return String(row._cat)
    if (key === '__date') return dateBucket(row)
    const v = row[key]
    return v === undefined || v === null || v === '' ? '(vacío)' : String(v)
  }

  const applyFilters = (list, exceptKey) => list.filter(r => filters.every(f => f.key === exceptKey || valueOf(r, f.key) === f.value))
  const filteredRows = useMemo(() => applyFilters(rows), [rows, filters])

  const toggleFilter = (key, value, label) => setFilters(fs => {
    const exists = fs.find(f => f.key === key && f.value === value)
    if (exists) return fs.filter(f => f !== exists)
    return [...fs.filter(f => f.key !== key), { key, value, label }]
  })
  const activeValue = key => filters.find(f => f.key === key)?.value

  const countBy = (list, key) => {
    const out = {}
    list.forEach(r => { const v = valueOf(r, key); out[v] = (out[v] || 0) + 1 })
    return out
  }

  // Cifras
  const total = rows.length
  const shown = filteredRows.length
  const catsWithData = new Set(filteredRows.map(r => r._cat)).size
  const delta = prevCount != null && prevCount > 0 ? Math.round(((total - prevCount) / prevCount) * 100) : null

  // Tabla
  const sq = search.trim().toLowerCase()
  const visibleRows = useMemo(() => !sq ? filteredRows : filteredRows.filter(r =>
    canonicalFields.some(f => String(r[f] ?? '').toLowerCase().includes(sq)) || (catNames[r._cat] || '').toLowerCase().includes(sq)
  ), [filteredRows, sq])

  const columns = [
    {
      title: 'Categoría', key: '_cat', width: 180, fixed: 'left',
      sorter: (a, b) => compareValues(catNames[a._cat], catNames[b._cat]),
      render: (_, r) => <span className="tag-neutral-inline">{catNames[r._cat] || `Categoría ${r._cat}`}</span>
    },
    ...canonicalFields.map(f => ({
      title: f === 'DocNo' ? 'Nº doc.' : (captionMap[f] || f),
      dataIndex: f,
      key: f,
      ellipsis: true,
      sorter: (a, b) => compareValues(a[f], b[f]),
      render: v => (f === 'DocNo' ? <span className="cell-mono">{v}</span> : (v || <span className="cell-muted">—</span>))
    }))
  ]

  // Exportación (lo que se ve: filtros + búsqueda)
  const exportBase = `${(profile?.nombre || 'informe').replace(/[\\/:*?"<>|]+/g, '_')}_${isoDay(new Date())}`
  const headers = ['Categoría', ...canonicalFields.map(f => (f === 'DocNo' ? 'Nº documento' : (captionMap[f] || f)))]
  const toMatrix = list => list.map(r => [catNames[r._cat] || r._cat, ...canonicalFields.map(f => r[f] ?? '')])

  const exportCSV = () => {
    const esc = v => '"' + String(v).replace(/"/g, '""') + '"'
    const lines = [headers.map(esc).join(';'), ...toMatrix(visibleRows).map(r => r.map(esc).join(';'))]
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${exportBase}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const exportExcel = async () => {
    try {
      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()

      const summary = [
        ['Informe', profile?.nombre || ''],
        ['Periodo', ranRange ? `${ranRange.from} a ${ranRange.to}` : ''],
        ['Campo de fecha', captionMap[dateField] || dateField],
        ['Documentos', visibleRows.length],
        ...(filters.length || sq ? [['Filtros', [...filters.map(f => f.label), ...(sq ? [`Búsqueda: ${search}`] : [])].join(' · ')]] : []),
        ['Generado', new Date().toLocaleString('es-ES')],
        [],
        ['Categoría', 'Documentos'],
        ...Object.entries(countBy(visibleRows, '_cat')).sort((a, b) => b[1] - a[1]).map(([c, n]) => [catNames[c] || c, n])
      ]
      groupFields.forEach(f => {
        summary.push([], [captionMap[f] || f, 'Documentos'])
        Object.entries(countBy(visibleRows, f)).sort((a, b) => b[1] - a[1]).forEach(([v, n]) => summary.push([v, n]))
      })
      const wsSum = XLSX.utils.aoa_to_sheet(summary)
      wsSum['!cols'] = [{ wch: 36 }, { wch: 18 }]
      XLSX.utils.book_append_sheet(wb, wsSum, 'Resumen')

      const wsData = XLSX.utils.aoa_to_sheet([headers, ...toMatrix(visibleRows)])
      wsData['!cols'] = headers.map(h => ({ wch: Math.min(40, Math.max(12, h.length + 2)) }))
      XLSX.utils.book_append_sheet(wb, wsData, 'Datos')

      XLSX.writeFile(wb, `${exportBase}.xlsx`)
    } catch (err) {
      handleError(err, 'exportar a Excel')
    }
  }

  // Datos de gráficos: cada gráfico ignora su propio filtro para poder cambiarlo
  const dateData = dateField && canonicalFields.includes(dateField) ? countBy(applyFilters(rows, '__date'), '__date') : null
  const catData = countBy(applyFilters(rows, '_cat'), '_cat')

  return (
    <div className="rp-dash">
      <div className="rp-kpis">
        <div className="rp-kpi">
          <span className="rp-kpi-label">Documentos</span>
          <span className="rp-kpi-value">{nf(shown)}{shown !== total && <span className="rp-kpi-of"> de {nf(total)}</span>}</span>
          {delta !== null && shown === total ? (
            <span className={`rp-kpi-delta ${delta > 0 ? 'is-up' : delta < 0 ? 'is-down' : ''}`}>
              {delta > 0 ? '+' : ''}{delta} % frente al periodo anterior ({nf(prevCount)})
            </span>
          ) : prevCount === 0 && shown === total ? (
            <span className="rp-kpi-delta">Sin documentos en el periodo anterior</span>
          ) : <span className="rp-kpi-delta">&nbsp;</span>}
        </div>
        <div className="rp-kpi">
          <span className="rp-kpi-label">Categorías con datos</span>
          <span className="rp-kpi-value">{catsWithData}<span className="rp-kpi-of"> de {(profile?.saved_cat_nos || []).length}</span></span>
          <span className="rp-kpi-delta">&nbsp;</span>
        </div>
        <div className="rp-kpi">
          <span className="rp-kpi-label">Periodo</span>
          <span className="rp-kpi-value rp-kpi-value--text">{ranRange ? fmtRange(ranRange.from, ranRange.to) : '—'}</span>
          <span className="rp-kpi-delta">por {captionMap[dateField] || dateField}</span>
        </div>
      </div>

      {filters.length > 0 && (
        <div className="rp-chips" aria-label="Filtros activos">
          {filters.map(f => (
            <button key={f.key} className="rp-chip" onClick={() => toggleFilter(f.key, f.value)} aria-label={`Quitar filtro ${f.label}`}>
              {f.label} <CloseOutlined />
            </button>
          ))}
          <button className="btn-link" onClick={() => setFilters([])}>Quitar filtros</button>
        </div>
      )}

      {dateData && Object.keys(dateData).length > 0 && (
        <TimeChart
          title={`Documentos por ${byMonth ? 'mes' : 'día'}`}
          data={dateData}
          from={ranRange?.from}
          to={ranRange?.to}
          byMonth={byMonth}
          labelOf={bucketLabel}
          active={activeValue('__date')}
          onPick={(b) => toggleFilter('__date', b, `${byMonth ? 'Mes' : 'Día'}: ${bucketLabel(b)}`)}
        />
      )}

      <div className="rp-charts">
        <BarChart
          title="Por categoría"
          data={catData}
          labelOf={c => catNames[c] || `Categoría ${c}`}
          active={activeValue('_cat')}
          onPick={c => toggleFilter('_cat', c, `Categoría: ${catNames[c] || c}`)}
        />
        {groupFields.map(f => (
          <BarChart
            key={f}
            title={`Por ${captionMap[f] || f}`}
            data={countBy(applyFilters(rows, f), f)}
            active={activeValue(f)}
            onPick={v => toggleFilter(f, v, `${captionMap[f] || f}: ${v}`)}
          />
        ))}
      </div>

      <section className="rp-table-wrap" aria-label="Documentos">
        <header className="rp-table-head">
          <span className="rp-col-title">Documentos</span>
          <span className="cell-muted">{nf(visibleRows.length)}</span>
          <div style={{ flex: 1 }} />
          <Input size="small" prefix={<SearchOutlined className="cell-muted" />} placeholder="Buscar en los resultados…"
            value={search} onChange={e => setSearch(e.target.value)} allowClear style={{ width: 240 }} aria-label="Buscar en los resultados" />
          <Dropdown trigger={['click']} placement="bottomRight" menu={{ items: [
            { key: 'xlsx', label: 'Excel (.xlsx) con resumen', onClick: exportExcel },
            { key: 'csv', label: 'CSV', onClick: exportCSV }
          ] }}>
            <Button size="small" icon={<DownloadOutlined />}>Exportar</Button>
          </Dropdown>
        </header>
        <Table
          className="data-table"
          size="small"
          columns={columns}
          dataSource={visibleRows}
          rowKey={(r) => `${r._cat}-${r.DocNo}`}
          scroll={{ x: 'max-content' }}
          pagination={{ defaultPageSize: 50, pageSizeOptions: [25, 50, 100, 200], showSizeChanger: true, showTotal: (t, [a, b]) => `${nf(a)}–${nf(b)} de ${nf(t)}` }}
        />
      </section>
    </div>
  )
}

// Barras horizontales: clic en una barra = filtrar
function BarChart({ title, data, labelOf = v => v, active, onPick }) {
  const [expanded, setExpanded] = useState(false)
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1])
  const list = expanded ? sorted : sorted.slice(0, 10)
  const max = sorted[0]?.[1] || 1

  return (
    <section className="rp-chart" aria-label={title}>
      <header className="rp-chart-head">
        <span className="rp-col-title">{title}</span>
        <span className="cell-muted">{sorted.length} {sorted.length === 1 ? 'valor' : 'valores'}</span>
      </header>
      <div className="rp-bars">
        {list.map(([value, count]) => {
          const label = labelOf(value)
          const isActive = active === value
          return (
            <button key={value} type="button" className={`rp-bar ${isActive ? 'is-active' : ''} ${active && !isActive ? 'is-dim' : ''}`}
              onClick={() => onPick(value)} aria-pressed={isActive} title={`${label}: ${nf(count)}`}>
              <span className="rp-bar-label">{label}</span>
              <span className="rp-bar-track"><span className="rp-bar-fill" style={{ width: `${Math.max(2, (count / max) * 100)}%` }} /></span>
              <span className="rp-bar-value">{nf(count)}</span>
            </button>
          )
        })}
      </div>
      {sorted.length > 10 && (
        <button className="btn-link rp-more" onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Ver menos' : `Ver los ${sorted.length} valores`}
        </button>
      )}
    </section>
  )
}

// Columnas por día o mes, rellenando los huecos del periodo
function TimeChart({ title, data, from, to, byMonth, labelOf, active, onPick }) {
  const buckets = useMemo(() => {
    if (!from || !to) return Object.keys(data).sort()
    const out = []
    const end = parseIsoDay(to)
    if (byMonth) {
      let d = new Date(parseIsoDay(from).getFullYear(), parseIsoDay(from).getMonth(), 1)
      while (d <= end) { out.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`); d = new Date(d.getFullYear(), d.getMonth() + 1, 1) }
    } else {
      let d = parseIsoDay(from)
      while (d <= end) { out.push(isoDay(d)); d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1) }
    }
    if (data['(sin fecha)']) out.push('(sin fecha)')
    return out
  }, [data, from, to, byMonth])

  const max = Math.max(1, ...buckets.map(b => data[b] || 0))
  const every = Math.ceil(buckets.length / 12)

  return (
    <section className="rp-chart rp-chart--time" aria-label={title}>
      <header className="rp-chart-head">
        <span className="rp-col-title">{title}</span>
        <span className="cell-muted">pico de {nf(max)}</span>
      </header>
      <div className="rp-cols">
        {buckets.map((b, i) => {
          const n = data[b] || 0
          const isActive = active === b
          return (
            <button key={b} type="button" className={`rp-colbar ${isActive ? 'is-active' : ''} ${active && !isActive ? 'is-dim' : ''}`}
              onClick={() => n && onPick(b)} disabled={!n} aria-pressed={isActive} title={`${labelOf(b)}: ${nf(n)}`}>
              <span className="rp-colbar-fill" style={{ height: `${n ? Math.max(3, (n / max) * 100) : 0}%` }} />
              <span className="rp-colbar-label">{i % every === 0 ? labelOf(b) : ''}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
