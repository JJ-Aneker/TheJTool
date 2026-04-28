import { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Modal, Form, Input, message, Spin, Tag, Popconfirm, Tooltip } from 'antd'
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
      message.error('Error al cargar servicios: ' + err.message)
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
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: 'URL Base',
      dataIndex: 'url_base',
      key: 'url_base',
      width: 200,
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
      width: 120,
      render: (text) => <code>{text}</code>
    },
    {
      title: 'Contraseña',
      dataIndex: 'password',
      key: 'password',
      width: 120,
      render: (text, record) => (
        <Space size={0}>
          <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
            {showPassword[record.id] ? text : '••••••••'}
          </span>
          <Button
            type="text"
            size="small"
            icon={showPassword[record.id] ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => setShowPassword({
              ...showPassword,
              [record.id]: !showPassword[record.id]
            })}
          />
        </Space>
      )
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
            onClick={() => editService(record)}
          >
            Editar
          </Button>
          <Button
            type="link"
            size="small"
            icon={<LinkOutlined />}
            onClick={() => testConnection(record)}
          >
            Probar
          </Button>
          <Popconfirm
            title="Eliminar servicio"
            description="¿Estás seguro de que quieres eliminar este servicio?"
            onConfirm={() => deleteService(record)}
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
      message.success('Servicio eliminado')
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
        message.success('Servicio actualizado')
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
        message.success('Servicio creado')
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
      <Card
        style={{ borderRadius: 0, margin: 0, height: '100%', display: 'flex', flexDirection: 'column', padding: 0 }}
        bodyStyle={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
        title={<><CloudOutlined /> Gestión de Servicios Web</>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0, flex: 1 }}>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setSelectedService(null)
                form.resetFields()
                setIsModalVisible(true)
              }}
            >
              Crear Servicio
            </Button>
            <Button
              onClick={loadServices}
              loading={loading}
            >
              Actualizar
            </Button>
          </Space>

          <Spin spinning={loading} style={{ flex: 1, minHeight: 0 }}>
            <Table
              columns={columns}
              dataSource={services}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
            />
          </Spin>
        </div>
      </Card>

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
