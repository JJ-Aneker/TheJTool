import { useState, useEffect } from 'react'
import { Button, Modal, message, Input, Table, Space, Tag, Empty, Spin, Tabs } from 'antd'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../config/supabaseClient'

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
    categoria: headers.findIndex(h => ['categoria', 'categoría', 'category', 'tab', 'categoria'].includes(h)),
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

    if (!categoryMap[categoria]) categoryMap[categoria] = {}
    if (!categoryMap[categoria][seccion]) categoryMap[categoria][seccion] = []
    categoryMap[categoria][seccion].push({ id: newGuid(), nombre, fieldKey, tipo, required })
  })

  if (!Object.keys(categoryMap).length) return { error: 'No se procesó ningún campo válido.' }

  const categories = Object.entries(categoryMap).map(([catName, sections]) => ({
    id: newGuid(),
    name: catName,
    sections: Object.entries(sections).map(([secName, fields]) => ({
      id: newGuid(),
      name: secName,
      fields
    }))
  }))

  return { categories, warnings }
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
  const total = preview && !preview.error ? preview.categories.reduce((a, c) => a + c.sections.reduce((sa, s) => sa + s.fields.length, 0), 0) : 0

  return (
    <div style={{ marginBottom: '16px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          padding: '10px 16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '6px',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        {open ? '▲' : '▼'} Importar campos desde CSV
      </button>
      {open && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '6px',
          padding: '16px',
          marginTop: '8px'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Columnas: <strong>Nombre ; Tipo ; Obligatorio ; Sección ; Categoría</strong>
          </div>
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setPreview(null) }}
            placeholder="Nombre;Tipo;Obligatorio;Sección;Categoría"
            style={{
              width: '100%',
              height: '100px',
              padding: '10px',
              border: '1px solid var(--border-default)',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px',
              backgroundColor: 'var(--bg-canvas)',
              color: 'var(--text-primary)',
              boxSizing: 'border-box',
              marginBottom: '10px'
            }}
          />
          <button
            onClick={handleParse}
            disabled={!text.trim()}
            style={{
              padding: '8px 16px',
              background: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            Analizar →
          </button>
          {preview && (
            <div style={{ marginTop: '10px' }}>
              {preview.error ? (
                <div style={{ color: '#ff6464', background: 'rgba(255, 100, 100, 0.1)', padding: '8px 12px', borderRadius: '4px', fontSize: '12px' }}>
                  ⚠ {preview.error}
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '12px', color: 'var(--accent-primary)', marginBottom: '8px' }}>
                    ✓ {total} campos · {preview.categories.length} categoría(s)
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleApply('replace')} style={{ padding: '6px 12px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                      Reemplazar
                    </button>
                    <button onClick={() => handleApply('append')} style={{ padding: '6px 12px', background: 'var(--bg-canvas)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                      Añadir
                    </button>
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

function FieldRow({ field, onChange, onRemove, showHeader, fieldIndex }) {
  const [expanded, setExpanded] = useState(false)
  const autoKey = toCamelKey(field.nombre)

  return (
    <>
      {showHeader && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 0.8fr auto', gap: '8px', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--border-default)' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>Nombre</div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>Tipo</div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>Obligatorio</div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--accent-primary)', textTransform: 'uppercase' }}></div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--accent-primary)', textTransform: 'uppercase' }}></div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 0.8fr auto', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
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
          />
        </div>
        <div>
          <select
            value={field.tipo}
            onChange={e => onChange({ ...field, tipo: e.target.value })}
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
          <button
            onClick={() => setExpanded(o => !o)}
            style={{ padding: '4px 8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', color: 'var(--text-primary)', width: '100%' }}
          >
            {expanded ? '▲' : '▼'}
          </button>
        </div>
        <div>
          <button
            onClick={onRemove}
            style={{ padding: '4px 8px', background: 'rgba(255, 100, 100, 0.1)', border: '1px solid rgba(255, 100, 100, 0.3)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#ff6464', width: '100%' }}
          >
            ✕
          </button>
        </div>
      </div>
      {expanded && (
        <div style={{ marginBottom: '8px', paddingLeft: '12px', borderLeft: '2px solid var(--border-default)' }}>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px' }}>Key</label>
          <input
            value={field.fieldKey}
            onChange={e => onChange({ ...field, fieldKey: e.target.value.replace(/\s+/g, '').replace(/[^A-Za-z0-9_]/g, '') })}
            placeholder={autoKey}
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
          />
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
      sections: [{ id: newGuid(), name: 'GENERAL', fields: [{ id: newGuid(), nombre: '', fieldKey: '', tipo: 'text', required: false }] }]
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
  const [colorModalOpen, setColorModalOpen] = useState(false)
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
    updated[activeCategory].sections[secIdx].fields.push({ id: newGuid(), nombre: '', fieldKey: '', tipo: 'text', required: false })
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
  const generateXml = () => {
    setError('')
    if (!currentCategory.name.trim()) {
      setError('El nombre de la categoría es obligatorio.')
      return
    }

    const totalFields = currentCategory.sections.reduce((a, s) => a + s.fields.filter(f => f.nombre.trim()).length, 0)
    if (totalFields === 0) {
      setError('Añade al menos un campo.')
      return
    }

    const fieldsXml = currentCategory.sections.map((sec) => {
      const secFields = sec.fields.filter(f => f.nombre.trim()).map(f => `    <Field><Name>${f.nombre}</Name><Key>${f.fieldKey || toCamelKey(f.nombre)}</Key><Type>${f.tipo}</Type><Required>${f.required ? '1' : '0'}</Required></Field>`).join('\n')
      return `  <Section name="${sec.name}">\n${secFields}\n  </Section>`
    }).join('\n')

    const newXml = `<?xml version="1.0" encoding="utf-8"?>
<Category>
  <Name>${currentCategory.name}</Name>
${fieldsXml}
</Category>`

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
    const a = document.createElement('a')
    a.href = 'data:application/xml;charset=utf-8,' + encodeURIComponent(xml)
    a.download = (currentCategory.name.trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_]/g, '') || 'categoria') + '_therefore.xml'
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
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <input
            value={cat.name}
            onChange={e => updateCategoryName(idx, e.target.value)}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: '8px',
              padding: '7px 10px',
              color: '#9ad1ff',
              fontSize: '13px',
              fontWeight: 600,
              boxSizing: 'border-box',
              outline: 'none',
              fontFamily: 'inherit',
              marginRight: '8px'
            }}
          />
          {categories.length > 1 && (
            <button
              onClick={() => removeCategory(idx)}
              style={{
                background: 'rgba(255, 80, 80, 0.10)',
                border: '1px solid rgba(255, 80, 80, 0.25)',
                borderRadius: '10px',
                color: '#fecaca',
                fontSize: '12px',
                padding: '6px 12px',
                cursor: 'pointer'
              }}
            >
              ✕ Eliminar
            </button>
          )}
        </div>

        {cat.sections.map((sec, secIdx) => (
          <div key={sec.id} style={{ background: 'rgba(0, 0, 0, 0.18)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <input
                value={sec.name}
                onChange={e => updateSecName(secIdx, e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '8px',
                  padding: '7px 10px',
                  color: '#9ad1ff',
                  fontSize: '13px',
                  fontWeight: 600,
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontFamily: 'inherit',
                  marginRight: '8px'
                }}
              />
              <span style={{ fontSize: '10px', background: 'rgba(154, 209, 255, 0.12)', color: '#9ad1ff', padding: '2px 7px', borderRadius: '5px', border: '1px solid rgba(154, 209, 255, 0.20)', marginRight: '8px' }}>{sec.fields.filter(f => f.nombre).length} campos</span>
              {cat.sections.length > 1 && (
                <button
                  onClick={() => removeSection(secIdx)}
                  style={{
                    background: 'rgba(255, 80, 80, 0.10)',
                    border: '1px solid rgba(255, 80, 80, 0.25)',
                    borderRadius: '10px',
                    color: '#fecaca',
                    fontSize: '12px',
                    padding: '6px 12px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {sec.fields.map((f, fieldIdx) => (
              <FieldRow
                key={f.id}
                field={f}
                onChange={v => updateField(secIdx, fieldIdx, v)}
                onRemove={() => removeField(secIdx, fieldIdx)}
                showHeader={fieldIdx === 0}
                fieldIndex={fieldIdx}
              />
            ))}

            <button
              onClick={() => addField(secIdx)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '10px',
                color: '#e6e7eb',
                fontSize: '12px',
                padding: '6px 12px',
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              + Campo
            </button>
          </div>
        ))}

        <button
          onClick={addSection}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: '10px',
            color: '#e6e7eb',
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
    <div style={{ padding: '24px' }}>
      {/* HEADER */}
      <div style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-primary)', letterSpacing: '-0.3px', margin: '0' }}>🏗️ Generador de Categorías</h1>
          <p style={{ fontSize: '12px', color: 'rgba(238, 244, 255, 0.55)', marginTop: '4px', margin: 0 }}>Crea múltiples categorías con secciones y campos · XML · v2.0</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveView('editor')}
            style={{
              background: activeView === 'editor' ? 'rgba(154, 209, 255, 0.15)' : 'rgba(255, 255, 255, 0.06)',
              borderColor: activeView === 'editor' ? '#9ad1ff' : 'rgba(255, 255, 255, 0.14)',
              color: activeView === 'editor' ? '#9ad1ff' : '#e6e7eb',
              border: '1px solid',
              borderRadius: '10px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500
            }}
          >
            ✎ Editor
          </button>
          <button
            onClick={() => setActiveView('preview')}
            style={{
              background: activeView === 'preview' ? 'rgba(154, 209, 255, 0.15)' : 'rgba(255, 255, 255, 0.06)',
              borderColor: activeView === 'preview' ? '#9ad1ff' : 'rgba(255, 255, 255, 0.14)',
              color: activeView === 'preview' ? '#9ad1ff' : '#e6e7eb',
              border: '1px solid',
              borderRadius: '10px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500
            }}
          >
            👁 Preview
          </button>
          <button
            onClick={() => setManagerOpen(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              borderColor: 'rgba(255, 255, 255, 0.14)',
              color: '#e6e7eb',
              border: '1px solid',
              borderRadius: '10px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500
            }}
          >
            📁 Mis Plantillas
          </button>
          <button
            onClick={() => setColorModalOpen(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              borderColor: 'rgba(255, 255, 255, 0.14)',
              color: '#e6e7eb',
              border: '1px solid',
              borderRadius: '10px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500
            }}
          >
            🎨 Colores
          </button>
        </div>
      </div>

      {activeView === 'preview' ? (
        <div style={{
          background: '#f3f4f6',
          borderRadius: '8px',
          fontFamily: 'Arial, sans-serif',
          overflow: 'auto',
          maxHeight: '600px'
        }}>
          <Tabs
            items={tabItems.map(tab => ({
              ...tab,
              children: (
                <div style={{ background: '#ffffff', padding: '20px' }}>
                  <div style={{ background: '#185FA5', color: '#fff', borderRadius: '6px 6px 0 0', padding: '16px', marginLeft: '-20px', marginRight: '-20px', marginTop: '-20px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '16px', fontWeight: '700' }}>{categories[parseInt(tab.key)].name}</div>
                  </div>
                  {categories[parseInt(tab.key)].sections.map((sec, si) => (
                    <div key={si} style={{ marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '1px solid #e5e7eb', paddingBottom: '5px', marginBottom: '12px' }}>
                        {sec.name}
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        {sec.fields.filter(f => f.nombre).map((f, fi) => {
                          const controlMap = {
                            text: <input type="text" placeholder={f.nombre} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', padding: '8px 10px', fontSize: '13px' }} />,
                            email: <input type="email" placeholder={f.nombre} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', padding: '8px 10px', fontSize: '13px' }} />,
                            phone: <input type="tel" placeholder={f.nombre} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', padding: '8px 10px', fontSize: '13px' }} />,
                            date: <input type="date" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', padding: '8px 10px', fontSize: '13px' }} />,
                            datetime: <input type="datetime-local" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', padding: '8px 10px', fontSize: '13px' }} />,
                            number: <input type="number" placeholder={f.nombre} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', padding: '8px 10px', fontSize: '13px' }} />,
                            money: <input type="number" step="0.01" placeholder={f.nombre} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', padding: '8px 10px', fontSize: '13px' }} />,
                            boolean: <input type="checkbox" style={{ width: '20px', height: '20px', accentColor: '#185FA5' }} />,
                            lookup: <select style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', padding: '8px 10px', fontSize: '13px' }}><option>-- Selecciona --</option></select>
                          }
                          return (
                            <div key={fi}>
                              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                                {f.nombre}
                                {f.required && <span style={{ color: '#dc2626', marginLeft: '3px' }}>*</span>}
                              </label>
                              {controlMap[f.tipo] || controlMap.text}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                  <button style={{ background: '#185FA5', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 24px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginTop: '12px' }}>
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
          <div style={{
            background: 'linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.04)),rgba(255,255,255,.06)',
            border: '1px solid rgba(255, 255, 255, 0.10)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            backdropFilter: 'blur(14px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)'
          }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#9ad1ff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>Categorías ({categories.length})</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={generateXml}
                style={{
                  background: '#9ad1ff',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#000',
                  fontSize: '13px',
                  padding: '9px 18px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Generar XML →
              </button>
              <button
                onClick={addCategory}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '10px',
                  color: '#e6e7eb',
                  fontSize: '13px',
                  padding: '9px 18px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                + Nueva Categoría
              </button>
              <button
                onClick={saveTemplate}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '10px',
                  color: '#e6e7eb',
                  fontSize: '13px',
                  padding: '9px 18px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                💾 Guardar Plantilla
              </button>
            </div>
          </div>

          {/* EDITOR */}
          <div>
            <CsvImporter onImport={handleCsvImport} />
            <div style={{
              background: 'linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.04)),rgba(255,255,255,.06)',
              border: '1px solid rgba(255, 255, 255, 0.10)',
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
          <div style={{ color: '#fecaca', fontSize: '12px', marginBottom: '10px', background: 'rgba(255, 80, 80, 0.12)', border: '1px solid rgba(255, 80, 80, 0.25)', padding: '8px 12px', borderRadius: '8px' }}>
            ⚠ {error}
          </div>
        )}
        {xml && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={copy}
                style={{
                  background: '#9ad1ff',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#000',
                  fontSize: '13px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {copied ? '✓ Copiado' : '📋 Copiar XML'}
              </button>
              <button
                onClick={download}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '10px',
                  color: '#e6e7eb',
                  fontSize: '13px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                ⬇ Descargar .xml
              </button>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(238, 244, 255, 0.40)', marginBottom: '6px' }}>
              {xml.length.toLocaleString()} caracteres
            </div>
            <textarea
              readOnly
              value={xml}
              style={{
                width: '100%',
                height: '300px',
                padding: '10px',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '11px',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                color: '#a7f3d0',
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
        width={600}
        footer={null}
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Personaliza los colores de tu interfaz. Estos colores se aplican a todos los formularios.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {[
              { label: 'Primario', default: '#9ad1ff', key: 'primary' },
              { label: 'Fondo Canvas', default: '#16181D', key: 'bgCanvas' },
              { label: 'Fondo Card', default: '#25272D', key: 'bgCard' },
              { label: 'Texto Principal', default: '#e6e7eb', key: 'textMain' },
              { label: 'Texto Secundario', default: 'rgba(238, 244, 255, 0.55)', key: 'textSec' },
              { label: 'Borde', default: 'rgba(255, 255, 255, 0.14)', key: 'border' },
            ].map(color => (
              <div key={color.key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {color.label}
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    defaultValue={color.default.includes('rgb') ? '#e6e7eb' : color.default}
                    style={{
                      width: '50px',
                      height: '40px',
                      border: '1px solid var(--border-default)',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    defaultValue={color.default}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      border: '1px solid var(--border-default)',
                      borderRadius: '4px',
                      fontSize: '12px',
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

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-default)' }}>
            <button
              onClick={() => {
                message.success('Colores personalizados (demo)')
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
              Aplicar Colores
            </button>
          </div>

          <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(154, 209, 255, 0.1)', borderRadius: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            ℹ️ Los cambios de color se aplican automáticamente al formulario de preview. Esta funcionalidad está en demo - para persistencia, se guardarían en Supabase.
          </div>
        </div>
      </Modal>
    </div>
  )
}
