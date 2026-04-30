import { useState, useEffect } from 'react'
import { Button, Modal, message, Input, Table, Space, Tag, Empty, Spin } from 'antd'
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
    const seccion = idx.seccion >= 0 ? (cols[idx.seccion] || 'GENERAL').toUpperCase() : 'GENERAL'

    if (!sectionMap[seccion]) { sectionMap[seccion] = []; sectionOrder.push(seccion) }
    sectionMap[seccion].push({ id: newGuid(), nombre, fieldKey, tipo, required })
  })

  if (!sectionOrder.length) return { error: 'No se procesó ningún campo válido.' }
  const sections = sectionOrder.map(name => ({ id: newGuid(), name, fields: sectionMap[name] }))
  return { sections, warnings }
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
  const total = preview && !preview.error ? preview.sections.reduce((a, s) => a + s.fields.length, 0) : 0

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
            Columnas: <strong>Nombre ; Tipo ; Obligatorio ; Sección</strong>
          </div>
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setPreview(null) }}
            placeholder="Nombre;Tipo;Obligatorio;Sección"
            style={{
              width: '100%',
              height: '80px',
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
                    ✓ {total} campos · {preview.sections.length} sección(es)
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

function FieldRow({ field, onChange, onRemove }) {
  const [expanded, setExpanded] = useState(false)
  const autoKey = toCamelKey(field.nombre)

  return (
    <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-default)', borderRadius: '6px', padding: '10px', marginBottom: '8px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '2 1 150px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px' }}>Nombre</label>
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
            placeholder="Ej. Nombre"
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
        <div style={{ flex: '1.5 1 120px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px' }}>Tipo</label>
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
        <div style={{ display: 'flex', gap: '4px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={field.required}
              onChange={e => onChange({ ...field, required: e.target.checked })}
            />
            Obligatorio
          </label>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setExpanded(o => !o)}
            style={{ padding: '4px 8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', color: 'var(--text-primary)' }}
          >
            {expanded ? '▲' : '▼'}
          </button>
          <button
            onClick={onRemove}
            style={{ padding: '4px 8px', background: 'rgba(255, 100, 100, 0.1)', border: '1px solid rgba(255, 100, 100, 0.3)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#ff6464' }}
          >
            ✕
          </button>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-default)' }}>
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
    </div>
  )
}

