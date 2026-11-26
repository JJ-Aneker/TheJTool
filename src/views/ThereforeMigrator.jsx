// src/views/ThereforeMigrator.jsx
// Migrador de documentos entre categorías de Therefore™ (o descarga a una carpeta)
import { useEffect, useMemo, useRef, useState } from 'react'
import { Select, InputNumber, Checkbox, Alert, Table, Tooltip, Modal, Dropdown, Button, Spin, Input } from 'antd'
import {
  PlusOutlined, ArrowLeftOutlined, ArrowRightOutlined, CheckOutlined, MoreOutlined, DeleteOutlined,
  SwapOutlined, CopyOutlined, FolderOpenOutlined, DownloadOutlined, EyeOutlined, PauseOutlined,
  CaretRightOutlined, ReloadOutlined, WarningOutlined, FileExcelOutlined
} from '@ant-design/icons'
import { message } from '../utils/message'
import HelpButton from '../components/HelpButton'
import { supabase } from '../config/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { thereforeService } from '../services/thereforeService'
import { connectTenant, thApi, flattenCategoryTree, isAuthError } from '../services/thereforeConnect'
import { formatShortDate, formatFullDate } from '../utils/format'
import '../styles/migrator.css'

// ═══════════════════════════════════════════════════════════
// TIPOS DE CAMPO E ÍNDICES
// ═══════════════════════════════════════════════════════════

const TYPE_LABEL = { 1: 'Texto', 2: 'Entero', 3: 'Fecha', 4: 'Etiqueta', 5: 'Moneda', 6: 'Sí/No', 8: 'Tabla/contador', 10: 'Tabla', 99: 'Fecha y hora' }
const typeLabel = t => TYPE_LABEL[t] || `Tipo ${t ?? '?'}`
// Campos sin valor propio (etiquetas) o que no se pueden escribir al crear (tablas, contadores)
const isUnsupported = t => t === 4 || t === 8 || t === 10
// Tipo de índice (Web API) según el tipo de campo de destino
const KEY_FOR_TYPE = { 1: 'StringIndexData', 2: 'IntIndexData', 3: 'DateIndexData', 5: 'MoneyIndexData', 6: 'LogicalIndexData', 99: 'DateIndexData' }
const compatible = (srcType, dstType) => srcType === dstType || dstType === 1

const normField = f => {
  const colName = f.ColName || f.FieldName || f.Name
  return { colName, caption: f.Caption || colName, type: f.FieldType, fieldNo: f.FieldNo }
}

// Un elemento de índice viene como { StringIndexData: { FieldNo, FieldName, DataValue } } (o Date…, Int…)
function readIndexItem(item) {
  if (!item) return null
  const key = Object.keys(item).find(k => item[k] && typeof item[k] === 'object')
  if (!key) return null
  const v = item[key]
  return { key, fieldName: v.FieldName || v.ColName, fieldNo: v.FieldNo, value: v.DataISO8601Value ?? v.DataValue }
}

function convertValue(value, toKey) {
  if (value === null || value === undefined || value === '') return undefined
  switch (toKey) {
    case 'StringIndexData': return Array.isArray(value) ? value.join(', ') : String(value)
    case 'IntIndexData': { const n = parseInt(value, 10); return Number.isNaN(n) ? undefined : n }
    case 'MoneyIndexData': { const n = Number(String(value).replace(',', '.')); return Number.isNaN(n) ? undefined : n }
    case 'LogicalIndexData': return value === true || value === 'true' || value === 1 || value === '1'
    default: return value
  }
}

// Construye los índices para CreateDocument a partir de los del documento de origen
function mapIndexItems(srcItems, fieldMap, srcFields, dstFields) {
  const srcByName = Object.fromEntries(srcFields.map(f => [f.colName, f]))
  const dstByName = Object.fromEntries(dstFields.map(f => [f.colName, f]))
  const out = []
  const preview = []
  ;(srcItems || []).forEach(item => {
    const r = readIndexItem(item)
    if (!r || r.key === 'TableIndexData') return
    const target = fieldMap[r.fieldName]
    if (!target) return
    const sf = srcByName[r.fieldName]
    const df = dstByName[target]
    if (!df) return
    const key = sf && sf.type === df.type ? r.key : (KEY_FOR_TYPE[df.type] || r.key)
    const value = key === r.key ? r.value : convertValue(r.value, key)
    if (value === undefined || value === null) return
    const data = { FieldNo: 0, FieldName: df.colName }
    if (key === 'DateIndexData') data.DataISO8601Value = value
    else data.DataValue = value
    out.push({ [key]: data })
    preview.push({ from: sf?.caption || r.fieldName, to: df.caption, value: Array.isArray(value) ? value.join(', ') : String(value) })
  })
  return { items: out, preview }
}

function autoMap(srcFields, dstFields) {
  const map = {}
  const byCol = Object.fromEntries(dstFields.filter(f => !isUnsupported(f.type)).map(f => [f.colName.toLowerCase(), f]))
  const byCap = Object.fromEntries(dstFields.filter(f => !isUnsupported(f.type)).map(f => [String(f.caption).toLowerCase(), f]))
  srcFields.forEach(f => {
    if (isUnsupported(f.type)) return
    const m = byCol[f.colName.toLowerCase()] || byCap[String(f.caption).toLowerCase()]
    if (m) map[f.colName] = m.colName
  })
  return map
}

// ═══════════════════════════════════════════════════════════
// FILTROS POR CAMPOS DEL ORIGEN
// Misma sintaxis de condición que el generador de informes: valor (con * como
// comodín) o rango «desde TO hasta». Si falta un extremo se usa un valor límite.
// ═══════════════════════════════════════════════════════════

const filterKind = t => (t === 3 || t === 99 ? 'date' : t === 2 || t === 5 ? 'number' : t === 1 ? 'text' : null)
const isFilterable = f => !!filterKind(f.type)

function buildConditions(filters, fields) {
  return (filters || []).map(flt => {
    const f = fields.find(x => x.colName === flt.field)
    const kind = f && filterKind(f.type)
    if (!kind) return null
    let cond = null
    if (kind === 'text') cond = String(flt.value || '').trim() || null
    else if (kind === 'date' && (flt.from || flt.to)) cond = `${flt.from || '1900-01-01'} TO ${flt.to || '9999-12-31'}`
    else if (kind === 'number' && (flt.from != null || flt.to != null)) cond = `${flt.from ?? -999999999999} TO ${flt.to ?? 999999999999}`
    return cond ? { FieldNoOrName: f.colName, Operator: 0, Condition: cond } : null
  }).filter(Boolean)
}

function describeFilters(filters, fields) {
  return (filters || []).map(flt => {
    const f = fields.find(x => x.colName === flt.field)
    if (!f) return null
    const kind = filterKind(f.type)
    if (kind === 'text') return flt.value ? `${f.caption} = «${flt.value}»` : null
    if (flt.from == null && flt.to == null && !flt.from && !flt.to) return null
    return `${f.caption} ${flt.from ? `desde ${flt.from}` : ''}${flt.from && flt.to ? ' ' : ''}${flt.to ? `hasta ${flt.to}` : ''}`.trim()
  }).filter(Boolean)
}

// ═══════════════════════════════════════════════════════════
// REGISTRO (Supabase, con alternativa local si no existen las tablas)
// ═══════════════════════════════════════════════════════════

const LS_RUNS = 'migrator.runs'
const lsDoneKey = c => `migrator.done.${c.srcTenantId}:${c.srcCatNo}->${c.dstTenantId}:${c.dstCatNo}`
const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d } catch { return d } }
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* sin almacenamiento */ } }
const isMissingTable = err => !!err && (err.code === '42P01' || err.code === 'PGRST205' || /does not exist|schema cache|Could not find the table/i.test(err.message || ''))
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `run-${Date.now()}-${Math.random().toString(16).slice(2)}`)

