import { useState, useEffect } from 'react'
import { Button, Modal, message, Input, Table, Space, Tag, Empty, Spin } from 'antd'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../config/supabaseClient'

export default function CategoryBuilder() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [xmlContent, setXmlContent] = useState('')
  const [templateName, setTemplateName] = useState('')
  const [templateDesc, setTemplateDesc] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.id) {
      loadTemplates()
    }
  }, [user?.id])

  const loadTemplates = async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await supabase
        .from('category_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (err) {
        setError(`Error loading templates: ${err.message}`)
        return
      }

      setTemplates(data || [])
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      message.error('Nombre requerido')
      return
    }
    if (!xmlContent.trim()) {
      message.error('XML requerido')
      return
    }

    setLoading(true)
    try {
      if (selectedTemplate?.id) {
        // Update
        const { error: err } = await supabase
          .from('category_templates')
          .update({
            name: templateName,
            description: templateDesc,
            xml_definition: xmlContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTemplate.id)

        if (err) throw err
        message.success('Plantilla actualizada')
      } else {
        // Insert
        const { error: err } = await supabase
          .from('category_templates')
          .insert({
            template_id: `cat_${Date.now()}`,
            name: templateName,
            description: templateDesc,
            xml_definition: xmlContent,
            created_by: user.id,
            compartido: false
          })

        if (err) throw err
        message.success('Plantilla guardada')
      }

      setXmlContent('')
      setTemplateName('')
      setTemplateDesc('')
      setSelectedTemplate(null)
      await loadTemplates()
    } catch (err) {
      message.error(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicate = async (template) => {
    try {
      const { error: err } = await supabase
        .from('category_templates')
        .insert({
          template_id: `cat_${Date.now()}`,
          name: `${template.name} (Copia)`,
          description: template.description,
          xml_definition: template.xml_definition,
          created_by: user.id,
          compartido: false
        })

      if (err) throw err
      message.success('Plantilla duplicada')
      await loadTemplates()
    } catch (err) {
      message.error(`Error: ${err.message}`)
    }
  }

  const handleDownload = (template) => {
    const a = document.createElement('a')
    a.href = 'data:application/xml;charset=utf-8,' + encodeURIComponent(template.xml_definition)
    a.download = `${template.name.replace(/\s+/g, '_')}_therefore.xml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleToggleShare = async (template) => {
    try {
      const { error: err } = await supabase
        .from('category_templates')
        .update({ compartido: !template.compartido })
        .eq('id', template.id)

      if (err) throw err
      message.success(template.compartido ? 'Privada' : 'Compartida')
      await loadTemplates()
    } catch (err) {
      message.error(`Error: ${err.message}`)
    }
  }

  const handleDelete = async (templateId) => {
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

  const handleLoadTemplate = (template) => {
    setSelectedTemplate(template)
    setTemplateName(template.name)
    setTemplateDesc(template.description || '')
    setXmlContent(template.xml_definition)
    setModalOpen(false)
  }

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchText.toLowerCase())
  )

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Estado',
      dataIndex: 'compartido',
      key: 'compartido',
      render: (compartido) => (
        <Tag color={compartido ? 'blue' : 'default'}>
          {compartido ? 'Compartida' : 'Privada'}
        </Tag>
      ),
      width: 120
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            onClick={() => handleLoadTemplate(record)}
          >
            Cargar
          </Button>
          <Button
            size="small"
            onClick={() => handleToggleShare(record)}
          >
            {record.compartido ? 'Privada' : 'Compartir'}
          </Button>
          <Button
            size="small"
            onClick={() => handleDuplicate(record)}
          >
            Copiar
          </Button>
          <Button
            size="small"
            onClick={() => handleDownload(record)}
          >
            Descar
          </Button>
          <Button
            danger
            size="small"
            onClick={() => handleDelete(record.id)}
          >
            ✕
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '20px' }}>🏗️ Generador de Categorías</h1>

      {error && (
        <div style={{
          background: 'rgba(255, 100, 100, 0.1)',
          color: '#ff6464',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #ff6464'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px' }}>
        {/* Editor Panel */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{ marginBottom: '16px' }}>
            {selectedTemplate ? '✏️ Editar' : '➕ Nueva Plantilla'}
          </h3>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
              Nombre *
            </label>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Ej. Categoría Legal"
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
              Descripción
            </label>
            <Input.TextArea
              value={templateDesc}
              onChange={(e) => setTemplateDesc(e.target.value)}
              placeholder="Descripción..."
              rows={2}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
              XML Definition *
            </label>
            <textarea
              value={xmlContent}
              onChange={(e) => setXmlContent(e.target.value)}
              placeholder="Pega el XML aquí..."
              style={{
                width: '100%',
                minHeight: '300px',
                padding: '10px',
                fontFamily: 'monospace',
                fontSize: '11px',
                border: '1px solid var(--border-default)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-canvas)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              type="primary"
              onClick={handleSaveTemplate}
              loading={loading}
            >
              {selectedTemplate ? 'Actualizar' : 'Guardar'}
            </Button>
            {selectedTemplate && (
              <Button onClick={() => {
                setSelectedTemplate(null)
                setTemplateName('')
                setTemplateDesc('')
                setXmlContent('')
              }}>
                Cancelar
              </Button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <h4 style={{ margin: '0 0 12px 0' }}>Mis Plantillas</h4>
            <Input.Search
              placeholder="Buscar..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="small"
              style={{ marginBottom: '12px' }}
            />
            <Button
              block
              onClick={() => setModalOpen(true)}
            >
              Ver todas ({templates.length})
            </Button>
          </div>

          {selectedTemplate && (
            <div style={{
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              padding: '12px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                {selectedTemplate.name}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Creado: {new Date(selectedTemplate.created_at).toLocaleDateString('es-ES')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Templates Modal */}
      <Modal
        title="Plantillas de Categoría"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        width={1000}
        footer={null}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Empty description="No hay plantillas" />
        ) : (
          <Table
            columns={columns}
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
