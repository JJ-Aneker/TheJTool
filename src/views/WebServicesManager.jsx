import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, message, Spin, Tag, Popconfirm, Tooltip } from 'antd'
import { CloudOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, LinkOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import { supabase } from '../config/supabaseClient'

export default function WebServicesManager() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [showPassword, setShowPassword] = useState({})

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('web_services')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setServices(data || [])
    } catch (err) {
      handleError(err, 'cargar servicios', false); message.error(MESSAGES.ERROR.LOAD('servicios') + ': ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Nombre del Servicio',
      dataIndex: 'servername',
      key: 'servername',
      render: (text) => <strong>{text || '-'}</strong>
    },
    {
      title: 'Tenant',
      dataIndex: 'tenant_name',
      key: 'tenant_name',
      render: (text) => text || '-'
    },
    {
      title: 'URL Base',
      dataIndex: 'url_base',
      key: 'url_base',
      render: (text) => (
        <Tooltip title={text}>
          <a href={text} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px' }}>
            {text?.substring(0, 30)}...
          </a>
        </Tooltip>
      )
    },
    {
      title: 'Usuario',
      dataIndex: 'username',
      key: 'username',
      render: (text) => <code>{text}</code>
    },
    {
      title: 'Contraseña',
      dataIndex: 'password',
      key: 'password',
      render: (text, record) => (
        <Space size={0}>
          <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
            {showPassword[record.id] ? text : '••••••••'}
          </span>
          <button
            className="btn-link"
            onClick={() => setShowPassword({
              ...showPassword,
              [record.id]: !showPassword[record.id]
            })}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}
          >
            {showPassword[record.id] ? <EyeInvisibleOutlined style={{ fontSize: '12px' }} /> : <EyeOutlined style={{ fontSize: '12px' }} />}
          </button>
        </Space>
      )
    },
    {
      title: 'Creado',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => text ? new Date(text).toLocaleString('es-ES') : '-'
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-link"
            onClick={() => editService(record)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <EditOutlined style={{ fontSize: '12px' }} /> Editar
          </button>
          <button
            className="btn-link"
            onClick={() => testConnection(record)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <LinkOutlined style={{ fontSize: '12px' }} /> Probar
          </button>
          <Popconfirm
            title="Eliminar servicio"
            description="¿Estás seguro de que quieres eliminar este servicio?"
            onConfirm={() => deleteService(record)}
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

  const editService = (service) => {
    setSelectedService(service)
    form.setFieldsValue({
      servername: service.servername,
      tenant_name: service.tenant_name,
      url_base: service.url_base,
      username: service.username,
      password: service.password,
      observaciones: service.observaciones
    })
    setIsModalVisible(true)
  }

  const deleteService = async (service) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('web_services')
        .delete()
        .eq('id', service.id)

      if (error) throw error
      setServices(services.filter(s => s.id !== service.id))
      message.success(MESSAGES.SUCCESS.DELETE('Servicio'))
    } catch (err) {
      message.error('Error al eliminar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async (service) => {
    message.loading('Probando conexión...')
    try {
      const response = await fetch(service.url_base, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${service.username}:${service.password}`)
        }
      })

      if (response.ok || response.status === 403 || response.status === 401) {
        message.success('Conexión exitosa')
      } else {
        message.error(`Error: ${response.status} ${response.statusText}`)
      }
    } catch (err) {
      message.error('Error de conexión: ' + err.message)
    }
  }

  const handleModalOk = async (values) => {
    setLoading(true)
    try {
      if (selectedService) {
        const { error } = await supabase
          .from('web_services')
          .update({
            servername: values.servername,
            tenant_name: values.tenant_name,
            url_base: values.url_base,
            username: values.username,
            password: values.password,
            observaciones: values.observaciones
          })
          .eq('id', selectedService.id)

        if (error) throw error
        setServices(services.map(s =>
          s.id === selectedService.id
            ? { ...s, ...values }
            : s
        ))
        message.success(MESSAGES.SUCCESS.UPDATE('Servicio'))
      } else {
        const { data, error } = await supabase
          .from('web_services')
          .insert([{
            servername: values.servername,
            tenant_name: values.tenant_name,
            url_base: values.url_base,
            username: values.username,
            password: values.password,
            observaciones: values.observaciones,
            created_at: new Date().toISOString()
          }])
          .select()

        if (error) throw error
        setServices([...services, ...data])
        message.success(MESSAGES.SUCCESS.CREATE('Servicio'))
      }

      setIsModalVisible(false)
      form.resetFields()
      setSelectedService(null)
    } catch (err) {
      message.error('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="container-main" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-xl)', minWidth: 0, overflow: 'hidden' }}>
        {/* HEADER */}
        <div className="header-main">
          <h1 className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <CloudOutlined /> Gestión de Servicios Web
          </h1>
          <div className="header-actions">
            <button
              className="btn-primary"
              onClick={() => {
                setSelectedService(null)
                form.resetFields()
                setIsModalVisible(true)
              }}
            >
              + Crear Servicio
            </button>
            <button
              className="btn-default"
              onClick={loadServices}
              disabled={loading}
            >
              🔄 Actualizar
            </button>
          </div>
        </div>

        <Spin spinning={loading} style={{ flex: 1, minHeight: 0, minWidth: 0, width: '100%', overflow: 'auto' }}>
          <Table
            columns={columns}
            dataSource={services}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ y: 'calc(100vh - 280px)' }}
          />
        </Spin>
      </div>

      <Modal
        title={selectedService ? 'Editar Servicio Web' : 'Crear Nuevo Servicio Web'}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
          setSelectedService(null)
        }}
        confirmLoading={loading}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalOk}
        >
          <Form.Item
            label="Nombre del Servicio"
            name="servername"
          >
            <Input placeholder="Ej: BuildingCenter API" />
          </Form.Item>

          <Form.Item
            label="Nombre del Tenant"
            name="tenant_name"
          >
            <Input placeholder="Ej: BuildingCenter" />
          </Form.Item>

          <Form.Item
            label="URL Base"
            name="url_base"
            rules={[
              { required: true, message: 'URL requerida' },
              { type: 'url', message: 'URL inválida' }
            ]}
          >
            <Input placeholder="https://api.example.com" />
          </Form.Item>

          <Form.Item
            label="Usuario"
            name="username"
            rules={[{ required: true, message: 'Usuario requerido' }]}
          >
            <Input placeholder="Usuario de acceso" />
          </Form.Item>

          <Form.Item
            label="Contraseña"
            name="password"
            rules={[{ required: true, message: 'Contraseña requerida' }]}
          >
            <Input.Password placeholder="Contraseña de acceso" />
          </Form.Item>

          <Form.Item
            label="Observaciones"
            name="observaciones"
          >
            <Input.TextArea rows={3} placeholder="Notas adicionales sobre este servicio" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
