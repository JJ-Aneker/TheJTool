import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Spin, Tag, Popconfirm } from 'antd'
import { message } from '../utils/message'
import { FileTextOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, DownloadOutlined } from '@ant-design/icons'
import { supabase } from '../config/supabaseClient'

export default function TemplateManager() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('therefore_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (err) {
      handleError(err, 'cargar templates', false); message.error(MESSAGES.ERROR.LOAD('templates') + ': ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || '-'
    },
    {
      title: 'Tamaño CSV',
      key: 'size',
      width: 120,
      render: (_, record) => {
        const size = record.csv_data ? record.csv_data.length : 0
        return (size / 1024).toFixed(2) + ' KB'
      }
    },
    {
      title: 'Creado',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => text ? new Date(text).toLocaleString('es-ES') : '-'
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-link"
            onClick={() => editTemplate(record)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <EditOutlined style={{ fontSize: '12px' }} /> Editar
          </button>
          <button
            className="btn-link"
            onClick={() => downloadTemplate(record)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <DownloadOutlined style={{ fontSize: '12px' }} /> Descargar
          </button>
          <Popconfirm
            title="Eliminar template"
            description="¿Estás seguro de que quieres eliminar este template?"
            onConfirm={() => deleteTemplate(record)}
            okText="Sí"
            cancelText="No"
          >
            <button
              className="btn-link danger"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <DeleteOutlined style={{ fontSize: '12px' }} />
            </button>
          </Popconfirm>
        </div>
      )
    }
  ]

  const editTemplate = (template) => {
    setSelectedTemplate(template)
    form.setFieldsValue({
      name: template.name,
      description: template.description,
      csv_data: template.csv_data
    })
    setIsModalVisible(true)
  }

  const deleteTemplate = async (template) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('therefore_templates')
        .delete()
        .eq('id', template.id)

      if (error) throw error
      setTemplates(templates.filter(t => t.id !== template.id))
      message.success(MESSAGES.SUCCESS.DELETE('Template'))
    } catch (err) {
      message.error('Error al eliminar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = (template) => {
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(template.csv_data))
    element.setAttribute('download', `${template.name}.csv`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    message.success('Template descargado')
  }

  const handleModalOk = async (values) => {
    setLoading(true)
    try {
      if (selectedTemplate) {
        const { error } = await supabase
          .from('therefore_templates')
          .update({
            name: values.name,
            description: values.description,
            csv_data: values.csv_data
          })
          .eq('id', selectedTemplate.id)

        if (error) throw error
        setTemplates(templates.map(t =>
          t.id === selectedTemplate.id
            ? { ...t, ...values }
            : t
        ))
        message.success(MESSAGES.SUCCESS.UPDATE('Template'))
      } else {
        const { data, error } = await supabase
          .from('therefore_templates')
          .insert([{
            name: values.name,
            description: values.description,
            csv_data: values.csv_data,
            created_at: new Date().toISOString()
          }])
          .select()

        if (error) throw error
        setTemplates([...templates, ...data])
        message.success(MESSAGES.SUCCESS.CREATE('Template'))
      }

      setIsModalVisible(false)
      form.resetFields()
      setSelectedTemplate(null)
    } catch (err) {
      message.error('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-xl)', height: '100%', minWidth: 0, overflow: 'hidden' }}>
        <div className="header-main">
          <h1 className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <FileTextOutlined /> Gestión de Templates
          </h1>
          <div className="header-actions">
            <button
              className="btn-primary"
              onClick={() => {
                setSelectedTemplate(null)
                form.resetFields()
                setIsModalVisible(true)
              }}
            >
              + Crear Template
            </button>
            <button
              className="btn-default"
              onClick={loadTemplates}
              disabled={loading}
            >
              🔄 Actualizar
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, minWidth: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Spin size="large" />
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={templates}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              style={{ width: '100%' }}
            />
          )}
        </div>
      </div>

      <Modal
        title={selectedTemplate ? 'Editar Template' : 'Crear Nuevo Template'}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
          setSelectedTemplate(null)
        }}
        confirmLoading={loading}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalOk}
        >
          <Form.Item
            label="Nombre"
            name="name"
            rules={[{ required: true, message: 'Nombre requerido' }]}
          >
            <Input placeholder="Nombre del template" />
          </Form.Item>

          <Form.Item
            label="Descripción"
            name="description"
          >
            <Input.TextArea rows={2} placeholder="Descripción del template" />
          </Form.Item>

          <Form.Item
            label="Datos CSV"
            name="csv_data"
            rules={[{ required: true, message: 'Datos CSV requeridos' }]}
          >
            <Input.TextArea
              rows={8}
              placeholder="Pega aquí los datos CSV"
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
