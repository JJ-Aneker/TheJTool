import { useState, useEffect } from 'react'
import { Button, Modal, message, Input, Table, Space, Tag, Empty, Spin, Tabs } from 'antd'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../config/supabaseClient'
import '../styles/category-builder.css'
import { MESSAGES } from '../constants/messages'
import { handleError, logError } from '../utils/errorHandler'
import { logger } from '../utils/logger'

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

// Therefore TypeNo mapping (official types)
const FIELD_TYPES = [
  { value: '1', label: 'Texto (String)', typeno: 1 },
  { value: '2', label: 'Número (Integer)', typeno: 2 },
  { value: '3', label: 'Fecha (Date)', typeno: 3 },
  { value: '5', label: 'Dinero (Money)', typeno: 5 },
  { value: '6', label: 'Booleano (Logical)', typeno: 6 },
  { value: '7', label: 'Fecha-Hora (DateTime)', typeno: 7 },
  { value: '10', label: 'Tabla (Table)', typeno: 10 },
  { value: '15', label: 'Lista/Lookup', typeno: 15 },
]

// BGR color helper (Blue-Green-Red format, Therefore standard)
const bgr = (r, g, b) => b * 65536 + g * 256 + r
const bgrToHex = (val) => {
  // Handle invalid input gracefully
  if (typeof val !== 'number' || val < 0 || val > 16777215) {
    logger.warn('Invalid BGR value', { val, fallback: '#F0F0F0' })
    return '#F0F0F0'
  }
  const b = (val >> 16) & 0xff
  const g = (val >> 8) & 0xff
  const r = val & 0xff
  const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
  return hex
}

// Therefore color palettes (official themes) — with descriptive color labels
const COLOR_PALETTES = {
  'Corporativa': {
    name: 'Corporativa',
    secBg: bgr(0, 0, 0),
    secText: bgr(255, 255, 255),
    hdrBg: bgr(154, 69, 26),
    hdrText: bgr(255, 255, 255),
    hdrSub: bgr(220, 160, 120),
    hdrMed: bgr(100, 40, 15),
    dlgBg: bgr(192, 192, 192),
    tabBg: bgr(160, 160, 160),
    fieldBg: bgr(255, 255, 255),
    fieldText: bgr(0, 0, 0),
    labelColor: bgr(55, 65, 81),
    labelBg: bgr(240, 240, 240),
    // Palette metadata for UI display
    colorLabels: {
      secBg: 'Sección (Fondo)',
      secText: 'Sección (Texto)',
      hdrBg: 'Título (Fondo)',
      hdrText: 'Título (Texto)',
      fieldBg: 'Campos (Fondo)',
      fieldText: 'Campos (Texto)',
      labelColor: 'Etiqueta (Texto)',
      dlgBg: 'Fondo de Categoría'
    }
  },
  'Therefore Azul': {
    name: 'Therefore Azul',
    secBg: bgr(24, 95, 165),
    secText: bgr(255, 255, 255),
    hdrBg: bgr(24, 95, 165),
    hdrText: bgr(255, 255, 255),
    hdrSub: bgr(180, 210, 240),
    hdrMed: bgr(16, 75, 140),
    dlgBg: bgr(240, 240, 240),
    tabBg: bgr(192, 192, 192),
    fieldBg: bgr(255, 255, 255),
    fieldText: bgr(0, 0, 0),
    labelColor: bgr(55, 65, 81),
    labelBg: bgr(245, 248, 252),
    colorLabels: {
      secBg: 'Sección (Fondo)',
      secText: 'Sección (Texto)',
      hdrBg: 'Título (Fondo)',
      hdrText: 'Título (Texto)',
      fieldBg: 'Campos (Fondo)',
      fieldText: 'Campos (Texto)',
      labelColor: 'Etiqueta (Texto)',
      dlgBg: 'Fondo de Categoría'
    }
  },
  'Verde Corporativo': {
    name: 'Verde Corporativo',
    secBg: bgr(22, 101, 52),
    secText: bgr(255, 255, 255),
    hdrBg: bgr(22, 101, 52),
    hdrText: bgr(255, 255, 255),
    hdrSub: bgr(187, 247, 208),
    hdrMed: bgr(15, 75, 38),
    dlgBg: bgr(240, 245, 240),
    tabBg: bgr(192, 192, 192),
    fieldBg: bgr(255, 255, 255),
    fieldText: bgr(0, 0, 0),
    labelColor: bgr(55, 65, 81),
    labelBg: bgr(245, 252, 247),
    colorLabels: {
      secBg: 'Sección (Fondo)',
      secText: 'Sección (Texto)',
      hdrBg: 'Título (Fondo)',
      hdrText: 'Título (Texto)',
      fieldBg: 'Campos (Fondo)',
      fieldText: 'Campos (Texto)',
      labelColor: 'Etiqueta (Texto)',
      dlgBg: 'Fondo de Categoría'
    }
  },
  'Rojo Institucional': {
    name: 'Rojo Institucional',
    secBg: bgr(153, 27, 27),
    secText: bgr(255, 255, 255),
    hdrBg: bgr(153, 27, 27),
    hdrText: bgr(255, 255, 255),
    hdrSub: bgr(254, 202, 202),
    hdrMed: bgr(120, 20, 20),
    dlgBg: bgr(245, 240, 240),
    tabBg: bgr(192, 192, 192),
    fieldBg: bgr(255, 255, 255),
    fieldText: bgr(0, 0, 0),
    labelColor: bgr(55, 65, 81),
    labelBg: bgr(252, 245, 245),
    colorLabels: {
      secBg: 'Sección (Fondo)',
      secText: 'Sección (Texto)',
      hdrBg: 'Título (Fondo)',
      hdrText: 'Título (Texto)',
      fieldBg: 'Campos (Fondo)',
      fieldText: 'Campos (Texto)',
      labelColor: 'Etiqueta (Texto)',
      dlgBg: 'Fondo de Categoría'
    }
  },
  'Gris Neutro': {
    name: 'Gris Neutro',
    secBg: bgr(55, 65, 81),
    secText: bgr(255, 255, 255),
    hdrBg: bgr(55, 65, 81),
    hdrText: bgr(255, 255, 255),
    hdrSub: bgr(209, 213, 219),
    hdrMed: bgr(31, 41, 55),
    dlgBg: bgr(243, 244, 246),
    tabBg: bgr(192, 192, 192),
    fieldBg: bgr(255, 255, 255),
    fieldText: bgr(0, 0, 0),
    labelColor: bgr(55, 65, 81),
    labelBg: bgr(249, 250, 251),
    colorLabels: {
      secBg: 'Sección (Fondo)',
      secText: 'Sección (Texto)',
      hdrBg: 'Título (Fondo)',
      hdrText: 'Título (Texto)',
      fieldBg: 'Campos (Fondo)',
      fieldText: 'Campos (Texto)',
      labelColor: 'Etiqueta (Texto)',
      dlgBg: 'Fondo de Categoría'
    }
  },
  'Morado': {
    name: 'Morado',
    secBg: bgr(88, 28, 135),
    secText: bgr(255, 255, 255),
    hdrBg: bgr(88, 28, 135),
    hdrText: bgr(255, 255, 255),
    hdrSub: bgr(233, 213, 255),
    hdrMed: bgr(59, 7, 100),
    dlgBg: bgr(245, 240, 250),
    tabBg: bgr(192, 192, 192),
    fieldBg: bgr(255, 255, 255),
    fieldText: bgr(0, 0, 0),
    labelColor: bgr(55, 65, 81),
    labelBg: bgr(250, 245, 252),
    colorLabels: {
      secBg: 'Sección (Fondo)',
      secText: 'Sección (Texto)',
      hdrBg: 'Título (Fondo)',
      hdrText: 'Título (Texto)',
      fieldBg: 'Campos (Fondo)',
      fieldText: 'Campos (Texto)',
      labelColor: 'Etiqueta (Texto)',
      dlgBg: 'Fondo de Categoría'
    }
  }
}