function useRegistry() {
  const [remote, setRemote] = useState(true)
  const remoteRef = useRef(true)
  const goLocal = () => { remoteRef.current = false; setRemote(false) }

  const runToRow = (r) => ({
    name: r.name, mode: r.mode,
    src_tenant_id: String(r.cfg.srcTenantId), src_category_no: r.cfg.srcCatNo, src_category: r.cfg.srcCatName,
    dst_tenant_id: r.cfg.dstTenantId ? String(r.cfg.dstTenantId) : null, dst_category_no: r.cfg.dstCatNo || null, dst_category: r.cfg.dstCatName || null,
    field_map: r.cfg.fieldMap || {}, options: r.cfg.options || {},
    status: r.status, total: r.total || 0, ok_count: r.ok || 0, error_count: r.errors || 0, skipped_count: r.skipped || 0
  })
  const rowToRun = (row) => ({
    id: row.id, name: row.name, mode: row.mode, status: row.status, total: row.total, ok: row.ok_count, errors: row.error_count, skipped: row.skipped_count,
    created_at: row.created_at, updated_at: row.updated_at,
    cfg: {
      mode: row.mode, srcTenantId: row.src_tenant_id, srcCatNo: row.src_category_no, srcCatName: row.src_category,
      dstTenantId: row.dst_tenant_id, dstCatNo: row.dst_category_no, dstCatName: row.dst_category,
      fieldMap: row.field_map || {}, options: row.options || {}
    }
  })

  return {
    remote,
    async listRuns() {
      if (remoteRef.current) {
        const { data, error } = await supabase.from('migration_runs').select('*').order('created_at', { ascending: false }).limit(100)
        if (!error) return (data || []).map(rowToRun)
        if (isMissingTable(error)) goLocal(); else throw error
      }
      return lsGet(LS_RUNS, [])
    },
    async createRun(run) {
      if (remoteRef.current) {
        const { data, error } = await supabase.from('migration_runs').insert(runToRow(run)).select().single()
        if (!error && data?.id && data?.src_category_no !== undefined) return { ...run, id: data.id, created_at: data.created_at }
        if (error && !isMissingTable(error)) throw error
        if (error) goLocal()
      }
      const saved = { ...run, id: newId(), created_at: new Date().toISOString() }
      lsSet(LS_RUNS, [saved, ...lsGet(LS_RUNS, [])].slice(0, 100))
      return saved
    },
    async updateRun(run) {
      if (remoteRef.current && !String(run.id).startsWith('run-')) {
        const { error } = await supabase.from('migration_runs').update({ ...runToRow(run), updated_at: new Date().toISOString() }).eq('id', run.id)
        if (!error) return
        if (!isMissingTable(error)) throw error
        goLocal()
      }
      lsSet(LS_RUNS, lsGet(LS_RUNS, []).map(r => (r.id === run.id ? { ...run, updated_at: new Date().toISOString() } : r)))
    },
    async deleteRun(id) {
      if (remoteRef.current) {
        const { error } = await supabase.from('migration_runs').delete().eq('id', id)
        if (!error) return
        if (!isMissingTable(error)) throw error
        goLocal()
      }
      lsSet(LS_RUNS, lsGet(LS_RUNS, []).filter(r => r.id !== id))
    },
    // DocNo de origen ya copiados correctamente a este destino
    async doneDocNos(cfg) {
      const done = new Set(lsGet(lsDoneKey(cfg), []))
      if (remoteRef.current) {
        for (let from = 0; ; from += 1000) {
          const { data, error } = await supabase.from('migration_items').select('src_doc_no')
            .eq('src_tenant_id', String(cfg.srcTenantId)).eq('src_category_no', cfg.srcCatNo)
            .eq('dst_tenant_id', String(cfg.dstTenantId)).eq('dst_category_no', cfg.dstCatNo)
            .eq('status', 'ok').range(from, from + 999)
          if (error) { if (isMissingTable(error)) goLocal(); else throw error; break }
          ;(data || []).forEach(r => done.add(r.src_doc_no))
          if (!data || data.length < 1000) break
        }
      }
      return done
    },
    async addItems(cfg, runId, items) {
      if (!items.length) return
      if (cfg.mode === 'copy') {
        const key = lsDoneKey(cfg)
        const prev = lsGet(key, [])
        lsSet(key, [...prev, ...items.filter(i => i.status === 'ok').map(i => i.srcDocNo)])
      }
      if (!remoteRef.current) return
      const rows = items.map(i => ({
        run_id: String(runId).startsWith('run-') ? null : runId,
        src_tenant_id: String(cfg.srcTenantId), src_category_no: cfg.srcCatNo, src_doc_no: i.srcDocNo,
        dst_tenant_id: cfg.dstTenantId ? String(cfg.dstTenantId) : null, dst_category_no: cfg.dstCatNo || null,
        dst_doc_no: i.dstDocNo || null, status: i.status, error: i.error ? String(i.error).slice(0, 1000) : null
      }))
      const { error } = await supabase.from('migration_items').insert(rows)
      if (error) { if (isMissingTable(error)) goLocal(); else console.error('[Migrador] No se pudo registrar:', error.message) }
    }
  }
}

// ═══════════════════════════════════════════════════════════
// ESCRITURA EN CARPETA (File System Access API: Chrome y Edge)
// ═══════════════════════════════════════════════════════════

const canPickFolder = typeof window !== 'undefined' && 'showDirectoryPicker' in window
const safeName = s => String(s || 'archivo').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'archivo'
const b64ToBytes = b64 => { const bin = atob(b64); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out }

