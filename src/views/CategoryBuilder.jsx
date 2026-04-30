import { useState, useEffect } from 'react'
import { Table, Button, Modal, message, Spin, Space, Tag, Input, Empty, Upload } from 'antd'
import { DeleteOutlined, EditOutlined, CopyOutlined, DownloadOutlined, ShareOutlined, LockOutlined } from '@ant-design/icons'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../config/supabaseClient'
import '../styles/category-builder.css'

export default function CategoryBuilder() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [managerOpen, setManagerOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [xmlContent, setXmlContent] = useState('')
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [fileList, setFileList] = useState([])

  // Load templates on mount
  useEffect(() => {
    loadTemplates()
  }, [user?.id])

  const loadTemplates = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('category_templates')
        .select('*')
        .or(`created_by.eq.${user.id},compartido.eq.true`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (err) {
      message.error('Error cargando plantillas: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async (templateId) => {
    try {
      const { error } = await supabase
        .from('category_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error
      message.success('Plantilla eliminada')
      loadTemplates()
    } catch (err) {
      message.error('Error eliminando: ' + err.message)
    }
  }

  const handleDuplicateTemplate = async (template) => {
    try {
      const newXml = template.xml_definition
      const { error } = await supabase
        .from('category_templates')
        .insert({
          template_id: `${template.template_id}_copy_${Date.now()}`,
          name: `${template.name} (Copia)`,
          description: template.description,
          xml_definition: newXml,
          csv_data: template.csv_data,
          created_by: user.id,
          compartido: false
        })

      if (error) throw error
      message.success('Plantilla duplicada')
      loadTemplates()
    } catch (err) {
      message.error('Error duplicando: ' + err.message)
    }
  }

  const handleDownloadTemplate = (template) => {
    const a = document.createElement('a')
    a.href = 'data:application/xml;charset=utf-8,' + encodeURIComponent(template.xml_definition)
    a.download = (template.name.replace(/\s+/g, '_') || 'categoria') + '_therefore.xml'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleShareTemplate = async (template) => {
    try {
      const { error } = await supabase
        .from('category_templates')
        .update({ compartido: !template.compartido })
        .eq('id', template.id)

      if (error) throw error
      message.success(template.compartido ? 'Plantilla privada' : 'Plantilla compartida')
      loadTemplates()
    } catch (err) {
      message.error('Error al compartir: ' + err.message)
    }
  }

  const handleLoadTemplate = (template) => {
    setSelectedTemplate(template)
    setXmlContent(template.xml_definition)
    setTemplateName(template.name)
    setTemplateDescription(template.description)
    setManagerOpen(false)
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      message.error('El nombre es obligatorio')
      return
    }
    if (!xmlContent.trim()) {
      message.error('El contenido XML es obligatorio')
      return
    }

    try {
      if (selectedTemplate?.id) {
        // Update existing template
        const { error } = await supabase
          .from('category_templates')
          .update({
            name: templateName,
            description: templateDescription,
            xml_definition: xmlContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTemplate.id)

        if (error) throw error
        message.success('Plantilla actualizada')
      } else {
        // Insert new template
        const { error } = await supabase
          .from('category_templates')
          .insert({
            template_id: `cat_${Date.now()}`,
            name: templateName,
            description: templateDescription,
            xml_definition: xmlContent,
            created_by: user.id,
            compartido: false
          })

        if (error) throw error
        message.success('Plantilla guardada')
      }

      // Reset form
      setXmlContent('')
      setTemplateName('')
      setTemplateDescription('')
      setSelectedTemplate(null)
      loadTemplates()
    } catch (err) {
      message.error('Error guardando: ' + err.message)
    }
  }

  const handleUploadXml = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target.result
        setXmlContent(content)
        message.success('XML cargado')
      } catch (err) {
        message.error('Error leyendo archivo: ' + err.message)
      }
    }
    reader.readAsText(file)
    return false
  }

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchText.toLowerCase()))
  )

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>,
      width: '30%'
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
      width: '35%',
      render: (text) => text || <span style={{ color: 'var(--text-muted)' }}>-</span>
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
      width: '15%'
    },
    {
      title: 'Creado',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      width: '20%'
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: '20%',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleLoadTemplate(record)}
            title="Cargar"
          />
          <Button
            size="small"
            icon={record.compartido ? <LockOutlined /> : <ShareOutlined />}
            onClick={() => handleShareTemplate(record)}
            title={record.compartido ? 'Hacer privada' : 'Compartir'}
          />
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleDuplicateTemplate(record)}
            title="Duplicar"
          />
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadTemplate(record)}
            title="Descargar XML"
          />
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: 'Confirmar eliminación',
                content: `¿Estás seguro de que quieres eliminar "${record.name}"?`,
                okText: 'Eliminar',
                cancelText: 'Cancelar',
                okButtonProps: { danger: true },
                onOk: () => handleDeleteTemplate(record.id)
              })
            }}
            title="Eliminar"
          />
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 16px 0' }}>
          🏗️ Generador de Categorías
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Crea y gestiona plantillas de categorías para Therefore™ Solution Designer
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px' }}>
        {/* Editor */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '8px', padding: '20px', border: '1px solid var(--border-default)' }}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px 0' }}>
              {selectedTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
            </h2>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Nombre *
            </label>
            <Input
              placeholder="Ej. Categoria Legal"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              style={{ marginBottom: '12px' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Descripción
            </label>
            <Input.TextArea
              placeholder="Descripción de la plantilla..."
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              rows={3}
              style={{ marginBottom: '12px' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              XML Definition *
            </label>
            <Upload
              accept=".xml"
              maxCount={1}
              beforeUpload={handleUploadXml}
              style={{ marginBottom: '12px' }}
            >
              <Button>Cargar XML</Button>
            </Upload>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <textarea
              value={xmlContent}
              onChange={(e) => setXmlContent(e.target.value)}
              placeholder="O pega el contenido XML aquí..."
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
            <Button type="primary" onClick={handleSaveTemplate}>
              {selectedTemplate ? 'Actualizar' : 'Guardar'} Plantilla
            </Button>
            {selectedTemplate && (
              <Button onClick={() => {
                setSelectedTemplate(null)
                setXmlContent('')
                setTemplateName('')
                setTemplateDescription('')
              }}>
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div style={{ background: 'var(--bg-card)', borderRadius: '8px', padding: '16px', border: '1px solid var(--border-default)', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '600', margin: '0 0 12px 0', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Mis Plantillas
            </h3>
            <Input.Search
              placeholder="Buscar..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ marginBottom: '12px' }}
              size="small"
            />
            <Button
              block
              onClick={() => setManagerOpen(true)}
              style={{ marginTop: '8px' }}
            >
              Ver todas ({filteredTemplates.length})
            </Button>
          </div>

          {selectedTemplate && (
            <div style={{ background: 'var(--bg-canvas)', borderRadius: '8px', padding: '12px', border: '1px solid var(--border-default)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <strong>Editando:</strong>
              </div>
              <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
                {selectedTemplate.name}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Creado: {new Date(selectedTemplate.created_at).toLocaleDateString('es-ES')}
              </div>
            </div>
          )}
        </div>
      </div>

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
            placeholder="Buscar por nombre o descripción..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: '400px' }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Empty
            description={searchText ? 'Sin resultados' : 'No hay plantillas creadas'}
            style={{ padding: '40px' }}
          />
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
