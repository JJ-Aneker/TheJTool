import { useState, useRef, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { useRole } from '../hooks/useRole'
import StepRequest from '../components/eform-ai/StepRequest'
import React from 'react'
import { Modal, Button, Spin, Dropdown, Input, Select, Switch, Segmented, Alert, Upload, Tag, Tooltip } from 'antd'
import { CopyOutlined, LockOutlined, ShareAltOutlined, DeleteOutlined, MoreOutlined, PlusOutlined, ArrowUpOutlined, ArrowDownOutlined, CaretDownOutlined, CaretRightOutlined, FileTextOutlined, ArrowLeftOutlined, ThunderboltOutlined, UploadOutlined, SearchOutlined, FormOutlined, RobotOutlined } from '@ant-design/icons'
import { formatFullDate } from '../utils/format'
import { handleError } from '../utils/errorHandler'
import { formatShortDate } from '../utils/format'
import { message } from '../utils/message'
import HelpButton from '../components/HelpButton'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../config/supabaseClient'
import { useTranslation } from 'react-i18next'
import { useMessages } from '../utils/i18nMessages'
import '../styles/eform-builder.css'

function newGuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16).toUpperCase()
  })
}

function escXml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function toCamelKey(s) {
  return String(s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('') || 'campo'
}

function dcreaNow() {
  const d = new Date()
  const p = (n, l = 2) => String(n).padStart(l, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}000`
}

const FIELD_TYPES = [
  { value: 'text', label: 'Texto', formio: 'textfield' },
  { value: 'email', label: 'Email', formio: 'email' },
  { value: 'phone', label: 'Teléfono', formio: 'phoneNumber' },
  { value: 'date', label: 'Fecha', formio: 'datetime' },
  { value: 'datetime', label: 'Fecha y hora', formio: 'datetime' },
  { value: 'number', label: 'Número entero', formio: 'number' },
  { value: 'money', label: 'Importe (€)', formio: 'currency' },
  { value: 'checkbox', label: 'Casilla (Sí/No)', formio: 'checkbox' },
  { value: 'select', label: 'Lista desplegable', formio: 'select' },
]

const TYPE_ALIAS = {
  'string': 'text', 'texto': 'text', 'text': 'text', 'str': 'text', 'varchar': 'text',
  'email': 'email', 'correo': 'email', 'mail': 'email',
  'phone': 'phone', 'telefono': 'phone', 'teléfono': 'phone', 'tel': 'phone', 'phonenumber': 'phone',
  'date': 'date', 'fecha': 'date',
  'timestamp': 'datetime', 'datetime': 'datetime', 'fecha y hora': 'datetime',
  'integer': 'number', 'entero': 'number', 'int': 'number', 'número': 'number', 'numero': 'number',
  'money': 'money', 'importe': 'money', 'float': 'money', 'decimal': 'money', 'currency': 'money',
  'logical': 'checkbox', 'lógico': 'checkbox', 'logico': 'checkbox',
  'checkbox': 'checkbox', 'bool': 'checkbox', 'boolean': 'checkbox',
  'lookup': 'select', 'lista': 'select', 'combo': 'select', 'desplegable': 'select', 'select': 'select',
}

const COND_EMPTY = { show: '', when: '', json: '' }
const COMP_EXTRAS = { reorder: false, properties: {}, customConditional: '', logic: [], attributes: {}, conditional: COND_EMPTY }
const VALIDATE_BASE = (required, extra = {}) => ({ required, customMessage: '', json: '', ...extra })

function buildComponent(f) {
  // Bloques avanzados (creados con IA o importados): se conservan tal cual
  if (f.locked && f.raw) return f.raw

  const key = f.fieldKey || toCamelKey(f.nombre)

  switch (f.tipo) {
    case 'date':
      return {
        label: f.nombre, tableView: true, alwaysEnabled: false,
        type: 'datetime', input: true, key,
        enableDate: true, enableTime: false, format: 'dd/MM/yyyy',
        ...COMP_EXTRAS,
        validate: VALIDATE_BASE(f.required)
      }

    case 'datetime':
      return {
        label: f.nombre, tableView: true, alwaysEnabled: false,
        type: 'datetime', input: true, key,
        enableDate: true, enableTime: true, format: 'dd/MM/yyyy HH:mm',
        ...COMP_EXTRAS,
        validate: VALIDATE_BASE(f.required)
      }

    case 'number':
      return {
        label: f.nombre, tableView: true, alwaysEnabled: false,
        type: 'number', input: true, key,
        ...(f.defaultValue ? { defaultValue: f.defaultValue } : {}),
        ...COMP_EXTRAS,
        validate: VALIDATE_BASE(f.required)
      }

    case 'money':
      return {
        label: f.nombre, tableView: true, alwaysEnabled: false,
        type: 'currency', input: true, key, currency: 'EUR',
        ...(f.defaultValue ? { defaultValue: f.defaultValue } : {}),
        ...COMP_EXTRAS,
        validate: VALIDATE_BASE(f.required)
      }

    case 'checkbox':
      return {
        label: f.nombre, tableView: true, alwaysEnabled: false,
        type: 'checkbox', input: true, key,
        ...COMP_EXTRAS,
        validate: VALIDATE_BASE(f.required)
      }

    case 'email':
      return {
        label: f.nombre, allowMultipleMasks: false, showWordCount: false, showCharCount: false,
        tableView: true, alwaysEnabled: false,
        type: 'email', input: true, key,
        inputFormat: 'plain', encrypted: false,
        ...(f.placeholder ? { placeholder: f.placeholder } : {}),
        ...COMP_EXTRAS,
        validate: VALIDATE_BASE(f.required)
      }

    case 'phone':
      return {
        label: f.nombre, allowMultipleMasks: false, showWordCount: false, showCharCount: false,
        tableView: true, alwaysEnabled: false,
        type: 'phoneNumber', input: true, key,
        defaultValue: '', inputFormat: 'plain', encrypted: false,
        ...COMP_EXTRAS,
        validate: VALIDATE_BASE(f.required)
      }

    case 'select': {
      const values = (f.options || '')
        .split('\n').map(l => l.trim()).filter(Boolean)
        .map(l => {
          const [lbl, val] = l.includes('=') ? l.split('=', 2) : [l, l]
          return { label: lbl.trim(), value: (val || lbl).trim() }
        })
      return {
        label: f.nombre, tableView: true, alwaysEnabled: false,
        type: 'select', input: true, key,
        ...(f.defaultValue ? { defaultValue: f.defaultValue } : {}),
        ...COMP_EXTRAS,
        validate: VALIDATE_BASE(f.required),
        data: { values }
      }
    }

    default: { // text
      const ml = f.maxLength ? parseInt(f.maxLength) : 500
      return {
        label: f.nombre, allowMultipleMasks: false, showWordCount: false, showCharCount: false,
        tableView: true, alwaysEnabled: false,
        type: 'textfield', input: true, key,
        inputFormat: 'plain', encrypted: false,
        ...(f.placeholder ? { placeholder: f.placeholder } : {}),
        ...(f.defaultValue ? { defaultValue: f.defaultValue } : {}),
        ...(f.readOnly ? { disabled: true } : {}),
        ...COMP_EXTRAS,
        validate: VALIDATE_BASE(f.required, { maxLength: ml })
      }
    }
  }
}

function buildFormioJson({ sections, colsPerRow, submitLabel }) {
  const cols = colsPerRow || 2
  const width = Math.floor(12 / cols)
  const components = []
  let colIdx = 1

  sections.forEach((sec, si) => {
    const validFields = sec.fields.filter(f => f.nombre.trim())
    if (!validFields.length) return

    const panelComps = []
    let i = 0
    while (i < validFields.length) {
      const f = validFields[i]
      if (f.tipo === 'checkbox' || f.locked) {
        panelComps.push(buildComponent(f))
        i++
      } else {
        const rowFields = []
        while (i < validFields.length && validFields[i].tipo !== 'checkbox' && !validFields[i].locked && rowFields.length < cols) {
          rowFields.push(validFields[i])
          i++
        }
        panelComps.push({
          label: 'Columnas', type: 'columns',
          key: `cols_${si}_${Math.floor((i - rowFields.length) / cols)}`,
          input: false, tableView: false, mask: false,
          alwaysEnabled: false, reorder: false,
          properties: {}, customConditional: '', logic: [], attributes: {},
          conditional: COND_EMPTY,
          columns: rowFields.map(rf => ({
            width, offset: 0, push: 0, pull: 0,
            type: 'column', input: false, hideOnChildrenHidden: false,
            key: `column${colIdx++}`, tableView: true, label: 'Column',
            components: [buildComponent(rf)]
          }))
        })
      }
    }

    components.push({
      label: sec.name, type: 'panel',
      key: `panel_${toCamelKey(sec.name) || `sec${si}`}`,
      input: false, tableView: false, collapsible: false,
      reorder: false, properties: {}, customConditional: '',
      logic: [], attributes: {}, conditional: COND_EMPTY,
      components: panelComps
    })
  })

  components.push({
    type: 'button', label: submitLabel || 'Enviar', key: 'submit',
    theme: 'primary', input: true, tableView: true
  })

  return { display: 'form', settings: {}, components }
}

// FDef: JSON en bruto. Se escapan & < > (los bloques HTML de la IA los usan) pero NUNCA las comillas.
function escFDef(json) {
  return json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildEFormXml({ formName, submitLabel, sections, colsPerRow, formIdOverride }) {
  const formio = buildFormioJson({ sections, colsPerRow, submitLabel })
  const fdef = escFDef(JSON.stringify(formio, null, 2))
  const formID = (formIdOverride && /^[A-Za-z][A-Za-z0-9_]*$/.test(formIdOverride))
    ? formIdOverride
    : (formName.replace(/\s+/g, '').replace(/[^A-Za-z0-9]/g, '') || 'EForm')
  const formGuid = newGuid()

  return `<?xml version="1.0" encoding="utf-8"?>
<Configuration><Version>570425345</Version><NewImportExport>1</NewImportExport><Categories></Categories><QueryTemplates></QueryTemplates><CaseDefinitions></CaseDefinitions><Folders></Folders><Datatypes></Datatypes><KeywordDictionaries></KeywordDictionaries><Counters></Counters><Templates></Templates><WFProcesses></WFProcesses><UCProfiles></UCProfiles><TreeViews></TreeViews><CloudStorages></CloudStorages><Preprocessors></Preprocessors><Forms></Forms><FormImgs></FormImgs><ReportDefinitions></ReportDefinitions><ReportTemplates></ReportTemplates><PowerBIDataSets></PowerBIDataSets><PowerBITables></PowerBITables><EForms><EForm><FNo>-1</FNo><FVer>1</FVer><FName>${escXml(formName)}</FName><FDef>${fdef}</FDef><DCrea>${dcreaNow()}</DCrea><FCreUs>10</FCreUs><FCreUsNam>admin</FCreUsNam><Id>${formGuid}</Id><FormID>${escXml(formID)}</FormID></EForm></EForms><ESignatureProviders></ESignatureProviders><Roles></Roles><RoleAssignments></RoleAssignments><CommonScripts></CommonScripts><OfficeProfiles></OfficeProfiles><IxProfiles></IxProfiles><Queries></Queries><Users></Users><CaptProfiles></CaptProfiles><References></References><CntConnSrcs></CntConnSrcs><Dashboards></Dashboards><Stamps></Stamps><RetentionPolicies></RetentionPolicies><SmartCaptureProcessors></SmartCaptureProcessors><SmartCaptureQueues></SmartCaptureQueues><DocDownloadProviders></DocDownloadProviders><Credentials></Credentials></Configuration>`
}

// ── Conversión form.io → estructura del editor ──────────────────────────────
// Campos sencillos → editables. Todo lo demás (QR, búsquedas, firma, HTML, lógica condicional…)
// → "bloque avanzado" bloqueado que se conserva intacto en el XML.
const SIMPLE_FORMIO = { textfield: 'text', email: 'email', phoneNumber: 'phone', datetime: 'date', number: 'number', currency: 'money', checkbox: 'checkbox', select: 'select' }

const ADV_LABELS = {
  htmlelement: 'Texto / HTML', content: 'Contenido', signature: 'Firma', button: 'Botón',
  panel: 'Panel', columns: 'Columnas', fieldset: 'Grupo', well: 'Grupo', table: 'Tabla',
  datagrid: 'Tabla de datos', editgrid: 'Tabla editable', file: 'Adjunto', textarea: 'Texto largo',
  select: 'Búsqueda', radio: 'Opciones', selectboxes: 'Casillas', hidden: 'Oculto', day: 'Fecha (día)',
  time: 'Hora', url: 'Enlace', tags: 'Etiquetas', survey: 'Encuesta', container: 'Contenedor', modaledit: 'Ventana',
  // Campos sencillos que llevan reglas (validación, condiciones, cálculos)
  textfield: 'Texto con reglas', email: 'Email con reglas', phoneNumber: 'Teléfono con reglas', datetime: 'Fecha con reglas',
  number: 'Número con reglas', currency: 'Importe con reglas', checkbox: 'Casilla con reglas'
}

// Traduce los avisos técnicos del validador a lenguaje claro (manteniendo el detalle técnico)
function friendlyWarning(w) {
  const text = String(w)
  if (/<script>/i.test(text)) return 'Un bloque HTML incluye código <script>. Therefore™ lo elimina al importar, así que esa función (p. ej. el lector QR) no funcionaría.'
  if (/signature/i.test(text) && /nativ/i.test(text)) return 'Se ha usado la firma nativa de form.io, que Therefore™ no admite.'
  return text.replace(/^components(\[\d+\]\.?(components|columns)?)*\S*:\s*/, '')
}

function isSimpleFormio(c) {
  const tipo = SIMPLE_FORMIO[c.type]
  if (!tipo) return false
  const hasLogic = (Array.isArray(c.logic) && c.logic.length) || c.customConditional ||
    (c.conditional && (c.conditional.when || c.conditional.json)) || c.calculateValue ||
    (c.validate && (c.validate.custom || c.validate.pattern)) || c.customDefaultValue ||
    (c.properties && Object.keys(c.properties).length) || c.redrawOn || c.refreshOn
  if (hasLogic) return false
  if (c.type === 'select' && c.dataSrc && c.dataSrc !== 'values') return false
  return true
}

function formioToField(c) {
  if (!isSimpleFormio(c)) {
    return {
      id: newGuid(), locked: true, raw: c,
      nombre: c.label || c.title || c.key || ADV_LABELS[c.type] || c.type || 'Bloque',
      fieldKey: c.key || '', tipo: 'advanced', advType: c.type,
      required: !!c.validate?.required, readOnly: false, placeholder: '', defaultValue: '', maxLength: '', options: ''
    }
  }
  return {
    id: newGuid(),
    nombre: c.label || '',
    fieldKey: c.key || '',
    tipo: c.type === 'datetime' ? (c.enableTime ? 'datetime' : 'date') : SIMPLE_FORMIO[c.type],
    required: !!c.validate?.required,
    readOnly: !!c.disabled,
    placeholder: c.placeholder || '',
    defaultValue: c.defaultValue != null && typeof c.defaultValue !== 'object' ? String(c.defaultValue) : '',
    maxLength: c.validate?.maxLength ? String(c.validate.maxLength) : '',
    options: c.data?.values?.map(v => (v.value && v.value !== v.label ? `${v.value}=${v.label}` : v.label)).join('\n') || ''
  }
}

// Recorre un panel: las "columns" generadas por el editor se aplanan; el resto se convierte
function collectFields(components, out) {
  (components || []).forEach(c => {
    if (c.type === 'button' && (c.key === 'submit' || c.action === 'submit' || !c.action)) return
    // Las columnas son solo maquetación: se despliegan para que cada campo se vea y se edite por separado
    // (si la propia columna tiene lógica condicional, se conserva entera como bloque)
    const columnsHaveLogic = c.customConditional || (c.conditional && (c.conditional.when || c.conditional.json)) || (Array.isArray(c.logic) && c.logic.length)
    if (c.type === 'columns' && Array.isArray(c.columns) && !columnsHaveLogic) {
      c.columns.forEach(col => collectFields(col.components || [], out))
      return
    }
    out.push(formioToField(c))
  })
}

export function componentsToEditor(components) {
  const sections = []
  let loose = null
  let submitLabel = 'Enviar'
  ;(components || []).forEach(c => {
    if (c.type === 'button' && (c.key === 'submit' || c.action === 'submit' || !c.action)) {
      submitLabel = c.label || submitLabel
      return
    }
    if (c.type === 'panel' && !c.collapsible && !(c.conditional && (c.conditional.when || c.conditional.json)) && !c.customConditional && !(Array.isArray(c.logic) && c.logic.length)) {
      loose = null
      const fields = []
      collectFields(c.components, fields)
      sections.push({ id: newGuid(), name: (c.label || c.title || 'PANEL').toUpperCase(), fields })
      return
    }
    // Componentes sueltos fuera de panel: se agrupan en una sección
    if (!loose) {
      loose = { id: newGuid(), name: sections.length ? 'OTROS' : 'GENERAL', fields: [] }
      sections.push(loose)
    }
    collectFields([c], loose.fields)
  })
  if (!sections.length) sections.push({ id: newGuid(), name: 'GENERAL', fields: [] })
  return { sections, submitLabel }
}

export function editorToComponents({ sections, colsPerRow, submitLabel }) {
  return buildFormioJson({ sections, colsPerRow, submitLabel }).components
}

function parseCsv(raw) {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  if (!lines.length) return { error: 'El texto está vacío.' }
  const sep = lines[0].includes(';') ? ';' : ','
  const headers = lines[0].split(sep).map(h => h.trim().toLowerCase())

  const idx = {
    nombre: headers.findIndex(h => ['nombre', 'name', 'label', 'etiqueta'].includes(h)),
    fieldkey: headers.findIndex(h => ['key', 'fieldkey', 'fieldid', 'colname', 'col'].includes(h)),
    tipo: headers.findIndex(h => ['tipo', 'type', 'typeno'].includes(h)),
    obligatorio: headers.findIndex(h => ['obligatorio', 'required', 'requerido'].includes(h)),
    placeholder: headers.findIndex(h => ['placeholder', 'ayuda', 'hint'].includes(h)),
    default: headers.findIndex(h => ['default', 'defecto', 'defaultvalue'].includes(h)),
    maxlength: headers.findIndex(h => ['maxlength', 'max', 'longitud', 'long'].includes(h)),
    seccion: headers.findIndex(h => ['seccion', 'sección', 'section', 'grupo', 'group', 'panel'].includes(h)),
    options: headers.findIndex(h => ['options', 'opciones', 'valores'].includes(h)),
  }

  if (idx.nombre === -1) return { error: 'No se encontró la columna "Nombre".' }

  const sectionMap = {}, sectionOrder = [], warnings = []

  lines.slice(1).forEach((line, li) => {
    const cols = line.split(sep).map(c => c.trim())
    const nombre = cols[idx.nombre] || ''
    if (!nombre) { warnings.push(`Fila ${li + 2}: sin nombre, ignorada.`); return }

    const fieldKey = idx.fieldkey >= 0 ? (cols[idx.fieldkey] || toCamelKey(nombre)) : toCamelKey(nombre)
    const tipo = idx.tipo >= 0 ? (TYPE_ALIAS[cols[idx.tipo]?.toLowerCase()] || 'text') : 'text'
    const required = idx.obligatorio >= 0 ? ['1', 'si', 'sí', 'yes', 'true'].includes((cols[idx.obligatorio] || '').toLowerCase()) : false
    const placeholder = idx.placeholder >= 0 ? (cols[idx.placeholder] || '') : ''
    const defaultValue = idx.default >= 0 ? (cols[idx.default] || '') : ''
    const maxLength = idx.maxlength >= 0 ? (cols[idx.maxlength] || '') : ''
    const options = idx.options >= 0 ? (cols[idx.options] || '').replaceAll('|', '\n') : ''
    const seccion = idx.seccion >= 0 ? (cols[idx.seccion] || 'GENERAL').toUpperCase() : 'GENERAL'

    if (!sectionMap[seccion]) { sectionMap[seccion] = []; sectionOrder.push(seccion) }
    sectionMap[seccion].push({ id: newGuid(), nombre, fieldKey, tipo, required, readOnly: false, placeholder, defaultValue, maxLength, options })
  })

  if (!sectionOrder.length) return { error: 'No se procesó ningún campo válido.' }
  const sections = sectionOrder.map(name => ({ id: newGuid(), name, fields: sectionMap[name] }))
  return { sections, warnings }
}

function CsvImporter({ isOpen, onClose, onImport }) {
  const [text, setText] = useState('')
  const [preview, setPreview] = useState(null)

  const handleParse = () => setPreview(parseCsv(text))
  const handleApply = mode => {
    if (!preview || preview.error) return
    onImport(preview, mode)
    setText('')
    setPreview(null)
    onClose()
  }
  const total = preview && !preview.error
    ? preview.sections.reduce((a, s) => a + s.fields.length, 0) : 0

  return (
    <Modal
      title="📤 Importar campos desde CSV"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        <div style={{ marginBottom: '8px' }}>Columnas: <code>Nombre ; Key ; Tipo ; Obligatorio ; Placeholder ; Default ; MaxLength ; Seccion ; Options</code></div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Solo <b>Nombre</b> es obligatorio. <b>Options</b> para select: separadas por <code>|</code>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          <strong>Tipos:</strong> text, email, phone, date, datetime, number, money, checkbox, select
        </div>
      </div>
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setPreview(null) }}
        placeholder={'Nombre;Key;Tipo;Obligatorio;Placeholder;Default;MaxLength;Seccion;Options\nNombre completo;nombre;Text;Si;Tu nombre completo;;100;DATOS PERSONALES\nCurso;curso;Select;Si;;;; ACADÉMICO;1ESO=1 ESO|2ESO=2 ESO'}
        className="form-textarea"
        style={{
          height: '120px',
          fontFamily: 'monospace',
          marginBottom: '16px'
        }}
      />
      <button
        onClick={handleParse}
        disabled={!text.trim()}
        className="btn-default btn-sm"
      >
        Analizar →
      </button>
      {preview && (
        <div style={{ marginTop: '16px' }}>
          {preview.error ? (
            <div className="alert-error" style={{ padding: '12px' }}>
              ⚠ {preview.error}
            </div>
          ) : (
            <>
              <div style={{ fontSize: '12px', color: 'var(--accent-primary)', marginBottom: '12px' }}>
                ✓ {total} campos · {preview.sections.length} panel(es)
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleApply('replace')} className="btn-default btn-sm">
                  Reemplazar
                </button>
                <button onClick={() => handleApply('append')} className="btn-default btn-sm">
                  Añadir
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  )
}

const TYPE_LABEL = Object.fromEntries(FIELD_TYPES.map(t => [t.value, t.label]))
const fieldTypeLabel = (f) => f.locked ? (ADV_LABELS[f.advType] || 'Bloque avanzado') : (TYPE_LABEL[f.tipo] || 'Texto')

// Fila de la estructura: etiqueta editable en línea, tipo y obligatorio de un vistazo
function StructureField({ field, selected, onSelect, onChange, onEnter, onKeyNav, menuItems, dragProps, inputRef }) {
  return (
    <div
      className={`efx-row efx-field ${selected ? 'is-selected' : ''} ${field.locked ? 'is-locked' : ''}`}
      onClick={onSelect}
      {...dragProps}
    >
      <span className="efx-grip" aria-hidden="true">⋮⋮</span>
      {field.locked && <LockOutlined className="efx-lock" aria-label="Bloque avanzado" />}
      <input
        ref={inputRef}
        className="efx-row-input"
        readOnly={!!field.locked}
        value={field.nombre}
        placeholder="Nombre del campo"
        aria-label="Etiqueta del campo"
        onFocus={onSelect}
        onChange={e => {
          const nombre = e.target.value
          onChange({
            ...field, nombre,
            // La clave sigue a la etiqueta mientras no se haya personalizado
            fieldKey: !field.fieldKey || field.fieldKey === toCamelKey(field.nombre) ? toCamelKey(nombre) : field.fieldKey
          })
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); onEnter() }
          else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); onKeyNav(e) }
          else if (e.key === 'Backspace' && field.nombre === '') { e.preventDefault(); onKeyNav(e) }
        }}
      />
      <span className="efx-type">{fieldTypeLabel(field)}</span>
      <span className="efx-req" title={field.required ? 'Obligatorio' : undefined}>{field.required ? '✱' : ''}</span>
      <span onClick={e => e.stopPropagation()}>
        <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
          <Button type="text" size="small" icon={<MoreOutlined />} aria-label={`Acciones: ${field.nombre || 'campo'}`} />
        </Dropdown>
      </span>
    </div>
  )
}

function PropRow({ label, hint, children }) {
  return (
    <div className="efx-prop">
      <label className="efx-prop-label">{label}</label>
      {children}
      {hint && <div className="efx-prop-hint">{hint}</div>}
    </div>
  )
}

function LockedProperties({ field, sections, sectionId, onMove, onRemove }) {
  const [showJson, setShowJson] = useState(false)
  return (
    <>
      <div className="efx-props-title">Bloque avanzado</div>
      <Alert type="info" showIcon message="Se conserva tal cual en el XML."
        description="Lo creó la IA o viene de un formulario importado. Puedes moverlo o eliminarlo; para cambiarlo, pídeselo a la IA." />
      <PropRow label="Nombre"><span>{field.nombre}</span></PropRow>
      <PropRow label="Tipo"><span>{ADV_LABELS[field.advType] || field.advType}</span></PropRow>
      <PropRow label="Clave técnica"><span className="efx-mono">{field.fieldKey || '—'}</span></PropRow>
      <PropRow label="Panel">
        <Select value={sectionId} onChange={onMove} style={{ width: '100%' }}
          options={sections.map(sec => ({ value: sec.id, label: sec.name || 'Sin nombre' }))} />
      </PropRow>
      <button className="btn-link" style={{ alignSelf: 'flex-start' }} onClick={() => setShowJson(v => !v)}>
        {showJson ? 'Ocultar definición' : 'Ver definición (JSON)'}
      </button>
      {showJson && <pre className="efx-json">{JSON.stringify(field.raw, null, 2)}</pre>}
      <button className="btn-link danger efx-remove" onClick={onRemove}><DeleteOutlined /> Eliminar bloque</button>
    </>
  )
}

function FieldProperties({ field, sections, sectionId, onChange, onMove, onRemove }) {
  if (field.locked) return <LockedProperties field={field} sections={sections} sectionId={sectionId} onMove={onMove} onRemove={onRemove} />
  const isSelect = field.tipo === 'select'
  const isText = field.tipo === 'text' || field.tipo === 'email'
  const autoKey = toCamelKey(field.nombre)
  return (
    <>
      <div className="efx-props-title">Campo</div>
      <PropRow label="Etiqueta">
        <Input value={field.nombre} onChange={e => {
          const nombre = e.target.value
          onChange({ ...field, nombre, fieldKey: !field.fieldKey || field.fieldKey === toCamelKey(field.nombre) ? toCamelKey(nombre) : field.fieldKey })
        }} placeholder="ej. NIF" />
      </PropRow>
      <PropRow label="Tipo">
        <Select value={field.tipo} onChange={v => onChange({ ...field, tipo: v })} style={{ width: '100%' }}
          options={FIELD_TYPES.map(t => ({ value: t.value, label: t.label }))} />
      </PropRow>
      <div className="efx-switches">
        <label className="efx-switch"><Switch size="small" checked={field.required} onChange={v => onChange({ ...field, required: v })} /> Obligatorio</label>
        <label className="efx-switch"><Switch size="small" checked={!!field.readOnly} onChange={v => onChange({ ...field, readOnly: v })} /> Solo lectura</label>
      </div>
      {isSelect && (
        <PropRow label="Opciones" hint="Una por línea. Puedes usar valor=Etiqueta.">
          <Input.TextArea rows={5} value={field.options} onChange={e => onChange({ ...field, options: e.target.value })}
            placeholder={'ACTIVO=Activo\nPENDIENTE=Pendiente\nBAJA=Baja'} />
        </PropRow>
      )}
      <PropRow label="Texto de ayuda">
        <Input value={field.placeholder} onChange={e => onChange({ ...field, placeholder: e.target.value })} placeholder="Se muestra dentro del campo vacío" />
      </PropRow>
      <PropRow label="Valor por defecto">
        <Input value={field.defaultValue} onChange={e => onChange({ ...field, defaultValue: e.target.value })} />
      </PropRow>
      {isText && (
        <PropRow label="Longitud máxima">
          <Input type="number" value={field.maxLength} onChange={e => onChange({ ...field, maxLength: e.target.value })} placeholder="500" />
        </PropRow>
      )}
      <PropRow label="Panel">
        <Select value={sectionId} onChange={onMove} style={{ width: '100%' }}
          options={sections.map(sec => ({ value: sec.id, label: sec.name || 'Sin nombre' }))} />
      </PropRow>
      <PropRow label="Clave técnica" hint="Se genera sola a partir de la etiqueta. Cámbiala solo si Therefore™ necesita otra.">
        <Input className="efx-mono" value={field.fieldKey} placeholder={autoKey}
          onChange={e => onChange({ ...field, fieldKey: e.target.value.replace(/\s+/g, '').replace(/[^A-Za-z0-9_]/g, '') })} />
      </PropRow>
      <button className="btn-link danger efx-remove" onClick={onRemove}><DeleteOutlined /> Eliminar campo</button>
    </>
  )
}

function FormPreview({ formName, description, submitLabel, sections, colsPerRow }) {
  const cols = colsPerRow || 2
  const pct = Math.floor(100 / cols)

  const CTRL = {
    text: <input type="text" style={{ width: '100%' }} readOnly />,
    email: <input type="email" style={{ width: '100%' }} readOnly />,
    phone: <input type="tel" style={{ width: '100%' }} readOnly />,
    date: <input type="date" style={{ width: '100%' }} readOnly />,
    datetime: <input type="datetime-local" style={{ width: '100%' }} readOnly />,
    number: <input type="number" style={{ width: '100%' }} readOnly />,
    money: <input type="number" step="0.01" style={{ width: '100%' }} readOnly />,
    checkbox: <input type="checkbox" style={{ width: '16px', height: '16px' }} />,
    select: <select style={{ width: '100%' }}><option>-- Selecciona --</option></select>,
  }

  return (
    <div className="eform-preview">
      <div className="eform-preview-header">
        <div className="eform-preview-title">{formName || 'Nombre del formulario'}</div>
        {description && <div className="eform-preview-description">{description}</div>}
      </div>
      <div className="eform-preview-body">
        {sections.filter(s => s.fields.some(f => f.nombre)).map((sec, si) => (
          <div key={si}>
            {sec.name && <div className="eform-preview-section">{sec.name}</div>}
            <div className="eform-preview-fields">
              {sec.fields.filter(f => f.nombre).map((f, fi) => (
                <div key={fi} style={{ width: `calc(${pct}% - 6px)` }}>
                  <label className="eform-preview-label">
                    {f.nombre}
                    {f.required && <span style={{ color: 'var(--accent-error)', marginLeft: '3px' }}>*</span>}
                  </label>
                  {f.locked
                    ? <div className="efx-preview-locked"><LockOutlined /> {ADV_LABELS[f.advType] || 'Bloque avanzado'} · se ve en Therefore™</div>
                    : (CTRL[f.tipo] || CTRL.text)}
                </div>
              ))}
            </div>
          </div>
        ))}
        <button className="eform-preview-button">
          {submitLabel || 'Enviar'}
        </button>
      </div>
    </div>
  )
}

export default function EFormBuilder() {
  const { t } = useTranslation()
  const MESSAGES = useMessages()
  const { user } = useAuth()
  const [formName, setFormName] = useState('')
  const [description, setDescription] = useState('')
  const [submitLabel, setSubmitLabel] = useState('Enviar')
  const [colsPerRow, setColsPerRow] = useState(2)
  const [sections, setSections] = useState([{ id: newGuid(), name: 'GENERAL', fields: [{ id: newGuid(), nombre: '', fieldKey: '', tipo: 'text', required: false, readOnly: false, placeholder: '', defaultValue: '', maxLength: '', options: '' }] }])
  const [xml, setXml] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [activeView, setActiveView] = useState('editor')
  const [saving, setSaving] = useState(false)
  const [xmlModalOpen, setXmlModalOpen] = useState(false)
  const [formId, setFormId] = useState(null)
  const [isNew, setIsNew] = useState(true)
  const [managerOpen, setManagerOpen] = useState(false)
  const [savedForms, setSavedForms] = useState([])
  const [loadingForms, setLoadingForms] = useState(false)
  const [csvModalOpen, setCsvModalOpen] = useState(false)

  // ── Módulo único: lista de formularios · editor · creación con IA ──────────
  const { isAdmin } = useRole()
  const [searchParams, setSearchParams] = useSearchParams()
  const [mode, setMode] = useState(searchParams.get('nuevo') === 'ia' ? 'ai' : 'list')
  const [listSearch, setListSearch] = useState('')
  const [aiHistory, setAiHistory] = useState([])
  const [origin, setOrigin] = useState('manual')
  const [thereforeFormId, setThereforeFormId] = useState('')
  // Contexto Therefore™ (lo usa la IA al crear o al pedir cambios)
  const [environment, setEnvironment] = useState('online')
  const [tenant, setTenant] = useState('')
  const [serverUrl, setServerUrl] = useState('')
  const [categoryXml, setCategoryXml] = useState(null)
  const [categoryFileName, setCategoryFileName] = useState('')
  // Creación con IA (reutiliza el formulario de petición del asistente)
  const [aiData, setAiData] = useState({ request: '', environment: 'online', tenant: '', serverUrl: '', blocks: [], categoryXml: null, categoryFields: [], questions: null, answers: [], detailedPrompt: '', formName: '', formId: '', generationId: null, components: null, xml: null, validation: null })
  const [aiLoading, setAiLoading] = useState(false)
  const [aiDone, setAiDone] = useState(false)
  // Cambios con IA dentro del editor
  const [aiEditOpen, setAiEditOpen] = useState(false)
  const [aiInstruction, setAiInstruction] = useState('')
  const [aiEditing, setAiEditing] = useState(false)
  const [undoState, setUndoState] = useState(null)
  const [aiWarnings, setAiWarnings] = useState([])

  const newField = () => ({ id: newGuid(), nombre: '', fieldKey: '', tipo: 'text', required: false, readOnly: false, placeholder: '', defaultValue: '', maxLength: '', options: '' })
  const newSection = (name = 'GENERAL') => ({ id: newGuid(), name, fields: [newField()] })


  // ── Selección y edición de la estructura ──────────────────────────────────
  // selected: null (propiedades del formulario) | { type: 'section', sid } | { type: 'field', sid, fid }
  const [selected, setSelected] = useState(null)
  const [collapsed, setCollapsed] = useState({})
  const [dragging, setDragging] = useState(null)
  const fieldRefs = useRef({})
  const [focusId, setFocusId] = useState(null)

  useEffect(() => {
    if (focusId && fieldRefs.current[focusId]) {
      fieldRefs.current[focusId].focus()
      setFocusId(null)
    }
  }, [focusId, sections])

  const flatFields = sections.flatMap(sec => sec.fields.map(f => ({ sid: sec.id, fid: f.id })))
  const findField = (sid, fid) => sections.find(sec => sec.id === sid)?.fields.find(f => f.id === fid)

  const setField = (sid, fid, v) => setSections(s => s.map(sec => sec.id === sid ? { ...sec, fields: sec.fields.map(f => f.id === fid ? v : f) } : sec))

  const insertFieldAfter = (sid, fid) => {
    const nf = newField()
    setSections(s => s.map(sec => {
      if (sec.id !== sid) return sec
      const idx = fid ? sec.fields.findIndex(f => f.id === fid) : sec.fields.length - 1
      const fields = [...sec.fields]
      fields.splice(idx + 1, 0, nf)
      return { ...sec, fields }
    }))
    setCollapsed(c => ({ ...c, [sid]: false }))
    setSelected({ type: 'field', sid, fid: nf.id })
    setFocusId(nf.id)
  }

  const deleteField = (sid, fid) => {
    const pos = flatFields.findIndex(x => x.fid === fid)
    const next = flatFields[pos + 1] || flatFields[pos - 1]
    setSections(s => s.map(sec => sec.id === sid ? { ...sec, fields: sec.fields.filter(f => f.id !== fid) } : sec))
    if (next && next.fid !== fid) { setSelected({ type: 'field', ...next }); setFocusId(next.fid) } else setSelected(null)
  }

  const duplicateField = (sid, fid) => {
    const f = findField(sid, fid); if (!f) return
    const copy = { ...f, id: newGuid(), nombre: f.nombre ? `${f.nombre} (copia)` : '', fieldKey: '' }
    setSections(s => s.map(sec => {
      if (sec.id !== sid) return sec
      const idx = sec.fields.findIndex(x => x.id === fid)
      const fields = [...sec.fields]; fields.splice(idx + 1, 0, copy)
      return { ...sec, fields }
    }))
    setSelected({ type: 'field', sid, fid: copy.id })
  }

  const moveFieldBy = (sid, fid, delta) => {
    setSections(s => s.map(sec => {
      if (sec.id !== sid) return sec
      const idx = sec.fields.findIndex(f => f.id === fid)
      const to = idx + delta
      if (to < 0 || to >= sec.fields.length) return sec
      const fields = [...sec.fields]; const [m] = fields.splice(idx, 1); fields.splice(to, 0, m)
      return { ...sec, fields }
    }))
  }

  // Mueve un campo a otro panel (y opcionalmente a la posición de otro campo)
  const moveFieldTo = (fromSid, fid, toSid, beforeFid = null) => {
    setSections(s => {
      const f = s.find(sec => sec.id === fromSid)?.fields.find(x => x.id === fid)
      if (!f) return s
      const removed = s.map(sec => sec.id === fromSid ? { ...sec, fields: sec.fields.filter(x => x.id !== fid) } : sec)
      return removed.map(sec => {
        if (sec.id !== toSid) return sec
        const fields = [...sec.fields]
        const idx = beforeFid ? fields.findIndex(x => x.id === beforeFid) : -1
        if (idx >= 0) fields.splice(idx, 0, f); else fields.push(f)
        return { ...sec, fields }
      })
    })
    setSelected({ type: 'field', sid: toSid, fid })
  }

  const addPanel = () => {
    const sec = newSection('NUEVO PANEL')
    setSections(s => [...s, sec])
    setSelected({ type: 'section', sid: sec.id })
  }

  const renameSection = (sid, v) => setSections(s => s.map(sec => sec.id === sid ? { ...sec, name: v.toUpperCase() } : sec))

  const deleteSection = (sid) => {
    const sec = sections.find(x => x.id === sid)
    const n = sec?.fields.filter(f => f.nombre).length || 0
    const run = () => { setSections(s => s.filter(x => x.id !== sid)); setSelected(null) }
    if (n === 0) return run()
    Modal.confirm({
      title: `¿Eliminar el panel «${sec.name}»?`,
      content: `Se borrarán también sus ${n} campos.`,
      okText: 'Eliminar', okButtonProps: { danger: true }, cancelText: 'Cancelar',
      onOk: run
    })
  }

  const moveSectionBy = (sid, delta) => setSections(s => {
    const idx = s.findIndex(x => x.id === sid); const to = idx + delta
    if (to < 0 || to >= s.length) return s
    const arr = [...s]; const [m] = arr.splice(idx, 1); arr.splice(to, 0, m)
    return arr
  })

  const navFrom = (fid, e) => {
    const pos = flatFields.findIndex(x => x.fid === fid)
    const delta = e.key === 'ArrowUp' || e.key === 'Backspace' ? -1 : 1
    if (e.altKey && e.key !== 'Backspace') {
      const cur = flatFields[pos]; moveFieldBy(cur.sid, cur.fid, delta); setFocusId(cur.fid); return
    }
    if (e.key === 'Backspace') { const cur = flatFields[pos]; deleteField(cur.sid, cur.fid); return }
    const next = flatFields[pos + delta]
    if (next) { setSelected({ type: 'field', ...next }); setFocusId(next.fid) }
  }

  const fieldMenu = (sid, fid, si, fi, count) => [
    { key: 'add', icon: <PlusOutlined />, label: 'Añadir campo debajo', onClick: () => insertFieldAfter(sid, fid) },
    { key: 'dup', icon: <CopyOutlined />, label: 'Duplicar', onClick: () => duplicateField(sid, fid) },
    { key: 'up', icon: <ArrowUpOutlined />, label: 'Subir', disabled: fi === 0, onClick: () => moveFieldBy(sid, fid, -1) },
    { key: 'down', icon: <ArrowDownOutlined />, label: 'Bajar', disabled: fi === count - 1, onClick: () => moveFieldBy(sid, fid, 1) },
    { type: 'divider' },
    { key: 'del', icon: <DeleteOutlined />, label: 'Eliminar', danger: true, onClick: () => deleteField(sid, fid) }
  ]

  const sectionMenu = (sid, si) => [
    { key: 'add', icon: <PlusOutlined />, label: 'Añadir campo', onClick: () => insertFieldAfter(sid, null) },
    { key: 'up', icon: <ArrowUpOutlined />, label: 'Subir panel', disabled: si === 0, onClick: () => moveSectionBy(sid, -1) },
    { key: 'down', icon: <ArrowDownOutlined />, label: 'Bajar panel', disabled: si === sections.length - 1, onClick: () => moveSectionBy(sid, 1) },
    { type: 'divider' },
    { key: 'del', icon: <DeleteOutlined />, label: 'Eliminar panel', danger: true, disabled: sections.length <= 1, onClick: () => deleteSection(sid) }
  ]

  const handleCsvImport = ({ sections: newSecs }, mode) => {
    const mapped = newSecs.map(s => ({ id: newGuid(), name: s.name, fields: s.fields }))
    if (mode === 'replace') {
      setSections(mapped)
    } else {
      setSections(prev => {
        const merged = [...prev]
        mapped.forEach(ns => {
          const ex = merged.find(s => s.name === ns.name)
          if (ex) ex.fields = [...ex.fields, ...ns.fields]
          else merged.push(ns)
        })
        return merged
      })
    }
    setXml('')
    setError('')
  }

  const generate = () => {
    setError('')
    if (!formName.trim()) { setError('Ponle un nombre al formulario (panel de la derecha).'); setSelected(null); return }
    const total = sections.flatMap(s => s.fields).filter(f => f.nombre.trim()).length
    if (total === 0) { setError('Añade al menos un campo.'); return }
    setXml(buildEFormXml({ formName: formName.trim(), submitLabel: submitLabel.trim() || 'Enviar', sections, colsPerRow, formIdOverride: thereforeFormId }))
    setXmlModalOpen(true)
  }

  const saveToSupabase = async () => {
    if (!xml) return
    setSaving(true)
    try {
      const newFormId = formId || newGuid()

      // Si es nuevo, INSERT. Si existe, UPDATE
      if (isNew) {
        const { error: err } = await supabase.from('eforms').insert({
          form_id: newFormId,
          name: formName,
          definition: xml,
          description: description,
          created_by: user?.id
        })
        if (err) throw err
        setFormId(newFormId)
        setIsNew(false)
      } else {
        const { error: err } = await supabase
          .from('eforms')
          .update({
            name: formName,
            definition: xml,
            description: description,
            updated_at: new Date().toISOString()
          })
          .eq('form_id', formId)
        if (err) throw err
      }

      message.success(isNew ? '✓ Formulario guardado' : '✓ Formulario actualizado')
      setXmlModalOpen(false)
    } catch (err) {
      handleError(err, 'realizar la operación')
    } finally {
      setSaving(false)
    }
  }

  const copy = () => {
    const fb = () => {
      const ta = document.createElement('textarea')
      ta.value = xml
      ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(xml).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }).catch(fb)
    } else {
      fb()
    }
  }

  const download = () => {
    const a = document.createElement('a')
    a.href = 'data:application/xml;charset=utf-8,' + encodeURIComponent(xml)
    a.download = (formName.trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_]/g, '') || 'eform') + '_therefore.xml'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const loadSavedForms = async () => {
    setLoadingForms(true)
    try {
      let query = supabase.from('eforms').select('*')

      // Filtro: usuarios ven suyos + compartidos, admins ven todos
      const isAdmin = user?.user_metadata?.is_admin || false

      if (!isAdmin) {
        query = query.or(`created_by.eq.${user?.id},compartido.eq.true`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setSavedForms(data || [])
    } catch (err) {
      message.error('Error cargando formularios: ' + err.message)
    } finally {
      setLoadingForms(false)
    }
  }

  const duplicateForm = async (form) => {
    try {
      const { error } = await supabase
        .from('eforms')
        .insert({
          form_id: `${form.form_id}_copy_${Date.now()}`,
          name: `${form.name} (Copia)`,
          definition: form.definition,
          description: form.description,
          compartido: false,
          created_by: user?.id
        })

      if (error) throw error
      message.success('Formulario duplicado')
      loadSavedForms()
    } catch (err) {
      message.error('Error duplicando: ' + err.message)
    }
  }

  const parseFormioField = (field) => {
    const tipo = {
      'textfield': 'text',
      'email': 'email',
      'phoneNumber': 'phone',
      'datetime': field.enableTime ? 'datetime' : 'date',
      'number': 'number',
      'currency': 'money',
      'checkbox': 'checkbox',
      'select': 'select'
    }[field.type] || 'text'

    return {
      id: newGuid(),
      nombre: field.label || '',
      fieldKey: field.key || '',
      tipo: tipo,
      required: field.validate?.required || false,
      readOnly: field.disabled || false,
      placeholder: field.placeholder || '',
      defaultValue: field.defaultValue || '',
      maxLength: field.validate?.maxLength?.toString() || '',
      options: field.data?.values?.map(v => `${v.value}=${v.label}`).join('\n') || ''
    }
  }

  // Abre en el editor un conjunto de componentes form.io (de un formulario guardado o de la IA)
  const openComponents = (components, meta = {}) => {
    const { sections: secs, submitLabel: sl } = componentsToEditor(components)
    setSections(secs)
    setSubmitLabel(sl)
    setFormName(meta.formName || '')
    setDescription(meta.description || '')
    setThereforeFormId(meta.thereforeFormId || '')
    setOrigin(meta.origin || 'manual')
    if (meta.environment) setEnvironment(meta.environment)
    if (meta.tenant !== undefined) setTenant(meta.tenant || '')
    if (meta.serverUrl !== undefined) setServerUrl(meta.serverUrl || '')
    setFormId(meta.savedFormId || null)
    setIsNew(!meta.savedFormId)
    setSelected(null)
    setCollapsed({})
    setUndoState(null)
    setXml('')
    setError('')
    setActiveView('editor')
    setMode('editor')
    const locked = secs.flatMap(sec => sec.fields).filter(f => f.locked).length
    return locked
  }

  const loadFormToEditor = (form) => {
    try {
      const xmlDoc = new DOMParser().parseFromString(form.definition, 'text/xml')
      const fdefNode = xmlDoc.querySelector('FDef')
      if (!fdefNode) throw new Error('No se encontró FDef en el XML')
      const formioJson = JSON.parse(fdefNode.textContent)
      const formIdNode = xmlDoc.querySelector('FormID')
      const locked = openComponents(formioJson.components || [], {
        formName: form.name,
        description: form.description,
        thereforeFormId: formIdNode?.textContent || '',
        savedFormId: form.form_id,
        origin: 'manual'
      })
      setManagerOpen(false)
      message.success(locked ? `Formulario abierto · ${locked} bloques avanzados conservados` : 'Formulario abierto')
    } catch (err) {
      message.error('No se pudo abrir el formulario: ' + err.message)
    }
  }

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('No autenticado')
    return { Authorization: `Bearer ${session.access_token}` }
  }

  const loadAiHistory = async () => {
    if (!isAdmin) return
    try {
      const response = await axios.get('/api/eform-ai?action=history', { headers: await authHeaders() })
      setAiHistory(response.data.generations || [])
    } catch (err) {
      console.error('Error cargando historial IA:', err)
    }
  }

  const openGeneration = async (id) => {
    try {
      setLoadingForms(true)
      const response = await axios.get(`/api/eform-ai?action=get&id=${id}`, { headers: await authHeaders() })
      const g = response.data.generation
      const locked = openComponents(g.components || [], {
        formName: g.form_name, thereforeFormId: g.form_id, origin: 'ia',
        environment: g.environment, tenant: g.tenant, serverUrl: g.server_url
      })
      message.success(locked ? `Abierto · ${locked} bloques avanzados conservados` : 'Abierto en el editor')
    } catch (err) {
      message.error('No se pudo abrir: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoadingForms(false)
    }
  }

  // Lista inicial
  useEffect(() => {
    if (mode === 'list') { loadSavedForms(); loadAiHistory() }
  }, [mode, isAdmin])

  // Al terminar la generación con IA, el resultado se abre directamente en el editor
  useEffect(() => {
    if (!aiDone) return
    setAiDone(false)
    if (!aiData.components) return
    const locked = openComponents(aiData.components, {
      formName: aiData.formName, thereforeFormId: aiData.formId, origin: 'ia',
      environment: aiData.environment, tenant: aiData.tenant, serverUrl: aiData.serverUrl
    })
    if (aiData.categoryXml) { setCategoryXml(aiData.categoryXml); setCategoryFileName(c => c || 'categoría de referencia') }
    if (aiData.validation?.errors?.length) {
      setAiWarnings(aiData.validation.errors.map(e => typeof e === 'string' ? e : (e.message || JSON.stringify(e))))
    } else setAiWarnings([])
    message.success(locked ? `eForm generado · ${locked} bloques avanzados conservados` : 'eForm generado: ya puedes retocarlo')
    if (searchParams.get('nuevo')) setSearchParams({})
  }, [aiDone])

  const startBlank = () => {
    openComponents([], { formName: '', origin: 'manual' })
    setSections([newSection('GENERAL')])
  }

  const startAi = () => {
    setAiData(d => ({ ...d, request: '', detailedPrompt: '', formName: '', formId: '', components: null, environment, tenant, serverUrl, categoryXml }))
    setMode('ai')
  }

  const startCsv = () => {
    startBlank()
    setCsvModalOpen(true)
  }

  const backToList = () => {
    const dirty = mode === 'editor' && sections.some(sec => sec.fields.some(f => f.nombre.trim()))
    if (!dirty) { setMode('list'); return }
    Modal.confirm({
      title: '¿Volver a la lista?',
      content: 'Los cambios que no hayas guardado en «Mis formularios» o descargado se perderán.',
      okText: 'Volver', cancelText: 'Seguir editando',
      onOk: () => setMode('list')
    })
  }

  const handleCategoryFile = (file) => {
    const reader = new FileReader()
    reader.onload = e => { setCategoryXml(e.target.result); setCategoryFileName(file.name) }
    reader.readAsText(file)
    return false
  }

  // Paso 4: cambios con IA sobre el formulario abierto
  const requestAiEdit = async () => {
    if (!aiInstruction.trim()) return
    setAiEditing(true)
    try {
      const components = editorToComponents({ sections, colsPerRow, submitLabel })
      const response = await axios.post('/api/eform-ai?action=edit', {
        components, instruction: aiInstruction, environment, tenant, serverUrl, categoryXml
      }, { headers: { ...(await authHeaders()), 'Content-Type': 'application/json' } })
      const snapshot = { sections, submitLabel }
      const { sections: secs, submitLabel: sl } = componentsToEditor(response.data.components)
      setSections(secs)
      setSubmitLabel(sl)
      setSelected(null)
      setUndoState(snapshot)
      const errs = response.data.validation?.errors || []
      setAiWarnings(errs.map(e => typeof e === 'string' ? e : (e.message || JSON.stringify(e))))
      setAiEditOpen(false)
      setAiInstruction('')
      message.success('Cambios de la IA aplicados. Puedes deshacerlos.')
    } catch (err) {
      message.error('La IA no pudo aplicar el cambio: ' + (err.response?.data?.error || err.message))
    } finally {
      setAiEditing(false)
    }
  }

  const undoAiEdit = () => {
    if (!undoState) return
    setSections(undoState.sections)
    setSubmitLabel(undoState.submitLabel)
    setUndoState(null)
    setAiWarnings([])
    setSelected(null)
  }

  // Lista combinada: formularios guardados + generaciones con IA
  const listRows = useMemo(() => {
    const saved = savedForms.map(f => ({ key: `s-${f.id}`, kind: 'saved', name: f.name, sub: f.description || '', date: f.created_at, shared: f.compartido, mine: f.created_by === user?.id, raw: f }))
    const gens = aiHistory.map(g => ({ key: `g-${g.id}`, kind: 'ai', name: g.form_name || 'Sin nombre', sub: g.form_id || '', date: g.created_at, status: g.status, version: g.version, raw: g }))
    const q = listSearch.trim().toLowerCase()
    return [...saved, ...gens]
      .filter(r => !q || r.name.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q))
      .sort((x, y) => new Date(y.date) - new Date(x.date))
  }, [savedForms, aiHistory, listSearch, user?.id])

  const newMenuItems = [
    { key: 'blank', icon: <FormOutlined />, label: 'En blanco', onClick: startBlank },
    ...(isAdmin ? [{ key: 'ai', icon: <ThunderboltOutlined />, label: 'Describiéndolo (IA)', onClick: startAi }] : []),
    { key: 'csv', icon: <UploadOutlined />, label: 'Desde CSV', onClick: startCsv }
  ]

  const totalFields = sections.flatMap(s => s.fields).filter(f => f.nombre.trim()).length

  return (
    <div className="eform-container">
      {mode === 'list' && (
        <>
          <div className="eform-header">
            <div>
              <h1 className="header-title">eForms</h1>
              <p className="header-subtitle">Crea formularios electrónicos y descarga el XML para Therefore™ Solution Designer.</p>
            </div>
            <div className="eform-header-actions">
              <HelpButton section="eformBuilder" />
              <Input prefix={<SearchOutlined className="cell-muted" />} placeholder="Buscar formularios…" value={listSearch}
                onChange={e => setListSearch(e.target.value)} allowClear style={{ width: 260 }} aria-label="Buscar formularios" />
              <Dropdown menu={{ items: newMenuItems }} trigger={['click']} placement="bottomRight">
                <button className="btn-primary"><PlusOutlined /> Nuevo eForm</button>
              </Dropdown>
            </div>
          </div>

          {loadingForms ? (
            <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>
          ) : listRows.length === 0 ? (
            <div className="efx-empty">
              <p className="cell-title">{listSearch ? `Ningún formulario coincide con «${listSearch}»` : 'Aún no hay formularios'}</p>
              {!listSearch && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn-default" onClick={startBlank}><FormOutlined /> Empezar en blanco</button>
                  {isAdmin && <button className="btn-primary" onClick={startAi}><ThunderboltOutlined /> Describirlo con IA</button>}
                </div>
              )}
            </div>
          ) : (
            <ul className="row-list" aria-label="Formularios">
              {listRows.map(r => {
                const confirmDelete = () => Modal.confirm({
                  title: `¿Eliminar «${r.name}»?`,
                  content: r.kind === 'ai' ? 'Se borrará esta versión generada con IA. Esta acción no se puede deshacer.' : 'Esta acción no se puede deshacer.',
                  okText: 'Eliminar', okButtonProps: { danger: true }, cancelText: 'Cancelar',
                  onOk: async () => {
                    try {
                      if (r.kind === 'ai') {
                        await axios.delete(`/api/eform-ai?action=delete&id=${r.raw.id}`, { headers: await authHeaders() })
                        message.success('Eliminado'); loadAiHistory()
                      } else {
                        const { error: delErr } = await supabase.from('eforms').delete().eq('id', r.raw.id)
                        if (delErr) throw delErr
                        message.success('Eliminado'); loadSavedForms()
                      }
                    } catch (err) {
                      message.error('No se pudo eliminar: ' + (err.response?.data?.error || err.message))
                    }
                  }
                })
                const items = r.kind === 'saved' ? [
                  { key: 'dup', icon: <CopyOutlined />, label: 'Duplicar', onClick: () => duplicateForm(r.raw) },
                  ...(r.mine ? [
                    { key: 'share', icon: r.shared ? <LockOutlined /> : <ShareAltOutlined />, label: r.shared ? 'Dejar de compartir' : 'Compartir', onClick: async () => {
                      try {
                        const { error: upErr } = await supabase.from('eforms').update({ compartido: !r.shared }).eq('id', r.raw.id)
                        if (upErr) throw upErr
                        message.success(r.shared ? 'Ya no está compartido' : 'Compartido'); loadSavedForms()
                      } catch (err) { handleError(err, 'realizar la operación') }
                    } },
                    { type: 'divider' },
                    { key: 'del', icon: <DeleteOutlined />, label: 'Eliminar', danger: true, onClick: confirmDelete }
                  ] : [])
                ] : [
                  { key: 'open', icon: <FormOutlined />, label: 'Abrir en el editor', onClick: () => openGeneration(r.raw.id) },
                  { type: 'divider' },
                  { key: 'del', icon: <DeleteOutlined />, label: 'Eliminar', danger: true, onClick: confirmDelete }
                ]
                return (
                  <li key={r.key} className="row-list-item">
                    <span className="home-action-icon" aria-hidden="true">{r.kind === 'ai' ? <ThunderboltOutlined /> : <FormOutlined />}</span>
                    <div className="cell-stack" style={{ flex: 1 }}>
                      <span className="cell-title">
                        {r.name}
                        {r.shared && <span className="tag-neutral-inline" style={{ marginLeft: 8 }}>Compartido</span>}
                        {r.kind === 'saved' && !r.mine && <span className="tag-neutral-inline" style={{ marginLeft: 8 }}>De otro usuario</span>}
                      </span>
                      <span className="cell-sub">{r.sub || '—'}</span>
                    </div>
                    <span className="cell-muted row-list-meta" style={{ minWidth: 150 }}>
                      {r.kind === 'ai' ? `Generado con IA${r.version > 1 ? ` · v${r.version}` : ''}` : 'Guardado'}
                      {r.kind === 'ai' && r.status === 'invalid' && <span className="status-dot status-dot--error" style={{ marginLeft: 8 }} title="Con avisos de validación" />}
                    </span>
                    <Tooltip title={formatFullDate(r.date)}><span className="cell-muted row-list-meta" style={{ minWidth: 100 }}>{formatShortDate(r.date)}</span></Tooltip>
                    <button className="btn-default" onClick={() => r.kind === 'saved' ? loadFormToEditor(r.raw) : openGeneration(r.raw.id)}>Abrir</button>
                    {items ? (
                      <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
                        <Button type="text" size="small" icon={<MoreOutlined />} aria-label={`Acciones: ${r.name}`} />
                      </Dropdown>
                    ) : <span style={{ width: 24 }} />}
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}

      {mode === 'ai' && (
        <>
          <div className="eform-header">
            <div>
              <button className="btn-link efx-back" onClick={() => setMode('list')}><ArrowLeftOutlined /> eForms</button>
              <h1 className="header-title">Nuevo eForm con IA</h1>
              <p className="header-subtitle">Descríbelo con tus palabras. El resultado se abre en el editor para que lo retoques.</p>
            </div>
            <div className="eform-header-actions">
              <HelpButton section="eformGeneratorAI" />
            </div>
          </div>
          <div className="efx-ai-wrap">
            <Spin spinning={aiLoading} tip="La IA está trabajando…">
              <StepRequest
                formData={aiData}
                updateFormData={u => setAiData(prev => ({ ...prev, ...u }))}
                goToStep={step => { if (step === 2) setAiDone(true) }}
                setLoading={setAiLoading}
              />
            </Spin>
          </div>
        </>
      )}

      {mode === 'editor' && (
      <>
      <div className="eform-header">
        <div>
          <button className="btn-link efx-back" onClick={backToList}><ArrowLeftOutlined /> eForms</button>
          <h1 className="header-title">{formName || 'Nuevo eForm'}</h1>
          {origin === 'ia' && <p className="header-subtitle">Generado con IA · los bloques con candado se conservan tal cual en el XML.</p>}
        </div>
        <div className="eform-header-actions">
          <HelpButton section="eformBuilder" />
          {isAdmin && <button className="btn-default" onClick={() => setAiEditOpen(true)}><ThunderboltOutlined /> Pedir cambios a la IA</button>}
          <button className="btn-default" onClick={() => setCsvModalOpen(true)}>Importar CSV</button>
          <button className="btn-primary" onClick={generate}>Generar XML</button>
        </div>
      </div>

      {undoState && (
        <Alert type="success" showIcon closable onClose={() => setUndoState(null)} style={{ marginBottom: 12 }}
          message="La IA ha aplicado los cambios."
          action={<button className="btn-default" onClick={undoAiEdit}>Deshacer</button>} />
      )}
      {aiWarnings.length > 0 && (
        <Alert type="warning" showIcon closable onClose={() => setAiWarnings([])} style={{ marginBottom: 12 }}
          message={`La IA ha dejado ${aiWarnings.length === 1 ? 'un problema' : `${aiWarnings.length} problemas`} que Therefore™ no aceptaría`}
          description={
            <>
              <ul style={{ margin: '0 0 8px', paddingLeft: 18 }}>{aiWarnings.slice(0, 5).map((w, i) => <li key={i}>{friendlyWarning(w)}</li>)}</ul>
              <span className="cell-muted" style={{ fontSize: 12 }}>Corrígelo antes de importar el XML.</span>
            </>
          }
          action={isAdmin && (
            <button className="btn-default" onClick={() => {
              setAiInstruction(`Corrige estos problemas de validación sin cambiar nada más:\n${aiWarnings.map(w => `- ${w}`).join('\n')}`)
              setAiEditOpen(true)
            }}>Pedir a la IA que lo corrija</button>
          )} />
      )}

      <div role="tablist" aria-label="Vista" className="efx-tabs">
        {[['editor', 'Editor'], ['preview', 'Vista previa']].map(([v, label]) => (
          <button key={v} role="tab" aria-selected={activeView === v} className={`efx-tab ${activeView === v ? 'is-active' : ''}`} onClick={() => setActiveView(v)}>
            {label}
          </button>
        ))}
        <span className="efx-tabs-meta">{totalFields} {totalFields === 1 ? 'campo' : 'campos'} · {sections.length} {sections.length === 1 ? 'panel' : 'paneles'}</span>
      </div>

      {error && <Alert type="warning" showIcon message={error} closable onClose={() => setError('')} style={{ marginBottom: 12 }} />}

      {activeView === 'preview' ? (
        <div className="efx-preview-wrap">
          <FormPreview formName={formName} description={description} submitLabel={submitLabel} sections={sections} colsPerRow={colsPerRow} />
        </div>
      ) : (
        <div className="efx-layout">
          {/* ── Estructura ───────────────────────────── */}
          <div className="efx-structure" aria-label="Estructura del formulario">
            <button type="button" className={`efx-row efx-form-row ${selected === null ? 'is-selected' : ''}`} onClick={() => setSelected(null)}>
              <FileTextOutlined />
              <span className="efx-form-name">{formName || 'Formulario sin nombre'}</span>
              <span className="efx-type">Propiedades</span>
            </button>

            {sections.map((sec, si) => {
              const isCollapsed = !!collapsed[sec.id]
              return (
                <div key={sec.id} className="efx-section"
                  onDragOver={e => { if (dragging) e.preventDefault() }}
                  onDrop={e => { e.preventDefault(); if (dragging) { moveFieldTo(dragging.sid, dragging.fid, sec.id); setDragging(null) } }}
                >
                  <div className={`efx-row efx-section-row ${selected?.type === 'section' && selected.sid === sec.id ? 'is-selected' : ''}`}
                    onClick={() => setSelected({ type: 'section', sid: sec.id })}>
                    <button type="button" className="efx-caret" aria-label={isCollapsed ? 'Desplegar panel' : 'Plegar panel'}
                      onClick={e => { e.stopPropagation(); setCollapsed(c => ({ ...c, [sec.id]: !isCollapsed })) }}>
                      {isCollapsed ? <CaretRightOutlined /> : <CaretDownOutlined />}
                    </button>
                    <span className="efx-section-name">{sec.name || 'Panel sin nombre'}</span>
                    <span className="efx-type">{sec.fields.filter(f => f.nombre).length}</span>
                    <span onClick={e => e.stopPropagation()}>
                      <Dropdown menu={{ items: sectionMenu(sec.id, si) }} trigger={['click']} placement="bottomRight">
                        <Button type="text" size="small" icon={<MoreOutlined />} aria-label={`Acciones del panel ${sec.name}`} />
                      </Dropdown>
                    </span>
                  </div>

                  {!isCollapsed && (
                    <>
                      {sec.fields.map((f, fi) => (
                        <StructureField
                          key={f.id}
                          field={f}
                          inputRef={el => { fieldRefs.current[f.id] = el }}
                          selected={selected?.type === 'field' && selected.fid === f.id}
                          onSelect={() => setSelected({ type: 'field', sid: sec.id, fid: f.id })}
                          onChange={v => setField(sec.id, f.id, v)}
                          onEnter={() => insertFieldAfter(sec.id, f.id)}
                          onKeyNav={e => navFrom(f.id, e)}
                          menuItems={fieldMenu(sec.id, f.id, si, fi, sec.fields.length)}
                          dragProps={{
                            draggable: true,
                            onDragStart: () => setDragging({ sid: sec.id, fid: f.id }),
                            onDragEnd: () => setDragging(null),
                            onDragOver: e => { if (dragging) e.preventDefault() },
                            onDrop: e => {
                              e.preventDefault(); e.stopPropagation()
                              if (dragging && dragging.fid !== f.id) moveFieldTo(dragging.sid, dragging.fid, sec.id, f.id)
                              setDragging(null)
                            }
                          }}
                        />
                      ))}
                      <button type="button" className="efx-add" onClick={() => insertFieldAfter(sec.id, null)}>
                        <PlusOutlined /> Añadir campo
                      </button>
                    </>
                  )}
                </div>
              )
            })}

            <button type="button" className="efx-add efx-add-panel" onClick={addPanel}>
              <PlusOutlined /> Añadir panel
            </button>
            <p className="efx-shortcuts">Intro: campo nuevo · ↑ ↓: moverse · Alt + ↑ ↓: reordenar · Retroceso en un campo vacío: borrarlo</p>
          </div>

          {/* ── Propiedades ──────────────────────────── */}
          <aside className="efx-props" aria-label="Propiedades">
            {selected?.type === 'field' && findField(selected.sid, selected.fid) ? (
              <FieldProperties
                field={findField(selected.sid, selected.fid)}
                sections={sections}
                sectionId={selected.sid}
                onChange={v => setField(selected.sid, selected.fid, v)}
                onMove={toSid => moveFieldTo(selected.sid, selected.fid, toSid)}
                onRemove={() => deleteField(selected.sid, selected.fid)}
              />
            ) : selected?.type === 'section' && sections.find(x => x.id === selected.sid) ? (
              (() => {
                const sec = sections.find(x => x.id === selected.sid)
                return (
                  <>
                    <div className="efx-props-title">Panel</div>
                    <PropRow label="Nombre del panel" hint="Therefore™ lo muestra en mayúsculas.">
                      <Input value={sec.name} onChange={e => renameSection(sec.id, e.target.value)} placeholder="DATOS DEL CLIENTE" />
                    </PropRow>
                    <PropRow label="Campos">
                      <span>{sec.fields.filter(f => f.nombre).length}</span>
                    </PropRow>
                    <button className="btn-default" onClick={() => insertFieldAfter(sec.id, null)}><PlusOutlined /> Añadir campo</button>
                    {sections.length > 1 && (
                      <button className="btn-link danger efx-remove" onClick={() => deleteSection(sec.id)}><DeleteOutlined /> Eliminar panel</button>
                    )}
                  </>
                )
              })()
            ) : (
              <>
                <div className="efx-props-title">Formulario</div>
                <PropRow label="Nombre *">
                  <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="ej. Solicitud de documentos" status={error && !formName.trim() ? 'warning' : undefined} />
                </PropRow>
                <PropRow label="Descripción" hint="Opcional. Aparece encima del formulario.">
                  <Input.TextArea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Rellene este formulario para…" />
                </PropRow>
                <PropRow label="Texto del botón">
                  <Input value={submitLabel} onChange={e => setSubmitLabel(e.target.value)} placeholder="Enviar" />
                </PropRow>
                <PropRow label="Campos por fila">
                  <Segmented block value={colsPerRow} onChange={setColsPerRow} options={[1, 2, 3, 4]} />
                </PropRow>
                <PropRow label="ID del formulario (FormID)" hint="Se genera a partir del nombre si lo dejas vacío.">
                  <Input className="efx-mono" value={thereforeFormId} placeholder={formName.replace(/\s+/g, '').replace(/[^A-Za-z0-9]/g, '') || 'NuevoEForm'}
                    onChange={e => setThereforeFormId(e.target.value.replace(/[^A-Za-z0-9_]/g, ''))} />
                </PropRow>

                <div className="efx-props-title" style={{ marginTop: 8 }}>Destino en Therefore™</div>
                <PropRow label="Entorno">
                  <Segmented block value={environment} onChange={setEnvironment}
                    options={[{ label: 'Online', value: 'online' }, { label: 'On-Premise', value: 'onpremise' }]} />
                </PropRow>
                {environment === 'online' ? (
                  <PropRow label="Tenant">
                    <Input value={tenant} onChange={e => setTenant(e.target.value)} placeholder="ej. canon-demo" />
                  </PropRow>
                ) : (
                  <PropRow label="URL del servidor">
                    <Input value={serverUrl} onChange={e => setServerUrl(e.target.value)} placeholder="https://servidor/TheService" />
                  </PropRow>
                )}
                <PropRow label="Categoría de referencia" hint="XML exportado de la categoría donde se archivará. La IA lo usa para que los campos coincidan.">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Upload accept=".xml" showUploadList={false} beforeUpload={handleCategoryFile}>
                      <button className="btn-default"><UploadOutlined /> {categoryFileName ? 'Cambiar' : 'Subir XML'}</button>
                    </Upload>
                    {categoryFileName && (
                      <>
                        <span className="cell-muted" style={{ fontSize: 13 }}>{categoryFileName}</span>
                        <button className="btn-link" onClick={() => { setCategoryXml(null); setCategoryFileName('') }}>Quitar</button>
                      </>
                    )}
                  </div>
                </PropRow>
              </>
            )}
          </aside>
        </div>
      )}
      </>
      )}

      {/* Forms Manager Modal */}
      <Modal
        title="Mis Formularios"
        open={managerOpen}
        onCancel={() => setManagerOpen(false)}
        width="80%"
        footer={<button className="btn-default" onClick={() => setManagerOpen(false)}>Cerrar</button>}
      >
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {loadingForms ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
            </div>
          ) : savedForms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              No hay formularios guardados
            </div>
          ) : (
            <ul className="row-list" aria-label="Formularios guardados">
              {savedForms.map((form) => {
                const isMine = form.created_by === user?.id
                const toggleShare = async () => {
                  try {
                    await supabase.from('eforms').update({ compartido: !form.compartido }).eq('id', form.id)
                    message.success(form.compartido ? 'Ya no está compartido' : 'Compartido')
                    loadSavedForms()
                  } catch (err) {
                    handleError(err, 'realizar la operación')
                  }
                }
                const remove = () => Modal.confirm({
                  title: `¿Eliminar «${form.name}»?`,
                  content: 'Esta acción no se puede deshacer.',
                  okText: 'Eliminar',
                  okButtonProps: { danger: true },
                  cancelText: 'Cancelar',
                  onOk: async () => {
                    try {
                      await supabase.from('eforms').delete().eq('id', form.id)
                      message.success('Eliminado')
                      loadSavedForms()
                    } catch (err) {
                      handleError(err, 'realizar la operación')
                    }
                  }
                })
                const items = [
                  { key: 'dup', icon: <CopyOutlined />, label: 'Duplicar', onClick: () => duplicateForm(form) },
                  ...(isMine ? [
                    { key: 'share', icon: form.compartido ? <LockOutlined /> : <ShareAltOutlined />, label: form.compartido ? 'Dejar de compartir' : 'Compartir', onClick: toggleShare },
                    { type: 'divider' },
                    { key: 'delete', icon: <DeleteOutlined />, label: 'Eliminar', danger: true, onClick: remove }
                  ] : [])
                ]
                return (
                  <li key={form.id} className="row-list-item">
                    <div className="cell-stack" style={{ flex: 1 }}>
                      <span className="cell-title">
                        {form.name}
                        {form.compartido && <span className="tag-neutral-inline" style={{ marginLeft: 8 }}>Compartido</span>}
                        {!isMine && <span className="tag-neutral-inline" style={{ marginLeft: 8 }}>De otro usuario</span>}
                      </span>
                      <span className="cell-sub">{form.description || 'Sin descripción'}</span>
                    </div>
                    <span className="cell-muted row-list-meta">{formatShortDate(form.created_at)}</span>
                    <button className="btn-default" onClick={() => loadFormToEditor(form)}>Abrir</button>
                    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
                      <Button type="text" size="small" icon={<MoreOutlined />} aria-label={`Acciones: ${form.name}`} />
                    </Dropdown>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </Modal>

      {/* Cambios con IA sobre el formulario abierto */}
      <Modal
        title="Pedir cambios a la IA"
        open={aiEditOpen}
        onCancel={() => !aiEditing && setAiEditOpen(false)}
        footer={[
          <button key="c" className="btn-default" onClick={() => setAiEditOpen(false)} disabled={aiEditing}>Cancelar</button>,
          <button key="ok" className="btn-primary" onClick={requestAiEdit} disabled={aiEditing || !aiInstruction.trim()}>
            {aiEditing ? 'Aplicando…' : 'Aplicar cambios'}
          </button>
        ]}
      >
        <p className="cell-muted" style={{ marginTop: 0 }}>Describe qué quieres cambiar. La IA modifica el formulario abierto y podrás deshacerlo.</p>
        <Input.TextArea rows={4} value={aiInstruction} onChange={e => setAiInstruction(e.target.value)} disabled={aiEditing} autoFocus
          placeholder="ej. Añade un campo IBAN obligatorio en el panel PAGO y haz que el email sea obligatorio" />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {['Añade un campo IBAN obligatorio', 'Haz obligatorios todos los campos de contacto', 'Añade una firma al final', 'Ordena los campos alfabéticamente'].map(ex => (
            <button key={ex} className="btn-default" style={{ fontSize: 12 }} onClick={() => setAiInstruction(ex)} disabled={aiEditing}>{ex}</button>
          ))}
        </div>
        <p className="cell-muted" style={{ fontSize: 12, marginBottom: 0, marginTop: 12 }}>
          Usa el destino de Therefore™ y la categoría de referencia indicados en las propiedades del formulario.
        </p>
      </Modal>

      {/* XML Modal */}
      <Modal
        title="XML listo para importar en Therefore™"
        open={xmlModalOpen}
        onCancel={() => setXmlModalOpen(false)}
        width="90%"
        style={{ maxWidth: '1200px' }}
        footer={[
          <button key="close" className="btn-default" onClick={() => setXmlModalOpen(false)}>Cerrar</button>,
          <button key="copy" className="btn-default" onClick={copy}>{copied ? 'Copiado' : 'Copiar XML'}</button>,
          <button key="save" className="btn-default" onClick={saveToSupabase} disabled={saving}>{saving ? 'Guardando…' : 'Guardar en Mis formularios'}</button>,
          <button key="download" className="btn-primary" onClick={download}>Descargar .xml</button>,
        ]}
      >
        <div className="eform-xml-modal-content">
          <div className="eform-char-count">{xml.length.toLocaleString()} caracteres</div>
          <textarea readOnly className="eform-textarea eform-xml-textarea" value={xml} onClick={e => e.target.select()} />
        </div>
      </Modal>

      {/* CSV Importer Modal */}
      <CsvImporter isOpen={csvModalOpen} onClose={() => setCsvModalOpen(false)} onImport={handleCsvImport} />

    </div>
  )
}
