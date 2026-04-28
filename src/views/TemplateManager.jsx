import { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Modal, Form, Input, message, Spin, Tag, Popconfirm } from 'antd'
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
      message.error('Error al cargar templates: ' + err.message)
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
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => editTemplate(record)}
          >
            Editar
          </Button>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => downloadTemplate(record)}
          >
            Descargar
          </Button>
          <Popconfirm
            title="Eliminar template"
            description="¿Estás seguro de que quieres eliminar este template?"
            onConfirm={() => deleteTemplate(record)}
            okText="Sí"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
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
      message.success('Template eliminado')
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
        message.success('Template actualizado')
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
        message.success('Template creado')
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
      <Card
        style={{ borderRadius: 0, margin: 0, height: '100%', display: 'flex', flexDirection: 'column', padding: 0 }}
        bodyStyle={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
        title={<><FileTextOutlined /> Gestión de Templates</>}
      >
        <Space style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedTemplate(null)
              form.resetFields()
              setIsModalVisible(true)
            }}
          >
            Crear Template
          </Button>
          <Button
            onClick={loadTemplates}
            loading={loading}
          >
            Actualizar
          </Button>
        </Space>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={templates}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Spin>
      </Card>

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