// Maps CSV type aliases to Therefore TypeNo values
const TYPE_ALIAS = {
  // String (TypeNo 1)
  'string': '1', 'texto': '1', 'text': '1', 'str': '1', 'varchar': '1',
  'email': '1', 'correo': '1',
  'phone': '1', 'teléfono': '1', 'celular': '1',
  // Integer (TypeNo 2)
  'number': '2', 'integer': '2', 'int': '2', 'entero': '2', 'número': '2', 'numeric': '2',
  // Date (TypeNo 3)
  'date': '3', 'fecha': '3',
  // Money (TypeNo 5)
  'money': '5', 'importe': '5', 'decimal': '5', 'currency': '5',
  // Logical (TypeNo 6)
  'boolean': '6', 'bool': '6', 'lógico': '6', 'logical': '6', 'checkbox': '6',
  // DateTime (TypeNo 7)
  'datetime': '7', 'timestamp': '7', 'fecha y hora': '7', 'fecha-hora': '7',
  // Memo → String with max length (TypeNo 1)
  'memo': '1', 'texto largo': '1', 'textarea': '1', 'longtext': '1',
  // Lookup (TypeNo 15)
  'lookup': '15', 'lista': '15', 'combo': '15', 'desplegable': '15',
  // Table (TypeNo 10)
  'table': '10', 'tabla': '10', 'grid': '10',
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
    tablaparent: headers.findIndex(h => ['tablaparent', 'tabla_parent', 'tabla parent', 'parenttable', 'parent table', 'tabla'].includes(h)),
  }

  if (idx.nombre === -1) return { error: 'No se encontró la columna "Nombre".' }

  const categoryMap = {}
  const warnings = []
  const tableColumnMap = {} // Para mapear TablaParent → lista de columnas

  // Primera pasada: identificar campos Table y recolectar sus columnas
  lines.slice(1).forEach((line, li) => {
    const cols = line.split(sep).map(c => c.trim())
    const nombre = cols[idx.nombre] || ''
    if (!nombre) return

    const tipo = idx.tipo >= 0 ? (TYPE_ALIAS[cols[idx.tipo]?.toLowerCase()] || 'text') : 'text'
    const tablaParent = idx.tablaparent >= 0 ? (cols[idx.tablaparent] || '').trim() : ''

    // Si tiene TablaParent y el tipo NO es Table, es una columna de tabla
    if (tablaParent && tipo !== '10') {
      if (!tableColumnMap[tablaParent]) tableColumnMap[tablaParent] = []
      const fieldKey = idx.fieldkey >= 0 ? (cols[idx.fieldkey] || toCamelKey(nombre)) : toCamelKey(nombre)
      const length = idx.length >= 0 ? (cols[idx.length] || '').trim() : ''
      const required = idx.obligatorio >= 0 ? ['1', 'si', 'sí', 'yes', 'true'].includes((cols[idx.obligatorio] || '').toLowerCase()) : false
      tableColumnMap[tablaParent].push({ id: newGuid(), nombre, fieldKey, tipo, required, length })
    }
  })

  // Segunda pasada: procesar campos normales
  lines.slice(1).forEach((line, li) => {
    const cols = line.split(sep).map(c => c.trim())
    const nombre = cols[idx.nombre] || ''
    if (!nombre) { warnings.push(`Fila ${li + 2}: sin nombre, ignorada.`); return }

    const categoria = idx.categoria >= 0 ? (cols[idx.categoria] || 'CATEGORÍA 1').trim() : 'CATEGORÍA 1'
    const fieldKey = idx.fieldkey >= 0 ? (cols[idx.fieldkey] || toCamelKey(nombre)) : toCamelKey(nombre)
    const tipo = idx.tipo >= 0 ? (TYPE_ALIAS[cols[idx.tipo]?.toLowerCase()] || 'text') : 'text'
    const required = idx.obligatorio >= 0 ? ['1', 'si', 'sí', 'yes', 'true'].includes((cols[idx.obligatorio] || '').toLowerCase()) : false
    const seccion = idx.seccion >= 0 ? (cols[idx.seccion] || 'GENERAL').toUpperCase() : 'GENERAL'
    const pestaña = idx.pestaña >= 0 ? (cols[idx.pestaña] || '').trim() : ''
    const length = idx.length >= 0 ? (cols[idx.length] || '').trim() : ''
    const tablaParent = idx.tablaparent >= 0 ? (cols[idx.tablaparent] || '').trim() : ''

    // Ignorar campos que son columnas de tabla (tienen TablaParent y no son Table)
    if (tablaParent && tipo !== '10') return

    const field = { id: newGuid(), nombre, fieldKey, tipo, required, pestaña, length }

    // Si es un Table, agregar sus columnas si existen
    if (tipo === '10' && tableColumnMap[nombre]) {
      field.columnas = tableColumnMap[nombre]
    }

    if (!categoryMap[categoria]) categoryMap[categoria] = {}
    if (!categoryMap[categoria][seccion]) categoryMap[categoria][seccion] = []
    categoryMap[categoria][seccion].push(field)
  })

  if (!Object.keys(categoryMap).length) return { error: 'No se procesó ningún campo válido.' }

  const categories = Object.entries(categoryMap).map(([catName, sections]) => ({
    id: newGuid(),
    name: catName,
    sections: Object.entries(sections).map(([secName, fields]) => {
    // Extract unique pestaña values from fields for this section
    const pestañasSet = new Set(fields.map(f => f.pestaña?.trim()).filter(Boolean))
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
        <div style={{ marginBottom: '8px' }}>Columnas: <strong>Categoría ; Pestaña ; Sección ; Nombre ; Tipo ; Longitud ; Obligatorio ; TablaParent</strong></div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Pestaña, Longitud, Obligatorio y TablaParent son opcionales. Máx texto: 4000 caracteres.
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
          <strong>TablaParent:</strong> indica en qué campo Table va incluida esta fila (para columnas de tabla). Si Tipo=Table, dejar vacío.
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
        placeholder="Categoría;Pestaña;Sección;Nombre;Tipo;Longitud;Obligatorio"
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

function SectionBlock({ section, secIdx, fields, allPestañas, updateField, removeField, updateSecName, removeSection, catSectionsCount, updateFieldPestaña }) {
  return (
    <div className="category-section-block">
      <div className="category-section-row">
        <span className="category-section-tag">Sección</span>
        <input
          value={section.name}
          onChange={e => updateSecName(secIdx, e.target.value)}
          className="category-input-compact"
          style={{ flex: 1 }}
        />
        <span className="category-badge">{section.fields.filter(f => f.nombre).length} campos</span>
        {catSectionsCount > 1 && (
          <button onClick={() => removeSection(secIdx)} className="btn-default btn-sm">✕</button>
        )}
      </div>
      {fields.map(({ field, fieldIdx }) => (
        <FieldRow
          key={field.id}
          field={field}
          onChange={v => updateField(secIdx, fieldIdx, v)}
          onRemove={() => removeField(secIdx, fieldIdx)}
          allPestañas={allPestañas}
          onPestañaChange={newTab => updateFieldPestaña(secIdx, fieldIdx, newTab)}
        />
      ))}
    </div>
  )
}

function FieldRow({ field, onChange, onRemove, allPestañas, onPestañaChange }) {
  const [expanded, setExpanded] = useState(false)
  const autoKey = toCamelKey(field.nombre)
  const isStringField = field.tipo === '1' // TypeNo 1 = String field requires length

  return (
    <>
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
        <div>
          <input
            type="number"
            value={isStringField ? (field.length || '') : ''}
            disabled={!isStringField}
            onChange={e => onChange({ ...field, length: e.target.value })}
            placeholder={isStringField ? '100' : '—'}
            min="1"
            max="4000"
            className="category-input-compact"
            style={{ textAlign: 'right', opacity: isStringField ? 1 : 0.3 }}
          />
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
          <select
            value={field.pestaña || ''}
            onChange={e => {
              const newTab = e.target.value
              onChange({ ...field, pestaña: newTab })
              onPestañaChange && onPestañaChange(newTab)
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
            {allPestañas && allPestañas.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
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
          {field.tipo === '10' && (
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
                    value={col.tipo || '1'}
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
                    {FIELD_TYPES.filter(t => t.value !== '10').map(t => <option key={t.value} value={t.value} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{t.label}</option>)}
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
                  newCols.push({ id: newGuid(), nombre: '', tipo: '1', length: 100 })
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

// Dialog Preview Component - exact graphic representation of Therefore appearance
function DialogPreview({ catName, sections, hasTable, palette }) {
  // Extract unique pestaña names from all fields
  const allPestañas = new Set()
  sections.forEach(sec => {
    sec.fields.forEach(f => {
      const p = f.pestaña?.trim()
      if (p) allPestañas.add(p)
    })
  })
  const pestañaList = Array.from(allPestañas).sort()

  const [activeTab, setActiveTab] = useState(pestañaList.length > 0 ? pestañaList[0] : 'Datos')

  // Update activeTab when pestañaList changes
  useEffect(() => {
    if (pestañaList.length > 0) {
      // If current activeTab is no longer in the list, switch to first
      if (!pestañaList.includes(activeTab)) {
        setActiveTab(pestañaList[0])
      }
    }
  }, [pestañaList, activeTab])

  const pal = palette || COLOR_PALETTES['Therefore Azul']

  // Convert BGR colors to hex for CSS
  const secBgHex = bgrToHex(pal.secBg)
  const secTextHex = bgrToHex(pal.secText)
  const dlgBgHex = bgrToHex(pal.dlgBg)
  const hdrBgHex = bgrToHex(pal.hdrBg)
  const hdrTextHex = bgrToHex(pal.hdrText)
  const hdrSubHex = bgrToHex(pal.hdrSub)
  const hdrMedHex = bgrToHex(pal.hdrMed || pal.hdrSub) // fallback to hdrSub if hdrMed not available
  const fieldBgHex = bgrToHex(pal.fieldBg || bgr(255, 255, 255))
  const fieldTextHex = bgrToHex(pal.fieldText || bgr(0, 0, 0))
  const labelColorHex = bgrToHex(pal.labelColor || bgr(55, 65, 81))
  const labelBgHex = bgrToHex(pal.labelBg || bgr(240, 240, 240))
  const tabBgHex = bgrToHex(pal.tabBg || bgr(192, 192, 192))

  // Use 0.85 scale for better visual fidelity (matching old implementation)
  const SCALE = 0.85
  const DW = 530
  const LX1 = 5, LW = 95, FX1 = 102, FW = 160, LX2 = 270, FX2 = 368, FW2 = 152
  const ROW_Hp = 14, LBL_Hp = 12, ROW_GAPp = 18, SEC_Hp = 13, SEC_GAPp = 16, HDR_Hp = 42, TAB_PAD_Yp = 44

  const TYPE_ICON = { '1': 'abc', '2': '123', '3': '📅', '5': '€', '6': '✓', '7': '🕐', '15': '▾', '10': '📋' }

  // Build visualization rows (including table fields)
  // When hasTable (tabs), only show fields for the active tab
  const rows = []
  let yPos = hasTable ? 8 : HDR_Hp + SEC_GAPp
  sections.filter(s => s.fields.some(f => f.nombre)).forEach((sec) => {
    // Determine which fields to show (regular + table fields)
    let fieldsToShow
    if (hasTable) {
      // Show fields matching the active tab, plus fields with no pestaña (including tables)
      fieldsToShow = sec.fields.filter(f =>
        f.nombre && (!f.pestaña?.trim() || f.pestaña.trim() === activeTab)
      )
    } else {
      // Show all fields (regular and table)
      fieldsToShow = sec.fields.filter(f => f.nombre)
    }

    if (fieldsToShow.length > 0) {
      rows.push({ type: 'sec', y: yPos, label: sec.name })
      yPos += SEC_GAPp
    }

    // Separate table and non-table fields
    const normalFields = fieldsToShow.filter(f => f.tipo !== '10')
    const tableFields = fieldsToShow.filter(f => f.tipo === '10')

    // Render normal fields (2 per row)
    for (let i = 0; i < normalFields.length; i += 2) {
      rows.push({ type: 'row', y: yPos, f1: normalFields[i], f2: normalFields[i + 1] })
      yPos += ROW_GAPp
    }

    // Render table fields (1 per row, with special indicator)
    tableFields.forEach((tbl) => {
      rows.push({ type: 'table', y: yPos, field: tbl })
      yPos += ROW_GAPp
    })

    yPos += 6
  })

  const contentH = yPos + 10
  const dialogH = hasTable ? TAB_PAD_Yp + Math.max(contentH + 20, 260) + 10 : HDR_Hp + contentH + 10

  return (
    <div style={{ overflowX: 'auto', fontFamily: 'Arial, sans-serif' }}>
      {/* Title bar - grey with colored dots */}
      <div style={{
        width: DW * SCALE,
        background: '#e5e7eb',
        border: '1px solid #9ca3af',
        borderBottom: 'none',
        borderRadius: `${4 * SCALE}px ${4 * SCALE}px 0 0`,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: `${3 * SCALE}px ${8 * SCALE}px`,
        fontFamily: 'Arial'
      }}>
        {['#ef4444', '#f59e0b', '#22c55e'].map((c, i) => (
          <span key={i} style={{
            width: 8 * SCALE,
            height: 8 * SCALE,
            borderRadius: '50%',
            background: c,
            display: 'inline-block'
          }} />
        ))}
        <span style={{ marginLeft: 6, fontSize: 8 * SCALE, color: '#6b7280', fontFamily: 'sans-serif' }}>
          {catName || 'Sin nombre'} · Therefore
        </span>
      </div>

      {/* Dialog body */}
      <div style={{
        width: DW * SCALE,
        height: Math.min(dialogH, 520) * SCALE,
        background: dlgBgHex,
        border: '1px solid #9ca3af',
        borderRadius: `0 0 ${4 * SCALE}px ${4 * SCALE}px`,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Arial, sans-serif'
      }}>
        {/* Header - flat (when no table) */}
        {!hasTable && (
          <>
            <div style={{
              position: 'absolute',
              left: 5 * SCALE,
              top: 6 * SCALE,
              width: (DW - 10) * SCALE,
              height: 18 * SCALE,
              background: hdrBgHex,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 5 * SCALE
            }}>
              <span style={{ fontSize: 11 * SCALE, fontWeight: 700, color: hdrTextHex }}>
                {catName || 'Categoría'}
              </span>
            </div>
            <div style={{
              position: 'absolute',
              left: 5 * SCALE,
              top: 26 * SCALE,
              width: (DW - 10) * SCALE,
              height: 12 * SCALE,
              background: hdrBgHex,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 5 * SCALE
            }}>
              <span style={{ fontSize: 7 * SCALE, color: hdrSubHex }}>DATOS</span>
            </div>
          </>
        )}

        {/* Tab control (when table exists) */}
        {hasTable && pestañaList.length > 0 && (
          <div style={{ position: 'absolute', left: 5 * SCALE, top: 4 * SCALE, display: 'flex', gap: 2 }}>
            {pestañaList.map((tabName) => (
              <div
                key={tabName}
                onClick={() => setActiveTab(tabName)}
                style={{
                  padding: `${2 * SCALE}px ${10 * SCALE}px`,
                  fontSize: 8 * SCALE,
                  cursor: 'pointer',
                  borderRadius: `${3 * SCALE}px ${3 * SCALE}px 0 0`,
                  background: activeTab === tabName ? dlgBgHex : tabBgHex,
                  color: activeTab === tabName ? '#1e293b' : '#6b7280',
                  border: '1px solid #9ca3af',
                  borderBottom: activeTab === tabName ? `1px solid ${dlgBgHex}` : '1px solid #9ca3af',
                  fontWeight: activeTab === tabName ? 700 : 400,
                  fontFamily: 'Arial, sans-serif'
                }}
              >
                {tabName}
              </div>
            ))}
          </div>
        )}

        {/* Tab content container */}
        {hasTable && activeTab && (
          <div style={{
            position: 'absolute',
            left: 5 * SCALE,
            top: TAB_PAD_Yp * SCALE,
            width: (DW - 10) * SCALE,
            bottom: 5 * SCALE,
            background: '#f3f4f6',
            border: '1px solid #9ca3af',
            borderRadius: 3 * SCALE,
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
                {rows.map((row, ri) =>
                  row.type === 'sec' ? (
                    <div
                      key={ri}
                      style={{
                        position: 'absolute',
                        left: (LX1 + 5) * SCALE,
                        top: row.y * SCALE,
                        width: (DW - 10 - 20 - 10) * SCALE,
                        height: SEC_Hp * SCALE,
                        background: secBgHex,
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: 6 * SCALE
                      }}
                    >
                      <span style={{ fontSize: 7 * SCALE, fontWeight: 700, color: secTextHex }}>
                        {row.label}
                      </span>
                    </div>
                  ) : row.type === 'table' ? (
                    <div key={ri} style={{
                      position: 'absolute',
                      left: (LX1 + 5) * SCALE,
                      top: row.y * SCALE,
                      width: (DW - 10 - 20 - 10) * SCALE,
                      height: ROW_Hp * SCALE
                    }}>
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 1 * SCALE,
                        width: (LW + 100) * SCALE,
                        height: LBL_Hp * SCALE,
                        fontSize: 7 * SCALE,
                        color: labelColorHex,
                        background: labelBgHex,
                        textAlign: 'right',
                        lineHeight: `${LBL_Hp * SCALE}px`,
                        paddingRight: 3,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis'
                      }}>
                        {row.field.nombre}
                      </div>
                      <div style={{
                        position: 'absolute',
                        left: (LW + 100) * SCALE,
                        top: 0,
                        width: 80 * SCALE,
                        height: ROW_Hp * SCALE,
                        background: '#fef3c7',
                        border: '1px solid #fcd34d',
                        fontSize: 7 * SCALE,
                        color: '#92400e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600
                      }}>
                        📋 Table
                      </div>
                    </div>
                  ) : (
                    <div key={ri}>
                      {row.f1 && (
                        <div style={{
                          position: 'absolute',
                          left: (LX1 + 5) * SCALE,
                          top: row.y * SCALE,
                          width: (LW + FW + 5) * SCALE,
                          height: ROW_Hp * SCALE
                        }}>
                          <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 1 * SCALE,
                            width: LW * SCALE,
                            height: LBL_Hp * SCALE,
                            fontSize: 7 * SCALE,
                            color: labelColorHex,
                            background: labelBgHex,
                            textAlign: 'right',
                            lineHeight: `${LBL_Hp * SCALE}px`,
                            paddingRight: 3,
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis'
                          }}>
                            {row.f1.nombre}
                          </div>
                          <div style={{
                            position: 'absolute',
                            left: (FX1 - LX1 + 5) * SCALE,
                            top: 0,
                            width: FW * SCALE,
                            height: ROW_Hp * SCALE,
                            background: fieldBgHex,
                            border: '1px solid #9ca3af',
                            fontSize: 7 * SCALE,
                            color: fieldTextHex,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            paddingRight: 3
                          }}>
                            {TYPE_ICON[row.f1.tipo] || '?'}
                          </div>
                        </div>
                      )}
                      {row.f2 && (
                        <div style={{
                          position: 'absolute',
                          left: (LX2 + 5) * SCALE,
                          top: row.y * SCALE,
                          width: (LW + FW2 + 5) * SCALE,
                          height: ROW_Hp * SCALE
                        }}>
                          <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 1 * SCALE,
                            width: LW * SCALE,
                            height: LBL_Hp * SCALE,
                            fontSize: 7 * SCALE,
                            color: labelColorHex,
                            background: labelBgHex,
                            textAlign: 'right',
                            lineHeight: `${LBL_Hp * SCALE}px`,
                            paddingRight: 3,
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis'
                          }}>
                            {row.f2.nombre}
                          </div>
                          <div style={{
                            position: 'absolute',
                            left: (FX2 - LX2 + 5) * SCALE,
                            top: 0,
                            width: FW2 * SCALE,
                            height: ROW_Hp * SCALE,
                            background: fieldBgHex,
                            border: '1px solid #9ca3af',
                            fontSize: 7 * SCALE,
                            color: fieldTextHex,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            paddingRight: 3
                          }}>
                            {TYPE_ICON[row.f2.tipo] || '?'}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
          </div>
        )}

        {/* Regular content (when no table) */}
        {!hasTable && rows.map((row, ri) =>
          row.type === 'sec' ? (
            <div
              key={ri}
              style={{
                position: 'absolute',
                left: 5 * SCALE,
                top: row.y * SCALE,
                width: (DW - 10) * SCALE,
                height: SEC_Hp * SCALE,
                background: secBgHex,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 6 * SCALE
              }}
            >
              <span style={{ fontSize: 7 * SCALE, fontWeight: 700, color: secTextHex }}>
                {row.label}
              </span>
            </div>
          ) : row.type === 'table' ? (
            <div key={ri} style={{
              position: 'absolute',
              left: LX1 * SCALE,
              top: row.y * SCALE,
              width: (DW - 10) * SCALE,
              height: ROW_Hp * SCALE
            }}>
              <div style={{
                position: 'absolute',
                left: 0,
                top: 1 * SCALE,
                width: (LW + 100) * SCALE,
                height: LBL_Hp * SCALE,
                fontSize: 7 * SCALE,
                color: labelColorHex,
                background: labelBgHex,
                textAlign: 'right',
                lineHeight: `${LBL_Hp * SCALE}px`,
                paddingRight: 3,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis'
              }}>
                {row.field.nombre}
              </div>
              <div style={{
                position: 'absolute',
                left: (LW + 100) * SCALE,
                top: 0,
                width: 80 * SCALE,
                height: ROW_Hp * SCALE,
                background: '#fef3c7',
                border: '1px solid #fcd34d',
                fontSize: 7 * SCALE,
                color: '#92400e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600
              }}>
                📋 Table
              </div>
            </div>
          ) : (
            <div key={ri}>
              {row.f1 && (
                <div style={{
                  position: 'absolute',
                  left: LX1 * SCALE,
                  top: row.y * SCALE,
                  width: (LW + FW + 5) * SCALE,
                  height: ROW_Hp * SCALE
                }}>
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 1 * SCALE,
                    width: LW * SCALE,
                    height: LBL_Hp * SCALE,
                    fontSize: 7 * SCALE,
                    color: labelColorHex,
                    background: labelBgHex,
                    textAlign: 'right',
                    lineHeight: `${LBL_Hp * SCALE}px`,
                    paddingRight: 3,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis'
                  }}>
                    {row.f1.nombre}
                  </div>
                  <div style={{
                    position: 'absolute',
                    left: (FX1 - LX1) * SCALE,
                    top: 0,
                    width: FW * SCALE,
                    height: ROW_Hp * SCALE,
                    background: fieldBgHex,
                    border: '1px solid #9ca3af',
                    fontSize: 7 * SCALE,
                    color: fieldTextHex,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: 3
                  }}>
                    {TYPE_ICON[row.f1.tipo] || '?'}
                  </div>
                </div>
              )}
              {row.f2 && (
                <div style={{
                  position: 'absolute',
                  left: LX2 * SCALE,
                  top: row.y * SCALE,
                  width: (LW + FW2 + 5) * SCALE,
                  height: ROW_Hp * SCALE
                }}>
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 1 * SCALE,
                    width: LW * SCALE,
                    height: LBL_Hp * SCALE,
                    fontSize: 7 * SCALE,
                    color: labelColorHex,
                    background: labelBgHex,
                    textAlign: 'right',
                    lineHeight: `${LBL_Hp * SCALE}px`,
                    paddingRight: 3,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis'
                  }}>
                    {row.f2.nombre}
                  </div>
                  <div style={{
                    position: 'absolute',
                    left: (FX2 - LX2) * SCALE,
                    top: 0,
                    width: FW2 * SCALE,
                    height: ROW_Hp * SCALE,
                    background: fieldBgHex,
                    border: '1px solid #9ca3af',
                    fontSize: 7 * SCALE,
                    color: fieldTextHex,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: 3
                  }}>
                    {TYPE_ICON[row.f2.tipo] || '?'}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  )
}

// XML Parser - Extract categories structure from generated XML (like parseThereforeXml)
// sourceCategories: original categories array to preserve palette selections
function parseXmlCategories(xmlString, sourceCategories = []) {
  try {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlString, 'application/xml')

    const parseErr = xmlDoc.querySelector('parsererror')
    if (parseErr) {
      logger.error('XML Parse Error:', parseErr.textContent.slice(0, 120))
      return []
    }

    const catNodes = xmlDoc.querySelectorAll('Configuration > Categories > Category')
    if (!catNodes.length) {
      console.warn('No categories found in XML')
      return []
    }

    const VALID_TYPES = new Set(['1', '2', '3', '5', '6', '7', '9', '15'])
    const parsedCategories = []

    catNodes.forEach((catNode, catIdx) => {
      // Extract category name from XML (looking for last T > S element in Name)
      let catName = ''
      const nameS = catNode.querySelectorAll(':scope > Name TStr T S')
      if (nameS.length) {
        catName = nameS[nameS.length - 1].textContent.trim()
      }
      if (!catName) {
        catName = catNode.querySelector(':scope > Name')?.textContent.trim() || 'Sin nombre'
      }

      const fieldNodes = catNode.querySelectorAll(':scope > Fields > Field')
      const sections = []
      let currentSection = null

      fieldNodes.forEach((field) => {
        const typeNo = field.querySelector(':scope > TypeNo')?.textContent.trim() || ''
        const colName = field.querySelector(':scope > ColName')?.textContent.trim() || ''
        const hasTable = !!field.querySelector(':scope > BelongsToTable')
        const hasLinked = !!field.querySelector(':scope > BelongsTo')

        // Section header: TypeNo 4, no ColName, has <BClr> in DisplayProp
        if (typeNo === '4' && !colName) {
          const hasBClr = !!field.querySelector(':scope > DisplayProp > BClr')
          if (hasBClr) {
            const capS = field.querySelectorAll(':scope > Caption TStr T S')
            let secName = capS.length ? capS[capS.length - 1].textContent.trim().toUpperCase() : ''
            if (!secName) {
              secName = field.querySelector(':scope > Caption')?.textContent.trim().toUpperCase() || 'SECCIÓN'
            }
            currentSection = { name: secName, fields: [] }
            sections.push(currentSection)
          }
          return
        }

        // Skip layout, table columns, linked display fields
        if (typeNo === '4' || hasTable || hasLinked) return

        // Skip unsupported / negative TypeNos
        if (!VALID_TYPES.has(typeNo)) return

        // Data field must have ColName
        if (!colName) return

        // Caption: last <T><S> inside <Caption>
        let caption = ''
        const capS = field.querySelectorAll(':scope > Caption TStr T S')
        if (capS.length) caption = capS[capS.length - 1].textContent.trim()
        if (!caption) caption = field.querySelector(':scope > Caption')?.textContent.trim() || colName

        if (!currentSection) {
          currentSection = { name: 'DATOS IMPORTADOS', fields: [] }
          sections.push(currentSection)
        }

        const mappedType = typeNo === '9' ? '1' : typeNo
        currentSection.fields.push({
          nombre: caption,
          tipo: mappedType,
          fieldKey: colName.toLowerCase()
        })
      })

      // Filter out empty sections
      const validSections = sections.filter(s => s.fields.length > 0)
      if (!validSections.length) {
        console.warn(`Category "${catName}" has no data fields`)
        return
      }

      // Preserve palette from original category at same index
      const sourcePalette = sourceCategories[catIdx]?.palette || 'Therefore Azul'

      parsedCategories.push({
        name: catName,
        sections: validSections,
        palette: sourcePalette
      })
    })

    return parsedCategories
  } catch (err) {
    logger.error('Error parsing XML:', err)
    return []
  }
}

// Enhanced Grid Preview - Visual card-based representation of categories
function CategoryGridPreview({ categories, onClose }) {
  const [expandedTab, setExpandedTab] = useState({})

  const toggleTab = (catIdx, tabNo) => {
    const key = `${catIdx}-${tabNo}`
    setExpandedTab(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const TYPE_ICONS = {
    '1': { icon: '📝', label: 'Texto' },
    '2': { icon: '🔢', label: 'Número' },
    '3': { icon: '📅', label: 'Fecha' },
    '5': { icon: '💰', label: 'Dinero' },
    '6': { icon: '✅', label: 'Sí/No' },
    '7': { icon: '🕐', label: 'Fecha-Hora' },
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '12px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        padding: '30px'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '15px'
        }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '24px', fontWeight: 700 }}>
            📊 Vista Previa de Categorías
          </h2>
          <button
            onClick={onClose}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            ✕ Cerrar
          </button>
        </div>

        {/* Categories Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: '20px'
        }}>
          {categories.map((cat, catIdx) => {
            const pal = COLOR_PALETTES[cat.palette || 'Therefore Azul']
            const dlgBgHex = bgrToHex(pal.dlgBg)
            const hdrBgHex = bgrToHex(pal.hdrBg)
            const hdrTextHex = bgrToHex(pal.hdrText)
            const secBgHex = bgrToHex(pal.secBg)
            const secTextHex = bgrToHex(pal.secText)
            const labelColorHex = bgrToHex(pal.labelColor || bgr(55, 65, 81))
            const tabBgHex = bgrToHex(pal.tabBg || bgr(192, 192, 192))

            // Get all pestañas for this category
            const allPestañas = new Set()
            cat.sections.forEach(sec => {
              sec.fields.forEach(f => {
                if (f.pestaña?.trim()) allPestañas.add(f.pestaña.trim())
              })
            })
            const pestañaList = Array.from(allPestañas).sort()

            return (
              <div
                key={catIdx}
                style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: '#f9fafb',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {/* Category Header */}
                <div style={{
                  background: hdrBgHex,
                  color: hdrTextHex,
                  padding: '16px 20px',
                  fontWeight: 700,
                  fontSize: '16px',
                  borderBottom: '3px solid #e5e7eb'
                }}>
                  📁 {cat.name || 'Sin nombre'}
                </div>

                {/* Tabs (if exist) */}
                {pestañaList.length > 0 && (
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    padding: '12px 16px',
                    borderBottom: '1px solid #d1d5db',
                    background: '#f3f4f6',
                    flexWrap: 'wrap'
                  }}>
                    {pestañaList.map((pestaña, idx) => (
                      <button
                        key={idx}
                        onClick={() => toggleTab(catIdx, idx)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px 6px 0 0',
                          border: 'none',
                          background: expandedTab[`${catIdx}-${idx}`] ? dlgBgHex : tabBgHex,
                          color: expandedTab[`${catIdx}-${idx}`] ? '#1f2937' : '#6b7280',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: expandedTab[`${catIdx}-${idx}`] ? 600 : 500,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {pestaña}
                      </button>
                    ))}
                  </div>
                )}

                {/* Content */}
                <div style={{ padding: '16px' }}>
                  {pestañaList.length === 0 ? (
                    // No tabs - show all sections
                    cat.sections.map((sec, secIdx) => (
                      <SectionCard
                        key={secIdx}
                        section={sec}
                        hdrBgHex={hdrBgHex}
                        secBgHex={secBgHex}
                        secTextHex={secTextHex}
                        labelColorHex={labelColorHex}
                        TYPE_ICONS={TYPE_ICONS}
                      />
                    ))
                  ) : (
                    // Show sections for each expanded tab
                    pestañaList.map((pestaña, tabIdx) => {
                      const isExpanded = expandedTab[`${catIdx}-${tabIdx}`]
                      const sectionsInTab = cat.sections
                        .map(sec => ({
                          ...sec,
                          fieldsInTab: sec.fields.filter(f => f.pestaña?.trim() === pestaña && f.nombre.trim())
                        }))
                        .filter(sec => sec.fieldsInTab.length > 0)

                      return (
                        <div key={tabIdx} style={{ marginBottom: isExpanded ? '16px' : '0' }}>
                          {isExpanded && sectionsInTab.map((sec, secIdx) => (
                            <SectionCard
                              key={secIdx}
                              section={{ ...sec, fields: sec.fieldsInTab }}
                              hdrBgHex={hdrBgHex}
                              secBgHex={secBgHex}
                              secTextHex={secTextHex}
                              labelColorHex={labelColorHex}
                              TYPE_ICONS={TYPE_ICONS}
                            />
                          ))}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '2px solid #e5e7eb',
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '13px'
        }}>
          ✨ Esta es una representación visual de cómo se verán las categorías en Therefore
        </div>
      </div>
    </div>
  )
}

// Section Card Component
function SectionCard({ section, hdrBgHex, secBgHex, secTextHex, labelColorHex, TYPE_ICONS }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Section Header */}
      <div style={{
        background: secBgHex,
        color: secTextHex,
        padding: '8px 12px',
        fontSize: '12px',
        fontWeight: 700,
        marginBottom: '8px',
        borderRadius: '4px'
      }}>
        {section.name}
      </div>

      {/* Fields Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '8px'
      }}>
        {section.fields
          .filter(f => f.nombre?.trim())
          .map((field, idx) => {
            const typeInfo = TYPE_ICONS[field.tipo] || { icon: '❓', label: 'Otro' }
            return (
              <div
                key={idx}
                style={{
                  border: '1px solid var(--border-default)',
                  borderRadius: '6px',
                  padding: '10px',
                  background: 'var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px'
                }}
              >
                <span style={{ fontSize: '18px' }}>{typeInfo.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {field.nombre}
                  </div>
                  <div style={{
                    color: 'var(--text-secondary)',
                    fontSize: '11px'
                  }}>
                    {typeInfo.label}
                  </div>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

// Separate component for field table to avoid re-creation on every render
function FieldTableComponent({ fields, expandedRows, setExpandedRows, updateField, removeField, addField, secIdx }) {
  const columns = [
    {
      title: 'Nombre',
      key: 'nombre',
      width: '25%',
      render: (_, record) => (
        <input
          value={record.field.nombre}
          onChange={e => updateField(record.secIdx, record.fieldIdx, { ...record.field, nombre: e.target.value })}
          className="form-input"
          style={{ fontSize: '12px', padding: '4px' }}
        />
      )
    },
    {
      title: 'Tipo',
      key: 'tipo',
      width: '20%',
      render: (_, record) => (
        <select
          value={record.field.tipo}
          onChange={e => updateField(record.secIdx, record.fieldIdx, { ...record.field, tipo: e.target.value })}
          className="form-input"
          style={{ fontSize: '12px', padding: '4px' }}
        >
          <option value="1">📝 String</option>
          <option value="2">🔢 Int</option>
          <option value="3">📅 Date</option>
          <option value="5">💰 Decimal</option>
          <option value="6">✅ Logical</option>
          <option value="7">📌 Keyword</option>
          <option value="10">📋 Table</option>
        </select>
      )
    },
    {
      title: 'Longitud',
      key: 'length',
      width: '12%',
      render: (_, record) => {
        const isFixedType = ['2', '3', '5', '6', '7'].includes(record.field.tipo)
        return (
          <input
            type="number"
            value={record.field.length || ''}
            onChange={e => updateField(record.secIdx, record.fieldIdx, { ...record.field, length: e.target.value ? parseInt(e.target.value) : null })}
            className="form-input"
            style={{ fontSize: '12px', padding: '4px' }}
            disabled={isFixedType}
            placeholder={isFixedType ? '-' : ''}
          />
        )
      }
    },
    {
      title: 'Req',
      key: 'required',
      width: '8%',
      render: (_, record) => (
        <input
          type="checkbox"
          checked={record.field.required}
          onChange={e => updateField(record.secIdx, record.fieldIdx, { ...record.field, required: e.target.checked })}
          style={{ width: '16px', height: '16px' }}
        />
      )
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: '10%',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          {record.field.tipo === '10' && (
            <button
              onClick={() => setExpandedRows(prev => ({ ...prev, [record.rowKey]: !prev[record.rowKey] }))}
              style={{
                fontSize: '12px',
                padding: '2px 6px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--accent-primary)'
              }}
            >
              {expandedRows[record.rowKey] ? '▲' : '▼'}
            </button>
          )}
          <button
            onClick={() => removeField(record.secIdx, record.fieldIdx)}
            className="btn-icon"
            style={{
              fontSize: '14px',
              padding: '2px 4px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
          >
            🗑
          </button>
        </div>
      )
    }
  ]

  return (
    <>
      <Table
        columns={columns}
        dataSource={fields.map((f) => {
          const rowKey = `${f.secIdx}-${f.fieldIdx}`
          return { ...f, key: rowKey, rowKey }
        })}
        pagination={false}
        size="small"
        style={{ marginBottom: '12px' }}
        onRow={(record) => ({
          style: { background: expandedRows[record.rowKey] ? 'var(--bg-hover)' : 'transparent' }
        })}
      />
      {/* Render Table field columns */}
      {fields.map((record) => {
        const rowKey = `${record.secIdx}-${record.fieldIdx}`
        if (record.field.tipo !== '10' || !expandedRows[rowKey]) return null
        return (
          <div key={`expanded-${record.key}`} style={{ marginBottom: '12px', padding: '12px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-default)' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--accent-primary)', marginBottom: '8px', textTransform: 'uppercase' }}>
              📋 Columnas de {record.field.nombre}
            </div>
            {!record.field.columnas && (updateField(record.secIdx, record.fieldIdx, { ...record.field, columnas: [] }))}
            {(record.field.columnas || []).map((col, colIdx) => (
              <div key={col.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                <input
                  value={col.nombre}
                  onChange={e => {
                    const newCols = [...(record.field.columnas || [])]
                    newCols[colIdx].nombre = e.target.value
                    updateField(record.secIdx, record.fieldIdx, { ...record.field, columnas: newCols })
                  }}
                  placeholder="Nombre columna"
                  style={{
                    width: '100%',
                    padding: '4px 6px',
                    border: '1px solid var(--border-default)',
                    borderRadius: '3px',
                    fontSize: '11px',
                    backgroundColor: 'var(--bg-canvas)',
                    color: 'var(--text-primary)',
                    fontFamily: 'monospace'
                  }}
                />
                <select
                  value={col.tipo || '1'}
                  onChange={e => {
                    const newCols = [...(record.field.columnas || [])]
                    newCols[colIdx].tipo = e.target.value
                    updateField(record.secIdx, record.fieldIdx, { ...record.field, columnas: newCols })
                  }}
                  style={{
                    width: '100%',
                    padding: '4px 6px',
                    border: '1px solid var(--border-default)',
                    borderRadius: '3px',
                    fontSize: '11px',
                    backgroundColor: 'var(--bg-canvas)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="1">String</option>
                  <option value="2">Int</option>
                  <option value="3">Date</option>
                  <option value="5">Decimal</option>
                  <option value="6">Logical</option>
                </select>
                <input
                  type="number"
                  value={col.length || ''}
                  onChange={e => {
                    const newCols = [...(record.field.columnas || [])]
                    newCols[colIdx].length = e.target.value ? parseInt(e.target.value) : ''
                    updateField(record.secIdx, record.fieldIdx, { ...record.field, columnas: newCols })
                  }}
                  placeholder="Longitud"
                  style={{
                    width: '100%',
                    padding: '4px 6px',
                    border: '1px solid var(--border-default)',
                    borderRadius: '3px',
                    fontSize: '11px',
                    backgroundColor: 'var(--bg-canvas)',
                    color: 'var(--text-primary)'
                  }}
                />
                <button
                  onClick={() => {
                    const newCols = (record.field.columnas || []).filter((_, idx) => idx !== colIdx)
                    updateField(record.secIdx, record.fieldIdx, { ...record.field, columnas: newCols })
                  }}
                  style={{
                    padding: '2px 4px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    fontSize: '12px'
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const newCols = [...(record.field.columnas || []), { id: newGuid(), nombre: '', tipo: '1', length: '' }]
                updateField(record.secIdx, record.fieldIdx, { ...record.field, columnas: newCols })
              }}
              style={{
                marginTop: '8px',
                fontSize: '11px',
                padding: '4px 8px',
                background: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              + Columna
            </button>
          </div>
        )
      })}
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button
          onClick={() => addField(secIdx, '1')}
          style={{
            fontSize: '12px',
            padding: '6px 12px',
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          + Campo Normal
        </button>
        <button
          onClick={() => addField(secIdx, '10')}
          style={{
            fontSize: '12px',
            padding: '6px 12px',
            background: 'var(--accent-success)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          + Campo Tabla
        </button>
      </div>
    </>
  )
}

export default function CategoryBuilder() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([
    {
      id: newGuid(),
      name: 'CATEGORÍA 1',
      palette: 'Therefore Azul',
    sections: [{ id: newGuid(), name: 'GENERAL', fields: [{ id: newGuid(), nombre: '', fieldKey: '', tipo: '1', required: false, pestaña: '', length: 100 }], pestañas: [] }]
    }
  ])
  const [activeCategory, setActiveCategory] = useState(0)
  const [xml, setXml] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [activeView, setActiveView] = useState('editor')
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [managerOpen, setManagerOpen] = useState(false)
  const [xmlModalOpen, setXmlModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [previewCategories, setPreviewCategories] = useState([])
  const [expandedRows, setExpandedRows] = useState({})

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
      logger.error('Error:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const currentCategory = categories[activeCategory]

  const saveTemplate = async () => {
    if (!currentCategory.name.trim()) {
      message.error(MESSAGES.CATEGORY.NAME_REQUIRED)
      return
    }

    try {
      const categoryJson = JSON.stringify(currentCategory)
      if (selectedTemplate?.id) {
        const { error } = await supabase
          .from('category_templates')
          .update({
            name: currentCategory.name,
            description: `${categories.length} categoría(s)`,
            xml_definition: categoryJson,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTemplate.id)

        if (error) throw error
        message.success(MESSAGES.SUCCESS.UPDATE('Categoría'))
      } else {
        const { error } = await supabase
          .from('category_templates')
          .insert({
            template_id: `cat_${Date.now()}`,
            name: currentCategory.name,
            description: `${categories.length} categoría(s)`,
            xml_definition: categoryJson,
            created_by: user.id,
            compartido: false
          })

        if (error) throw error
        message.success(MESSAGES.SUCCESS.SAVE('Categoría'))
      }

      setSelectedTemplate(null)
      setXml('')
      await loadTemplates()
    } catch (error) {
      handleError(error, 'guardar la categoría')
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
    setCategories([...categories, { id: newGuid(), name: `CATEGORÍA ${categories.length + 1}`, palette: 'Therefore Azul', sections: [{ id: newGuid(), name: 'GENERAL', fields: [] }] }])
  }

  const updateCategoryName = (idx, name) => {
    const updated = [...categories]
    updated[idx].name = name
    setCategories(updated)
  }

  const removeCategory = (idx) => {
    if (categories.length > 1) {
      Modal.confirm({
        title: 'Eliminar Categoría',
        content: `¿Está seguro que desea eliminar la categoría "${categories[idx].name}"? Esta acción no se puede deshacer.`,
        okText: 'Eliminar',
        okType: 'danger',
        cancelText: 'Cancelar',
        onOk() {
          const updated = categories.filter((_, i) => i !== idx)
          setCategories(updated)
          if (activeCategory >= updated.length) setActiveCategory(updated.length - 1)
        }
      })
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

  const addField = (secIdx, tipo = '1') => {
    const updated = [...categories]
    const newField = {
      id: newGuid(),
      nombre: tipo === '10' ? 'Nueva_Tabla' : 'Nuevo_Campo',
      fieldKey: tipo === '10' ? 'Nueva_Tabla' : 'Nuevo_Campo',
      tipo,
      required: false,
      pestaña: '',
      length: tipo === '1' ? 100 : ''
    }
    if (tipo === '10') newField.columnas = []
    updated[activeCategory].sections[secIdx].fields.push(newField)
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
  // StringField(1), IntField(2), DateField(3), MoneyField(5), LogicalField(6), CustomField(99)
  const typeToTypeNo = {
    'text': '1',       // StringField (default fallback)
    'string': '1',     // StringField
    'int': '2',        // IntField
    'date': '3',       // DateField
    'decimal': '5',    // MoneyField
    'boolean': '6',    // LogicalField
    'datetime': '99'   // CustomField (timestamp)
  }

  // Field length defaults by type
  const defaultFieldLength = {
    'string': 100,     // StringField: 1-4000 chars
    'int': 18,         // IntField: display width
    'date': 10,        // DateField: YYYY-MM-DD
    'decimal': 18,     // MoneyField: display width
    'boolean': 1,      // LogicalField: 1 byte
    'datetime': 19     // CustomField/timestamp
  }

  // Validate and normalize field length per Therefore type
  const normalizeFieldLength = (fieldType, providedLength, typeNo) => {
    const typeNoStr = String(typeNo)

    // Only StringField (TypeNo 1) accepts variable length (1-4000)
    if (typeNoStr === '1') {
    const length = parseInt(providedLength) || defaultFieldLength[fieldType] || 100
    return Math.min(Math.max(length, 1), 4000)
    }

    // Other types use system-defined fixed lengths
    // IntField(2), DateField(3), MoneyField(5), LogicalField(6), CustomField(99) - no Length tag
    return 0
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

  // Get default length for field type
  const getDefaultLength = (typeNo) => {
    const lengths = {
      '1': 100,   // StringField
      '2': 18,    // IntField
      '3': 10,    // DateField (YYYY-MM-DD)
      '5': 18,    // MoneyField
      '6': 1,     // LogicalField
      '7': 19,    // DateTimeField
      '10': 0,    // TableField (no length)
      '13': 0     // TabControl (no length)
    }
    return lengths[String(typeNo)] || 100
  }

  const makeDataField = ({ fieldno, colname, fieldid, caption, typeno, length, width, height, posx, posy, taborder, disporder, displayprop = '', tabMeta = '' }) => {
    const effectiveLength = length || getDefaultLength(typeno)
    const lengthTag = typeno === '5' ? '<Length>18</Length>'
      : (typeno !== '3' && typeno !== '6' && typeno !== '7' && typeno !== '15' && effectiveLength)
      ? `<Length>${effectiveLength}</Length>` : ''
    const dp = displayprop || `<BClr>${bgr(255, 255, 255)}</BClr>`
    return `<Field><FieldNo>${fieldno}</FieldNo><ColName>${colname}</ColName>${xmlCaption(caption)}<TypeNo>${typeno}</TypeNo>${lengthTag}<Width>${width}</Width><Height>${height}</Height><PosX>${posx}</PosX><PosY>${posy}</PosY><TabOrderPos>${taborder}</TabOrderPos><DontLoadValues>1</DontLoadValues><DispOrderPos>${disporder}</DispOrderPos>${xmlRegEx()}<Links></Links><Id>${newGuid()}</Id><DisplayProp>${dp}</DisplayProp><TabInfo FactoryType="0"></TabInfo><FieldID>${fieldid}</FieldID><DisplayPropCond></DisplayPropCond><Filter></Filter>${tabMeta}</Field>`
  }

  const makeLabelField = ({ fieldno, fieldid, caption, width, height, posx, posy, face = 'Arial', fsize = 9, bold = false, tclr = null, bclr = null, al = null, pd = null, tabMeta = '' }) => {
    let dp = `<Face>${face}</Face><FSize>${fsize}</FSize>`
    if (bold) dp += '<Bol>1</Bol>'
    if (tclr !== null) dp += `<TClr>${tclr}</TClr>`
    if (bclr !== null) dp += `<BClr>${bclr}</BClr>`
    if (al !== null) dp += `<Al>${al}</Al>`
    if (pd !== null) dp += `<Pd>${pd}</Pd>`
    return `<Field><FieldNo>${fieldno}</FieldNo>${xmlCaption(caption)}<TypeNo>4</TypeNo><Width>${width}</Width><Height>${height}</Height><PosX>${posx}</PosX><PosY>${posy}</PosY><DontLoadValues>1</DontLoadValues>${xmlRegEx()}<Links></Links><Id>${newGuid()}</Id><DisplayProp>${dp}</DisplayProp><TabInfo FactoryType="0"></TabInfo><FieldID>${fieldid}</FieldID><DisplayPropCond></DisplayPropCond><Filter></Filter><FullTextSearch>0</FullTextSearch>${tabMeta}</Field>`
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
    // Per Therefore rules: TypeNo 1,2,3,5,6,7,9 get Length tag; 4,10,12,13 do not
    let lengthTag = ''
    if (hasLengthTag(typeno) && length) {
      lengthTag = `<Length>${length}</Length>`
    }
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

  // Layout constants (Therefore standard positioning)
  const DIALOG_W  = 530
  const LBL_X1    = 5,  LBL_W  = 95
  const FLD_X1    = 102, FLD_W  = 160
  const LBL_X2    = 270
  const FLD_X2    = 368, FLD_W2 = 152
  const ROW_H     = 14,  LBL_H  = 12
  const ROW_GAP   = 18,  SEC_H  = 13, SEC_GAP = 16, HDR_H = 42
  const TAB_NO    = -200, TABLE_NO = -201
  const TAB_PAD_X = 5,   TAB_PAD_Y = 44, TAB_MARGIN = 10

  // Layout inside tab control (relative coordinates, 20px margins)
  const TAB_INNER = 20
  const TAB_LBL_X1 = TAB_INNER                    // 20
  const TAB_FLD_X1 = TAB_INNER + LBL_W + 7        // 122
  const TAB_LBL_X2 = TAB_FLD_X1 + FLD_W + 8       // 290
  const TAB_FLD_X2 = TAB_LBL_X2 + LBL_W + 7       // 392
  const TAB_INNER_W = DIALOG_W - TAB_MARGIN * 2    // 510
  const TAB_FLD_W2 = TAB_INNER_W - TAB_INNER - TAB_FLD_X2  // 98
  const TAB_SEC_W = TAB_INNER_W - TAB_INNER * 2   // 470

  const hasLengthTag = (typeno) => {
    // Per Therefore: TypeNo 1,2,3,5,6,7,9 get Length tag; others don't
    return ['1', '2', '3', '5', '6', '7', '9'].includes(String(typeno))
  }

  // Helper: Generate XML for a single category
  const generateCategoryXml = (cat, catIndex, offsets = {}) => {
    try {
      // Map any type value to valid Therefore TypeNo
      const normalizeFieldType = (fieldType) => {
        const typeMap = {
          '1': '1', '2': '2', '3': '3', '5': '5', '6': '6', '7': '7', '10': '10', '13': '13',
          'text': '1', 'string': '1', 'int': '2', 'integer': '2', 'date': '3', 'money': '5',
          'decimal': '5', 'boolean': '6', 'bool': '6', 'datetime': '7', 'timestamp': '7',
          'table': '10', 'tab': '13'
        }
        return typeMap[String(fieldType || '').toLowerCase().trim()] || '1'
      }

      const nombre = cat.name.trim()
      const ctgry_id = sanitizeName(cat.name)
      const tableName = sanitizeName(nombre)

      if (!nombre) {
        throw new Error('La categoría debe tener un nombre.')
      }

      // Preparar secciones con campos válidos
      const sections = cat.sections
          .filter(sec => sec.fields.some(f => f.nombre.trim()))
          .map(sec => ({
            name: sec.name,
            fields: sec.fields.filter(f => f.nombre.trim())
          }))

        if (sections.length === 0) {
          throw new Error('Añade al menos un campo.')
        }

      // Get palette
      const pal = COLOR_PALETTES[cat.palette || 'Therefore Azul']

      // ── BUILD CATEGORY XML ──────────────────────────────────────────
      const TAB_NO = offsets.tabNo ?? -200
      const TABLE_NO = (offsets.tabNo ?? -200) - 1
      let colNo = (offsets.tabNo ?? -200) - 2
      let fieldNo = offsets.fieldNoStart ?? -1
      let labelNo = offsets.labelNoStart ?? -50
      let fieldsXml = '', dispOrder = 1, tabOrder = 1

      // Detect pestaña values (for tab organization)
      const allPestañas = new Set()
      const pestañaToTabNo = {}
      sections.forEach(sec => {
          sec.fields.forEach(field => {
            const p = field.pestaña?.trim()
            if (p) allPestañas.add(p)
          })
        })
      const sortedPestañas = Array.from(allPestañas).sort()
      sortedPestañas.forEach((p, idx) => {
          pestañaToTabNo[p] = idx + 1
        })

      const hasPestañas = sortedPestañas.length > 0
      const getTabMeta = (fieldPestaña) => {
          if (!hasPestañas) return ''
          const p = fieldPestaña?.trim()
          if (!p || !pestañaToTabNo[p]) return ''
          return `<BelongsToTable>${TAB_NO}</BelongsToTable><ParentFieldType>3</ParentFieldType><ShowInTabNo>${pestañaToTabNo[p]}</ShowInTabNo>`
        }

      // Table column fields (if any table exists)
      // Map: tableName → { fieldNo, columns }
      let tableColFields = ''
      let hasTable = false
      const tableMap = {} // Track table field numbers for proper column BelongsToTable
      const allTableCols = []

      sections.forEach(sec => {
          sec.fields.forEach(field => {
            if (field.tipo === '10') {
              hasTable = true
              const tableFieldNo = fieldNo--
              const tableName_key = sanitizeName(field.nombre)
              tableMap[tableName_key] = { fieldNo: tableFieldNo, columns: field.columnas || [] }

              // Generate column fields if they exist
              if (field.columnas && field.columnas.length > 0) {
                field.columnas.forEach(col => {
                  if (!col.nombre.trim()) return
                  const normalizedType = normalizeFieldType(col.tipo)
                  const lt = normalizedType === '5' ? '<Length>18</Length>' : (normalizedType !== '3' && normalizedType !== '6' && normalizedType !== '7') ? `<Length>${col.length || 50}</Length>` : ''
                  const colname = sanitizeName(col.nombre)
                  // CRITICAL FIX: BelongsToTable points to the real Table field, not TAB_NO
                  tableColFields += `<Field><FieldNo>${colNo}</FieldNo><ColName>${colname}</ColName>${xmlCaption(col.nombre)}<TypeNo>${normalizedType}</TypeNo>${lt}<Width>${col.width || 150}</Width><Height>0</Height><PosX>0</PosX><PosY>0</PosY><DontLoadValues>1</DontLoadValues><DispOrderPos>${allTableCols.length + 1}</DispOrderPos>${xmlRegEx()}<Links></Links><BelongsToTable>${tableFieldNo}</BelongsToTable><Id>${newGuid()}</Id><DisplayProp></DisplayProp><ParentFieldType>2</ParentFieldType><TabInfo FactoryType="0"></TabInfo><FieldID>${colname}</FieldID><DisplayPropCond></DisplayPropCond><Filter></Filter></Field>`
                  colNo--
                  allTableCols.push(col)
                })
              }
            }
          })
        })

      // Data fields - organize by pestaña for proper section visibility
      let yPos = (hasTable || hasPestañas) ? 8 : HDR_H + SEC_GAP
      const sectionWidth = (hasTable || hasPestañas) ? DIALOG_W - TAB_MARGIN * 2 - 20 : DIALOG_W - 10

      if (hasPestañas) {
          // If we have pestaña, generate sections per tab
          sortedPestañas.forEach((pestaña) => {
            let tabYPos = yPos

            sections.forEach((sec, si) => {
              // Get only fields for this pestaña in this section
              const fieldsInTab = sec.fields.filter(f => f.pestaña?.trim() === pestaña)
              if (fieldsInTab.length === 0) return

              // Section header only for this pestaña
              fieldsXml += makeLabelField({ fieldno: labelNo--, fieldid: `Sec_${si}_${tableName}_${pestaña}`, caption: sec.name, width: sectionWidth, height: SEC_H, posx: 5, posy: tabYPos, bold: true, tclr: pal.secText, bclr: pal.secBg, al: 4, pd: 6, tabMeta: getTabMeta(pestaña) })
              tabYPos += SEC_GAP

              for (let i = 0; i < fieldsInTab.length; i += 2) {
                const f1 = fieldsInTab[i]
                const f2 = fieldsInTab[i + 1]

                if (f1) {
                  const colname1 = sanitizeName(f1.fieldKey || f1.nombre)
                  const normalizedType1 = normalizeFieldType(f1.tipo)

                  if (normalizedType1 === '10') {
                    // CRITICAL FIX: Generate actual Table field (TypeNo 10)
                    // For table lookup, use NOME (not fieldKey) to match tableMap key
                    const tableFieldKey = sanitizeName(f1.nombre)
                    const tableFieldNo = tableMap[tableFieldKey]?.fieldNo
                    fieldsXml += `<Field><FieldNo>${tableFieldNo}</FieldNo>${xmlCaption(f1.nombre)}<TypeNo>10</TypeNo><Width>580</Width><Height>92</Height><PosX>20</PosX><PosY>${tabYPos}</PosY><TabOrderPos>${tabOrder++}</TabOrderPos><DontLoadValues>1</DontLoadValues><DispOrderPos>${dispOrder++}</DispOrderPos>${xmlRegEx()}<Links></Links><ForeignTable>TheIxTable_${toCamel(f1.nombre)}_Hist</ForeignTable><Id>${newGuid()}</Id><DisplayProp></DisplayProp><TabInfo FactoryType="0"></TabInfo><FieldID>${colname1}</FieldID><DisplayPropCond></DisplayPropCond><Filter></Filter><BelongsToTable>${TAB_NO}</BelongsToTable><ParentFieldType>3</ParentFieldType><ShowInTabNo>${pestañaToTabNo[pestaña]}</ShowInTabNo></Field>`
                    tabYPos += 100
                  } else {
                    fieldsXml += makeLabelField({ fieldno: labelNo--, fieldid: `Lbl_${colname1}`, caption: f1.nombre, width: LBL_W, height: LBL_H, posx: LBL_X1 + 5, posy: tabYPos + 1, fsize: 8, al: 4, tclr: pal.labelColor, tabMeta: getTabMeta(pestaña) })
                    fieldsXml += makeDataField({ fieldno: fieldNo--, colname: colname1, fieldid: colname1, caption: f1.nombre, typeno: normalizedType1, length: f1.length, width: FLD_W, height: ROW_H, posx: FLD_X1 + 5, posy: tabYPos, taborder: tabOrder++, disporder: dispOrder++, displayprop: `<TClr>${pal.fieldText}</TClr><BClr>${pal.fieldBg}</BClr>`, tabMeta: getTabMeta(pestaña) })
                    tabYPos += ROW_GAP
                  }
                }
                if (f2) {
                  const colname2 = sanitizeName(f2.fieldKey || f2.nombre)
                  const normalizedType2 = normalizeFieldType(f2.tipo)

                  if (normalizedType2 === '10') {
                    // CRITICAL FIX: Generate actual Table field (TypeNo 10)
                    // For table lookup, use NOME (not fieldKey) to match tableMap key
                    const tableFieldKey = sanitizeName(f2.nombre)
                    const tableFieldNo = tableMap[tableFieldKey]?.fieldNo
                    fieldsXml += `<Field><FieldNo>${tableFieldNo}</FieldNo>${xmlCaption(f2.nombre)}<TypeNo>10</TypeNo><Width>580</Width><Height>92</Height><PosX>20</PosX><PosY>${tabYPos}</PosY><TabOrderPos>${tabOrder++}</TabOrderPos><DontLoadValues>1</DontLoadValues><DispOrderPos>${dispOrder++}</DispOrderPos>${xmlRegEx()}<Links></Links><ForeignTable>TheIxTable_${toCamel(f2.nombre)}_Hist</ForeignTable><Id>${newGuid()}</Id><DisplayProp></DisplayProp><TabInfo FactoryType="0"></TabInfo><FieldID>${colname2}</FieldID><DisplayPropCond></DisplayPropCond><Filter></Filter><BelongsToTable>${TAB_NO}</BelongsToTable><ParentFieldType>3</ParentFieldType><ShowInTabNo>${pestañaToTabNo[pestaña]}</ShowInTabNo></Field>`
                    tabYPos += 100
                  } else {
                    fieldsXml += makeLabelField({ fieldno: labelNo--, fieldid: `Lbl_${colname2}`, caption: f2.nombre, width: LBL_W, height: LBL_H, posx: LBL_X2 + 5, posy: tabYPos + 1, fsize: 8, al: 4, tclr: pal.labelColor, tabMeta: getTabMeta(pestaña) })
                    fieldsXml += makeDataField({ fieldno: fieldNo--, colname: colname2, fieldid: colname2, caption: f2.nombre, typeno: normalizedType2, length: f2.length, width: FLD_W2, height: ROW_H, posx: FLD_X2 + 5, posy: tabYPos, taborder: tabOrder++, disporder: dispOrder++, displayprop: `<TClr>${pal.fieldText}</TClr><BClr>${pal.fieldBg}</BClr>`, tabMeta: getTabMeta(pestaña) })
                    tabYPos += ROW_GAP
                  }
                }
              }
              tabYPos += 6
            })
          })

          // CRITICAL FIX: Generate fields WITHOUT pestaña (Sin Pestaña) - they should NOT have ShowInTabNo
          let baseYPos = yPos
          sections.forEach((sec, si) => {
            const baseFields = sec.fields.filter(f => !f.pestaña?.trim() && f.nombre.trim() && normalizeFieldType(f.tipo) !== '10')
            if (baseFields.length === 0) return

            fieldsXml += makeLabelField({ fieldno: labelNo--, fieldid: `Sec_${si}_${tableName}_base`, caption: sec.name, width: sectionWidth, height: SEC_H, posx: 5, posy: baseYPos, bold: true, tclr: pal.secText, bclr: pal.secBg, al: 4, pd: 6, tabMeta: '' })
            baseYPos += SEC_GAP

            for (let i = 0; i < baseFields.length; i += 2) {
              const f1 = baseFields[i]
              const f2 = baseFields[i + 1]

              if (f1) {
                const colname1 = sanitizeName(f1.fieldKey || f1.nombre)
                const normalizedType1 = normalizeFieldType(f1.tipo)

                if (normalizedType1 === '10') {
                  // Generate Table field with no tab assignment
                  // For table lookup, use NOME (not fieldKey) to match tableMap key
                  const tableFieldKey = sanitizeName(f1.nombre)
                  const tableFieldNo = tableMap[tableFieldKey]?.fieldNo
                  fieldsXml += `<Field><FieldNo>${tableFieldNo}</FieldNo>${xmlCaption(f1.nombre)}<TypeNo>10</TypeNo><Width>580</Width><Height>92</Height><PosX>20</PosX><PosY>${baseYPos}</PosY><TabOrderPos>${tabOrder++}</TabOrderPos><DontLoadValues>1</DontLoadValues><DispOrderPos>${dispOrder++}</DispOrderPos>${xmlRegEx()}<Links></Links><ForeignTable>TheIxTable_${toCamel(f1.nombre)}_Hist</ForeignTable><Id>${newGuid()}</Id><DisplayProp></DisplayProp><TabInfo FactoryType="0"></TabInfo><FieldID>${colname1}</FieldID><DisplayPropCond></DisplayPropCond><Filter></Filter></Field>`
                  baseYPos += 100
                } else {
                  fieldsXml += makeLabelField({ fieldno: labelNo--, fieldid: `Lbl_${colname1}`, caption: f1.nombre, width: LBL_W, height: LBL_H, posx: LBL_X1 + 5, posy: baseYPos + 1, fsize: 8, al: 4, tclr: pal.labelColor, tabMeta: '' })
                  fieldsXml += makeDataField({ fieldno: fieldNo--, colname: colname1, fieldid: colname1, caption: f1.nombre, typeno: normalizedType1, length: f1.length, width: FLD_W, height: ROW_H, posx: FLD_X1 + 5, posy: baseYPos, taborder: tabOrder++, disporder: dispOrder++, displayprop: `<TClr>${pal.fieldText}</TClr><BClr>${pal.fieldBg}</BClr>`, tabMeta: '' })
                  baseYPos += ROW_GAP
                }
              }
              if (f2) {
                const colname2 = sanitizeName(f2.fieldKey || f2.nombre)
                const normalizedType2 = normalizeFieldType(f2.tipo)

                if (normalizedType2 === '10') {
                  // Generate Table field with no tab assignment
                  // For table lookup, use NOME (not fieldKey) to match tableMap key
                  const tableFieldKey = sanitizeName(f2.nombre)
                  const tableFieldNo = tableMap[tableFieldKey]?.fieldNo
                  fieldsXml += `<Field><FieldNo>${tableFieldNo}</FieldNo>${xmlCaption(f2.nombre)}<TypeNo>10</TypeNo><Width>580</Width><Height>92</Height><PosX>20</PosX><PosY>${baseYPos}</PosY><TabOrderPos>${tabOrder++}</TabOrderPos><DontLoadValues>1</DontLoadValues><DispOrderPos>${dispOrder++}</DispOrderPos>${xmlRegEx()}<Links></Links><ForeignTable>TheIxTable_${toCamel(f2.nombre)}_Hist</ForeignTable><Id>${newGuid()}</Id><DisplayProp></DisplayProp><TabInfo FactoryType="0"></TabInfo><FieldID>${colname2}</FieldID><DisplayPropCond></DisplayPropCond><Filter></Filter></Field>`
                  baseYPos += 100
                } else {
                  fieldsXml += makeLabelField({ fieldno: labelNo--, fieldid: `Lbl_${colname2}`, caption: f2.nombre, width: LBL_W, height: LBL_H, posx: LBL_X2 + 5, posy: baseYPos + 1, fsize: 8, al: 4, tclr: pal.labelColor, tabMeta: '' })
                  fieldsXml += makeDataField({ fieldno: fieldNo--, colname: colname2, fieldid: colname2, caption: f2.nombre, typeno: normalizedType2, length: f2.length, width: FLD_W2, height: ROW_H, posx: FLD_X2 + 5, posy: baseYPos, taborder: tabOrder++, disporder: dispOrder++, displayprop: `<TClr>${pal.fieldText}</TClr><BClr>${pal.fieldBg}</BClr>`, tabMeta: '' })
                  baseYPos += ROW_GAP
                }
              }
            }
            baseYPos += 6
          })
          yPos = baseYPos
        } else {
          // No pestaña: render all sections in the main view
          sections.forEach((sec, si) => {
            fieldsXml += makeLabelField({ fieldno: labelNo--, fieldid: `Sec_${si}_${tableName}`, caption: sec.name, width: sectionWidth, height: SEC_H, posx: 5, posy: yPos, bold: true, tclr: pal.secText, bclr: pal.secBg, al: 4, pd: 6, tabMeta: '' })
            yPos += SEC_GAP

            for (let i = 0; i < sec.fields.length; i += 2) {
              const f1 = sec.fields[i]
              const f2 = sec.fields[i + 1]

              if (f1) {
                const colname1 = sanitizeName(f1.fieldKey || f1.nombre)
                const normalizedType1 = normalizeFieldType(f1.tipo)

                if (normalizedType1 === '10') {
                  // Generate Table field
                  // For table lookup, use NOME (not fieldKey) to match tableMap key
                  const tableFieldKey = sanitizeName(f1.nombre)
                  const tableFieldNo = tableMap[tableFieldKey]?.fieldNo
                  fieldsXml += `<Field><FieldNo>${tableFieldNo}</FieldNo>${xmlCaption(f1.nombre)}<TypeNo>10</TypeNo><Width>580</Width><Height>92</Height><PosX>20</PosX><PosY>${yPos}</PosY><TabOrderPos>${tabOrder++}</TabOrderPos><DontLoadValues>1</DontLoadValues><DispOrderPos>${dispOrder++}</DispOrderPos>${xmlRegEx()}<Links></Links><ForeignTable>TheIxTable_${toCamel(f1.nombre)}_Hist</ForeignTable><Id>${newGuid()}</Id><DisplayProp></DisplayProp><TabInfo FactoryType="0"></TabInfo><FieldID>${colname1}</FieldID><DisplayPropCond></DisplayPropCond><Filter></Filter></Field>`
                  yPos += 100
                } else {
                  fieldsXml += makeLabelField({ fieldno: labelNo--, fieldid: `Lbl_${colname1}`, caption: f1.nombre, width: LBL_W, height: LBL_H, posx: LBL_X1, posy: yPos + 1, fsize: 8, al: 4, tclr: pal.labelColor, tabMeta: '' })
                  fieldsXml += makeDataField({ fieldno: fieldNo--, colname: colname1, fieldid: colname1, caption: f1.nombre, typeno: normalizedType1, length: f1.length, width: FLD_W, height: ROW_H, posx: FLD_X1, posy: yPos, taborder: tabOrder++, disporder: dispOrder++, displayprop: `<TClr>${pal.fieldText}</TClr><BClr>${pal.fieldBg}</BClr>`, tabMeta: '' })
                  yPos += ROW_GAP
                }
              }
              if (f2) {
                const colname2 = sanitizeName(f2.fieldKey || f2.nombre)
                const normalizedType2 = normalizeFieldType(f2.tipo)

                if (normalizedType2 === '10') {
                  // Generate Table field
                  // For table lookup, use NOME (not fieldKey) to match tableMap key
                  const tableFieldKey = sanitizeName(f2.nombre)
                  const tableFieldNo = tableMap[tableFieldKey]?.fieldNo
                  fieldsXml += `<Field><FieldNo>${tableFieldNo}</FieldNo>${xmlCaption(f2.nombre)}<TypeNo>10</TypeNo><Width>580</Width><Height>92</Height><PosX>20</PosX><PosY>${yPos}</PosY><TabOrderPos>${tabOrder++}</TabOrderPos><DontLoadValues>1</DontLoadValues><DispOrderPos>${dispOrder++}</DispOrderPos>${xmlRegEx()}<Links></Links><ForeignTable>TheIxTable_${toCamel(f2.nombre)}_Hist</ForeignTable><Id>${newGuid()}</Id><DisplayProp></DisplayProp><TabInfo FactoryType="0"></TabInfo><FieldID>${colname2}</FieldID><DisplayPropCond></DisplayPropCond><Filter></Filter></Field>`
                  yPos += 100
                } else {
                  fieldsXml += makeLabelField({ fieldno: labelNo--, fieldid: `Lbl_${colname2}`, caption: f2.nombre, width: LBL_W, height: LBL_H, posx: LBL_X2, posy: yPos + 1, fsize: 8, al: 4, tclr: pal.labelColor, tabMeta: '' })
                  fieldsXml += makeDataField({ fieldno: fieldNo--, colname: colname2, fieldid: colname2, caption: f2.nombre, typeno: normalizedType2, length: f2.length, width: FLD_W2, height: ROW_H, posx: FLD_X2, posy: yPos, taborder: tabOrder++, disporder: dispOrder++, displayprop: `<TClr>${pal.fieldText}</TClr><BClr>${pal.fieldBg}</BClr>`, tabMeta: '' })
                  yPos += ROW_GAP
                }
              }
            }
            yPos += 6
          })
        }

      const contentH = yPos + 10

      // Header (flat, no tabs)
      let headerXml = ''
      if (!hasTable && !hasPestañas) {
          headerXml += makeLabelField({ fieldno: labelNo--, fieldid: `Hdr_Title_${tableName}`, caption: nombre, width: DIALOG_W - 10, height: 18, posx: 5, posy: 6, fsize: 14, bold: true, tclr: pal.hdrText, bclr: pal.hdrBg, al: 4, pd: 5 })
          headerXml += makeLabelField({ fieldno: labelNo--, fieldid: `Hdr_Sub_${tableName}`, caption: tableName, width: DIALOG_W - 10, height: 12, posx: 5, posy: 26, fsize: 9, tclr: pal.hdrSub, bclr: pal.hdrBg, al: 4, pd: 5 })
        }

      // Tab + Table control fields (if table or pestaña exists)
      let tabXml = ''
      if (hasPestañas) {
          const tabH2 = Math.max(contentH + 20, 260)

          // Build tabs XML - include only pestaña tabs (Table fields are generated separately)
          let tabsXml = ''
          sortedPestañas.forEach((pestañaName, idx) => {
            const tabNo = idx + 1
            tabsXml += `<T FactoryType="1"><TabNo>${tabNo}</TabNo><TabPos>${tabNo}</TabPos><TabCapt><TStr><T><L>1034</L><S>${escapeXml(pestañaName)}</S></T></TStr></TabCapt></T>`
          })

          // Tab control field
          const firstTabName = hasPestañas ? sortedPestañas[0] : 'Datos'
          tabXml += `<Field><FieldNo>${TAB_NO}</FieldNo>${xmlCaption(firstTabName)}<TypeNo>13</TypeNo><Width>${DIALOG_W - TAB_MARGIN * 2}</Width><Height>${tabH2}</Height><PosX>${TAB_PAD_X}</PosX><PosY>${TAB_PAD_Y}</PosY><DontLoadValues>1</DontLoadValues>${xmlRegEx()}<Links></Links><Id>${newGuid()}</Id><DisplayProp><Face>Arial</Face><FSize>8</FSize><BClr>${pal.tabBg}</BClr></DisplayProp><TabInfo FactoryType="1"><Tabs>${tabsXml}</Tabs></TabInfo><FieldID>Tab_${toCamel(tableName)}</FieldID><DisplayPropCond></DisplayPropCond><Filter></Filter></Field>`
        }

      const dialogH = (hasTable || hasPestañas) ? TAB_PAD_Y + Math.max(contentH + 20, 260) + 10 : HDR_H + contentH + 10
      const titleFlds = [-1, -2, -3].slice(0, Math.min(3, sections.flatMap(s => s.fields).length)).map(n => `<Fld>${n}</Fld>`).join('')
      const docTitles = `<DocTitles><DocTitlesArr><DocTitle><TitleType>1</TitleType><FieldNos>${titleFlds}</FieldNos><MaxLength>100</MaxLength><HideCtgryName>0</HideCtgryName><ShowFieldNames>0</ShowFieldNames></DocTitle><DocTitle><TitleType>2</TitleType><FieldNos>${titleFlds}</FieldNos><MaxLength>0</MaxLength><HideCtgryName>0</HideCtgryName><ShowFieldNames>1</ShowFieldNames></DocTitle></DocTitlesArr></DocTitles>`

      // Each category needs a UNIQUE CtgryNo (Therefore uses this as the primary ID)
      const ctgryNo = -(catIndex + 1)
      const categoryXml = `<Category><CtgryNo>${ctgryNo}</CtgryNo><Name UPT="1"><TStr><T><L>1034</L><S>${escapeXml(nombre)}</S></T></TStr></Name><Version>0</Version><Fields>${tableColFields}${fieldsXml}${headerXml}${tabXml}</Fields><DataTypes></DataTypes><Title>${escapeXml(nombre)}</Title><Width>${DIALOG_W}</Width><Height>${dialogH}</Height><Watermark><DocNo>0</DocNo></Watermark><FulltextMode>1</FulltextMode><FulltextDate>18991230</FulltextDate><CheckInMode>1</CheckInMode><Description UPT="1"><TStr></TStr></Description><Header><Font></Font></Header><Id>${newGuid()}</Id><DlgBgColor>${pal.dlgBg}</DlgBgColor><EmptyDocMode>1</EmptyDocMode><CoverMode>1</CoverMode>${docTitles}<CtgryID>${ctgry_id}</CtgryID></Category>`

      return categoryXml
    } catch (err) {
      throw new Error(`Error en categoría ${cat.name}: ${err.message}`)
    }
  }

  const generateXml = () => {
    setError('')

    if (categories.length === 0) {
      setError('Añade al menos una categoría.')
      return
    }

    try {
      // Generate XML for all categories with unique offsets
      // CRITICAL: Ranges must NOT overlap. Each category needs independent ranges.
      // fieldNo: 200 slots per category (safety margin for labels + data fields + UI elements)
      // tabNo: 100 slots per category
      let globalFieldNoOffset = -1
      let globalTabNoOffset = -500

      const categoryXmlBlocks = categories
        .filter(cat => cat.name.trim())
        .map((cat, idx) => {
          // Each category: labelNo starts at (fieldNo - 150), providing 150 label slots
          // This ensures no overlap: fieldNo and labelNo ranges are completely separate
          const labelNoStart = globalFieldNoOffset - 150

          const catXml = generateCategoryXml(cat, idx, {
            fieldNoStart: globalFieldNoOffset,
            labelNoStart: labelNoStart,
            tabNo: globalTabNoOffset
          })

          // Each category gets 200 fieldNo slots (100 for data + 100 for labels buffer)
          // Each category gets 200 tabNo slots
          globalFieldNoOffset -= 200
          globalTabNoOffset -= 200

          return catXml
        })
        .filter(xml => xml) // Remove undefined values

      if (categoryXmlBlocks.length === 0) {
        setError('Añade al menos una categoría con nombre.')
        return
      }

      const allCategoriesXml = categoryXmlBlocks.join('')

      // Build complete XML with all categories
      const xml = `<?xml version="1.0" encoding="utf-8"?><Configuration><Version>570425345</Version><NewImportExport>1</NewImportExport><Categories>${allCategoriesXml}</Categories><QueryTemplates></QueryTemplates><CaseDefinitions></CaseDefinitions><Folders></Folders><Datatypes></Datatypes><KeywordDictionaries></KeywordDictionaries><Counters></Counters><Templates></Templates><WFProcesses></WFProcesses><UCProfiles></UCProfiles><TreeViews></TreeViews><CloudStorages></CloudStorages><Preprocessors></Preprocessors><Forms></Forms><FormImgs></FormImgs><ReportDefinitions></ReportDefinitions><ReportTemplates></ReportTemplates><PowerBIDataSets></PowerBIDataSets><PowerBITables></PowerBITables><EForms></EForms><ESignatureProviders></ESignatureProviders><Roles></Roles><RoleAssignments></RoleAssignments><CommonScripts></CommonScripts><OfficeProfiles></OfficeProfiles><IxProfiles></IxProfiles><Queries></Queries><Users></Users><CaptProfiles></CaptProfiles><References></References><CntConnSrcs></CntConnSrcs><Dashboards></Dashboards><Stamps></Stamps><RetentionPolicies></RetentionPolicies><SmartCaptureProcessors></SmartCaptureProcessors><SmartCaptureQueues></SmartCaptureQueues><DocDownloadProviders></DocDownloadProviders><Credentials></Credentials></Configuration>`

      setXml(xml)
      // Parse XML to extract categories for preview, preserving palette from original categories
      const parsedCats = parseXmlCategories(xml, categories)
      setPreviewCategories(parsedCats)
      setXmlModalOpen(true)
      message.success(`✅ XML generado con ${categoryXmlBlocks.length} categoría(s) (Therefore Native Format)`)
      return
    } catch (err) {
      setError(`Error: ${err.message}`)
      logger.error('Error generando XML:', err)
      return
    }
  }

  const toCamel = (str) => {
    return (str || '').split('_')
      .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('') || 'categoria'
  }

  // Legacy version - no longer used
  const generateXmlLegacy = () => {
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

    // Build tab mapping from fields' pestaña property
    const sectionPestañas = []
      cat.sections.forEach(sec => {
        sec.fields.forEach(f => {
          if (f.pestaña && f.pestaña.trim()) {
            const trimmed = f.pestaña.trim()
            if (!sectionPestañas.includes(trimmed)) sectionPestañas.push(trimmed)
          }
        })
      })

    // Check if we have any fields with pestaña assigned
    // Create TabControl if there's at least one field with pestaña (even if it's the same pestaña for all fields)
    const hasTabs = sectionPestañas.length > 0

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

    // Use unique Tab FieldNo per category (decreasing from -200, -201, etc.)
    const categoryTabNo = globalFieldNo--

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
            const normalizedLength = normalizeFieldLength(f1.tipo, f1.length, typeno)
            const fieldWidth = calculateFieldWidth(normalizedLength.toString(), typeno)
            fieldsXml += makeDataField({ fieldno: globalFieldNo--, colname, fieldid: colname, caption: f1.nombre, typeno, length: normalizedLength.toString(), width: fieldWidth, height: ROW_H, posx: FLD_X1, posy: yPos, taborder: tabOrder++, disporder: dispOrder++ })
          }

          if (f2) {
            const colname = sanitizeName(f2.fieldKey || f2.nombre)
            fieldsXml += makeLabelField({ fieldno: globalLabelNo--, fieldid: `Lbl_${colname}`, caption: f2.nombre, width: LBL_W, height: LBL_H, posx: LBL_X2, posy: yPos + 1, fsize: 8, al: 4, tclr: bgr(55, 65, 81) })
            const typeno = typeToTypeNo[f2.tipo] || '1'
            const normalizedLength = normalizeFieldLength(f2.tipo, f2.length, typeno)
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
              const normalizedLength = normalizeFieldLength(col.tipo, col.length, colTypeno)
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
                const normalizedLength = normalizeFieldLength(f1.tipo, f1.length, typeno)
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
                const normalizedLength = normalizeFieldLength(f2.tipo, f2.length, typeno)
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
                const normalizedLength = normalizeFieldLength(col.tipo, col.length, colTypeno)
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
        // Tab Control - TypeNo 13 (TabControlField)
        // NOTE: Per production Therefore configs, TabInfo must be empty (FactoryType="0")
        // Tabs are defined implicitly via ShowInTabNo in field definitions
        tabXml += `<Field><FieldNo>${categoryTabNo}</FieldNo>${xmlCaption(sortedPestañas[0] || 'Datos')}<TypeNo>13</TypeNo><Width>${DIALOG_W - TAB_MARGIN * 2}</Width><Height>${tabH2}</Height><PosX>${TAB_PAD_X}</PosX><PosY>${TAB_PAD_Y}</PosY><DontLoadValues>1</DontLoadValues>${xmlRegEx()}<Links></Links><Id>${newGuid()}</Id><DisplayProp><Face>Arial</Face><FSize>8</FSize><BClr>${bgr(192, 192, 192)}</BClr></DisplayProp><TabInfo FactoryType="0"></TabInfo><FieldID>Tab_${camel}</FieldID><DisplayPropCond></DisplayPropCond><Filter></Filter></Field>`
      }

    const dialogH = hasTabs ? TAB_PAD_Y + Math.max(contentH + 20, 260) + 10 : HDR_H + contentH + 10
    const allFields = cat.sections.flatMap(s => s.fields).filter(f => f.nombre.trim())
    // Reference the first 3 data fields that were created for this category
    const titleFlds = [catStartFieldNo, catStartFieldNo - 1, catStartFieldNo - 2].slice(0, Math.min(3, allFields.length)).map(n => `<Fld>${n}</Fld>`).join('')
    const docTitles = `<DocTitles><DocTitlesArr><DocTitle><TitleType>1</TitleType><FieldNos>${titleFlds}</FieldNos><MaxLength>100</MaxLength><HideCtgryName>0</HideCtgryName><ShowFieldNames>0</ShowFieldNames></DocTitle><DocTitle><TitleType>2</TitleType><FieldNos>${titleFlds}</FieldNos><MaxLength>0</MaxLength><HideCtgryName>0</HideCtgryName><ShowFieldNames>1</ShowFieldNames></DocTitle></DocTitlesArr></DocTitles>`

    return `<Category><CtgryNo>-${catIdx + 1}</CtgryNo><TableName>${tableName}</TableName><Name UPT="1"><TStr><T><L>1034</L><S>${escapeXml(cat.name)}</S></T></TStr></Name><Version>0</Version><Fields>${headerXml}${fieldsXml}${tabXml}${fieldsWithTabsXml}</Fields><DataTypes></DataTypes><Title>${escapeXml(cat.name)}</Title><Width>${DIALOG_W}</Width><Height>${dialogH}</Height><Watermark><DocNo>0</DocNo></Watermark><FulltextMode>1</FulltextMode><FulltextDate>18991230</FulltextDate><CheckInMode>1</CheckInMode><Description UPT="1"><TStr></TStr></Description><Header><Font></Font></Header><DlgBgColor>${bgr(240, 240, 240)}</DlgBgColor><EmptyDocMode>1</EmptyDocMode><CoverMode>1</CoverMode>${docTitles}<CtgryID>${ctgryId}</CtgryID></Category>`
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

        {/* Refactored field editor with unified header */}
        {(() => {
          // Compute field groups: baseFields (no pestaña) and tabFields (grouped by pestaña)
          const baseGroups = []
          const tabGroups = {}
          const tabOrder = []

          cat.sections.forEach((sec, secIdx) => {
            const baseFields = []
            const tabFields = {}

            sec.fields.forEach((field, fieldIdx) => {
              const tab = field.pestaña?.trim()
              if (!tab) {
                baseFields.push({ field, fieldIdx })
              } else {
                if (!tabFields[tab]) tabFields[tab] = []
                tabFields[tab].push({ field, fieldIdx })
                if (!tabOrder.includes(tab)) tabOrder.push(tab)
              }
            })

            if (baseFields.length > 0) baseGroups.push({ sec, secIdx, fields: baseFields })
            Object.entries(tabFields).forEach(([tab, fields]) => {
              if (!tabGroups[tab]) tabGroups[tab] = []
              tabGroups[tab].push({ sec, secIdx, fields })
            })
          })

          return (
            <>
              {/* Single header for all fields */}
              <div className="category-table-header">
                <span>Nombre</span>
                <span>Tipo</span>
                <span>Long</span>
                <span style={{ textAlign: 'center' }}>Req</span>
                <span>Pestaña</span>
                <span />
                <span />
              </div>

              {/* Fields without pestaña */}
              {baseGroups.length > 0 && (
                <div className="category-group">
                  <div className="category-group-label">📌 Sin pestaña</div>
                  {baseGroups.map(({ sec, secIdx, fields }) => (
                    <SectionBlock
                      key={sec.id}
                      section={sec}
                      secIdx={secIdx}
                      fields={fields}
                      allPestañas={tabOrder}
                      updateField={updateField}
                      removeField={removeField}
                      updateSecName={updateSecName}
                      removeSection={removeSection}
                      catSectionsCount={cat.sections.length}
                      updateFieldPestaña={updateFieldPestaña}
                    />
                  ))}
                </div>
              )}

              {/* Fields grouped by pestaña */}
              {tabOrder.map(tabName => (
                <div key={tabName} className="category-group">
                  <div className="category-group-label">📑 {tabName}</div>
                  {tabGroups[tabName].map(({ sec, secIdx, fields }) => (
                    <SectionBlock
                      key={sec.id}
                      section={sec}
                      secIdx={secIdx}
                      fields={fields}
                      allPestañas={tabOrder}
                      updateField={updateField}
                      removeField={removeField}
                      updateSecName={updateSecName}
                      removeSection={removeSection}
                      catSectionsCount={cat.sections.length}
                      updateFieldPestaña={updateFieldPestaña}
                    />
                  ))}
                </div>
              ))}
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
            onClick={generateXml}
            className="btn-default"
          >
            ⚡ Generar XML
          </button>
          <button
            onClick={() => {
              message.info('Función eForm en desarrollo. Próximamente podrás generar eForms desde aquí.')
            }}
            className="btn-default"
            style={{ opacity: 0.6 }}
          >
            📋 Generar eForm
          </button>
          <button
            onClick={() => setPreviewModalOpen(true)}
            className="btn-default"
          >
            👁 Preview
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
        <div style={{ display: 'flex', gap: '16px', minHeight: 'calc(100vh - 200px)' }}>
          {/* LEFT PANEL: Category List */}
          <div style={{
            width: '220px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={addCategory} className="btn-default" style={{ flex: 1 }}>
                + Nueva
              </button>
              <button onClick={saveTemplate} className="btn-default" style={{ flex: 1 }}>
                💾 Guardar
              </button>
            </div>

            {/* Category list */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              overflow: 'auto',
              borderTop: '1px solid var(--border-default)',
              paddingTop: '12px'
            }}>
              {categories.map((cat, idx) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(idx)}
                  className="btn-default"
                  style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: activeCategory === idx ? 'var(--accent-primary)' : 'var(--bg-card)',
                    color: activeCategory === idx ? 'white' : 'var(--text-primary)',
                    border: activeCategory === idx ? 'none' : '1px solid var(--border-default)',
                    cursor: 'pointer',
                    transition: 'all 200ms',
                    fontSize: '12px',
                    fontWeight: activeCategory === idx ? '600' : '400',
                    width: '100%',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={cat.name}
                >
                  {cat.name || `Categoría ${idx + 1}`}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT PANEL: Category Editor */}
          {activeCategory < categories.length && (() => {
            const cat = categories[activeCategory]

            // Separate all fields into "sin pestaña" and by pestaña
            const allFields = cat.sections.flatMap((sec, secIdx) =>
              sec.fields.map((field, fieldIdx) => ({ field, secIdx, fieldIdx, section: sec }))
            )

            const baseFields = allFields.filter(f => !f.field.pestaña?.trim())
            const tabNames = new Set(allFields.filter(f => f.field.pestaña?.trim()).map(f => f.field.pestaña?.trim()))
            const tabs = Array.from(tabNames).sort()

            const getFieldsForTab = (tabName) => {
              if (!tabName) return baseFields
              return allFields.filter(f => f.field.pestaña?.trim() === tabName)
            }

            return (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Category header - Aligned with action buttons */}
                <div style={{
                  padding: '8px 0',
                  marginBottom: '16px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  borderBottom: '2px solid var(--border-default)',
                  height: '36px'
                }}>
                  {/* Editable title - FLEX to fill available space */}
                  <input
                    value={cat.name}
                    onChange={e => updateCategoryName(activeCategory, e.target.value)}
                    style={{
                      flex: 1,
                      fontSize: '18px',
                      fontWeight: '700',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '2px solid var(--border-default)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      minWidth: '100px',
                      outline: 'none',
                      transition: 'border-color 200ms'
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'var(--accent-primary)'
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'var(--border-default)'
                    }}
                    placeholder="Nombre de categoría"
                  />

                  {/* Palette selector - FIXED 200px */}
                  <select
                    value={cat.palette || 'Therefore Azul'}
                    onChange={e => {
                      const updated = [...categories]
                      updated[activeCategory].palette = e.target.value
                      setCategories(updated)
                    }}
                    style={{
                      padding: '8px 12px',
                      fontSize: '12px',
                      borderRadius: '4px',
                      border: '2px solid var(--border-default)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      width: '200px',
                      flexShrink: 0,
                      outline: 'none',
                      transition: 'border-color 200ms'
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'var(--accent-primary)'
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'var(--border-default)'
                    }}
                  >
                    {Object.keys(COLOR_PALETTES).map(palName => (
                      <option key={palName} value={palName} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{palName}</option>
                    ))}
                  </select>

                  {/* Delete button */}
                  {categories.length > 1 && (
                    <button
                      onClick={() => removeCategory(activeCategory)}
                      style={{
                        padding: '8px 14px',
                        background: 'transparent',
                        border: '2px solid var(--accent-error)',
                        borderRadius: '4px',
                        color: 'var(--accent-error)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '700',
                        transition: 'all 200ms',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255,80,80,0.15)'
                        e.currentTarget.style.borderColor = 'var(--accent-error)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.borderColor = 'var(--accent-error)'
                      }}
                      title="Eliminar esta categoría"
                    >
                      ✕ Eliminar
                    </button>
                  )}
                </div>

                {/* Base fields table */}
                {baseFields.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                      CAMPOS SIN PESTAÑA
                    </h4>
                    <FieldTableComponent fields={baseFields} expandedRows={expandedRows} setExpandedRows={setExpandedRows} updateField={updateField} removeField={removeField} addField={addField} secIdx={0} />
                  </div>
                )}

                {/* Tabs for fields with pestaña */}
                {tabs.length > 0 && (
                  <div>
                    <Tabs
                      items={tabs.map(tabName => {
                        const tabFields = getFieldsForTab(tabName)
                        const firstSecIdx = tabFields.length > 0 ? tabFields[0].secIdx : 0
                        return {
                          key: tabName,
                          label: tabName,
                          children: <FieldTableComponent fields={tabFields} expandedRows={expandedRows} setExpandedRows={setExpandedRows} updateField={updateField} removeField={removeField} addField={addField} secIdx={firstSecIdx} />
                        }
                      })}
                    />
                  </div>
                )}
              </div>
            )
          })()}
        </div>
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
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-link" onClick={() => loadTemplate(record)}>Cargar</button>
                    <button className="btn-link" onClick={() => downloadTemplate(record)}>Descar</button>
                    <button className="btn-link danger" onClick={() => deleteTemplate(record.id)}>✕</button>
                  </div>
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

      {/* Preview Modal - Miniaturas gráficas de categorías */}
      <Modal
        title="📊 Vista Previa de Categorías"
        open={previewModalOpen}
        onCancel={() => setPreviewModalOpen(false)}
        width="90vw"
        style={{ maxWidth: '1400px' }}
        footer={null}
        bodyStyle={{ maxHeight: '80vh', overflow: 'auto', padding: '30px' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '30px' }}>
          {categories.map((cat, idx) => (
            <div key={idx} style={{ border: '2px solid var(--border-default)', borderRadius: '8px', padding: '15px', background: 'var(--bg-card)' }}>
              <div style={{ marginBottom: '15px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {idx + 1}. {cat.name || 'Sin nombre'}
              </div>
              <DialogPreview
                catName={cat.name}
                sections={cat.sections}
                hasTable={cat.sections && cat.sections.some(s =>
                  s.fields && s.fields.some(f => f.tipo === '10')
                )}
                palette={COLOR_PALETTES[cat.palette || 'Therefore Azul']}
              />
            </div>
          ))}
        </div>
      </Modal>

      {/* CSV Importer Modal */}
      <CsvImporter isOpen={csvModalOpen} onClose={() => setCsvModalOpen(false)} onImport={handleCsvImport} />
    </div>
  )
}
