import { useState, useEffect } from 'react'
import { Table, Button, Modal, message, Spin, Space, Tag, Input, Empty } from 'antd'
import { DeleteOutlined, EditOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../config/supabaseClient'

export default function EFormManager() {
  const { user } = useAuth()
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedForm, setSelectedForm] = useState(null)
  const [searchText, setSearchText] = useState('')

  // Load forms on mount
  useEffect(() => {
    loadForms()
  }, [user?.id])

  const loadForms = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('eforms')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setForms(data || [])
    } catch (err) {
      message.error('Error cargando formularios: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedForm) return

    try {
      const { error } = await supabase
        .from('eforms')
        .delete()
        .eq('id', selectedForm.id)

      if (error) throw error
      message.success('Formulario eliminado')
      setDeleteModalOpen(false)
      setSelectedForm(null)
      loadForms()
    } catch (err) {
      message.error('Error eliminando: ' + err.message)
    }
  }

  const handleDuplicate = async (form) => {
    try {
      const { error } = await supabase
        .from('eforms')
        .insert({
          form_id: `${form.form_id}_copy_${Date.now()}`,
          name: `${form.name} (Copia)`,
          definition: form.definition,
          description: form.description,
          created_by: user.id
        })

      if (error) throw error
      message.success('Formulario duplicado')
      loadForms()
    } catch (err) {
      message.error('Error duplicando: ' + err.message)
    }
  }

  const handleDownload = (form) => {
    const a = document.createElement('a')
    a.href = 'data:application/xml;charset=utf-8,' + encodeURIComponent(form.definition)
    a.download = (form.name.replace(/\s+/g, '_') || 'eform') + '.xml'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const filteredForms = forms.filter(f =>
    f.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (f.description && f.description.toLowerCase().includes(searchText.toLowerCase()))
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
      width: '15%',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              // TODO: Load form into EFormBuilder for editing
              message.info('Función en desarrollo')
            }}
            title="Editar"
          />
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleDuplicate(record)}
            title="Duplicar"
          />
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
            title="Descargar XML"
          />
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => {
              setSelectedForm(record)
              setDeleteModalOpen(true)
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
          📚 Mis Formularios
        </h1>
        <Input
          placeholder="Buscar por nombre o descripción..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ maxWidth: '400px', marginBottom: '16px' }}
        />
        <Button onClick={loadForms} loading={loading}>
          Actualizar
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      ) : filteredForms.length === 0 ? (
        <Empty
          description={searchText ? 'Sin resultados' : 'No hay formularios creados'}
          style={{ padding: '40px' }}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={filteredForms}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="small"
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        title="Confirmar eliminación"
        open={deleteModalOpen}
        onOk={handleDelete}
        onCancel={() => {
          setDeleteModalOpen(false)
          setSelectedForm(null)
        }}
        okText="Eliminar"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
      >
        <p>¿Estás seguro de que quieres eliminar <strong>"{selectedForm?.name}"</strong>?</p>
        <p style={{ color: 'var(--accent-error)', fontSize: '12px' }}>
          Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  )
}
