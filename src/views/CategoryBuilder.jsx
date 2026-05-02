import { useState, useEffect } from 'react'
import { Button, Modal, message, Input, Table, Space, Tag, Empty, Spin, Tabs } from 'antd'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../config/supabaseClient'
import '../styles/category-builder.css'

function newGuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16).toUpperCase()
  })
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

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'email', label: 'Email' },
  { value: 'date', label: 'Fecha' },
  { value: 'datetime', label: 'Fecha y hora' },
  { value: 'number', label: 'Número' },
  { value: 'money', label: 'Importe (€)' },
  { value: 'boolean', label: 'Sí/No' },
  { value: 'lookup', label: 'Búsqueda' },
  { value: 'image', label: 'Imagen' },
  { value: 'table', label: '🗃 Tabla' },
]

const TYPE_ALIAS = {
  'string': 'text', 'texto': 'text', 'text': 'text',
  'email': 'email',
  'date': 'date', 'fecha': 'date',
  'datetime': 'datetime', 'timestamp': 'datetime', 'fecha y hora': 'datetime',
  'number': 'number', 'integer': 'number', 'int': 'number', 'entero': 'number',
  'money': 'money', 'importe': 'money', 'decimal': 'money',
  'boolean': 'boolean', 'bool': 'boolean', 'lógico': 'boolean',
  'lookup': 'lookup', 'lista': 'lookup', 'combo': 'lookup',
  'image': 'image', 'imagen': 'image', 'foto': 'image',
  'table': 'table', 'tabla': 'table', 'grid': 'table',
}

const COLOR_PRESETS = {
  dark: {
    name: '🌙 Oscuro',
    colors: {
      primary: '#9ad1ff',
      bgCanvas: '#16181D',
      bgCard: '#25272D',
      textMain: '#e6e7eb',
      textSec: 'rgba(238, 244, 255, 0.55)',
      border: 'rgba(255, 255, 255, 0.14)'
    }
  },
  light: {
    name: '☀️ Claro',
    colors: {
      primary: '#3663FF',
      bgCanvas: '#f5f7fa',
      bgCard: '#ffffff',
      textMain: 'rgba(0, 0, 0, 0.85)',
      textSec: 'rgba(0, 0, 0, 0.65)',
      border: '#d9d9d9'
    }
  },
  ocean: {
    name: '🌊 Ocean',
    colors: {
      primary: '#1890ff',
      bgCanvas: '#0f1419',
      bgCard: '#141d2d',
      textMain: '#e6f7ff',
      textSec: 'rgba(230, 247, 255, 0.65)',
      border: 'rgba(24, 144, 255, 0.3)'
    }
  },
  forest: {
    name: '🌲 Forest',
    colors: {
      primary: '#52c41a',
      bgCanvas: '#0d1a08',
      bgCard: '#162312',
      textMain: '#f6ffed',
      textSec: 'rgba(246, 255, 237, 0.65)',
      border: 'rgba(82, 196, 26, 0.3)'
    }
  },
  purple: {
    name: '💜 Purple',
    colors: {
      primary: '#722ed1',
      bgCanvas: '#1a0f2e',
      bgCard: '#261550',
      textMain: '#f9f0ff',
      textSec: 'rgba(249, 240, 255, 0.65)',
      border: 'rgba(114, 46, 209, 0.3)'
    }
  }
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
    seccion: headers.findIndex(h => ['seccion', 'sección', 'section', 'grupo', 'group'].includes(h)),
    pestaña: headers.findIndex(h => ['pestaña', 'pestaña', 'tab', 'tabs', 'tab'].includes(h)),
    categoria: headers.findIndex(h => ['categoria', 'categoría', 'category', 'tab', 'categoria'].includes(h)),
    length: headers.findIndex(h => ['length', 'longitud', 'tamaño', 'size', 'largo'].includes(h)),
  }

  if (idx.nombre === -1) return { error: 'No se encontró la columna "Nombre".' }

  const categoryMap = {}
  const warnings = []

  lines.slice(1).forEach((line, li) => {
    const cols = line.split(sep).map(c => c.trim())
    const nombre = cols[idx.nombre] || ''
    if (!nombre) { warnings.push(`Fila ${li + 2}: sin nombre, ignorada.`); return }

    const categoria = idx.categoria >= 0 ? (cols[idx.categoria] || 'CATEGORÍA 1').trim() : 'CATEGORÍA 1'
    const fieldKey = idx.fieldkey >= 0 ? (cols[idx.fieldkey] || toCamelKey(nombre)) : toCamelKey(nombre)
    const tipo = idx.tipo >= 0 ? (TYPE_ALIAS[cols[idx.tipo]?.toLowerCase()] || 'text') : 'text'
    const required = idx.obligatorio >= 0 ? ['1', 'si', 'sí', 'yes', 'true'].includes((cols[idx.obligatorio] || '').toLowerCase()) : false
    const seccion = idx.seccion >= 0 ? (cols[idx.seccion] || 'GENERAL').toUpperCase() : 'GENERAL'
    const pestaña = idx.pestaña >= 0 ? (cols[idx.pestaña] || 'Datos').trim() : 'Datos'
    const length = idx.length >= 0 ? (cols[idx.length] || '').trim() : ''

    if (!categoryMap[categoria]) categoryMap[categoria] = {}
    if (!categoryMap[categoria][seccion]) categoryMap[categoria][seccion] = []
    categoryMap[categoria][seccion].push({ id: newGuid(), nombre, fieldKey, tipo, required, pestaña, length })
  })

  if (!Object.keys(categoryMap).length) return { error: 'No se procesó ningún campo válido.' }

  const categories = Object.entries(categoryMap).map(([catName, sections]) => ({
    id: newGuid(),
    name: catName,
    sections: Object.entries(sections).map(([secName, fields]) => {
      // Extract unique pestaña values from fields for this section
      const pestañasSet = new Set(fields.map(f => f.pestaña).filter(Boolean))
      pestañasSet.add('Datos') // Ensure 'Datos' is always present
      const pestañas = Array.from(pestañasSet).sort()

      return {
        id: newGuid(),
        name: secName,
        fields,
        pestañas
      }
    })
  }))

  return { categories, warnings }
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
  const total = preview && !preview.error ? preview.categories.reduce((a, c) => a + c.sections.reduce((sa, s) => sa + s.fields.length, 0), 0) : 0

  return (
    <Modal
      title="📤 Importar campos desde CSV"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        <div style={{ marginBottom: '8px' }}>Columnas: <strong>Nombre ; Tipo ; Obligatorio ; Sección ; Pestaña ; Categoría ; Longitud</strong></div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Pestaña y Longitud son opcionales. Máx texto: 4000 caracteres.
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Tipos Therefore: <strong>text</strong> (1-4000), <strong>email</strong> (1-4000), <strong>phone</strong> (texto),
          <strong>number</strong> (entero), <strong>date</strong> (YYYY-MM-DD), <strong>money</strong>, <strong>boolean</strong>,
          <strong>lookup</strong>, <strong>datetime</strong>, <strong>image</strong>, <strong>table</strong>
        </div>
      </div>
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setPreview(null) }}
        placeholder="Nombre;Tipo;Obligatorio;Sección;Pestaña;Categoría;Longitud"
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
                ✓ {total} campos · {preview.categories.length} categoría(s)
              </div>
              <div style={{ display: 'flex', gap: 'var(--gap-md)' }}>
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

