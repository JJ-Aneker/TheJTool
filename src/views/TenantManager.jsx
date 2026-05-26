import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, message, Spin, Tag, Popconfirm, Tooltip, Checkbox } from 'antd'
import { CloudOutlined, PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined, GlobalOutlined, LockOutlined } from '@ant-design/icons'
import { supabase } from '../config/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { useRole } from '../hooks/useRole'
import '../styles/tenant-manager.css'

export default function TenantManager() {
  const [form] = Form.useForm()
  const { user } = useAuth()
  const { isAdmin } = useRole()
  const [loading, setLoading] = useState(false)
  const [tenants, setTenants] = useState([])
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [canEdit, setCanEdit] = useState(false)

  useEffect(() => {
    loadTenants()
  }, [user, isAdmin])

  useEffect(() => {
    if (isModalVisible && selectedTenant) {
      const isOwner = selectedTenant.owner_id === user?.id
      setCanEdit(isOwner || isAdmin)
      form.setFieldsValue({
        nombre: selectedTenant.nombre || '',
        url: selectedTenant.url || '',
        tenant: selectedTenant.tenant || '',
        usuario: selectedTenant.usuario || '',
        password: selectedTenant.password || '',
        shared: selectedTenant.shared || false
      })
    } else if (isModalVisible && !selectedTenant) {
      setCanEdit(true)
      form.resetFields()
    }
  }, [isModalVisible, selectedTenant, form, user, isAdmin])

  const loadTenants = async () => {
    if (!user) return

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
      width: 160,
      render: (text) => <span style={{ fontWeight: '600', fontSize: '14px' }}>{text || '-'}</span>
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      width: 180,
      render: (text) => <span style={{ color: 'var(--accent-primary)', fontSize: '13px' }}>{text || '-'}</span>
    },
    {
      title: 'Tenant ID',
      dataIndex: 'tenant',
      key: 'tenant',
      width: 90,
      render: (text) => <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '12px' }}>{text || '-'}</span>
    },
    {
      title: 'Usuario',
      dataIndex: 'usuario',
      key: 'usuario',
      width: 110,
      render: (text) => <span>{text || '-'}</span>
    },
    {
      title: 'Compartido',
      dataIndex: 'shared',
      key: 'shared',
      width: 85,
      render: (shared) => (
        <Tag icon={shared ? <GlobalOutlined /> : <LockOutlined />} color={shared ? 'blue' : 'default'}>
          {shared ? 'Público' : 'Privado'}
        </Tag>
      )
    },
    {
      title: 'Creado',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      render: (text) => text ? new Date(text).toLocaleString('es-ES') : '-'
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 110,
      fixed: 'right',
      render: (_, record) => {
        const isOwner = record.owner_id === user?.id
        // Siempre mostrar botones, pero dejar que el backend valide permisos
        // Si es owner o admin, puede modificar
        const canModify = isOwner || isAdmin

        return (
          <Space size="small" wrap>
            <Tooltip title="Abrir en nueva ventana">
              <Button
                type="link"
                size="small"
                icon={<LinkOutlined />}
                onClick={() => window.open(record.url, '_blank')}
              />
            </Tooltip>
            <Tooltip title={canModify ? 'Editar tenant' : 'Sin permiso'}>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                disabled={!canModify}
                onClick={() => editTenant(record)}
              />
            </Tooltip>
            <Popconfirm
              title="Eliminar tenant"
              description="¿Estás seguro de que quieres eliminar este tenant?"
              onConfirm={() => deleteTenant(record)}
              okText="Sí"
              cancelText="No"
              disabled={!canModify}
            >
              <Button
                type="link"
                danger
                size="small"
                icon={<DeleteOutlined />}
                disabled={!canModify}
              />
            </Popconfirm>
          </Space>
        )
      }
    }
  ]

  const editTenant = (tenant) => {
    setSelectedTenant(tenant)
    setIsModalVisible(true)
  }

  const createNewTenant = () => {
    setSelectedTenant(null)
    setCanEdit(true)
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
            shared: values.shared || false,
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
            shared: values.shared || false,
            owner_id: user.id,
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
    <div className="container-main" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-xl)', height: '100%' }}>
      {/* HEADER */}
      <div className="header-main">
        <h1 className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <CloudOutlined /> Gestión de Tenants
        </h1>
        <div className="header-actions">
          <button
            onClick={createNewTenant}
            className="btn-primary"
          >
            + Nuevo Tenant
          </button>
        </div>
      </div>

      <Spin spinning={loading} style={{ display: 'flex', flex: 1, minHeight: 0, width: '100%' }}>
        <Table
          columns={columns}
          dataSource={tenants}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          style={{ width: '100%' }}
          scroll={{ x: 'max-content', y: 'calc(100vh - 280px)' }}
          size="small"
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

          <Form.Item
            label="Compartir"
            name="shared"
            valuePropName="checked"
          >
            <Checkbox>
              Hacer este tenant visible para todos (públicamente)
            </Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