export default function CategoryBuilder() {
  const { user } = useAuth()
  const [categoryName, setCategoryName] = useState('')
  const [categoryDesc, setCategoryDesc] = useState('')
  const [sections, setSections] = useState([{ id: newGuid(), name: 'GENERAL', fields: [{ id: newGuid(), nombre: '', fieldKey: '', tipo: 'text', required: false }] }])
  const [xml, setXml] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [activeView, setActiveView] = useState('editor')
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [managerOpen, setManagerOpen] = useState(false)
  const [xmlModalOpen, setXmlModalOpen] = useState(false)
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

  const saveTemplate = async () => {
    if (!categoryName.trim()) {
      message.error('El nombre de la categoría es obligatorio')
      return
    }

    try {
      if (selectedTemplate?.id) {
        const { error: err } = await supabase
          .from('category_templates')
          .update({
            name: categoryName,
            description: categoryDesc,
            xml_definition: xml || '',
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
            name: categoryName,
            description: categoryDesc,
            xml_definition: xml || '',
            created_by: user.id,
            compartido: false
          })

        if (err) throw err
        message.success('Guardada')
      }

      setCategoryName('')
      setCategoryDesc('')
      setSelectedTemplate(null)
      setXml('')
      await loadTemplates()
    } catch (err) {
      message.error(`Error: ${err.message}`)
    }
  }

  const loadTemplate = (template) => {
    setSelectedTemplate(template)
    setCategoryName(template.name)
    setCategoryDesc(template.description || '')
    setXml(template.xml_definition || '')
    setManagerOpen(false)
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
    a.href = 'data:application/xml;charset=utf-8,' + encodeURIComponent(template.xml_definition)
    a.download = `${template.name.replace(/\s+/g, '_')}_therefore.xml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // Section operations
  const addSection = () => setSections(s => [...s, { id: newGuid(), name: 'NUEVA SECCIÓN', fields: [{ id: newGuid(), nombre: '', fieldKey: '', tipo: 'text', required: false }] }])
  const removeSection = i => setSections(s => s.filter((_, idx) => idx !== i))
  const updateSecName = (i, v) => setSections(s => s.map((sec, idx) => idx === i ? { ...sec, name: v.toUpperCase() } : sec))
  const addField = i => setSections(s => s.map((sec, idx) => idx === i ? { ...sec, fields: [...sec.fields, { id: newGuid(), nombre: '', fieldKey: '', tipo: 'text', required: false }] } : sec))
  const removeField = (si, fi) => setSections(s => s.map((sec, idx) => idx === si ? { ...sec, fields: sec.fields.filter((_, fIdx) => fIdx !== fi) } : sec))
  const updateField = (si, fi, v) => setSections(s => s.map((sec, idx) => idx === si ? { ...sec, fields: sec.fields.map((f, fIdx) => fIdx === fi ? v : f) } : sec))

  // CSV import
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

  // Generate XML
  const generateXml = () => {
    setError('')
    if (!categoryName.trim()) {
      setError('El nombre de la categoría es obligatorio.')
      return
    }
    const total = sections.flatMap(s => s.fields).filter(f => f.nombre.trim()).length
    if (total === 0) {
      setError('Añade al menos un campo.')
      return
    }

    const fieldsXml = sections.map((sec, si) => {
      const secFields = sec.fields.filter(f => f.nombre.trim()).map(f => `    <Field><Name>${f.nombre}</Name><Key>${f.fieldKey || toCamelKey(f.nombre)}</Key><Type>${f.tipo}</Type><Required>${f.required ? '1' : '0'}</Required></Field>`).join('\n')
      return `  <Section name="${sec.name}">\n${secFields}\n  </Section>`
    }).join('\n')

    const newXml = `<?xml version="1.0" encoding="utf-8"?>
<Category>
  <Name>${categoryName}</Name>
  <Description>${categoryDesc}</Description>
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
    a.download = (categoryName.trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_]/g, '') || 'categoria') + '_therefore.xml'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const totalFields = sections.flatMap(s => s.fields).filter(f => f.nombre.trim()).length
  const filteredTemplates = templates.filter(t => t.name.toLowerCase().includes(searchText.toLowerCase()))

  return (
    <div style={{ padding: '24px' }}>
      {/* HEADER */}
      <div style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-primary)', letterSpacing: '-0.3px', margin: '0' }}>🏗️ Generador de Categorías</h1>
          <p style={{ fontSize: '12px', color: 'rgba(238, 244, 255, 0.55)', marginTop: '4px', margin: 0 }}>Crea categorías para Therefore Solution Designer · XML · v2.0</p>
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
        </div>
      </div>

      {activeView === 'preview' ? (
        <div style={{
          background: 'linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.04)),rgba(255,255,255,.06)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          borderRadius: '8px',
          padding: '16px',
          backdropFilter: 'blur(14px)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)'
        }}>
          <h3 style={{ fontSize: '11px', fontWeight: '600', color: '#9ad1ff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>Vista previa: {categoryName || 'Categoría'}</h3>
          {sections.map((sec, si) => (
            <div key={si} style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#9ad1ff', textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '1px solid #e5e7eb', paddingBottom: '5px', marginBottom: '12px' }}>
                {sec.name}
              </h4>
              {sec.fields.filter(f => f.nombre).map((f, fi) => (
                <div key={fi} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" style={{ accentColor: '#185FA5' }} />
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>{f.nombre}{f.required && <span style={{ color: '#dc2626', marginLeft: '3px' }}>*</span>}</label>
                </div>
              ))}
            </div>
          ))}
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
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#9ad1ff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>Información de la categoría</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'rgba(238, 244, 255, 0.65)', marginBottom: '4px' }}>Nombre *</label>
                <input
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                  placeholder="Ej. Documentos Legales"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: '8px',
                    padding: '7px 10px',
                    color: '#e6e7eb',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'rgba(238, 244, 255, 0.65)', marginBottom: '4px' }}>Descripción</label>
                <input
                  value={categoryDesc}
                  onChange={e => setCategoryDesc(e.target.value)}
                  placeholder="Descripción de la categoría"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: '8px',
                    padding: '7px 10px',
                    color: '#e6e7eb',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#9ad1ff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Secciones y campos <span style={{ fontSize: '10px', background: 'rgba(154, 209, 255, 0.12)', color: '#9ad1ff', padding: '2px 7px', borderRadius: '5px', border: '1px solid rgba(154, 209, 255, 0.20)', marginLeft: '6px' }}>{totalFields} campos</span></span>
                <button
                  onClick={addSection}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    borderRadius: '10px',
                    color: '#e6e7eb',
                    fontSize: '12px',
                    padding: '6px 12px',
                    cursor: 'pointer'
                  }}
                >
                  + Sección
                </button>
              </div>

              {sections.map((sec, si) => (
                <div key={sec.id} style={{ background: 'rgba(0, 0, 0, 0.18)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <input
                      value={sec.name}
                      onChange={e => updateSecName(si, e.target.value)}
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
                    {sections.length > 1 && (
                      <button
                        onClick={() => removeSection(si)}
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

                  {sec.fields.map((f, fi) => (
                    <FieldRow
                      key={f.id}
                      field={f}
                      onChange={v => updateField(si, fi, v)}
                      onRemove={() => removeField(si, fi)}
                    />
                  ))}

                  <button
                    onClick={() => addField(si)}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: '10px',
                      color: '#e6e7eb',
                      fontSize: '12px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      marginTop: '4px'
                    }}
                  >
                    + Campo
                  </button>
                </div>
              ))}
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
    </div>
  )
}
