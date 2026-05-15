import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, message, Spin, Tag, Popconfirm, Tooltip } from 'antd'
import { CloudOutlined, PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons'
import { supabase } from '../config/supabaseClient'

export default function TenantManager() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [tenants, setTenants] = useState([])
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(false)

  useEffect(() => {
    loadTenants()
  }, [])

  useEffect(() => {
    if (isModalVisible && selectedTenant) {
      form.setFieldsValue({
        nombre: selectedTenant.nombre || '',
        url: selectedTenant.url || '',
        tenant: selectedTenant.tenant || '',
        usuario: selectedTenant.usuario || '',
        password: selectedTenant.password || ''
      })
    } else if (isModalVisible && !selectedTenant) {
      form.resetFields()
    }
  }, [isModalVisible, selectedTenant, form])

  const loadTenants = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTenants(data || [])
    } catch (err) {
      message.error('Error al cargar tenants: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Nombre del Tenant',
      dataIndex: 'nombre',
      key: 'nombre',
      width: 200,
      render: (text) => <span style={{ fontWeight: '600', fontSize: '14px' }}>{text || '-'}</span>
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      width: 250,
      render: (text) => <span style={{ color: 'var(--accent-primary)', fontSize: '13px' }}>{text || '-'}</span>
    },
    {
      title: 'Tenant ID',
      dataIndex: 'tenant',
      key: 'tenant',
      width: 150,
      render: (text) => <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '12px' }}>{text || '-'}</span>
    },
    {
      title: 'Usuario',
      dataIndex: 'usuario',
      key: 'usuario',
      width: 150,
      render: (text) => <span>{text || '-'}</span>
    },
    {
      title: 'Creado',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (text) => text ? new Date(text).toLocaleString('es-ES') : '-'
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Abrir en nueva ventana">
            <Button
              type="link"
              size="small"
              icon={<LinkOutlined />}
              onClick={() => window.open(record.url, '_blank')}
            />
          </Tooltip>
          <Tooltip title="Editar tenant">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => editTenant(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Eliminar tenant"
            description="¿Estás seguro de que quieres eliminar este tenant?"
            onConfirm={() => deleteTenant(record)}
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

  const editTenant = (tenant) => {
    setSelectedTenant(tenant)
    setIsModalVisible(true)
  }

  const createNewTenant = () => {
    setSelectedTenant(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const deleteTenant = async (tenant) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenant.id)

      if (error) throw error
      setTenants(tenants.filter(t => t.id !== tenant.id))
      message.success('Tenant eliminado correctamente')
    } catch (err) {
      message.error('Error al eliminar tenant: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleModalOk = async (values) => {
    setLoading(true)
    try {
      if (selectedTenant) {
        // Actualizar
        const { error } = await supabase
          .from('tenants')
          .update({
            nombre: values.nombre,
            url: values.url,
            tenant: values.tenant,
            usuario: values.usuario,
            password: values.password,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTenant.id)

        if (error) throw error

        setTenants(tenants.map(t =>
          t.id === selectedTenant.id
            ? { ...t, ...values, updated_at: new Date().toISOString() }
            : t
        ))
        message.success('Tenant actualizado correctamente')
      } else {
        // Crear
        const { data, error } = await supabase
          .from('tenants')
          .insert([{
            nombre: values.nombre,
            url: values.url,
            tenant: values.tenant,
            usuario: values.usuario,
            password: values.password,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()

        if (error) throw error

        setTenants([data[0], ...tenants])
        message.success('Tenant creado correctamente')
      }

      setIsModalVisible(false)
      form.resetFields()
      setSelectedTenant(null)
    } catch (error) {
      message.error('Error al guardar tenant: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-xl)', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <CloudOutlined /> Gestión de Tenants
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={createNewTenant}
          size="large"
        >
          Nuevo Tenant
        </Button>
      </div>

      <Spin spinning={loading} style={{ display: 'flex', flex: 1 }}>
        <Table
          columns={columns}
          dataSource={tenants}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          style={{ width: '100%' }}
          scroll={{ x: 1200, y: 'calc(100vh - 250px)' }}
        />
      </Spin>

      <Modal
        title={selectedTenant ? 'Editar Tenant' : 'Crear Nuevo Tenant'}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalOk}
        >
          <Form.Item
            label="Nombre del Tenant"
            name="nombre"
            rules={[{ required: true, message: 'Nombre requerido' }]}
          >
            <Input placeholder="ej: BuildingCenter Producción" />
          </Form.Item>

          <Form.Item
            label="URL"
            name="url"
            rules={[
              { required: true, message: 'URL requerida' },
              { type: 'url', message: 'Debe ser una URL válida' }
            ]}
          >
            <Input placeholder="https://buildingcenter.thereforeonline.com" />
          </Form.Item>

          <Form.Item
            label="Tenant ID"
            name="tenant"
            rules={[{ required: true, message: 'Tenant ID requerido' }]}
          >
            <Input placeholder="buildingcenter" />
          </Form.Item>

          <Form.Item
            label="Usuario"
            name="usuario"
            rules={[{ required: true, message: 'Usuario requerido' }]}
          >
            <Input placeholder="admin@empresa.com" />
          </Form.Item>

          <Form.Item
            label="Contraseña"
            name="password"
            rules={[{ required: true, message: 'Contraseña requerida' }]}
          >
            <Input.Password placeholder="Contraseña" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