function PreviewSection({ sectionName, fieldsByTab, baseFields, tabs }) {
  const [activeTab, setActiveTab] = useState(tabs.length > 0 ? tabs[0] : null)

  const controlMap = {
    text: (f) => <input type="text" placeholder={f.nombre} className="form-input" />,
    email: (f) => <input type="email" placeholder={f.nombre} className="form-input" />,
    phone: (f) => <input type="tel" placeholder={f.nombre} className="form-input" />,
    date: (f) => <input type="date" className="form-input" />,
    datetime: (f) => <input type="datetime-local" className="form-input" />,
    number: (f) => <input type="number" placeholder={f.nombre} className="form-input" />,
    money: (f) => <input type="number" step="0.01" placeholder={f.nombre} className="form-input" />,
    boolean: (f) => <input type="checkbox" style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)' }} />,
    lookup: (f) => <select className="form-select"><option>-- Selecciona --</option></select>
  }

  return (
    <div className="mb-lg">
      <h4 className="field-header" style={{ marginBottom: 0 }}>
        {sectionName}
      </h4>

      {baseFields.length > 0 && (
        <div style={{ marginBottom: tabs.length > 0 ? '16px' : '0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {baseFields.map((f, fi) => (
              <div key={fi}>
                <label className="form-label">
                  {f.nombre}
                  {f.required && <span style={{ color: 'var(--accent-error)', marginLeft: '3px' }}>*</span>}
                </label>
                {(controlMap[f.tipo] || controlMap.text)(f)}
              </div>
            ))}
          </div>
        </div>
      )}

      {tabs.length > 0 && (
        <>
          {tabs.length > 1 && (
            <div style={{ display: 'flex', gap: 'var(--gap-sm)', marginBottom: 'var(--gap-lg)', borderBottom: '1px solid var(--border-default)', paddingBottom: '8px' }}>
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={activeTab === tab ? 'btn-primary btn-sm' : 'btn-default btn-sm'}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}

          {tabs.length === 1 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-lg)' }}>
              {fieldsByTab[tabs[0]]?.map((f, fi) => (
                <div key={fi}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    {f.nombre}
                    {f.required && <span style={{ color: 'var(--accent-error)', marginLeft: '3px' }}>*</span>}
                  </label>
                  {(controlMap[f.tipo] || controlMap.text)(f)}
                </div>
              ))}
            </div>
          ) : (
            activeTab && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-lg)' }}>
                {fieldsByTab[activeTab]?.map((f, fi) => (
                  <div key={fi}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      {f.nombre}
                      {f.required && <span style={{ color: 'var(--accent-error)', marginLeft: '3px' }}>*</span>}
                    </label>
                    {(controlMap[f.tipo] || controlMap.text)(f)}
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}

function SectionEditor({ section, secIdx, updateField, removeField, addField, updateSecName, removeSection, catSectionsCount, addPestaña, removePestaña, updateFieldPestaña, selectedTab, hideTabManager }) {
  const [newPestañaInput, setNewPestañaInput] = useState('')

  // Separate fields: those without pestaña (baseFields) and those with pestaña (fieldsByTab)
  const baseFields = []
  const fieldsByTab = {}

  section.fields.forEach((f, idx) => {
    const tab = f.pestaña?.trim()
    if (!tab) {
      baseFields.push({ field: f, idx })
    } else {
      if (!fieldsByTab[tab]) fieldsByTab[tab] = []
      fieldsByTab[tab].push({ field: f, idx })
    }
  })

  const pestañas = section.pestañas || ['Datos']
  const currentActiveTab = selectedTab || (pestañas.length > 0 ? pestañas[0] : null)

  return (
    <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '12px', marginTop: '12px' }}>
      <div className="category-section-header">
        <input
          value={section.name}
          onChange={e => updateSecName(secIdx, e.target.value)}
          className="form-input"
          style={{ flex: 1 }}
        />
        <span className="category-badge">{section.fields.filter(f => f.nombre).length} campos</span>
        {catSectionsCount > 1 && (
          <button
            onClick={() => removeSection(secIdx)}
            className="btn-default btn-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tab Manager - only show if not hidden by parent */}
      {!hideTabManager && (
        <div className="category-pestana-manager">
          <div className="category-pestana-title">📑 Pestañas</div>
          <div className="category-pestana-list">
            {pestañas.map((p) => (
              <div key={p} className="category-pestana-tag">
                {p}
                {pestañas.length > 1 && (
                  <button
                    onClick={() => removePestaña(secIdx, p)}
                    title="Eliminar pestaña"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <input
              type="text"
              value={newPestañaInput}
              onChange={(e) => setNewPestañaInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newPestañaInput.trim()) {
                  addPestaña(secIdx, newPestañaInput)
                  setNewPestañaInput('')
                }
              }}
              placeholder="+ Nueva pestaña"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', color: 'var(--text-secondary)', outline: 'none', minWidth: '120px' }}
            />
          </div>
        </div>
      )}

      {/* When hideTabManager is true, show fields for selected tab + base fields without pestaña */}
      {hideTabManager && selectedTab ? (
        <div>
          {/* Fields without pestaña appear outside tabs */}
          {baseFields.map((item, idx) => (
            <FieldRow
              key={item.field.id}
              field={item.field}
              onChange={v => updateField(secIdx, item.idx, v)}
              onRemove={() => removeField(secIdx, item.idx)}
              showHeader={idx === 0}
              fieldIndex={idx}
              pestañas={pestañas}
              updateFieldPestaña={updateFieldPestaña}
              secIdx={secIdx}
              fieldIdx={item.idx}
            />
          ))}
          {/* Fields with selected tab */}
          {(fieldsByTab[selectedTab] || []).map((item, idx) => (
            <FieldRow
              key={item.field.id}
              field={item.field}
              onChange={v => updateField(secIdx, item.idx, v)}
              onRemove={() => removeField(secIdx, item.idx)}
              showHeader={idx === 0 && baseFields.length === 0}
              fieldIndex={baseFields.length + idx}
              pestañas={pestañas}
              updateFieldPestaña={updateFieldPestaña}
              secIdx={secIdx}
              fieldIdx={item.idx}
            />
          ))}
        </div>
      ) : baseFields.length > 0 && (
        <div>
          {baseFields.map((item, baseFieldIdx) => (
            <FieldRow
              key={item.field.id}
              field={item.field}
              onChange={v => updateField(secIdx, item.idx, v)}
              onRemove={() => removeField(secIdx, item.idx)}
              showHeader={baseFieldIdx === 0 && baseFields.length > 0}
              fieldIndex={baseFieldIdx}
              pestañas={pestañas}
              updateFieldPestaña={updateFieldPestaña}
              secIdx={secIdx}
              fieldIdx={item.idx}
            />
          ))}
        </div>
      )}

      {pestañas.length > 0 && Object.keys(fieldsByTab).length > 0 && !hideTabManager && (
        <>
          {pestañas.length > 1 && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', marginTop: baseFields.length > 0 ? '12px' : '0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px', overflowX: 'auto' }}>
              {pestañas.map(tab => (
                <button
                  key={tab}
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: currentActiveTab === tab ? '600' : '400',
                    background: currentActiveTab === tab ? 'rgba(154, 209, 255, 0.15)' : 'transparent',
                    border: currentActiveTab === tab ? '1px solid #9ad1ff' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: currentActiveTab === tab ? '#9ad1ff' : 'rgba(238, 244, 255, 0.6)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}

          {pestañas.length === 1 ? (
            <div>
              {fieldsByTab[pestañas[0]]?.map((item, tabFieldIdx) => (
                <FieldRow
                  key={item.field.id}
                  field={item.field}
                  onChange={v => updateField(secIdx, item.idx, v)}
                  onRemove={() => removeField(secIdx, item.idx)}
                  showHeader={tabFieldIdx === 0}
                  fieldIndex={tabFieldIdx}
                  pestañas={pestañas}
                  updateFieldPestaña={updateFieldPestaña}
                  secIdx={secIdx}
                  fieldIdx={item.idx}
                />
              ))}
            </div>
          ) : (
            currentActiveTab && (
              <div>
                {fieldsByTab[currentActiveTab]?.map((item, tabFieldIdx) => (
                  <FieldRow
                    key={item.field.id}
                    field={item.field}
                    onChange={v => updateField(secIdx, item.idx, v)}
                    onRemove={() => removeField(secIdx, item.idx)}
                    showHeader={tabFieldIdx === 0}
                    fieldIndex={tabFieldIdx}
                    pestañas={pestañas}
                    updateFieldPestaña={updateFieldPestaña}
                    secIdx={secIdx}
                    fieldIdx={item.idx}
                  />
                ))}
              </div>
            )
          )}
        </>
      )}

      <button
        onClick={() => addField(secIdx)}
        style={{
          width: '100%',
          background: 'var(--bg-hover)',
          border: '1px solid var(--border-default)',
          borderRadius: '10px',
          color: 'var(--text-primary)',
          fontSize: '12px',
          padding: '6px 12px',
          cursor: 'pointer',
          marginTop: '8px'
        }}
      >
        + Campo
      </button>
    </div>
  )
}

function FieldRow({ field, onChange, onRemove, showHeader, fieldIndex, pestañas, updateFieldPestaña, secIdx, fieldIdx }) {
  const [expanded, setExpanded] = useState(false)
  const autoKey = toCamelKey(field.nombre)

  return (
    <>
      {showHeader && (
        <div className="category-field-header">
          <div>Nombre</div>
          <div>Tipo</div>
          <div>Obligatorio</div>
          <div>Pestaña</div>
          <div></div>
          <div></div>
        </div>
      )}
      <div className="category-field-main">
        <div>
          <input
            value={field.nombre}
            onChange={e => {
              const nombre = e.target.value
              const autoK = toCamelKey(nombre)
              onChange({
                ...field, nombre,
                fieldKey: field.fieldKey === toCamelKey(field.nombre) ? autoK : field.fieldKey
              })
            }}
            placeholder="Nombre"
            className="category-input-compact"
          />
        </div>
        <div>
          <select
            value={field.tipo}
            onChange={e => onChange({ ...field, tipo: e.target.value })}
            className="category-select-compact"
          >
            {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={field.required}
              onChange={e => onChange({ ...field, required: e.target.checked })}
            />
          </label>
        </div>
        <div>
          {pestañas && pestañas.length > 0 && (
            <select
              value={field.pestaña || ''}
              onChange={e => {
                onChange({ ...field, pestaña: e.target.value })
                updateFieldPestaña && updateFieldPestaña(secIdx, fieldIdx, e.target.value)
              }}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid var(--border-default)',
                borderRadius: '4px',
                fontSize: '12px',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box'
              }}
            >
              <option value="">-- Sin pestaña --</option>
              {pestañas.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          )}
        </div>
        <div>
          <button
            onClick={() => setExpanded(o => !o)}
            className="btn-default btn-sm"
            style={{ width: '100%' }}
          >
            {expanded ? '▲' : '▼'}
          </button>
        </div>
        <div>
          <button
            onClick={onRemove}
            className="btn-default btn-sm"
            style={{ width: '100%' }}
          >
            ✕
          </button>
        </div>
      </div>
      {expanded && (
        <div className="category-field-expanded">
          <div>
            <label className="category-label">Key</label>
            <input
              value={field.fieldKey}
              onChange={e => onChange({ ...field, fieldKey: e.target.value.replace(/\s+/g, '').replace(/[^A-Za-z0-9_]/g, '') })}
              placeholder={autoKey}
              className="category-input-compact"
            />
          </div>
          <div>
            <label className="category-label">Pestaña</label>
            <input
              value={field.pestaña || ''}
              onChange={e => onChange({ ...field, pestaña: e.target.value })}
              placeholder="Dejar vacío para Sin pestaña"
              className="category-input-compact"
            />
          </div>
          {field.tipo === 'table' && (
            <div style={{ gridColumn: '1 / -1', marginTop: '8px', padding: '8px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--accent-primary)', marginBottom: '6px', textTransform: 'uppercase' }}>Columnas de tabla</div>
              {!field.columnas && (onChange({ ...field, columnas: [] }))}
              {(field.columnas || []).map((col, colIdx) => (
                <div key={col.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                  <input
                    value={col.nombre}
                    onChange={e => {
                      const newCols = [...(field.columnas || [])]
                      newCols[colIdx].nombre = e.target.value
                      onChange({ ...field, columnas: newCols })
                    }}
                    placeholder="Nombre columna"
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      border: '1px solid var(--border-default)',
                      borderRadius: '3px',
                      fontSize: '11px',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      boxSizing: 'border-box'
                    }}
                  />
                  <select
                    value={col.tipo || 'text'}
                    onChange={e => {
                      const newCols = [...(field.columnas || [])]
                      newCols[colIdx].tipo = e.target.value
                      onChange({ ...field, columnas: newCols })
                    }}
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      border: '1px solid var(--border-default)',
                      borderRadius: '3px',
                      fontSize: '11px',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      boxSizing: 'border-box'
                    }}
                  >
                    {FIELD_TYPES.filter(t => t.value !== 'table').map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <input
                    type="number"
                    value={col.length || 100}
                    onChange={e => {
                      const newCols = [...(field.columnas || [])]
                      newCols[colIdx].length = parseInt(e.target.value)
                      onChange({ ...field, columnas: newCols })
                    }}
                    placeholder="Longitud"
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      border: '1px solid var(--border-default)',
                      borderRadius: '3px',
                      fontSize: '11px',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    onClick={() => {
                      const newCols = (field.columnas || []).filter((_, i) => i !== colIdx)
                      onChange({ ...field, columnas: newCols })
                    }}
                    className="btn-default btn-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newCols = [...(field.columnas || [])]
                  newCols.push({ id: newGuid(), nombre: '', tipo: 'text', length: 100 })
                  onChange({ ...field, columnas: newCols })
                }}
                className="btn-default"
                style={{ width: '100%', marginTop: '6px' }}
              >
                + Columna
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default function CategoryBuilder() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([
    {
      id: newGuid(),
      name: 'CATEGORÍA 1',
      sections: [{ id: newGuid(), name: 'GENERAL', fields: [{ id: newGuid(), nombre: '', fieldKey: '', tipo: 'text', required: false, pestaña: 'Datos' }], pestañas: ['Datos'] }]
    }
  ])
  const [activeCategory, setActiveCategory] = useState(0)
  const [selectedTabByCategory, setSelectedTabByCategory] = useState({})  // Maps catIdx -> tabName
  const [xml, setXml] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [activeView, setActiveView] = useState('editor')
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [managerOpen, setManagerOpen] = useState(false)
  const [xmlModalOpen, setXmlModalOpen] = useState(false)
  const [colorModalOpen, setColorModalOpen] = useState(false)
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [customColors, setCustomColors] = useState(COLOR_PRESETS.dark.colors)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    if (user?.id) loadTemplates()
  }, [user?.id])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('category_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (err) throw err
      setTemplates(data || [])
    } catch (err) {
      console.error('Error:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const currentCategory = categories[activeCategory]

  const saveTemplate = async () => {
    if (!currentCategory.name.trim()) {
      message.error('El nombre de la categoría es obligatorio')
      return
    }

    try {
      const categoryJson = JSON.stringify(currentCategory)
      if (selectedTemplate?.id) {
        const { error: err } = await supabase
          .from('category_templates')
          .update({
            name: currentCategory.name,
            description: `${categories.length} categoría(s)`,
            xml_definition: categoryJson,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTemplate.id)

        if (err) throw err
        message.success('Actualizada')
      } else {
        const { error: err } = await supabase
          .from('category_templates')
          .insert({
            template_id: `cat_${Date.now()}`,
            name: currentCategory.name,
            description: `${categories.length} categoría(s)`,
            xml_definition: categoryJson,
            created_by: user.id,
            compartido: false
          })

        if (err) throw err
        message.success('Guardada')
      }

      setSelectedTemplate(null)
      setXml('')
      await loadTemplates()
    } catch (err) {
      message.error(`Error: ${err.message}`)
    }
  }

  const loadTemplate = (template) => {
    try {
      const loaded = JSON.parse(template.xml_definition)
      if (Array.isArray(loaded)) {
        setCategories(loaded)
      } else {
        setCategories([loaded])
      }
      setActiveCategory(0)
      setSelectedTemplate(template)
      setManagerOpen(false)
      message.success('Cargada')
    } catch (err) {
      message.error('Error al cargar la plantilla')
    }
  }

  const deleteTemplate = async (templateId) => {
    try {
      const { error: err } = await supabase
        .from('category_templates')
        .delete()
        .eq('id', templateId)

      if (err) throw err
      message.success('Eliminada')
      await loadTemplates()
    } catch (err) {
      message.error(`Error: ${err.message}`)
    }
  }

  const downloadTemplate = (template) => {
    const a = document.createElement('a')
    a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(template.xml_definition)
    a.download = `${template.name.replace(/\s+/g, '_')}_categories.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // Category operations
  const addCategory = () => {
    setCategories([...categories, { id: newGuid(), name: `CATEGORÍA ${categories.length + 1}`, sections: [{ id: newGuid(), name: 'GENERAL', fields: [] }] }])
  }

  const updateCategoryName = (idx, name) => {
    const updated = [...categories]
    updated[idx].name = name.toUpperCase()
    setCategories(updated)
  }

  const removeCategory = (idx) => {
    if (categories.length > 1) {
      const updated = categories.filter((_, i) => i !== idx)
      setCategories(updated)
      if (activeCategory >= updated.length) setActiveCategory(updated.length - 1)
    }
  }

  // Section operations
  const addSection = () => {
    const updated = [...categories]
    updated[activeCategory].sections.push({ id: newGuid(), name: 'NUEVA SECCIÓN', fields: [] })
    setCategories(updated)
  }

  const removeSection = (secIdx) => {
    const updated = [...categories]
    if (updated[activeCategory].sections.length > 1) {
      updated[activeCategory].sections = updated[activeCategory].sections.filter((_, i) => i !== secIdx)
      setCategories(updated)
    }
  }

  const updateSecName = (secIdx, name) => {
    const updated = [...categories]
    updated[activeCategory].sections[secIdx].name = name.toUpperCase()
    setCategories(updated)
  }

  const addField = (secIdx) => {
    const updated = [...categories]
    updated[activeCategory].sections[secIdx].fields.push({ id: newGuid(), nombre: '', fieldKey: '', tipo: 'text', required: false, pestaña: 'Datos' })
    setCategories(updated)
  }

  const removeField = (secIdx, fieldIdx) => {
    const updated = [...categories]
    updated[activeCategory].sections[secIdx].fields = updated[activeCategory].sections[secIdx].fields.filter((_, i) => i !== fieldIdx)
    setCategories(updated)
  }

  const updateField = (secIdx, fieldIdx, value) => {
    const updated = [...categories]
    updated[activeCategory].sections[secIdx].fields[fieldIdx] = value
    setCategories(updated)
  }

  const addPestaña = (secIdx, newPestañaName) => {
    if (!newPestañaName.trim()) return
    const updated = [...categories]
    const sec = updated[activeCategory].sections[secIdx]
    if (!sec.pestañas.includes(newPestañaName)) {
      sec.pestañas = [...sec.pestañas, newPestañaName].sort()
    }
    setCategories(updated)
  }

  const removePestaña = (secIdx, pestañaName) => {
    const updated = [...categories]
    const sec = updated[activeCategory].sections[secIdx]
    sec.pestañas = sec.pestañas.filter(p => p !== pestañaName)
    setCategories(updated)
  }

  const updateFieldPestaña = (secIdx, fieldIdx, pestaña) => {
    const updated = [...categories]
    updated[activeCategory].sections[secIdx].fields[fieldIdx].pestaña = pestaña
    setCategories(updated)
  }

  // CSV import
  const handleCsvImport = ({ categories: newCats }, mode) => {
    if (mode === 'replace') {
      setCategories(newCats)
      setActiveCategory(0)
    } else {
      setCategories([...categories, ...newCats])
    }
    setXml('')
    setError('')
  }

  // Generate XML
  // Map field types to Therefore TypeNo per official documentation
  // StringField(1), IntField(2), DateField(3), LabelField(4), MoneyField(5),
  // LogicalField(6), NumericCounter(8), TextCounter(9), TableField(10), CustomField(99)
  const typeToTypeNo = {
    'text': '1',      // StringField
    'email': '1',     // StringField
    'phone': '1',     // StringField (no phone type in Therefore)
    'number': '2',    // IntField
    'date': '3',      // DateField
    'money': '5',     // MoneyField
    'boolean': '6',   // LogicalField
    'table': '10',    // TableField
    'datetime': '99', // CustomField (timestamp)
    'lookup': '99',   // CustomField
    'image': '99'     // CustomField
  }

  // Field length defaults by type. Some types (boolean, money, table, image) don't use Length tag
  const defaultFieldLength = {
    'text': 100,      // StringField: 1-4000 chars
    'email': 100,     // StringField: 1-4000 chars
    'phone': 20,      // StringField: typical phone length
    'number': 18,     // IntField: display width (no Length tag)
    'date': 10,       // DateField: YYYY-MM-DD (no Length tag)
    'money': 18,      // MoneyField: display width (no Length tag)
    'boolean': 1,     // LogicalField (no Length tag)
    'table': 0,       // TableField (no Length tag)
    'datetime': 19,   // CustomField/timestamp (no Length tag in XML)
    'lookup': 100,    // CustomField: typically StringField-like
    'image': 0        // CustomField/image (no Length tag)
  }

  // Check if field type should have Length tag in XML
  const hasLengthTag = (fieldType) => {
    const typeNorm = fieldType?.toLowerCase() || 'text'
    // Only StringField (1) types have Length tags
    return typeToTypeNo[typeNorm] === '1'
  }

  // Validate and normalize field length
  const normalizeFieldLength = (fieldType, providedLength) => {
    const typeNorm = fieldType?.toLowerCase() || 'text'

    // Only apply length to StringField types
    if (!hasLengthTag(typeNorm)) return 0

    const maxLength = 4000 // StringField max
    const length = parseInt(providedLength) || defaultFieldLength[typeNorm] || 100
    return Math.min(Math.max(length, 1), maxLength)
  }

  const bgr = (r, g, b) => b * 65536 + g * 256 + r

  // Escape special XML characters
  const escapeXml = (str) => {
    if (!str) return ''
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  // Sanitize field names and table names
  const sanitizeName = (str) => {
    return String(str || '')
      .replace(/[^A-Za-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toUpperCase()
      .slice(0, 30)
  }

  const xmlCaption = (t) => `<Caption UPT="1"><TStr><T><L>1034</L><S>${escapeXml(t)}</S></T></TStr></Caption>`

  const calculateFieldWidth = (fieldLength, fieldType) => {
    // Tipos con ancho visual fijo
    if (['5', '3', '7'].includes(fieldType)) return 160  // money, date, datetime
    if (['6'].includes(fieldType)) return 120  // boolean

    const maxLength = parseInt(fieldLength) || 100
    // Escala: 1.5px por carácter (fuente Segoe UI 9pt)
    const scaledWidth = Math.max(maxLength * 1.5, 80)
    return Math.round(Math.min(scaledWidth, 400))  // máximo 400px
  }

  const makeDataField = ({ fieldno, colname, fieldid, caption, typeno, length, width = 160, height = 14, posx = 102, posy = 0, taborder = 1, disporder = 1, font = 'Segoe UI', fsize = 9, tabMeta = "" }) => {
    // Only StringField (TypeNo 1) has Length tag. Money (5) has fixed Length 18.
    const lengthTag = (typeno === '1' && length) ? `<Length>${length}</Length>` : (typeno === '5') ? '<Length>18</Length>' : ''
    const dp = `<Face>${font}</Face><FSize>${fsize}</FSize>`
    const safeColname = escapeXml(colname)
    const safeFieldid = escapeXml(fieldid)
    return `<Field><FieldNo>${fieldno}</FieldNo><ColName>${safeColname}</ColName>${xmlCaption(caption)}<TypeNo>${typeno}</TypeNo>${lengthTag}<Width>${width}</Width><Height>${height}</Height><PosX>${posx}</PosX><PosY>${posy}</PosY><TabOrderPos>${taborder}</TabOrderPos><DontLoadValues>1</DontLoadValues><DispOrderPos>${disporder}</DispOrderPos><RegExHelp UPT="1"><TStr></TStr></RegExHelp><Links></Links><Id>${newGuid()}</Id><DisplayProp>${dp}</DisplayProp><TabInfo FactoryType="0"></TabInfo><FieldID>${safeFieldid}</FieldID><DisplayPropCond></DisplayPropCond><Filter></Filter>${tabMeta}</Field>`
  }

  const makeLabelField = ({ fieldno, fieldid, caption, width = 500, height = 13, posx = 5, posy = 0, font = 'Segoe UI', fsize = 9, bold = false, tclr = null, bclr = null, al = null, pd = null, tabMeta = "" }) => {
    let dp = `<Face>${font}</Face><FSize>${fsize}</FSize>`
    if (bold) dp += `<Bol>1</Bol>`
    if (tclr !== null) dp += `<TClr>${tclr}</TClr>`
    if (bclr !== null) dp += `<BClr>${bclr}</BClr>`
    if (al !== null) dp += `<Al>${al}</Al>`
    if (pd !== null) dp += `<Pd>${pd}</Pd>`
    const safeFieldid = escapeXml(fieldid)
    return `<Field><FieldNo>${fieldno}</FieldNo>${xmlCaption(caption)}<TypeNo>4</TypeNo><Width>${width}</Width><Height>${height}</Height><PosX>${posx}</PosX><PosY>${posy}</PosY><DontLoadValues>1</DontLoadValues>${xmlRegEx()}<Links></Links><Id>${newGuid()}</Id><DisplayProp>${dp}</DisplayProp><TabInfo FactoryType="0"></TabInfo><FieldID>${safeFieldid}</FieldID><DisplayPropCond></DisplayPropCond><Filter></Filter><FullTextSearch>0</FullTextSearch>${tabMeta}</Field>`
  }

  const makeImageField = ({ fieldno, fieldid, caption, width = 133, height = 27, posx = 0, posy = 0, tabMeta = "" }) => {
    const safeFieldid = escapeXml(fieldid)
    return `<Field><FieldNo>${fieldno}</FieldNo>${xmlCaption(caption)}<TypeNo>12</TypeNo><Width>${width}</Width><Height>${height}</Height><PosX>${posx}</PosX><PosY>${posy}</PosY><DontLoadValues>1</DontLoadValues>${xmlRegEx()}<Links></Links><Id>${newGuid()}</Id><DisplayProp></DisplayProp><TabInfo FactoryType="0"></TabInfo><FieldID>${safeFieldid}</FieldID><DisplayPropCond></DisplayPropCond><Filter></Filter><FullTextSearch>0</FullTextSearch>${tabMeta}</Field>`
  }

  const makeTableField = ({ fieldno, fieldid, caption, width = 580, height = 92, posx = 20, posy = 0, tabMeta = "" }) => {
    const tableName = sanitizeName(caption)
    const foreignTable = `TheIxTable_${tableName}_Hist`
    const safeFieldid = escapeXml(fieldid)
    return `<Field><FieldNo>${fieldno}</FieldNo>${xmlCaption(caption)}<TypeNo>10</TypeNo><Width>${width}</Width><Height>${height}</Height><PosX>${posx}</PosX><PosY>${posy}</PosY><DontLoadValues>1</DontLoadValues><RegExHelp UPT="1"><TStr></TStr></RegExHelp><Links></Links><ForeignTable>${foreignTable}</ForeignTable><Id>${newGuid()}</Id><DisplayProp></DisplayProp><TabInfo FactoryType="0"></TabInfo><FieldID>${safeFieldid}</FieldID><DisplayPropCond></DisplayPropCond><Filter></Filter></Field>`
  }

  const makeTableColumnField = ({ fieldno, colname, fieldid, caption, typeno, length, taborder = 1, disporder = 1, parentTableNo, font = 'Segoe UI', fsize = 9 }) => {
    // Only StringField (TypeNo 1) has Length tag. Money (5) has fixed Length 18.
    const lengthTag = (typeno === '1' && length) ? `<Length>${length}</Length>` : (typeno === '5') ? '<Length>18</Length>' : ''
    const dp = `<Face>${font}</Face><FSize>${fsize}</FSize>`
    const safeColname = escapeXml(colname)
    const safeFieldid = escapeXml(fieldid)
    return `<Field><FieldNo>${fieldno}</FieldNo><ColName>${safeColname}</ColName>${xmlCaption(caption)}<TypeNo>${typeno}</TypeNo>${lengthTag}<Width>150</Width><Height>0</Height><PosX>0</PosX><PosY>0</PosY><TabOrderPos>${taborder}</TabOrderPos><DontLoadValues>1</DontLoadValues><DispOrderPos>${disporder}</DispOrderPos><RegExHelp UPT="1"><TStr></TStr></RegExHelp><Links></Links><BelongsToTable>${parentTableNo}</BelongsToTable><Id>${newGuid()}</Id><DisplayProp>${dp}</DisplayProp><ParentFieldType>2</ParentFieldType><TabInfo FactoryType="0"></TabInfo><FieldID>${safeFieldid}</FieldID><DisplayPropCond></DisplayPropCond><Filter></Filter></Field>`
  }

  const xmlRegEx = () => `<RegExHelp UPT="1"><TStr></TStr></RegExHelp>`

  const tabMetaXml = (tabNo, belongsTo) => `<BelongsToTable>${belongsTo}</BelongsToTable><ParentFieldType>3</ParentFieldType><ShowInTabNo>${tabNo}</ShowInTabNo>`

  const foreignTableName = (tableName) => {
    const camel = tableName.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('')
    return `TheIxTable_${camel}_Hist`
  }

  const DIALOG_W = 530
  const LBL_X1 = 5, LBL_W = 95
  const FLD_X1 = 102, FLD_W = 160
  const LBL_X2 = 270, FLD_X2 = 368, FLD_W2 = 152
  const ROW_H = 14, LBL_H = 12
  const ROW_GAP = 18, SEC_H = 13, SEC_GAP = 16, HDR_H = 42
  const TAB_NO = -200, TABLE_NO = -201
  const TAB_PAD_X = 5, TAB_PAD_Y = 44, TAB_MARGIN = 10

  // Layout inside tab control (relative coordinates, 20px margins)
  const TAB_INNER = 20
  const TAB_LBL_X1 = TAB_INNER                    // 20
  const TAB_FLD_X1 = TAB_INNER + LBL_W + 7        // 122
  const TAB_LBL_X2 = TAB_FLD_X1 + FLD_W + 8       // 290
  const TAB_FLD_X2 = TAB_LBL_X2 + LBL_W + 7       // 392
  const TAB_INNER_W = DIALOG_W - TAB_MARGIN * 2    // 510
  const TAB_FLD_W2 = TAB_INNER_W - TAB_INNER - TAB_FLD_X2  // 98
  const TAB_SEC_W = TAB_INNER_W - TAB_INNER * 2   // 470

  const generateXml = () => {
    setError('')

    const totalAllFields = categories.reduce((a, cat) => a + cat.sections.reduce((b, s) => b + s.fields.filter(f => f.nombre.trim()).length, 0), 0)
    if (totalAllFields === 0) {
      setError('Añade al menos un campo.')
      return
    }

    // Generate XML for ALL categories
    // Use global counters so FieldNo is unique across all categories
    let globalFieldNo = -1
    let globalLabelNo = -50

    const categoryBlocks = categories.map((cat, catIdx) => {
      if (!cat.name.trim()) return ''

      const tableName = sanitizeName(cat.name)
      const ctgryId = sanitizeName(cat.name)

      // Build tab mapping from section's defined pestañas
      const sectionPestañas = []
      cat.sections.forEach(sec => {
        if (sec.pestañas && Array.isArray(sec.pestañas)) {
          sec.pestañas.forEach(p => {
            if (!sectionPestañas.includes(p)) sectionPestañas.push(p)
          })
        }
      })

      // Check if we have multiple tabs (more than just 'Datos')
      const hasMultipleTabs = sectionPestañas.length > 1
      const hasTabs = hasMultipleTabs

      // Create map of pestaña name to tab number (1-indexed, reserved 1 for data)
      const pestañaToTabNo = {}
      const sortedPestañas = sectionPestañas.sort()
      sortedPestañas.forEach((p, idx) => {
        pestañaToTabNo[p] = idx + 1
      })

      const tab1Name = sortedPestañas[0] || 'Datos'
      const tab2Name = 'Historial'

      let colNo = -202
      let fieldsXml = '', dispOrder = 1, tabOrder = 1

      // Helper function to get tab metadata for a field
      const getTabMeta = (fieldPestaña) => {
        if (!hasTabs) return ''
        const trimmedPestaña = fieldPestaña?.trim()
        if (!trimmedPestaña || !pestañaToTabNo[trimmedPestaña]) return ''
        const tabNo = pestañaToTabNo[trimmedPestaña]
        return `<BelongsToTable>${categoryTabNo}</BelongsToTable><ParentFieldType>3</ParentFieldType><ShowInTabNo>${tabNo}</ShowInTabNo>`
      }

      // Use unique Tab and Table FieldNo per category (decreasing from -200, -201, etc.)
      const categoryTabNo = globalFieldNo--
      const categoryTableNo = globalFieldNo--

      let yPos = hasTabs ? 8 : HDR_H + SEC_GAP
      const sectionWidth = hasTabs ? DIALOG_W - TAB_MARGIN * 2 - 20 : DIALOG_W - 10
      const catStartFieldNo = globalFieldNo  // Remember where this category's data fields start

      // Header (only if no tabs)
      let headerXml = ''
      if (!hasTabs) {
        headerXml += makeLabelField({ fieldno: globalLabelNo--, fieldid: `Hdr_Title_${tableName}`, caption: cat.name, width: DIALOG_W - 10, height: 18, posx: 5, posy: 6, fsize: 14, bold: true, tclr: bgr(255, 255, 255), bclr: bgr(55, 65, 81), al: 4, pd: 5 })
      }

      // Data fields - PHASE 1: Generate fields WITHOUT pestaña (before TabControl)
      cat.sections.forEach((sec, si) => {
        const baseFields = sec.fields.filter(f => f.nombre.trim() && f.tipo !== 'table' && (!f.pestaña || !f.pestaña.trim()))
        const fieldsWithTabs = sec.fields.filter(f => f.nombre.trim() && f.tipo !== 'table' && f.pestaña && f.pestaña.trim())
        const tableFields = sec.fields.filter(f => f.nombre.trim() && f.tipo === 'table')

        // Only show section header if no tabs or has base fields
        if ((baseFields.length > 0 || tableFields.length > 0) && (!hasTabs || baseFields.length > 0)) {
          fieldsXml += makeLabelField({ fieldno: globalLabelNo--, fieldid: `Sec_${si}_${tableName}`, caption: sec.name, width: sectionWidth, height: SEC_H, posx: 5, posy: yPos, bold: true, tclr: bgr(255, 255, 255), bclr: bgr(55, 65, 81), al: 4, pd: 6 })
          yPos += SEC_GAP
        }

        // Process regular fields WITHOUT pestaña
        for (let i = 0; i < baseFields.length; i += 2) {
          const f1 = baseFields[i]
          const f2 = baseFields[i + 1]

          if (f1) {
            const colname = sanitizeName(f1.fieldKey || f1.nombre)
            fieldsXml += makeLabelField({ fieldno: globalLabelNo--, fieldid: `Lbl_${colname}`, caption: f1.nombre, width: LBL_W, height: LBL_H, posx: LBL_X1, posy: yPos + 1, fsize: 8, al: 4, tclr: bgr(55, 65, 81) })
            const typeno = typeToTypeNo[f1.tipo] || '1'
            const normalizedLength = normalizeFieldLength(f1.tipo, f1.length)
            const fieldWidth = calculateFieldWidth(normalizedLength.toString(), typeno)
            fieldsXml += makeDataField({ fieldno: globalFieldNo--, colname, fieldid: colname, caption: f1.nombre, typeno, length: normalizedLength.toString(), width: fieldWidth, height: ROW_H, posx: FLD_X1, posy: yPos, taborder: tabOrder++, disporder: dispOrder++ })
          }

          if (f2) {
            const colname = sanitizeName(f2.fieldKey || f2.nombre)
            fieldsXml += makeLabelField({ fieldno: globalLabelNo--, fieldid: `Lbl_${colname}`, caption: f2.nombre, width: LBL_W, height: LBL_H, posx: LBL_X2, posy: yPos + 1, fsize: 8, al: 4, tclr: bgr(55, 65, 81) })
            const typeno = typeToTypeNo[f2.tipo] || '1'
            const normalizedLength = normalizeFieldLength(f2.tipo, f2.length)
            const fieldWidth = calculateFieldWidth(normalizedLength.toString(), typeno)
            fieldsXml += makeDataField({ fieldno: globalFieldNo--, colname, fieldid: colname, caption: f2.nombre, typeno, length: normalizedLength.toString(), width: fieldWidth, height: ROW_H, posx: FLD_X2, posy: yPos, taborder: tabOrder++, disporder: dispOrder++ })
          }

          yPos += ROW_GAP
        }

        // Process table fields (NOT in tabs)
        tableFields.forEach((tableField) => {
          if (!tableField.pestaña || !tableField.pestaña.trim()) {
            const tableFieldNo = globalFieldNo--
            fieldsXml += makeTableField({ fieldno: tableFieldNo, fieldid: sanitizeName(tableField.nombre), caption: tableField.nombre, posy: yPos })
            yPos += 100
            tabOrder++
            dispOrder++

            const columns = tableField.columnas || []
            columns.forEach((col) => {
              const colname = sanitizeName(col.nombre)
              const colTypeno = typeToTypeNo[col.tipo] || '1'
              const normalizedLength = normalizeFieldLength(col.tipo, col.length)
              fieldsXml += makeTableColumnField({ fieldno: globalFieldNo--, colname, fieldid: colname, caption: col.nombre, typeno: colTypeno, length: normalizedLength.toString(), parentTableNo: tableFieldNo, taborder: tabOrder++, disporder: dispOrder++ })
            })
          }
        })

        yPos += 6
      })

      const baseContentH = yPos + 10  // Height of content BEFORE tabs

      // Tab Control XML
      let tabXml = ''
      let fieldsWithTabsXml = ''  // Fields INSIDE the tab (Phase 2)
      let tabYPos = 0  // Track vertical position for tab content height calculation

      if (hasTabs) {
        // PHASE 2: Generate fields WITH pestaña inside tabs - loop by tab, then by section
        let maxTabH = 0

        sortedPestañas.forEach((tabName, tabIdx) => {
          const tabNo = tabIdx + 1
          let tabYPos = TAB_INNER  // reset to 20 for every tab

          const mkTabMeta = () =>
            `<BelongsToTable>${categoryTabNo}</BelongsToTable><ParentFieldType>3</ParentFieldType><ShowInTabNo>${tabNo}</ShowInTabNo>`

          cat.sections.forEach((sec, si) => {
            const fieldsForTab = sec.fields.filter(f =>
              f.nombre.trim() && f.tipo !== 'table' && f.pestaña?.trim() === tabName
            )
            const tableFieldsForTab = sec.fields.filter(f =>
              f.nombre.trim() && f.tipo === 'table' && f.pestaña?.trim() === tabName
            )

            if (fieldsForTab.length === 0 && tableFieldsForTab.length === 0) return

            // Section header INSIDE this tab with correct ShowInTabNo
            fieldsWithTabsXml += makeLabelField({
              fieldno: globalLabelNo--,
              fieldid: `Sec_${si}_T${tabNo}_${tableName}`,
              caption: sec.name,
              width: TAB_SEC_W, height: SEC_H,
              posx: TAB_INNER, posy: tabYPos,
              bold: true, tclr: bgr(255, 255, 255), bclr: bgr(55, 65, 81), al: 4, pd: 6,
              tabMeta: mkTabMeta()
            })
            tabYPos += SEC_GAP

            // Regular fields in pairs with relative tab coordinates
            for (let i = 0; i < fieldsForTab.length; i += 2) {
              const f1 = fieldsForTab[i]
              const f2 = fieldsForTab[i + 1]

              if (f1) {
                const colname = sanitizeName(f1.fieldKey || f1.nombre)
                fieldsWithTabsXml += makeLabelField({
                  fieldno: globalLabelNo--, fieldid: `Lbl_${colname}`, caption: f1.nombre,
                  width: LBL_W, height: LBL_H, posx: TAB_LBL_X1, posy: tabYPos + 1,
                  fsize: 8, al: 4, tclr: bgr(55, 65, 81), tabMeta: mkTabMeta()
                })
                const typeno = typeToTypeNo[f1.tipo] || '1'
                const normalizedLength = normalizeFieldLength(f1.tipo, f1.length)
                const fieldWidth = Math.min(calculateFieldWidth(normalizedLength.toString(), typeno), 155)
                fieldsWithTabsXml += makeDataField({
                  fieldno: globalFieldNo--, colname, fieldid: colname, caption: f1.nombre,
                  typeno, length: normalizedLength.toString(),
                  width: fieldWidth, height: ROW_H, posx: TAB_FLD_X1, posy: tabYPos,
                  taborder: tabOrder++, disporder: dispOrder++, tabMeta: mkTabMeta()
                })
              }

              if (f2) {
                const colname = sanitizeName(f2.fieldKey || f2.nombre)
                fieldsWithTabsXml += makeLabelField({
                  fieldno: globalLabelNo--, fieldid: `Lbl_${colname}`, caption: f2.nombre,
                  width: LBL_W, height: LBL_H, posx: TAB_LBL_X2, posy: tabYPos + 1,
                  fsize: 8, al: 4, tclr: bgr(55, 65, 81), tabMeta: mkTabMeta()
                })
                const typeno = typeToTypeNo[f2.tipo] || '1'
                const normalizedLength = normalizeFieldLength(f2.tipo, f2.length)
                const fieldWidth = Math.min(calculateFieldWidth(normalizedLength.toString(), typeno), 98)
                fieldsWithTabsXml += makeDataField({
                  fieldno: globalFieldNo--, colname, fieldid: colname, caption: f2.nombre,
                  typeno, length: normalizedLength.toString(),
                  width: fieldWidth, height: ROW_H, posx: TAB_FLD_X2, posy: tabYPos,
                  taborder: tabOrder++, disporder: dispOrder++, tabMeta: mkTabMeta()
                })
              }

              tabYPos += ROW_GAP
            }

            // Table fields inside this tab
            tableFieldsForTab.forEach((tableField) => {
              const tableFieldNo = globalFieldNo--
              fieldsWithTabsXml += makeTableField({
                fieldno: tableFieldNo, fieldid: sanitizeName(tableField.nombre),
                caption: tableField.nombre, posy: tabYPos, tabMeta: mkTabMeta()
              })
              tabYPos += 100
              tabOrder++; dispOrder++

              const columns = tableField.columnas || []
              columns.forEach((col) => {
                const colname = sanitizeName(col.nombre)
                const colTypeno = typeToTypeNo[col.tipo] || '1'
                const normalizedLength = normalizeFieldLength(col.tipo, col.length)
                fieldsWithTabsXml += makeTableColumnField({
                  fieldno: globalFieldNo--, colname, fieldid: colname, caption: col.nombre,
                  typeno: colTypeno, length: normalizedLength.toString(),
                  parentTableNo: tableFieldNo, taborder: tabOrder++, disporder: dispOrder++
                })
              })
            })

            tabYPos += 6
          })

          maxTabH = Math.max(maxTabH, tabYPos + TAB_INNER)  // bottom margin 20px
        })

        tabYPos = maxTabH  // expose for contentH calculation below
      }

      const contentH = Math.max(baseContentH, hasTabs ? (tabYPos + 10) : 0)
      const camel = tableName.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('')
      const tableW = DIALOG_W - TAB_MARGIN * 2 - 10
      const tableH = Math.max(contentH, 240) - 30
      const tabH2 = Math.max(contentH + 20, 260)

      if (hasTabs) {
        // Table field for history tab (always the last tab)
        const historyTabNo = sortedPestañas.length + 1
        tabXml += `<Field><FieldNo>${categoryTableNo}</FieldNo>${xmlCaption(tab2Name)}<TypeNo>10</TypeNo><Width>${tableW}</Width><Height>${tableH}</Height><PosX>5</PosX><PosY>5</PosY><TabOrderPos>${tabOrder++}</TabOrderPos><DontLoadValues>1</DontLoadValues><DispOrderPos>${dispOrder++}</DispOrderPos>${xmlRegEx()}<Links></Links><BelongsToTable>${categoryTabNo}</BelongsToTable><ForeignTable>${foreignTableName(tableName)}</ForeignTable><Id>${newGuid()}</Id><DisplayProp></DisplayProp><ParentFieldType>3</ParentFieldType><TabInfo FactoryType="0"></TabInfo><ShowInTabNo>${historyTabNo}</ShowInTabNo><FieldID>Historial_${camel}</FieldID><DisplayPropCond></DisplayPropCond><Filter></Filter></Field>`

        // Build tab entries dynamically
        const tabEntries = sortedPestañas.map((p, idx) => {
          const tabNo = idx + 1
          return `<T FactoryType="1"><TabNo>${tabNo}</TabNo><TabPos>${tabNo}</TabPos><TabCapt><TStr><T><L>1034</L><S>${escapeXml(p)}</S></T></TStr></TabCapt></T>`
        }).join('')

        // Add history tab
        const historyTabEntry = `<T FactoryType="1"><TabNo>${historyTabNo}</TabNo><TabPos>${historyTabNo}</TabPos><TabCapt><TStr><T><L>1034</L><S>Historial</S></T></TStr></TabCapt></T>`

        // Tab Control
        tabXml += `<Field><FieldNo>${categoryTabNo}</FieldNo>${xmlCaption(tab1Name)}<TypeNo>13</TypeNo><Width>${DIALOG_W - TAB_MARGIN * 2}</Width><Height>${tabH2}</Height><PosX>${TAB_PAD_X}</PosX><PosY>${TAB_PAD_Y}</PosY><DontLoadValues>1</DontLoadValues>${xmlRegEx()}<Links></Links><Id>${newGuid()}</Id><DisplayProp><Face>Arial</Face><FSize>8</FSize><BClr>${bgr(192, 192, 192)}</BClr></DisplayProp><TabInfo FactoryType="1"><Tabs>${tabEntries}${historyTabEntry}</Tabs></TabInfo><FieldID>Tab_${camel}</FieldID><DisplayPropCond></DisplayPropCond><Filter></Filter></Field>`
      }

      const dialogH = hasTabs ? TAB_PAD_Y + Math.max(contentH + 20, 260) + 10 : HDR_H + contentH + 10
      const allFields = cat.sections.flatMap(s => s.fields).filter(f => f.nombre.trim())
      // Reference the first 3 data fields that were created for this category
      const titleFlds = [catStartFieldNo, catStartFieldNo - 1, catStartFieldNo - 2].slice(0, Math.min(3, allFields.length)).map(n => `<Fld>${n}</Fld>`).join('')
      const docTitles = `<DocTitles><DocTitlesArr><DocTitle><TitleType>1</TitleType><FieldNos>${titleFlds}</FieldNos><MaxLength>100</MaxLength><HideCtgryName>0</HideCtgryName><ShowFieldNames>0</ShowFieldNames></DocTitle><DocTitle><TitleType>2</TitleType><FieldNos>${titleFlds}</FieldNos><MaxLength>0</MaxLength><HideCtgryName>0</HideCtgryName><ShowFieldNames>1</ShowFieldNames></DocTitle></DocTitlesArr></DocTitles>`

      return `<Category><CtgryNo>-${catIdx + 1}</CtgryNo><TableName>${tableName}</TableName><Name UPT="1"><TStr><T><L>1034</L><S>${escapeXml(cat.name)}</S></T></TStr></Name><Version>0</Version><Fields>${headerXml}${fieldsXml}${fieldsWithTabsXml}${tabXml}</Fields><DataTypes></DataTypes><Title>${escapeXml(cat.name)}</Title><Width>${DIALOG_W}</Width><Height>${dialogH}</Height><Watermark><DocNo>0</DocNo></Watermark><FulltextMode>1</FulltextMode><FulltextDate>18991230</FulltextDate><CheckInMode>1</CheckInMode><Description UPT="1"><TStr></TStr></Description><Header><Font></Font></Header><DlgBgColor>${bgr(240, 240, 240)}</DlgBgColor><EmptyDocMode>1</EmptyDocMode><CoverMode>1</CoverMode>${docTitles}<CtgryID>${ctgryId}</CtgryID></Category>`
    }).join('')

    const newXml = `<?xml version="1.0" encoding="utf-8"?><Configuration><Version>570425345</Version><NewImportExport>1</NewImportExport><Categories>${categoryBlocks}</Categories><QueryTemplates></QueryTemplates><CaseDefinitions></CaseDefinitions><Folders></Folders><Datatypes></Datatypes><KeywordDictionaries></KeywordDictionaries><Counters></Counters><Templates></Templates><WFProcesses></WFProcesses><UCProfiles></UCProfiles><TreeViews></TreeViews><CloudStorages></CloudStorages><Preprocessors></Preprocessors><Forms></Forms><FormImgs></FormImgs><ReportDefinitions></ReportDefinitions><ReportTemplates></ReportTemplates><PowerBIDataSets></PowerBIDataSets><PowerBITables></PowerBITables><EForms></EForms><ESignatureProviders></ESignatureProviders><Roles></Roles><RoleAssignments></RoleAssignments><CommonScripts></CommonScripts><OfficeProfiles></OfficeProfiles><IxProfiles></IxProfiles><Queries></Queries><Users></Users><CaptProfiles></CaptProfiles><References></References><CntConnSrcs></CntConnSrcs><Dashboards></Dashboards><Stamps></Stamps><RetentionPolicies></RetentionPolicies><SmartCaptureProcessors></SmartCaptureProcessors><SmartCaptureQueues></SmartCaptureQueues><DocDownloadProviders></DocDownloadProviders><Credentials></Credentials></Configuration>`

    setXml(newXml)
    setXmlModalOpen(true)
  }

  const copy = () => {
    navigator.clipboard.writeText(xml).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const download = () => {
    const now = new Date()
    const timestamp = now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0')

    const a = document.createElement('a')
    a.href = 'data:application/xml;charset=utf-8,' + encodeURIComponent(xml)
    a.download = `TheConfiguration_${timestamp}.xml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const totalFields = currentCategory.sections.reduce((a, s) => a + s.fields.filter(f => f.nombre.trim()).length, 0)
  const filteredTemplates = templates.filter(t => t.name.toLowerCase().includes(searchText.toLowerCase()))

  const tabItems = categories.map((cat, idx) => ({
    key: idx.toString(),
    label: cat.name,
    children: (
      <div className="eform-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <input
            value={cat.name}
            onChange={e => updateCategoryName(idx, e.target.value)}
            className="form-input"
            style={{
              flex: 1,
              marginRight: '8px'
            }}
          />
          {categories.length > 1 && (
            <button
              onClick={() => removeCategory(idx)}
              className="btn-default"
            >
              ✕ Eliminar
            </button>
          )}
        </div>

        {/* Category-level tab management */}
        {(() => {
          // Collect all unique pestañas from all sections
          const allPestañas = new Set()
          cat.sections.forEach(sec => {
            if (sec.pestañas) sec.pestañas.forEach(p => allPestañas.add(p))
          })
          const uniquePestañas = Array.from(allPestañas)

          // Get selected tab for this category
          const selectedTab = selectedTabByCategory[idx] || (uniquePestañas.length > 0 ? uniquePestañas[0] : null)

          return (
            <>
              {/* Tab buttons (only show if there are multiple pestañas) */}
              {uniquePestañas.length > 1 && (
                <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', borderBottom: `1px solid var(--border-default)`, paddingBottom: '8px', overflowX: 'auto' }}>
                  {uniquePestañas.map(tab => (
                    <button
                      key={tab}
                      onClick={() => setSelectedTabByCategory({...selectedTabByCategory, [idx]: tab})}
                      style={{
                        padding: '8px 14px',
                        fontSize: '12px',
                        fontWeight: selectedTab === tab ? '600' : '400',
                        background: selectedTab === tab ? 'var(--bg-hover)' : 'transparent',
                        border: selectedTab === tab ? `1px solid var(--border-default)` : `1px solid var(--border-default)`,
                        color: selectedTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 200ms ease',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              )}

              {/* Render sections filtered by selected tab */}
              {cat.sections.map((sec, secIdx) => {
                // Only show section if it has fields in the selected tab (or any pestaña if single tab)
                const hasFieldsInSelectedTab = selectedTab && sec.fields.some(f => f.pestaña?.trim() === selectedTab)
                const hasNoTabFields = sec.fields.some(f => !f.pestaña || !f.pestaña.trim())
                const shouldShow = !selectedTab || hasFieldsInSelectedTab || hasNoTabFields

                if (!shouldShow) return null

                return (
                  <SectionEditor
                    key={sec.id}
                    section={sec}
                    secIdx={secIdx}
                    updateField={updateField}
                    removeField={removeField}
                    addField={addField}
                    updateSecName={updateSecName}
                    removeSection={removeSection}
                    catSectionsCount={cat.sections.length}
                    addPestaña={addPestaña}
                    removePestaña={removePestaña}
                    updateFieldPestaña={updateFieldPestaña}
                    selectedTab={selectedTab}
                    hideTabManager={uniquePestañas.length > 1}
                  />
                )
              })}
            </>
          )
        })()}

        <button
          onClick={addSection}
          style={{
            background: 'var(--bg-hover)',
            border: '1px solid var(--border-default)',
            borderRadius: '10px',
            color: 'var(--text-primary)',
            fontSize: '12px',
            padding: '6px 12px',
            cursor: 'pointer',
            marginBottom: '12px'
          }}
        >
          + Sección
        </button>
      </div>
    )
  }))

  return (
    <div className="container-main">
      {/* HEADER */}
      <div className="header-main">
        <div>
          <h1 className="header-title">🏗️ Generador de Categorías</h1>
          <p className="header-subtitle">Crea múltiples categorías con secciones y campos · XML · v2.0</p>
        </div>
        <div className="header-actions">
          <button
            onClick={() => setActiveView('editor')}
            className={activeView === 'editor' ? 'btn-primary' : 'btn-default'}
          >
            ✎ Editor
          </button>
          <button
            onClick={() => setActiveView('preview')}
            className={activeView === 'preview' ? 'btn-primary' : 'btn-default'}
          >
            👁 Preview
          </button>
          <button
            onClick={() => setCsvModalOpen(true)}
            className="btn-default"
          >
            📤 Importar CSV
          </button>
          <button
            onClick={() => setManagerOpen(true)}
            className="btn-default"
          >
            📁 Mis Plantillas
          </button>
          <button
            onClick={() => setColorModalOpen(true)}
            className="btn-default"
          >
            🎨 Colores
          </button>
          <button
            onClick={generateXml}
            className="btn-default"
          >
            ⚡ Generar XML
          </button>
        </div>
      </div>

      {activeView === 'preview' ? (
        <div style={{
          background: 'var(--bg-hover)',
          borderRadius: '8px',
          fontFamily: 'Arial, sans-serif',
          overflow: 'auto',
          maxHeight: '600px'
        }}>
          <Tabs
            items={tabItems.map(tab => ({
              ...tab,
              children: (
                <div style={{ background: 'var(--bg-canvas)', padding: '20px' }}>
                  <div style={{ background: 'var(--accent-primary)', color: 'var(--text-inverse)', borderRadius: '6px 6px 0 0', padding: '16px', marginLeft: '-20px', marginRight: '-20px', marginTop: '-20px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '16px', fontWeight: '700' }}>{categories[parseInt(tab.key)].name}</div>
                  </div>
                  {categories[parseInt(tab.key)].sections.map((sec, si) => {
                    // Separate fields: those without pestaña (baseFields) and those with pestaña
                    const baseFields = []
                    const fieldsByTab = {}

                    sec.fields.forEach(f => {
                      if (!f.nombre) return // Skip empty fields
                      const tabName = f.pestaña?.trim()
                      if (!tabName) {
                        baseFields.push(f)
                      } else {
                        if (!fieldsByTab[tabName]) fieldsByTab[tabName] = []
                        fieldsByTab[tabName].push(f)
                      }
                    })

                    const secTabs = Object.keys(fieldsByTab).sort()

                    return (
                      <PreviewSection key={si} sectionName={sec.name} fieldsByTab={fieldsByTab} baseFields={baseFields} tabs={secTabs} />
                    )
                  })}
                  <button style={{ background: 'var(--accent-primary)', color: 'var(--text-inverse)', border: 'none', borderRadius: '6px', padding: '10px 24px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginTop: '12px' }}>
                    Enviar
                  </button>
                </div>
              )
            }))}
          />
        </div>
      ) : (
        <>
          {/* INFORMACIÓN */}
          <div className="eform-panel">
            <div className="eform-panel-title">Categorías ({categories.length})</div>

            {/* Categories name editor */}
            <div className="eform-panel" style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombres definitivos</div>
                <button
                  onClick={() => {
                    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
                    setCategories(categories.map(cat => ({
                      ...cat,
                      name: cat.name.trim() ? `${cat.name} ${timestamp}` : `Categoría ${timestamp}`
                    })))
                  }}
                  className="btn-sm btn-default"
                  title="Agrega la fecha actual a los nombres para hacerlos únicos"
                >
                  📅 Agregar fecha
                </button>
              </div>
              <div style={{ display: 'grid', gap: '6px' }}>
                {categories.map((cat, idx) => (
                  <input
                    key={cat.id}
                    value={cat.name}
                    onChange={e => updateCategoryName(idx, e.target.value)}
                    placeholder={`Categoría ${idx + 1}`}
                    className="form-input"
                    style={{
                      flex: 1
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={addCategory} className="btn-default">
                + Nueva Categoría
              </button>
              <button onClick={saveTemplate} className="btn-default">
                💾 Guardar Plantilla
              </button>
            </div>
          </div>

          {/* EDITOR */}
          <div>
            <div style={{
              background: 'linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.04)),rgba(255,255,255,.06)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              padding: '16px',
              backdropFilter: 'blur(14px)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)'
            }}>
              <Tabs
                activeKey={activeCategory.toString()}
                onChange={(key) => setActiveCategory(parseInt(key))}
                items={tabItems}
              />
            </div>
          </div>
        </>
      )}

      {/* XML Modal */}
      <Modal
        title="Generar XML"
        open={xmlModalOpen}
        onCancel={() => setXmlModalOpen(false)}
        width={800}
        footer={null}
      >
        {error && (
          <div className="alert alert-error">
            ⚠ {error}
          </div>
        )}
        {xml && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <button onClick={copy} className="btn-default">
                {copied ? '✓ Copiado' : '📋 Copiar XML'}
              </button>
              <button onClick={download} className="btn-default">
                ⬇ Descargar .xml
              </button>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              {xml.length.toLocaleString()} caracteres
            </div>
            <textarea
              readOnly
              value={xml}
              style={{
                width: '100%',
                height: '300px',
                padding: '10px',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '11px',
                backgroundColor: 'var(--bg-dark)',
                color: 'var(--accent-success)',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
          </div>
        )}
      </Modal>

      {/* Templates Manager Modal */}
      <Modal
        title="Mis Plantillas de Categoría"
        open={managerOpen}
        onCancel={() => setManagerOpen(false)}
        width={1000}
        footer={null}
      >
        <div style={{ marginBottom: '16px' }}>
          <Input.Search
            placeholder="Buscar por nombre..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ maxWidth: '400px' }}
          />
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Empty description={searchText ? 'Sin resultados' : 'No hay plantillas creadas'} style={{ padding: '40px' }} />
        ) : (
          <Table
            columns={[
              { title: 'Nombre', dataIndex: 'name', key: 'name', render: (text) => <strong>{text}</strong>, width: '35%' },
              { title: 'Descripción', dataIndex: 'description', key: 'description', width: '35%', render: (text) => text || <span style={{ color: 'var(--text-muted)' }}>-</span> },
              {
                title: 'Estado', dataIndex: 'compartido', key: 'compartido',
                render: (compartido) => (
                  <Tag color={compartido ? 'blue' : 'default'}>
                    {compartido ? 'Compartida' : 'Privada'}
                  </Tag>
                ),
                width: '15%'
              },
              {
                title: 'Acciones', key: 'actions', width: '15%',
                render: (_, record) => (
                  <Space size="small">
                    <Button size="small" onClick={() => loadTemplate(record)}>Cargar</Button>
                    <Button size="small" onClick={() => downloadTemplate(record)}>Descar</Button>
                    <Button danger size="small" onClick={() => deleteTemplate(record.id)}>✕</Button>
                  </Space>
                )
              }
            ]}
            dataSource={filteredTemplates}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="small"
          />
        )}
      </Modal>

      {/* Color Palette Modal */}
      <Modal
        title="🎨 Paleta de Colores"
        open={colorModalOpen}
        onCancel={() => setColorModalOpen(false)}
        width={700}
        footer={null}
      >
        <div style={{ padding: '20px 0' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>Presets Estándar</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            {Object.entries(COLOR_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => {
                  setCustomColors(preset.colors)
                  message.success(`Aplicado: ${preset.name}`)
                }}
                style={{
                  padding: '12px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {preset.name}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {Object.values(preset.colors).slice(0, 4).map((color, i) => (
                    <div
                      key={i}
                      style={{
                        width: '24px',
                        height: '24px',
                        background: color,
                        borderRadius: '4px',
                        border: '1px solid var(--border-default)'
                      }}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>

          <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>Personalizado</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Primario', key: 'primary' },
              { label: 'Fondo Canvas', key: 'bgCanvas' },
              { label: 'Fondo Card', key: 'bgCard' },
              { label: 'Texto Principal', key: 'textMain' },
              { label: 'Texto Secundario', key: 'textSec' },
              { label: 'Borde', key: 'border' },
            ].map(color => (
              <div key={color.key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  {color.label}
                </label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={customColors[color.key]?.replace(/[rgba()]/g, '').split(',')[0] || '#9ad1ff'}
                    onChange={(e) => {
                      setCustomColors({ ...customColors, [color.key]: e.target.value })
                    }}
                    style={{
                      width: '40px',
                      height: '32px',
                      border: '1px solid var(--border-default)',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={customColors[color.key] || ''}
                    onChange={(e) => {
                      setCustomColors({ ...customColors, [color.key]: e.target.value })
                    }}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      border: '1px solid var(--border-default)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      backgroundColor: 'var(--bg-canvas)',
                      color: 'var(--text-primary)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-default)' }}>
            <button
              onClick={() => {
                message.success('Colores aplicados')
                setColorModalOpen(false)
              }}
              style={{
                background: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              ✓ Aplicar Colores
            </button>
          </div>
        </div>
      </Modal>

      {/* CSV Importer Modal */}
      <CsvImporter isOpen={csvModalOpen} onClose={() => setCsvModalOpen(false)} onImport={handleCsvImport} />
    </div>
  )
}