async function writeFile(dir, name, bytes) {
  const fh = await dir.getFileHandle(name, { create: true })
  const w = await fh.createWritable()
  await w.write(bytes)
  await w.close()
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════

const STEPS = ['Origen', 'Destino', 'Campos', 'Opciones', 'Migrar']
const DEFAULT_OPTIONS = { docFrom: null, docTo: null, max: null, concurrency: 3, skipDone: true, continueOnError: true, folderPerDoc: true, excel: true, filters: [] }
const emptyCfg = () => ({ mode: 'copy', srcTenantId: null, srcCatNo: null, srcCatName: '', dstTenantId: null, dstCatNo: null, dstCatName: '', fieldMap: {}, options: { ...DEFAULT_OPTIONS } })
const emptySide = () => ({ status: 'idle', error: '', cats: [], fields: [], loadingFields: false })
const nf = n => Number(n || 0).toLocaleString('es-ES', { useGrouping: 'always' })
const STATUS = {
  pending: { label: 'Preparada', cls: '' },
  running: { label: 'Interrumpida', cls: 'is-warn' },
  stopped: { label: 'Detenida', cls: 'is-warn' },
  done: { label: 'Completada', cls: 'is-ok' },
  done_with_errors: { label: 'Con errores', cls: 'is-err' }
}

export default function ThereforeMigrator() {
  const { user } = useAuth()
  const registry = useRegistry()
  const [view, setView] = useState('list')
  const [runs, setRuns] = useState([])
  const [loadingRuns, setLoadingRuns] = useState(true)
  const [tenants, setTenants] = useState([])
  const [step, setStep] = useState(0)
  const [cfg, setCfg] = useState(emptyCfg)
  const [src, setSrc] = useState(emptySide)
  const [dst, setDst] = useState(emptySide)
  const [dirHandle, setDirHandle] = useState(null)
  const [preview, setPreview] = useState({ loading: false, docs: [], error: '' })
  const [count, setCount] = useState({ loading: false, value: null, error: '' })
  const [exec, setExec] = useState(null) // estado de la ejecución
  const [onlyErrors, setOnlyErrors] = useState(false)
  // Una conexión por instancia: Therefore™ invalida el token anterior al pedir uno nuevo
  // con el mismo usuario, así que origen y destino comparten conexión si son la misma instancia
  const tenantConns = useRef({})
  const sideTenant = useRef({ src: null, dst: null })
  const connOf = side => tenantConns.current[sideTenant.current[side]]
  const pendingConnects = useRef({})
  // Reconecta una sola vez aunque fallen varios documentos en paralelo: si otro ya
  // renovó la conexión se usa esa; si se está renovando, se espera a la misma
  const reconnect = async (side, usedConn = null) => {
    const tid = sideTenant.current[side]
    if (usedConn && tenantConns.current[tid] && tenantConns.current[tid] !== usedConn) return tenantConns.current[tid]
    if (!pendingConnects.current[tid]) {
      pendingConnects.current[tid] = connectTenant(tid)
        .then(c => { tenantConns.current[tid] = c; return c })
        .finally(() => { delete pendingConnects.current[tid] })
    }
    return pendingConnects.current[tid]
  }
  const stopRef = useRef(false)
  const resultsRef = useRef([])
  const currentRunRef = useRef(null)

  const running = exec?.phase === 'listing' || exec?.phase === 'running'

  useEffect(() => { loadTenants(); loadRuns() }, [])

  // Aviso al cerrar la pestaña con una migración en marcha
  useEffect(() => {
    if (!running) return
    const h = e => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [running])

  const loadTenants = async () => {
    const { data, error } = await supabase.from('tenants').select('id, nombre, url, is_on_premise').order('nombre', { ascending: true })
    if (error) message.error('No se pudieron cargar las instancias: ' + error.message)
    setTenants(data || [])
  }

  const loadRuns = async () => {
    setLoadingRuns(true)
    try { setRuns(await registry.listRuns()) } catch (err) { message.error('No se pudo cargar el historial: ' + err.message) } finally { setLoadingRuns(false) }
  }

  const tenantName = id => tenants.find(t => String(t.id) === String(id))?.nombre || 'Instancia'
  const patchCfg = p => setCfg(c => ({ ...c, ...p }))
  const patchOpt = p => {
    setCfg(c => ({ ...c, options: { ...c.options, ...p } }))
    if ('filters' in p || 'docFrom' in p || 'docTo' in p) {
      setCount({ loading: false, value: null, error: '' })
      setPreview({ loading: false, docs: [], error: '' })
    }
  }

  // ── Conexión y categorías ───────────────────────────────
  const sideState = side => (side === 'src' ? [src, setSrc] : [dst, setDst])

  const connectSide = async (side, tenantId, keepCatNo = null) => {
    const [, set] = sideState(side)
    set({ ...emptySide(), status: 'connecting' })
    sideTenant.current[side] = tenantId
    if (!tenantId) { set(emptySide()); return }
    try {
      let conn = tenantConns.current[tenantId]
      if (!conn) {
        conn = await connectTenant(tenantId)
        tenantConns.current[tenantId] = conn
      }
      let tree
      try {
        tree = await thereforeService.getCategoryTree(conn.baseUrl, conn.headers)
      } catch {
        // La conexión guardada puede haber caducado: se pide una nueva y se reintenta
        conn = await reconnect(side)
        tree = await thereforeService.getCategoryTree(conn.baseUrl, conn.headers)
      }
      set(s => ({ ...s, status: 'ok', cats: flattenCategoryTree(tree) }))
      if (keepCatNo) await loadFields(side, keepCatNo)
    } catch (err) {
      set({ ...emptySide(), status: 'error', error: err.message })
    }
  }

  // Ejecuta una llamada y, si la sesión ya no vale, reconecta y reintenta una vez
  const withConn = async (side, fn) => {
    const used = connOf(side)
    try {
      return await fn(used)
    } catch (err) {
      if (!isAuthError(err)) throw err
      return fn(await reconnect(side, used))
    }
  }

  const loadFields = async (side, catNo) => {
    const [, set] = sideState(side)
    set(s => ({ ...s, loadingFields: true, fields: [] }))
    try {
      const data = await withConn(side, c => thApi(c, 'GetCategoryInfo', { CategoryNo: catNo }))
      const fields = (data.CategoryFields || data.Fields || []).map(normField).filter(f => f.colName)
      set(s => ({ ...s, loadingFields: false, fields }))
      return fields
    } catch (err) {
      set(s => ({ ...s, loadingFields: false }))
      message.error('No se pudieron leer los campos: ' + err.message)
      return []
    }
  }

  const pickTenant = (side, tenantId) => {
    if (side === 'src') patchCfg({ srcTenantId: tenantId, srcCatNo: null, srcCatName: '', fieldMap: {} })
    else patchCfg({ dstTenantId: tenantId, dstCatNo: null, dstCatName: '', fieldMap: {} })
    connectSide(side, tenantId)
  }

  const pickCategory = async (side, catNo) => {
    const [state] = sideState(side)
    const cat = state.cats.find(c => c.catNo === catNo)
    if (side === 'src') { setCfg(c => ({ ...c, srcCatNo: catNo, srcCatName: cat?.name || '', fieldMap: {}, options: { ...c.options, filters: [], docFrom: null, docTo: null } })); setCount({ loading: false, value: null, error: '' }) }
    else patchCfg({ dstCatNo: catNo, dstCatName: cat?.name || '', fieldMap: {} })
    if (catNo) await loadFields(side, catNo)
  }

  // Emparejamiento automático de campos al tener las dos categorías
  useEffect(() => {
    if (cfg.mode !== 'copy' || !src.fields.length || !dst.fields.length) return
    if (Object.keys(cfg.fieldMap || {}).length) return
    patchCfg({ fieldMap: autoMap(src.fields, dst.fields) })
  }, [src.fields, dst.fields, cfg.mode])

  // ── Navegación ──────────────────────────────────────────
  const sameTarget = cfg.mode === 'copy' && cfg.srcTenantId && String(cfg.srcTenantId) === String(cfg.dstTenantId) && cfg.srcCatNo && cfg.srcCatNo === cfg.dstCatNo
  const stepValid = [
    !!(cfg.srcTenantId && cfg.srcCatNo && src.fields.length),
    cfg.mode === 'copy' ? !!(cfg.dstTenantId && cfg.dstCatNo && dst.fields.length && !sameTarget) : !!dirHandle,
    true,
    true,
    true
  ]
  const canReach = i => stepValid.slice(0, i).every(Boolean)
  const goStep = i => { if (!running && canReach(i)) setStep(i) }

  const startNew = () => {
    setCfg(emptyCfg()); setSrc(emptySide()); setDst(emptySide()); setDirHandle(null)
    setPreview({ loading: false, docs: [], error: '' }); setExec(null); resultsRef.current = []; currentRunRef.current = null
    setStep(0); setView('wizard')
  }

  const openRun = async (run) => {
    const c = { ...emptyCfg(), ...run.cfg, options: { ...DEFAULT_OPTIONS, ...(run.cfg.options || {}) } }
    setCfg(c); setDirHandle(null); setPreview({ loading: false, docs: [], error: '' })
    setExec(null); resultsRef.current = []; currentRunRef.current = run
    setStep(c.mode === 'copy' ? 4 : 1)
    setView('wizard')
    await connectSide('src', c.srcTenantId, c.srcCatNo)
    if (c.mode === 'copy') await connectSide('dst', c.dstTenantId, c.dstCatNo)
  }

  const backToList = () => {
    if (running) return
    setView('list'); loadRuns()
  }

  const confirmDeleteRun = (run) => Modal.confirm({
    title: `¿Eliminar «${run.name}» del historial?`,
    content: 'Solo se borra la entrada del historial. El registro de documentos ya copiados se conserva, para no duplicarlos si repites la migración.',
    okText: 'Eliminar', okButtonProps: { danger: true }, cancelText: 'Cancelar',
    onOk: async () => {
      try { await registry.deleteRun(run.id); setRuns(rs => rs.filter(r => r.id !== run.id)); message.success('Eliminada del historial') } catch (err) { message.error(err.message) }
    }
  })

  // ── Carpeta de descarga ─────────────────────────────────
  const chooseFolder = async () => {
    try {
      const h = await window.showDirectoryPicker({ mode: 'readwrite' })
      setDirHandle(h)
    } catch (err) {
      if (err.name !== 'AbortError') message.error('No se pudo abrir la carpeta: ' + err.message)
    }
  }

  // ── Lectura de un documento de origen ───────────────────
  const readSourceDoc = async (docNo) => {
    const doc = await withConn('src', c => thApi(c, 'GetDocument', { DocNo: docNo, VersionNo: 0, IsStreamsInfoNeeded: true, IsIndexDataValuesNeeded: true }))
    const infos = doc.StreamsInfo || doc.Streams || []
    const files = []
    for (let i = 0; i < Math.max(infos.length, 0); i++) {
      const info = infos[i] || {}
      const streamNo = info.StreamNo ?? i
      const data = await withConn('src', c => thApi(c, 'GetDocumentStream', { DocNo: docNo, StreamNo: streamNo, VersionNo: 0 }))
      const fileData = data.FileData ?? data.StreamData
      if (!fileData) throw new Error(`El archivo ${streamNo} llegó vacío`)
      files.push({ name: data.FileName || info.FileName || info.StreamName || `archivo_${streamNo}`, data: fileData })
    }
    const indexItems = doc.IndexData?.IndexDataItems || doc.IndexData?.Items || doc.IndexDataItems || []
    return { files, indexItems }
  }

  // ── Vista previa (sin escribir nada) ────────────────────
  const runPreview = async () => {
    setPreview({ loading: true, docs: [], error: '' })
    try {
      const all = await listDocNos()
      const docNos = all.slice(0, 3)
      if (!docNos.length) { setPreview({ loading: false, docs: [], total: 0, error: 'Ningún documento de la categoría de origen cumple estos filtros.' }); return }
      const docs = []
      for (const docNo of docNos) {
        const doc = await withConn('src', c => thApi(c, 'GetDocument', { DocNo: docNo, VersionNo: 0, IsStreamsInfoNeeded: true, IsIndexDataValuesNeeded: true }))
        const items = doc.IndexData?.IndexDataItems || doc.IndexData?.Items || doc.IndexDataItems || []
        const files = (doc.StreamsInfo || doc.Streams || []).map(s => s.FileName || s.StreamName).filter(Boolean)
        const mapped = cfg.mode === 'copy'
          ? mapIndexItems(items, cfg.fieldMap, src.fields, dst.fields).preview
          : items.map(readIndexItem).filter(Boolean).map(r => ({ from: src.fields.find(f => f.colName === r.fieldName)?.caption || r.fieldName, to: '—', value: Array.isArray(r.value) ? r.value.join(', ') : String(r.value ?? '') }))
        docs.push({ docNo, files, mapped })
      }
      setPreview({ loading: false, docs, total: all.length, error: '' })
    } catch (err) {
      setPreview({ loading: false, docs: [], error: err.message })
    }
  }

  const countDocs = async () => {
    setCount({ loading: true, value: null, error: '' })
    try {
      const o = cfg.options
      const n = (await listDocNos(null, { ...o, max: null })).length
      setCount({ loading: false, value: n, error: '' })
    } catch (err) {
      setCount({ loading: false, value: null, error: err.message })
    }
  }

  // DocNo de la categoría de origen, con filtros
  const listDocNos = async (limit = null, opts = null) => {
    const o = opts || cfg.options
    const conditions = buildConditions(o.filters, src.fields)
    const run = c => thereforeService.executeMultiQuery(c.baseUrl, c.headers, [{ CategoryNo: cfg.srcCatNo, Mode: 0, MaxRows: 500000, Conditions: conditions }], ['DocNo'])
    const used = connOf('src')
    let r = await run(used)
    if (r.error && isAuthError(r.error)) r = await run(await reconnect('src', used))
    if (r.error) throw new Error(r.error)
    let docNos = [...new Set(r.rows.map(x => Number(x.DocNo)).filter(Boolean))].sort((a, b) => a - b)
    if (o.docFrom) docNos = docNos.filter(n => n >= o.docFrom)
    if (o.docTo) docNos = docNos.filter(n => n <= o.docTo)
    if (o.max) docNos = docNos.slice(0, o.max)
    if (limit) docNos = docNos.slice(0, limit)
    return docNos
  }

  // ── Ejecución ───────────────────────────────────────────
  const startMigration = async () => {
    if (cfg.mode === 'download' && !dirHandle) { message.error('Elige la carpeta de destino'); setStep(1); return }
    stopRef.current = false
    resultsRef.current = []
    const startedAt = Date.now()
    const name = currentRunRef.current?.name || `${cfg.srcCatName} (${tenantName(cfg.srcTenantId)}) → ${cfg.mode === 'copy' ? `${cfg.dstCatName} (${tenantName(cfg.dstTenantId)})` : 'carpeta'}`
    setExec({ phase: 'listing', total: 0, done: 0, ok: 0, errors: 0, skipped: 0, startedAt, log: [], label: 'Buscando documentos en el origen…' })

    let docNos
    try {
      docNos = await listDocNos()
    } catch (err) {
      setExec(e => ({ ...e, phase: 'failed', label: 'No se pudieron listar los documentos: ' + err.message }))
      return
    }

    let pending = docNos
    let skipped = 0
    if (cfg.mode === 'copy' && cfg.options.skipDone) {
      try {
        const done = await registry.doneDocNos(cfg)
        pending = docNos.filter(n => !done.has(n))
        skipped = docNos.length - pending.length
      } catch (err) {
        // Sin esta comprobación se podrían duplicar documentos: mejor parar
        setExec(e => ({ ...e, phase: 'failed', label: `No se pudo comprobar qué documentos ya estaban copiados (${err.message}). Para seguir de todos modos, desmarca «Saltar los documentos que ya se copiaron» en Opciones.` }))
        return
      }
    }

    let run = {
      ...(currentRunRef.current || {}),
      name, mode: cfg.mode, cfg, status: 'running', total: docNos.length, ok: 0, errors: 0, skipped
    }
    try {
      run = currentRunRef.current?.id ? (await registry.updateRun(run), run) : await registry.createRun(run)
      currentRunRef.current = run
    } catch (err) {
      message.warning('La migración no se guardará en el historial: ' + err.message)
    }

    const counters = { done: 0, ok: 0, errors: 0 }
    const buffer = []
    const excelRows = []
    const flush = async () => { const items = buffer.splice(0); await registry.addItems(cfg, run.id, items) }

    setExec(e => ({ ...e, phase: 'running', total: pending.length, skipped, label: '' }))
    if (!pending.length) {
      setExec(e => ({ ...e, phase: 'finished', label: skipped ? 'Todos los documentos ya estaban copiados.' : 'No hay documentos que migrar.' }))
      run = { ...run, status: 'done', ok: skipped, errors: 0 }; await registry.updateRun(run).catch(() => {})
      return
    }

    const pushLog = (entry) => {
      resultsRef.current.push(entry)
      setExec(e => ({ ...e, log: [entry, ...e.log].slice(0, 300) }))
    }

    const processOne = async (docNo) => {
      const { files, indexItems } = await readSourceDoc(docNo)
      if (cfg.mode === 'copy') {
        const { items } = mapIndexItems(indexItems, cfg.fieldMap, src.fields, dst.fields)
        const payload = { CategoryNo: cfg.dstCatNo, IndexDataItems: items, Streams: files.map(f => ({ FileName: f.name, FileData: f.data })) }
        const res = await withConn('dst', c => thApi(c, 'CreateDocument', payload))
        return { dstDocNo: res.DocNo ?? res.NewDocNo ?? null, files: files.length }
      }
      // Descarga a carpeta
      const target = cfg.options.folderPerDoc ? await dirHandle.getDirectoryHandle(String(docNo), { create: true }) : dirHandle
      const used = new Set()
      for (const f of files) {
        let fname = safeName(f.name)
        if (!cfg.options.folderPerDoc) fname = `${docNo}_${fname}`
        let candidate = fname; let n = 1
        while (used.has(candidate.toLowerCase())) { candidate = fname.replace(/(\.[^.]*)?$/, m => ` (${n++})${m}`) }
        used.add(candidate.toLowerCase())
        await writeFile(target, candidate, b64ToBytes(f.data))
      }
      if (cfg.options.excel) {
        const row = { 'Nº documento': docNo, Archivos: files.map(f => f.name).join(' | ') }
        indexItems.map(readIndexItem).filter(Boolean).forEach(r => {
          const caption = src.fields.find(x => x.colName === r.fieldName)?.caption || r.fieldName
          row[caption] = Array.isArray(r.value) ? r.value.join(', ') : r.value
        })
        excelRows.push(row)
      }
      return { dstDocNo: null, files: files.length }
    }

    let idx = 0
    let abort = false
    const worker = async () => {
      while (idx < pending.length && !stopRef.current && !abort) {
        const docNo = pending[idx++]
        const t0 = Date.now()
        try {
          const r = await processOne(docNo)
          counters.ok++
          buffer.push({ srcDocNo: docNo, dstDocNo: r.dstDocNo, status: 'ok' })
          pushLog({ docNo, ok: true, dstDocNo: r.dstDocNo, files: r.files, ms: Date.now() - t0 })
        } catch (err) {
          counters.errors++
          buffer.push({ srcDocNo: docNo, status: 'error', error: err.message })
          pushLog({ docNo, ok: false, error: err.message, ms: Date.now() - t0 })
          if (!cfg.options.continueOnError) abort = true
        }
        counters.done++
        setExec(e => ({ ...e, done: counters.done, ok: counters.ok, errors: counters.errors }))
        if (buffer.length >= 20) await flush()
        if (counters.done % 25 === 0) registry.updateRun({ ...run, ok: skipped + counters.ok, errors: counters.errors }).catch(() => {})
      }
    }

    const workers = Array.from({ length: Math.max(1, Math.min(8, cfg.options.concurrency || 3)) }, worker)
    await Promise.all(workers)
    await flush()

    // Excel de índices en la carpeta
    if (cfg.mode === 'download' && cfg.options.excel && excelRows.length) {
      try {
        const XLSX = await import('xlsx')
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(excelRows), 'Índices')
        const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        await writeFile(dirHandle, `indices_${safeName(cfg.srcCatName)}_${new Date().toISOString().slice(0, 10)}.xlsx`, new Uint8Array(out))
      } catch (err) {
        message.warning('No se pudo guardar el Excel de índices: ' + err.message)
      }
    }

    const stopped = stopRef.current || abort
    const status = stopped ? 'stopped' : counters.errors ? 'done_with_errors' : 'done'
    run = { ...run, status, ok: skipped + counters.ok, errors: counters.errors }
    currentRunRef.current = run
    await registry.updateRun(run).catch(() => {})
    setExec(e => ({ ...e, phase: 'finished', finishedAt: Date.now(), stopped, label: '' }))
  }

  const stopMigration = () => {
    stopRef.current = true
    setExec(e => ({ ...e, label: 'Deteniendo: se terminan los documentos en curso…' }))
  }

  const downloadReport = async () => {
    const XLSX = await import('xlsx')
    const rows = resultsRef.current.map(r => ({
      'Nº documento origen': r.docNo,
      'Nº documento destino': r.dstDocNo ?? '',
      Resultado: r.ok ? 'Correcto' : 'Error',
      Archivos: r.files ?? '',
      Error: r.error || ''
    }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Resultado')
    XLSX.writeFile(wb, `migracion_${safeName(cfg.srcCatName)}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // ═════════════════════════════ VISTAS ═════════════════════════════

  if (view === 'list') {
    return (
      <div className="mg-page">
        <div className="header-main">
          <div>
            <h1 className="header-title">Migrador de documentos</h1>
            <p className="header-subtitle">Copia documentos de una categoría de Therefore™ a otra, o descárgalos a una carpeta con sus índices en Excel.</p>
          </div>
          <div className="header-actions">
            <HelpButton section="thereforeMigrator" />
            <button className="btn-primary" onClick={startNew}><PlusOutlined /> Nueva migración</button>
          </div>
        </div>

        {!registry.remote && (
          <Alert type="info" showIcon message="El historial se guarda solo en este navegador"
            description="Para guardarlo en la base de datos y evitar duplicados desde cualquier equipo, ejecuta en Supabase el script supabase/migrations/20261124_migrator.sql." />
        )}

        {loadingRuns ? <div className="mg-center"><Spin /></div> : runs.length === 0 ? (
          <div className="mg-empty">
            <p className="cell-title">Aún no hay migraciones</p>
            <p className="cell-muted">Elige una categoría de origen y un destino. Antes de copiar podrás revisar qué campo va a cuál y ver una vista previa.</p>
            <button className="btn-primary" onClick={startNew}><PlusOutlined /> Nueva migración</button>
          </div>
        ) : (
          <ul className="row-list" aria-label="Migraciones">
            {runs.map(r => {
              const st = STATUS[r.status] || STATUS.pending
              const processed = (r.ok || 0) + (r.errors || 0)
              return (
                <li key={r.id} className="row-list-item">
                  <span className="home-action-icon" aria-hidden="true">{r.mode === 'copy' ? <SwapOutlined /> : <DownloadOutlined />}</span>
                  <div className="cell-stack" style={{ flex: 1, minWidth: 0 }}>
                    <span className="cell-title">{r.name}</span>
                    <span className="cell-sub">
                      {r.mode === 'copy' ? 'Copia entre categorías' : 'Descarga a carpeta'} · {nf(r.ok)} de {nf(r.total)} correctos{r.errors ? ` · ${nf(r.errors)} ${r.errors === 1 ? 'error' : 'errores'}` : ''}{processed < r.total ? ` · ${nf(r.total - processed)} pendientes` : ''}
                    </span>
                  </div>
                  <span className={`mg-status ${st.cls}`}>{st.label}</span>
                  <Tooltip title={formatFullDate(r.updated_at || r.created_at)}>
                    <span className="cell-muted row-list-meta" style={{ minWidth: 96 }}>{formatShortDate(r.updated_at || r.created_at)}</span>
                  </Tooltip>
                  <button className="btn-default" onClick={() => openRun(r)}>{r.status === 'done' ? 'Abrir' : 'Continuar'}</button>
                  <Dropdown trigger={['click']} placement="bottomRight" menu={{ items: [
                    { key: 'del', icon: <DeleteOutlined />, label: 'Eliminar del historial', danger: true, onClick: () => confirmDeleteRun(r) }
                  ] }}>
                    <Button type="text" size="small" icon={<MoreOutlined />} aria-label={`Acciones: ${r.name}`} />
                  </Dropdown>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    )
  }

  // ── Asistente ──────────────────────────────────────────
  const primary = step < 4 ? (
    <button className="btn-primary mg-primary" onClick={() => goStep(step + 1)} disabled={!stepValid[step]}>
      Siguiente <ArrowRightOutlined />
    </button>
  ) : running ? (
    <button className="btn-default mg-primary" onClick={stopMigration} disabled={stopRef.current}><PauseOutlined /> Detener</button>
  ) : (
    <button className="btn-primary mg-primary" onClick={startMigration}>
      <CaretRightOutlined /> {exec?.phase === 'finished' ? 'Ejecutar de nuevo' : cfg.mode === 'copy' ? 'Iniciar migración' : 'Iniciar descarga'}
    </button>
  )

  return (
    <div className="mg-page">
      <div className="header-main">
        <div style={{ minWidth: 0 }}>
          <button className="btn-link mg-back" onClick={backToList} disabled={running}><ArrowLeftOutlined /> Migraciones</button>
          <h1 className="header-title">{currentRunRef.current?.name || 'Nueva migración'}</h1>
        </div>
        <div className="header-actions">
          <HelpButton section="thereforeMigrator" />
          {primary}
        </div>
      </div>

      <nav className="mg-steps" aria-label="Pasos">
        {STEPS.map((label, i) => {
          const done = i < step && stepValid[i]
          const hidden = false
          return hidden ? null : (
            <div key={label} className="mg-step-wrap">
              {i > 0 && <span className="mg-step-line" aria-hidden="true" />}
              <button type="button" className={`mg-step ${step === i ? 'is-current' : ''} ${done ? 'is-done' : ''}`}
                onClick={() => goStep(i)} disabled={running || !canReach(i)} aria-current={step === i ? 'step' : undefined}>
                <span className="mg-step-num">{done ? <CheckOutlined /> : i + 1}</span>
                <span>{label}</span>
              </button>
            </div>
          )
        })}
      </nav>

      {/* 1. ORIGEN */}
      {step === 0 && (
        <section className="mg-card">
          <header className="mg-card-head"><h2>¿De dónde salen los documentos?</h2></header>
          <div className="mg-card-body">
            <SidePicker side="src" label="Instancia de origen" state={src} tenants={tenants} tenantId={cfg.srcTenantId} catNo={cfg.srcCatNo}
              onTenant={id => pickTenant('src', id)} onCategory={c => pickCategory('src', c)} onRetry={() => connectSide('src', cfg.srcTenantId)} />
          </div>
        </section>
      )}
      {step === 0 && cfg.srcCatNo && src.fields.length > 0 && (
        <section className="mg-card">
          <header className="mg-card-head">
            <h2>¿Qué documentos?</h2>
            <div className="mg-head-actions">
              {count.value != null && !count.loading && (
                <span className="mg-count"><strong>{nf(count.value)}</strong> {count.value === 1 ? 'documento' : 'documentos'}</span>
              )}
              <button className="btn-default" onClick={countDocs} disabled={count.loading}>
                {count.loading ? <Spin size="small" /> : <ReloadOutlined />} Contar documentos
              </button>
            </div>
          </header>
          <div className="mg-card-body">
            {count.error && <Alert type="error" showIcon message="No se pudieron contar los documentos" description={count.error} />}
            <FilterEditor fields={src.fields} filters={cfg.options.filters || []} onChange={filters => patchOpt({ filters })} />
            <div className="mg-row">
              <label className="mg-field"><span className="mg-label">Desde el documento nº</span>
                <InputNumber min={1} value={cfg.options.docFrom} onChange={v => patchOpt({ docFrom: v })} placeholder="Primero" style={{ width: '100%' }} /></label>
              <label className="mg-field"><span className="mg-label">Hasta el documento nº</span>
                <InputNumber min={1} value={cfg.options.docTo} onChange={v => patchOpt({ docTo: v })} placeholder="Último" style={{ width: '100%' }} /></label>
            </div>
          </div>
        </section>
      )}

      {/* 2. DESTINO */}
      {step === 1 && (
        <section className="mg-card">
          <header className="mg-card-head"><h2>¿Adónde van?</h2></header>
          <div className="mg-card-body">
            <div className="mg-modes" role="radiogroup" aria-label="Tipo de migración">
              <button type="button" role="radio" aria-checked={cfg.mode === 'copy'} className={`mg-mode ${cfg.mode === 'copy' ? 'is-selected' : ''}`}
                onClick={() => patchCfg({ mode: 'copy' })}>
                <SwapOutlined className="mg-mode-icon" />
                <span className="mg-mode-title">Copiar a otra categoría</span>
                <span className="mg-mode-desc">Crea los documentos, con sus archivos e índices, en una categoría de la misma u otra instancia.</span>
              </button>
              <button type="button" role="radio" aria-checked={cfg.mode === 'download'} className={`mg-mode ${cfg.mode === 'download' ? 'is-selected' : ''}`}
                onClick={() => patchCfg({ mode: 'download' })}>
                <FolderOpenOutlined className="mg-mode-icon" />
                <span className="mg-mode-title">Descargar a una carpeta</span>
                <span className="mg-mode-desc">Guarda los archivos en una carpeta de tu equipo y genera un Excel con los índices de cada documento.</span>
              </button>
            </div>

            {cfg.mode === 'copy' ? (
              <>
                <SidePicker side="dst" label="Instancia de destino" state={dst} tenants={tenants} tenantId={cfg.dstTenantId} catNo={cfg.dstCatNo}
                  onTenant={id => pickTenant('dst', id)} onCategory={c => pickCategory('dst', c)} onRetry={() => connectSide('dst', cfg.dstTenantId)} />
                {sameTarget && <Alert type="warning" showIcon message="El origen y el destino son la misma categoría" />}
              </>
            ) : !canPickFolder ? (
              <Alert type="warning" showIcon message="Tu navegador no permite elegir una carpeta"
                description="Usa Google Chrome o Microsoft Edge para descargar a una carpeta." />
            ) : (
              <div className="mg-field">
                <span className="mg-label">Carpeta de destino</span>
                <div className="mg-folder">
                  <button className="btn-default" onClick={chooseFolder}><FolderOpenOutlined /> {dirHandle ? 'Cambiar carpeta' : 'Elegir carpeta'}</button>
                  {dirHandle ? <span className="mg-folder-name"><CheckOutlined /> {dirHandle.name}</span> : <span className="cell-muted">El navegador te pedirá permiso para escribir en ella.</span>}
                </div>
                <Checkbox checked={cfg.options.folderPerDoc} onChange={e => patchOpt({ folderPerDoc: e.target.checked })}>Una subcarpeta por documento (con su número)</Checkbox>
                <Checkbox checked={cfg.options.excel} onChange={e => patchOpt({ excel: e.target.checked })}>Generar un Excel con los índices de cada documento</Checkbox>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3. CAMPOS */}
      {step === 2 && (
        <section className="mg-card">
          <header className="mg-card-head">
            <h2>{cfg.mode === 'copy' ? 'Qué campo va a cuál' : 'Índices que se exportan'}</h2>
            {cfg.mode === 'copy' && (
              <div className="mg-head-actions">
                <span className="cell-muted">{Object.keys(cfg.fieldMap).length} de {src.fields.filter(f => !isUnsupported(f.type)).length} campos asignados</span>
                <button className="btn-link" onClick={() => patchCfg({ fieldMap: autoMap(src.fields, dst.fields) })}><ReloadOutlined /> Emparejar automáticamente</button>
              </div>
            )}
          </header>
          <div className="mg-card-body">
            {cfg.mode === 'copy'
              ? <FieldMapper srcFields={src.fields} dstFields={dst.fields} fieldMap={cfg.fieldMap} onChange={fieldMap => patchCfg({ fieldMap })} />
              : (
                <>
                  <p className="cell-muted" style={{ margin: 0 }}>
                    {cfg.options.excel ? 'El Excel tendrá una fila por documento con estos campos:' : 'Has desactivado el Excel de índices: solo se descargarán los archivos.'}
                  </p>
                  {cfg.options.excel && (
                    <div className="mg-chips">{src.fields.filter(f => !isUnsupported(f.type)).map(f => <span key={f.colName} className="tag-neutral-inline">{f.caption}</span>)}</div>
                  )}
                </>
              )}
          </div>
        </section>
      )}

      {/* 4. OPCIONES + VISTA PREVIA */}
      {step === 3 && (
        <div className="mg-grid">
          <section className="mg-card">
            <header className="mg-card-head"><h2>Opciones</h2></header>
            <div className="mg-card-body">
              {describeFilters(cfg.options.filters, src.fields).length > 0 || cfg.options.docFrom || cfg.options.docTo ? (
                <p className="mg-help" style={{ margin: 0 }}>
                  Documentos: {[...describeFilters(cfg.options.filters, src.fields), cfg.options.docFrom || cfg.options.docTo ? `nº ${cfg.options.docFrom || 'inicio'} a ${cfg.options.docTo || 'fin'}` : null].filter(Boolean).join(' · ')}.{' '}
                  <button className="btn-link" onClick={() => setStep(0)}>Cambiar en Origen</button>
                </p>
              ) : null}
              <div className="mg-row">
                <label className="mg-field"><span className="mg-label">Máximo de documentos</span>
                  <InputNumber min={1} value={cfg.options.max} onChange={v => patchOpt({ max: v })} placeholder="Todos" style={{ width: '100%' }} />
                  <span className="mg-help">Útil para una primera prueba real con pocos documentos.</span></label>
                <label className="mg-field"><span className="mg-label">Documentos en paralelo</span>
                  <InputNumber min={1} max={8} value={cfg.options.concurrency} onChange={v => patchOpt({ concurrency: v || 1 })} style={{ width: '100%' }} />
                  <span className="mg-help">Entre 3 y 5 es lo recomendable. Más carga más el servidor.</span></label>
              </div>
              {cfg.mode === 'copy' && (
                <Checkbox checked={cfg.options.skipDone} onChange={e => patchOpt({ skipDone: e.target.checked })}>
                  Saltar los documentos que ya se copiaron a este destino (evita duplicados al repetir o continuar)
                </Checkbox>
              )}
              <Checkbox checked={cfg.options.continueOnError} onChange={e => patchOpt({ continueOnError: e.target.checked })}>
                Si un documento falla, anotarlo y seguir con el siguiente
              </Checkbox>
            </div>
          </section>

          <section className="mg-card">
            <header className="mg-card-head">
              <h2>Vista previa</h2>
              <button className="btn-default" onClick={runPreview} disabled={preview.loading}>
                {preview.loading ? <Spin size="small" /> : <EyeOutlined />} Ver los 3 primeros
              </button>
            </header>
            <div className="mg-card-body">
              {preview.total != null && preview.docs.length > 0 && (
                <p className="mg-prev-total"><strong>{nf(preview.total)}</strong> {preview.total === 1 ? 'documento cumple' : 'documentos cumplen'} los filtros{cfg.options.max && preview.total > cfg.options.max ? ` (se migrarán ${nf(cfg.options.max)} por el máximo indicado)` : ''}. Estos son los 3 primeros:</p>
              )}
              {!preview.docs.length && !preview.error && !preview.loading && (
                <p className="cell-muted" style={{ margin: 0 }}>Lee los 3 primeros documentos y muestra cómo quedarían sus índices. No escribe nada en el destino.</p>
              )}
              {preview.error && <Alert type="error" showIcon message={preview.error} />}
              {preview.docs.map(d => (
                <div key={d.docNo} className="mg-prev">
                  <div className="mg-prev-head">
                    <span className="cell-title">Documento {d.docNo}</span>
                    <span className="cell-muted">{d.files.length} {d.files.length === 1 ? 'archivo' : 'archivos'}{d.files.length ? `: ${d.files.join(', ')}` : ''}</span>
                  </div>
                  {d.mapped.length === 0 ? <p className="cell-muted mg-prev-none">Ningún índice se copiará con la asignación actual.</p> : (
                    <table className="mg-prev-table">
                      <tbody>
                        {d.mapped.map((m, i) => (
                          <tr key={i}>
                            <td className="cell-muted">{m.from}</td>
                            {cfg.mode === 'copy' && <td className="mg-prev-arrow">→ {m.to}</td>}
                            <td>{m.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* 5. MIGRAR */}
      {step === 4 && (
        <>
          <section className="mg-card">
            <div className="mg-summary">
              <div className="mg-summary-side">
                <span className="mg-label">Origen</span>
                <span className="cell-title">{cfg.srcCatName || '—'}</span>
                <span className="cell-muted">{tenantName(cfg.srcTenantId)}</span>
                {describeFilters(cfg.options.filters, src.fields).length > 0 && (
                  <span className="cell-muted">Filtro: {describeFilters(cfg.options.filters, src.fields).join(' · ')}</span>
                )}
              </div>
              <ArrowRightOutlined className="mg-summary-arrow" />
              <div className="mg-summary-side">
                <span className="mg-label">Destino</span>
                {cfg.mode === 'copy' ? (
                  <>
                    <span className="cell-title">{cfg.dstCatName || '—'}</span>
                    <span className="cell-muted">{tenantName(cfg.dstTenantId)} · {Object.keys(cfg.fieldMap).length} campos asignados</span>
                  </>
                ) : (
                  <>
                    <span className="cell-title">{dirHandle?.name || 'Carpeta sin elegir'}</span>
                    <span className="cell-muted">{cfg.options.excel ? 'Con Excel de índices' : 'Solo archivos'}</span>
                  </>
                )}
              </div>
            </div>

            {(src.status === 'connecting' || dst.status === 'connecting') && <div className="mg-note"><Spin size="small" /> Conectando con las instancias…</div>}
            {cfg.mode === 'download' && !dirHandle && (
              <Alert type="warning" showIcon message="Elige de nuevo la carpeta de destino" description="Por seguridad, el navegador no recuerda la carpeta entre sesiones." action={<button className="btn-default" onClick={() => setStep(1)}>Elegir carpeta</button>} />
            )}

            {exec && <Progress exec={exec} />}

            {!exec && (
              <p className="mg-note cell-muted">
                {cfg.mode === 'copy'
                  ? 'Se crearán los documentos en el destino. Los ya copiados antes se saltan si mantienes esa opción.'
                  : 'Se guardarán los archivos en la carpeta elegida.'} Mantén esta pestaña abierta mientras dure.
              </p>
            )}
          </section>

          {exec && (exec.log.length > 0 || exec.phase === 'finished') && (
            <section className="mg-card">
              <header className="mg-card-head">
                <h2>Registro</h2>
                <div className="mg-head-actions">
                  <Checkbox checked={onlyErrors} onChange={e => setOnlyErrors(e.target.checked)}>Solo errores</Checkbox>
                  <button className="btn-default" onClick={downloadReport} disabled={!resultsRef.current.length}><FileExcelOutlined /> Descargar informe</button>
                </div>
              </header>
              <Table
                className="data-table"
                size="small"
                rowKey={(r, i) => `${r.docNo}-${i}`}
                dataSource={exec.log.filter(r => !onlyErrors || !r.ok)}
                pagination={{ pageSize: 50, hideOnSinglePage: true }}
                columns={[
                  { title: 'Documento', dataIndex: 'docNo', width: 120, render: v => <span className="cell-mono">{v}</span> },
                  { title: 'Resultado', key: 'r', width: 120, render: (_, r) => <span className={`mg-status ${r.ok ? 'is-ok' : 'is-err'}`}>{r.ok ? 'Correcto' : 'Error'}</span> },
                  ...(cfg.mode === 'copy' ? [{ title: 'Nº en destino', dataIndex: 'dstDocNo', width: 130, render: v => (v ? <span className="cell-mono">{v}</span> : '—') }] : []),
                  { title: 'Archivos', dataIndex: 'files', width: 100, render: v => v ?? '—' },
                  { title: 'Detalle', key: 'd', render: (_, r) => (r.ok ? <span className="cell-muted">{(r.ms / 1000).toFixed(1).replace('.', ',')} s</span> : <span className="mg-error-text">{r.error}</span>) }
                ]}
              />
              {exec.log.length >= 300 && <p className="mg-note cell-muted">Se muestran los últimos 300. El informe en Excel incluye todos.</p>}
            </section>
          )}
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// SUBCOMPONENTES
// ═══════════════════════════════════════════════════════════

function SidePicker({ label, state, tenants, tenantId, catNo, onTenant, onCategory, onRetry }) {
  const options = useMemo(() => state.cats.map(c => ({ value: c.catNo, label: c.name, path: c.path })), [state.cats])
  return (
    <div className="mg-row">
      <label className="mg-field">
        <span className="mg-label">{label}</span>
        <Select value={tenantId || undefined} onChange={onTenant} placeholder="Elige una instancia" showSearch optionFilterProp="label"
          options={tenants.map(t => ({ value: t.id, label: t.nombre }))} />
        <span className="mg-conn" aria-live="polite">
          {state.status === 'connecting' && <><Spin size="small" /> Conectando…</>}
          {state.status === 'ok' && <><span className="status-dot status-dot--active" /> Conectado · {state.cats.length} categorías</>}
          {state.status === 'error' && <><span className="status-dot status-dot--error" /> <span className="mg-error-text" title={state.error}>{state.error}</span> <button className="btn-link" onClick={onRetry}>Reintentar</button></>}
        </span>
      </label>
      <label className="mg-field">
        <span className="mg-label">Categoría</span>
        <Select value={catNo || undefined} onChange={onCategory} placeholder={state.status === 'ok' ? 'Busca por nombre' : 'Primero elige la instancia'}
          disabled={state.status !== 'ok'} showSearch
          filterOption={(input, o) => `${o.label} ${o.path} ${o.value}`.toLowerCase().includes(input.toLowerCase())}
          options={options}
          optionRender={o => (
            <div className="mg-opt">
              <span>{o.data.label}</span>
              <span className="cell-muted">{o.data.path ? `${o.data.path} · ` : ''}nº {o.data.value}</span>
            </div>
          )} />
        <span className="mg-conn">
          {state.loadingFields && <><Spin size="small" /> Leyendo campos…</>}
          {!state.loadingFields && catNo && state.fields.length > 0 && <>{state.fields.length} campos</>}
        </span>
      </label>
    </div>
  )
}

function FilterEditor({ fields, filters, onChange }) {
  const options = fields.filter(isFilterable).map(f => ({ value: f.colName, label: `${f.caption} (${typeLabel(f.type)})` }))
  const update = (i, patch) => onChange(filters.map((f, j) => (j === i ? { ...f, ...patch } : f)))
  const remove = i => onChange(filters.filter((_, j) => j !== i))
  const add = () => onChange([...filters, { field: options[0]?.value || null, value: '', from: null, to: null }])

  return (
    <div className="mg-field">
      <span className="mg-label">Filtrar por campos del origen</span>
      {filters.length === 0 && <span className="mg-help">Sin filtros: se migran todos los documentos de la categoría.</span>}
      {filters.map((flt, i) => {
        const f = fields.find(x => x.colName === flt.field)
        const kind = f ? filterKind(f.type) : null
        return (
          <div key={i} className="mg-filter">
            <Select value={flt.field || undefined} onChange={v => update(i, { field: v, value: '', from: null, to: null })} options={options}
              showSearch optionFilterProp="label" placeholder="Campo" className="mg-filter-field" />
            {kind === 'text' && (
              <Input value={flt.value} onChange={e => update(i, { value: e.target.value })} placeholder="Valor exacto, o con * como comodín (p. ej. Acme*)" className="mg-filter-value" />
            )}
            {kind === 'date' && (
              <div className="mg-filter-range">
                <input type="date" className="mg-date" value={flt.from || ''} onChange={e => update(i, { from: e.target.value || null })} aria-label="Desde" />
                <span className="cell-muted">a</span>
                <input type="date" className="mg-date" value={flt.to || ''} onChange={e => update(i, { to: e.target.value || null })} aria-label="Hasta" />
              </div>
            )}
            {kind === 'number' && (
              <div className="mg-filter-range">
                <InputNumber value={flt.from} onChange={v => update(i, { from: v })} placeholder="Desde" />
                <span className="cell-muted">a</span>
                <InputNumber value={flt.to} onChange={v => update(i, { to: v })} placeholder="Hasta" />
              </div>
            )}
            <Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => remove(i)} aria-label="Quitar filtro" />
          </div>
        )
      })}
      {options.length > 0 && (
        <button type="button" className="btn-link mg-add" onClick={add}><PlusOutlined /> Añadir filtro</button>
      )}
      {filters.length > 1 && <span className="mg-help">Se migran los documentos que cumplen todos los filtros a la vez.</span>}
    </div>
  )
}

function FieldMapper({ srcFields, dstFields, fieldMap, onChange }) {
  const usable = dstFields.filter(f => !isUnsupported(f.type))
  const usedTargets = new Set(Object.values(fieldMap))
  const unmappedDst = usable.filter(f => !usedTargets.has(f.colName))

  return (
    <>
      <table className="mg-map">
        <thead>
          <tr><th>Campo de origen</th><th aria-label="" /><th>Campo de destino</th><th>Estado</th></tr>
        </thead>
        <tbody>
          {srcFields.map(f => {
            const unsupported = isUnsupported(f.type)
            const target = fieldMap[f.colName]
            const df = dstFields.find(d => d.colName === target)
            const warn = df && !compatible(f.type, df.type)
            return (
              <tr key={f.colName} className={unsupported ? 'is-disabled' : ''}>
                <td>
                  <span className="mg-map-name">{f.caption}</span>
                  <span className="mg-map-meta">{f.colName} · {typeLabel(f.type)}</span>
                </td>
                <td className="mg-map-arrow"><ArrowRightOutlined /></td>
                <td>
                  {unsupported ? <span className="cell-muted">No se copia</span> : (
                    <Select
                      value={target || '__none'}
                      onChange={v => { const next = { ...fieldMap }; if (v === '__none') delete next[f.colName]; else next[f.colName] = v; onChange(next) }}
                      style={{ width: '100%' }}
                      showSearch optionFilterProp="label"
                      options={[
                        { value: '__none', label: 'No copiar' },
                        ...usable.map(d => ({ value: d.colName, label: `${d.caption} (${typeLabel(d.type)})` }))
                      ]}
                    />
                  )}
                </td>
                <td>
                  {unsupported ? <span className="mg-status">{typeLabel(f.type)}</span>
                    : !target ? <span className="mg-status">Sin copiar</span>
                      : warn ? <Tooltip title={`El origen es ${typeLabel(f.type)} y el destino ${typeLabel(df.type)}. Se intentará convertir el valor.`}><span className="mg-status is-warn"><WarningOutlined /> Tipo distinto</span></Tooltip>
                        : <span className="mg-status is-ok"><CheckOutlined /> Correcto</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {unmappedDst.length > 0 && (
        <p className="mg-note cell-muted">
          Campos del destino que quedarán vacíos: {unmappedDst.map(f => f.caption).join(', ')}.
          Si alguno es obligatorio en Therefore™, la creación de documentos fallará.
        </p>
      )}
    </>
  )
}

function Progress({ exec }) {
  const pct = exec.total ? Math.round((exec.done / exec.total) * 100) : 0
  const elapsed = ((exec.finishedAt || Date.now()) - exec.startedAt) / 1000
  const rate = exec.done && elapsed ? exec.done / elapsed : 0
  const remaining = rate && exec.total > exec.done ? (exec.total - exec.done) / rate : 0
  const fmtTime = s => (s < 60 ? `${Math.round(s)} s` : s < 3600 ? `${Math.round(s / 60)} min` : `${(s / 3600).toFixed(1).replace('.', ',')} h`)

  return (
    <div className="mg-progress">
      {exec.label && <div className="mg-progress-label">{exec.phase === 'listing' && <Spin size="small" />} {exec.label}</div>}
      {exec.phase !== 'listing' && exec.phase !== 'failed' && (
        <>
          <div className="mg-progress-track"><div className={`mg-progress-bar ${exec.errors ? 'has-errors' : ''}`} style={{ width: `${pct}%` }} /></div>
          <div className="mg-kpis">
            <div><span className="mg-kpi-value">{nf(exec.done)}<span className="mg-kpi-of"> / {nf(exec.total)}</span></span><span className="mg-kpi-label">procesados ({pct} %)</span></div>
            <div><span className="mg-kpi-value is-ok">{nf(exec.ok)}</span><span className="mg-kpi-label">correctos</span></div>
            <div><span className={`mg-kpi-value ${exec.errors ? 'is-err' : ''}`}>{nf(exec.errors)}</span><span className="mg-kpi-label">con error</span></div>
            <div><span className="mg-kpi-value">{nf(exec.skipped)}</span><span className="mg-kpi-label">ya copiados</span></div>
            <div>
              <span className="mg-kpi-value">{exec.phase === 'finished' ? fmtTime(elapsed) : remaining ? fmtTime(remaining) : '—'}</span>
              <span className="mg-kpi-label">{exec.phase === 'finished' ? 'duración' : 'tiempo restante'}</span>
            </div>
          </div>
          {exec.phase === 'finished' && (
            <Alert
              type={exec.errors ? 'warning' : 'success'} showIcon
              message={exec.stopped ? 'Migración detenida' : exec.errors ? 'Terminada con errores' : 'Migración terminada'}
              description={exec.stopped
                ? 'Puedes continuarla más tarde desde el historial: se saltarán los documentos ya copiados.'
                : exec.errors ? 'Revisa el registro. Si corriges la causa, ejecútala de nuevo: solo se intentarán los que faltan.' : undefined}
            />
          )}
        </>
      )}
      {exec.phase === 'failed' && <Alert type="error" showIcon message={exec.label} />}
    </div>
  )
}
