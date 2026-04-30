import { useState, useEffect } from 'react'
import { Button, Modal, message, Input, Table, Space, Tag, Empty, Spin, Upload } from 'antd'
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
    placeholder: headers.findIndex(h => ['placeholder', 'ayuda', 'hint'].includes(h)),
    default: headers.findIndex(h => ['default', 'defecto', 'defaultvalue'].includes(h)),
    maxlength: headers.findIndex(h => ['maxlength', 'max', 'longitud'].includes(h)),
    seccion: headers.findIndex(h => ['seccion', 'sección', 'section', 'grupo', 'group'].includes(h)),
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
            placeholder="Nombre;Tipo;Obligatorio;Sección\nNombre completo;Text;Si;DATOS PERSONALES"
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
          <div>
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
                boxSizing: 'border-box',
                marginBottom: '8px'
              }}
            />
          </div>
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
      console.error('Error cargando plantillas:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const saveTemplateToSupabase = async () => {
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
        message.success('Plantilla actualizada')
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
        message.success('Plantilla guardada')
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

    // Simple XML generation
    const fieldsXml = sections.map((sec, si) => {
      const secFields = sec.fields.filter(f => f.nombre.trim()).map(f => `    <Field><Name>${f.nombre}</Name><Key>${f.fieldKey || toCamelKey(f.nombre)}</Key><Type>${f.tipo}</Type><Required>${f.required ? '1' : '0'}</Required></Field>`).join('\n')
      return `  <Section name="${sec.name}">\n${secFields}\n  </Section>`
    }).join('\n')

    setXml(`<?xml version="1.0" encoding="utf-8"?>
<Category>
  <Name>${categoryName}</Name>
  <Description>${categoryDesc}</Description>
${fieldsXml}
</Category>`)
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
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0' }}>🏗️ Generador de Categorías</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0' }}>Crea plantillas de categorías para Therefore™</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveView('editor')}
            style={{
              padding: '8px 16px',
              background: activeView === 'editor' ? 'var(--accent-primary)' : 'var(--bg-card)',
              color: activeView === 'editor' ? 'white' : 'var(--text-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            ✎ Editor
          </button>
          <button
            onClick={() => setActiveView('preview')}
            style={{
              padding: '8px 16px',
              background: activeView === 'preview' ? 'var(--accent-primary)' : 'var(--bg-card)',
              color: activeView === 'preview' ? 'white' : 'var(--text-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            👁 Vista previa
          </button>
          <button
            onClick={() => setManagerOpen(true)}
            style={{
              padding: '8px 16px',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            📁 Mis plantillas ({templates.length})
          </button>
        </div>
      </div>

      {activeView === 'preview' ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '20px' }}>
          <h3>Vista previa: {categoryName || 'Categoría'}</h3>
          {sections.map((sec, si) => (
            <div key={si} style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent-primary)', textTransform: 'uppercase', margin: '0 0 12px 0' }}>
                {sec.name}
              </h4>
              {sec.fields.filter(f => f.nombre).map((f, fi) => (
                <div key={fi} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" />
                  <label>{f.nombre}{f.required && <span style={{ color: '#ff6464' }}>*</span>}</label>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* LEFT */}
          <div>
            <CsvImporter onImport={handleCsvImport} />
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: '0', fontSize: '14px', fontWeight: '600' }}>Secciones y campos ({totalFields})</h3>
                <button
                  onClick={addSection}
                  style={{
                    padding: '6px 12px',
                    background: 'var(--accent-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  + Sección
                </button>
              </div>

              {sections.map((sec, si) => (
                <div key={sec.id} style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-default)', borderRadius: '6px', padding: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                    <input
                      value={sec.name}
                      onChange={e => updateSecName(si, e.target.value)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        border: '1px solid var(--border-default)',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        boxSizing: 'border-box'
                      }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>({sec.fields.filter(f => f.nombre).length})</span>
                    {sections.length > 1 && (
                      <button
                        onClick={() => removeSection(si)}
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(255, 100, 100, 0.1)',
                          border: '1px solid rgba(255, 100, 100, 0.3)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: '#ff6464'
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
                      padding: '8px 12px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      marginTop: '8px'
                    }}
                  >
                    + Campo
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>Información</h3>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Nombre de la categoría</label>
                <input
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                  placeholder="Ej. Documentos Legales"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid var(--border-default)',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: 'var(--bg-canvas)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Descripción</label>
                <textarea
                  value={categoryDesc}
                  onChange={e => setCategoryDesc(e.target.value)}
                  placeholder="Descripción de la categoría..."
                  style={{
                    width: '100%',
                    height: '60px',
                    padding: '8px 10px',
                    border: '1px solid var(--border-default)',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: 'var(--bg-canvas)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>
              <button
                onClick={saveTemplateToSupabase}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: 'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                {selectedTemplate ? '💾 Actualizar plantilla' : '💾 Guardar plantilla'}
              </button>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '16px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>Generar XML</h3>
              {error && (
                <div style={{ background: 'rgba(255, 100, 100, 0.1)', color: '#ff6464', padding: '8px 12px', borderRadius: '4px', marginBottom: '12px', fontSize: '12px' }}>
                  ⚠ {error}
                </div>
              )}
              <button
                onClick={generateXml}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: 'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}
              >
                Generar XML →
              </button>
              {xml && (
                <div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <button
                      onClick={copy}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: 'var(--bg-canvas)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {copied ? '✓ Copiado' : '📋 Copiar'}
                    </button>
                    <button
                      onClick={download}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: 'var(--bg-canvas)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: 'var(--text-primary)'
                      }}
                    >
                      ⬇ Descargar
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={xml}
                    style={{
                      width: '100%',
                      height: '200px',
                      padding: '10px',
                      border: '1px solid var(--border-default)',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '10px',
                      backgroundColor: 'var(--bg-canvas)',
                      color: 'var(--accent-primary)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manager Modal */}
      <Modal
        title="Mis Plantillas de Categoría"
        open={managerOpen}
        onCancel={() => setManagerOpen(false)}
        width={1000}
        footer={null}
      >
        <div style={{ marginBottom: '16px' }}>
          <Input.Search
            placeholder="Buscar..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </div>
        {loading ? (
          <Spin />
        ) : filteredTemplates.length === 0 ? (
          <Empty description="No hay plantillas" />
        ) : (
          <Table
            columns={[
              { title: 'Nombre', dataIndex: 'name', key: 'name' },
              {
                title: 'Estado', dataIndex: 'compartido', key: 'compartido',
                render: c => <Tag color={c ? 'blue' : 'default'}>{c ? 'Compartida' : 'Privada'}</Tag>
              },
              {
                title: 'Acciones', key: 'actions', width: 200,
                render: (_, r) => (
                  <Space size="small">
                    <Button size="small" onClick={() => loadTemplate(r)}>Cargar</Button>
                    <Button size="small" onClick={() => downloadTemplate(r)}>Descar</Button>
                    <Button danger size="small" onClick={() => deleteTemplate(r.id)}>✕</Button>
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
