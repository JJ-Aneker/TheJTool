import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../config/supabaseClient'
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
      if (f.tipo === 'checkbox') {
        panelComps.push(buildComponent(f))
        i++
      } else {
        const rowFields = []
        while (i < validFields.length && validFields[i].tipo !== 'checkbox' && rowFields.length < cols) {
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

function buildEFormXml({ formName, submitLabel, sections, colsPerRow }) {
  const formio = buildFormioJson({ sections, colsPerRow, submitLabel })
  const fdef = JSON.stringify(formio, null, 2)
  const formID = formName.replace(/\s+/g, '').replace(/[^A-Za-z0-9]/g, '') || 'EForm'
  const formGuid = newGuid()

  return `<?xml version="1.0" encoding="utf-8"?>
<Configuration><Version>570425345</Version><NewImportExport>1</NewImportExport><Categories></Categories><QueryTemplates></QueryTemplates><CaseDefinitions></CaseDefinitions><Folders></Folders><Datatypes></Datatypes><KeywordDictionaries></KeywordDictionaries><Counters></Counters><Templates></Templates><WFProcesses></WFProcesses><UCProfiles></UCProfiles><TreeViews></TreeViews><CloudStorages></CloudStorages><Preprocessors></Preprocessors><Forms></Forms><FormImgs></FormImgs><ReportDefinitions></ReportDefinitions><ReportTemplates></ReportTemplates><PowerBIDataSets></PowerBIDataSets><PowerBITables></PowerBITables><EForms><EForm><FNo>-1</FNo><FVer>1</FVer><FName>${escXml(formName)}</FName><FDef>${fdef}</FDef><DCrea>${dcreaNow()}</DCrea><FCreUs>10</FCreUs><FCreUsNam>admin</FCreUsNam><Id>${formGuid}</Id><FormID>${escXml(formID)}</FormID></EForm></EForms><ESignatureProviders></ESignatureProviders><Roles></Roles><RoleAssignments></RoleAssignments><CommonScripts></CommonScripts><OfficeProfiles></OfficeProfiles><IxProfiles></IxProfiles><Queries></Queries><Users></Users><CaptProfiles></CaptProfiles><References></References><CntConnSrcs></CntConnSrcs><Dashboards></Dashboards><Stamps></Stamps><RetentionPolicies></RetentionPolicies><SmartCaptureProcessors></SmartCaptureProcessors><SmartCaptureQueues></SmartCaptureQueues><DocDownloadProviders></DocDownloadProviders><Credentials></Credentials></Configuration>`
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

function Toggle({ on, onChange, label }) {
  return (
    <label className="eform-toggle" data-on={on} onClick={onChange}>
      <span className="eform-toggle-switch">
        <span className="eform-toggle-thumb" style={{ left: on ? '12px' : '2px' }} />
      </span>
      {label}
    </label>
  )
}

function CsvImporter({ onImport }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [preview, setPreview] = useState(null)

  const handleParse = () => setPreview(parseCsv(text))
  const handleApply = mode => {
    if (!preview || preview.error) return
    onImport(preview, mode)
    setText('')
    setPreview(null)
    setOpen(false)
  }
  const total = preview && !preview.error
    ? preview.sections.reduce((a, s) => a + s.fields.length, 0) : 0

  return (
    <div className="eform-csv-importer">
      <button className="eform-btn-expand" onClick={() => setOpen(o => !o)}>
        {open ? '▲' : '▼'} Importar campos desde CSV
      </button>
      {open && (
        <div className="eform-csv-panel">
          <div className="eform-panel-title">Importar CSV</div>
          <div className="eform-csv-help">
            Columnas: <code>Nombre ; Key ; Tipo ; Obligatorio ; Placeholder ; Default ; MaxLength ; Seccion ; Options</code><br />
            <span>Solo <b>Nombre</b> es obligatorio. <b>Options</b> para select: separadas por <code>|</code></span>
          </div>
          <textarea
            className="eform-textarea"
            value={text}
            onChange={e => { setText(e.target.value); setPreview(null) }}
            placeholder={'Nombre;Key;Tipo;Obligatorio;Placeholder;Default;MaxLength;Seccion;Options\nNombre completo;nombre;Text;Si;Tu nombre completo;;100;DATOS PERSONALES\nCurso;curso;Select;Si;;;; ACADÉMICO;1ESO=1 ESO|2ESO=2 ESO'}
          />
          <button className="eform-btn-primary" onClick={handleParse} disabled={!text.trim()}>Analizar →</button>
          {preview && (
            <div className="eform-csv-preview">
              {preview.error ? (
                <div className="eform-error">⚠ {preview.error}</div>
              ) : (
                <>
                  <div className="eform-preview-info">✓ {total} campos · {preview.sections.length} panel(es)</div>
                  <div className="eform-sections-list">
                    {preview.sections.map((sec, si) => (
                      <div key={si}>
                        <div className="eform-section-name">▸ {sec.name}</div>
                        {sec.fields.map((f, fi) => (
                          <div key={fi} className="eform-field-item">
                            {f.nombre} <span>({f.fieldKey} · {f.tipo}{f.required ? ' · ✱' : ''})</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  {preview.warnings?.length > 0 && (
                    <div className="eform-warnings">
                      {preview.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
                    </div>
                  )}
                  <div className="eform-csv-actions">
                    <button className="eform-btn-primary" onClick={() => handleApply('replace')}>Reemplazar</button>
                    <button className="eform-btn" onClick={() => handleApply('append')}>Añadir al final</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function FieldRow({ field, onChange, onRemove }) {
  const [expanded, setExpanded] = useState(false)
  const isSelect = field.tipo === 'select'
  const isText = field.tipo === 'text' || field.tipo === 'email'
  const autoKey = toCamelKey(field.nombre)

  return (
    <div className="eform-field-row">
      <div className="eform-field-main">
        <div className="eform-field-group">
          <label className="eform-label">Etiqueta</label>
          <input
            className="eform-input"
            value={field.nombre}
            onChange={e => {
              const nombre = e.target.value
              const autoK = toCamelKey(nombre)
              onChange({
                ...field, nombre,
                fieldKey: field.fieldKey === toCamelKey(field.nombre) ? autoK : field.fieldKey
              })
            }}
            placeholder="ej. Nombre completo"
          />
        </div>
        <div className="eform-field-group">
          <label className="eform-label">Key (Form.io)</label>
          <input
            className="eform-input"
            value={field.fieldKey}
            onChange={e => onChange({ ...field, fieldKey: e.target.value.replace(/\s+/g, '').replace(/[^A-Za-z0-9_]/g, '') })}
            placeholder={autoKey}
          />
        </div>
        <div className="eform-field-group">
          <label className="eform-label">Tipo</label>
          <select
            className="eform-select"
            value={field.tipo}
            onChange={e => onChange({ ...field, tipo: e.target.value })}
          >
            {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="eform-toggles">
          <Toggle on={field.required} onChange={() => onChange({ ...field, required: !field.required })} label="Obligatorio" />
          <Toggle on={field.readOnly} onChange={() => onChange({ ...field, readOnly: !field.readOnly })} label="Solo lectura" />
        </div>
        <div className="eform-field-actions">
          <button className="eform-btn-small" onClick={() => setExpanded(o => !o)} title="Más opciones">
            {expanded ? '▲' : '▼'} Más
          </button>
          <button className="eform-btn-danger" onClick={onRemove} title="Eliminar">✕</button>
        </div>
      </div>

      {expanded && (
        <div className="eform-field-expanded">
          <div className="eform-field-group">
            <label className="eform-label">Placeholder</label>
            <input
              className="eform-input"
              value={field.placeholder}
              onChange={e => onChange({ ...field, placeholder: e.target.value })}
              placeholder="Texto de ayuda…"
            />
          </div>
          <div className="eform-field-group">
            <label className="eform-label">Valor por defecto</label>
            <input
              className="eform-input"
              value={field.defaultValue}
              onChange={e => onChange({ ...field, defaultValue: e.target.value })}
              placeholder=""
            />
          </div>
          {isText && (
            <div className="eform-field-group">
              <label className="eform-label">Longitud máxima</label>
              <input
                className="eform-input"
                type="number"
                value={field.maxLength}
                onChange={e => onChange({ ...field, maxLength: e.target.value })}
                placeholder="500"
              />
            </div>
          )}
          {isSelect && (
            <div className="eform-field-group-full">
              <label className="eform-label">Opciones (una por línea: <code>valor=Etiqueta</code> o solo etiqueta)</label>
              <textarea
                className="eform-textarea"
                value={field.options}
                onChange={e => onChange({ ...field, options: e.target.value })}
                placeholder={'ACTIVO=Activo\nPENDIENTE=Pendiente documentación\nBAJA=Baja'}
              />
            </div>
          )}
        </div>
      )}
    </div>
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
                  {CTRL[f.tipo] || CTRL.text}
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

  const newField = () => ({ id: newGuid(), nombre: '', fieldKey: '', tipo: 'text', required: false, readOnly: false, placeholder: '', defaultValue: '', maxLength: '', options: '' })
  const newSection = (name = 'GENERAL') => ({ id: newGuid(), name, fields: [newField()] })

  const addSection = () => setSections(s => [...s, newSection('NUEVO PANEL')])
  const removeSection = i => setSections(s => s.filter((_, idx) => idx !== i))
  const updateSecName = (i, v) => setSections(s => s.map((sec, idx) => idx === i ? { ...sec, name: v.toUpperCase() } : sec))
  const addField = i => setSections(s => s.map((sec, idx) => idx === i ? { ...sec, fields: [...sec.fields, newField()] } : sec))
  const removeField = (si, fi) => setSections(s => s.map((sec, idx) => idx === si ? { ...sec, fields: sec.fields.filter((_, fIdx) => fIdx !== fi) } : sec))
  const updateField = (si, fi, v) => setSections(s => s.map((sec, idx) => idx === si ? { ...sec, fields: sec.fields.map((f, fIdx) => fIdx === fi ? v : f) } : sec))

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
    if (!formName.trim()) { setError('El nombre del formulario es obligatorio.'); return }
    const total = sections.flatMap(s => s.fields).filter(f => f.nombre.trim()).length
    if (total === 0) { setError('Añade al menos un campo.'); return }
    setXml(buildEFormXml({ formName: formName.trim(), submitLabel: submitLabel.trim() || 'Enviar', sections, colsPerRow }))
  }

  const saveToSupabase = async () => {
    if (!xml) return
    setSaving(true)
    try {
      const { error: err } = await supabase.from('eforms').insert({
        name: formName,
        definition: xml,
        description: description,
        created_by: user?.id,
        created_at: new Date().toISOString()
      })
      if (err) throw err
      // TODO: Show success message
      console.log('eForms guardado exitosamente')
    } catch (err) {
      setError('Error al guardar: ' + err.message)
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

  const totalFields = sections.flatMap(s => s.fields).filter(f => f.nombre.trim()).length

  return (
    <div className="eform-container">
      <div className="eform-header">
        <div>
          <h1 className="eform-title">📋 Therefore™ eForms Builder</h1>
          <p className="eform-subtitle">Genera el XML de importación de eForms para Therefore Solution Designer · Form.io JSON · v2.0</p>
        </div>
        <div className="eform-view-toggle">
          {['editor', 'preview'].map(v => (
            <button
              key={v}
              onClick={() => setActiveView(v)}
              className={`eform-btn ${activeView === v ? 'active' : ''}`}
            >
              {v === 'editor' ? '✎ Editor' : '👁 Preview'}
            </button>
          ))}
        </div>
      </div>

      <div className="eform-panel">
        <div className="eform-panel-title">Identidad del formulario</div>
        <div className="eform-identity-grid">
          <div>
            <label className="eform-label">Nombre del formulario *</label>
            <input className="eform-input" value={formName} onChange={e => setFormName(e.target.value)} placeholder="ej. Solicitud de documentos" />
          </div>
          <div>
            <label className="eform-label">Texto botón enviar</label>
            <input className="eform-input" value={submitLabel} onChange={e => setSubmitLabel(e.target.value)} placeholder="Enviar" />
          </div>
        </div>
        <div className="eform-description-grid">
          <div>
            <label className="eform-label">Descripción visible en el formulario <span>(opcional)</span></label>
            <input className="eform-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Rellene este formulario para…" />
          </div>
          <div>
            <label className="eform-label">Columnas por fila</label>
            <div className="eform-cols-selector">
              {[1, 2, 3, 4].map(n => (
                <button
                  key={n}
                  onClick={() => setColsPerRow(n)}
                  className={`eform-btn-col ${colsPerRow === n ? 'active' : ''}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {activeView === 'preview' ? (
        <div className="eform-panel">
          <div className="eform-panel-title">Preview del formulario web</div>
          <FormPreview formName={formName} description={description} submitLabel={submitLabel} sections={sections} colsPerRow={colsPerRow} />
        </div>
      ) : (
        <div className="eform-grid">
          <div className="eform-left">
            <CsvImporter onImport={handleCsvImport} />
            <div className="eform-panel">
              <div className="eform-panel-header">
                <span className="eform-panel-title">Paneles y campos <span className="eform-badge">{totalFields} campos</span></span>
                <button className="eform-btn" onClick={addSection}>+ Panel</button>
              </div>
              {sections.map((sec, si) => (
                <div key={sec.id} className="eform-section">
                  <div className="eform-sec-header">
                    <input
                      className="eform-input eform-section-name"
                      value={sec.name}
                      onChange={e => updateSecName(si, e.target.value)}
                      placeholder="NOMBRE DEL PANEL"
                    />
                    <span className="eform-badge">{sec.fields.filter(f => f.nombre).length} campos</span>
                    {sections.length > 1 && <button className="eform-btn-danger" onClick={() => removeSection(si)}>✕</button>}
                  </div>
                  {sec.fields.map((f, fi) => (
                    <FieldRow key={f.id} field={f} onChange={v => updateField(si, fi, v)} onRemove={() => removeField(si, fi)} />
                  ))}
                  <button className="eform-btn" onClick={() => addField(si)}>+ Campo</button>
                </div>
              ))}
            </div>
          </div>

          <div className="eform-right">
            <div className="eform-panel">
              <div className="eform-panel-title">Estructura del XML</div>
              <div className="eform-info-text">
                <p>Therefore eForms usa <strong>Form.io</strong> como motor de formularios. El XML contiene el JSON de Form.io dentro del nodo <code>&lt;FDef&gt;</code>.</p>
                <p>Cada <strong>Panel</strong> → componente <code>panel</code> de Form.io. Cada fila de campos → <code>columns</code>.</p>
                <p>El <strong>Key</strong> de cada campo debe coincidir con el <code>FieldID</code> de la categoría vinculada en Therefore.</p>
              </div>
            </div>

            <div className="eform-panel">
              <div className="eform-panel-header">
                <span className="eform-panel-title">Generar XML</span>
                <span className="eform-badge">{totalFields} campos</span>
              </div>
              {error && <div className="eform-error">{error}</div>}
              <button className="eform-btn-primary" onClick={generate}>Generar XML →</button>
              {xml && (
                <div className="eform-xml-output">
                  <div className="eform-xml-actions">
                    <button className="eform-btn-success" onClick={copy}>{copied ? '✓ Copiado' : '📋 Copiar XML'}</button>
                    <button className="eform-btn" onClick={download}>⬇ Descargar .xml</button>
                    <button className="eform-btn" onClick={saveToSupabase} disabled={saving}>{saving ? '⏳ Guardando...' : '💾 Guardar en Supabase'}</button>
                  </div>
                  <div className="eform-char-count">{xml.length.toLocaleString()} caracteres</div>
                  <textarea readOnly className="eform-textarea" value={xml} onClick={e => e.target.select()} />
                </div>
              )}
            </div>

            <div className="eform-panel">
              <div className="eform-panel-title">Checklist de publicación</div>
              <div className="eform-checklist">
                {[
                  'Importar el XML en Solution Designer',
                  'Verificar que el Key de cada campo coincide con el FieldID de la categoría',
                  'Configurar la categoría vinculada si no existe',
                  'Publicar desde Herramientas → Publicar eForms',
                  'Verificar la URL de publicación en IIS',
                  'Probar envío antes de distribuir el enlace',
                ].map((item, i) => (
                  <div key={i} className="eform-checklist-item">
                    <span>☐</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="eform-footer">
        Therefore eForms Builder v2.0 · Aneker · Genera Form.io JSON nativo para Therefore
      </div>
    </div>
  )
}
