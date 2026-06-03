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
        is_on_premise: selectedTenant.is_on_premise || false,
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
      render: (text) => <span style={{ fontWeight: '600', fontSize: '14px' }}>{text || '-'}</span>
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      render: (text) => <span style={{ color: 'var(--accent-primary)', fontSize: '13px' }}>{text || '-'}</span>
    },
    {
      title: 'Tenant ID',
      dataIndex: 'tenant',
      key: 'tenant',
      render: (text) => <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '12px' }}>{text || '-'}</span>
    },
    {
      title: 'Tipo',
      dataIndex: 'is_on_premise',
      key: 'is_on_premise',
      render: (isOnPremise) => (
        <Tag color={isOnPremise ? 'default' : 'blue'}>
          {isOnPremise ? 'On-Premise' : 'Cloud'}
        </Tag>
      )
    },
    {
      title: 'Usuario',
      dataIndex: 'usuario',
      key: 'usuario',
      render: (text) => <span>{text || '-'}</span>
    },
    {
      title: 'Compartido',
      dataIndex: 'shared',
      key: 'shared',
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
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Tooltip title="Abrir en nueva ventana">
              <button
                className="btn-link"
                onClick={() => window.open(record.url, '_blank')}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <LinkOutlined style={{ fontSize: '12px' }} />
              </button>
            </Tooltip>
            <Tooltip title={canModify ? 'Editar tenant' : 'Sin permiso'}>
              <button
                className="btn-link"
                disabled={!canModify}
                onClick={() => editTenant(record)}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: canModify ? 1 : 0.5, cursor: canModify ? 'pointer' : 'not-allowed' }}
              >
                <EditOutlined style={{ fontSize: '12px' }} />
              </button>
            </Tooltip>
            <Popconfirm
              title="Eliminar tenant"
              description="¿Estás seguro de que quieres eliminar este tenant?"
              onConfirm={() => deleteTenant(record)}
              okText="Sí"
              cancelText="No"
              disabled={!canModify}
            >
              <button
                className="btn-link danger"
                disabled={!canModify}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: canModify ? 1 : 0.5, cursor: canModify ? 'pointer' : 'not-allowed' }}
              >
                <DeleteOutlined style={{ fontSize: '12px' }} />
              </button>
            </Popconfirm>
          </div>
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
        // Debug: Check auth info
        const { data: authUser } = await supabase.auth.getUser()
        console.log('👤 Auth UID actual:', authUser?.user?.id)
        console.log('👤 Tenant owner_id:', selectedTenant.owner_id)
        console.log('👤 ¿Es propietario?:', authUser?.user?.id === selectedTenant.owner_id)

        // Actualizar
        const updateData = {
          nombre: values.nombre,
          url: values.url,
          tenant: values.tenant,
          usuario: values.usuario,
          password: values.password,
          shared: values.shared || false,
          updated_at: new Date().toISOString()
        }
        // Only include is_on_premise if it exists in values
        if ('is_on_premise' in values) {
          updateData.is_on_premise = values.is_on_premise || false
        }

        console.log('📝 Actualizando tenant ID:', selectedTenant.id)
        console.log('📝 Datos a guardar:', { ...updateData, password: '***' })

        const { data, error } = await supabase
          .from('tenants')
          .update(updateData)
          .eq('id', selectedTenant.id)
          .select()

        console.log('📝 Respuesta de UPDATE:', { data, error })

        if (error) {
          console.error('❌ Error en UPDATE:', error)
          throw new Error(`Error al guardar: ${error.message} (${error.code})`)
        }

        if (!data || data.length === 0) {
          console.warn('⚠️ UPDATE no afectó ningún registro')
          throw new Error('El registro no fue actualizado (posible problema de RLS o permiso)')
        }

        console.log('✅ UPDATE exitoso:', data)

        const updatedTenant = { ...selectedTenant, ...values, updated_at: new Date().toISOString() }
        setTenants(tenants.map(t =>
          t.id === selectedTenant.id ? updatedTenant : t
        ))
        setSelectedTenant(updatedTenant)
        message.success('Tenant actualizado correctamente')
      } else {
        // Crear
        const insertData = {
          nombre: values.nombre,
          url: values.url,
          tenant: values.tenant,
          usuario: values.usuario,
          password: values.password,
          shared: values.shared || false,
          owner_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        // Only include is_on_premise if it exists in values
        if ('is_on_premise' in values) {
          insertData.is_on_premise = values.is_on_premise || false
        }

        const { data, error } = await supabase
          .from('tenants')
          .insert([insertData])
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
    <div className="container-main" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-xl)', height: '100%', minWidth: 0, overflow: 'hidden' }}>
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

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, minWidth: 0 }}>
        {loading && <Spin style={{ position: 'absolute', zIndex: 10 }} />}
        <Table
          columns={columns}
          dataSource={tenants}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          style={{ width: '100%' }}
          scroll={{ y: 'calc(100vh - 280px)' }}
          size="small"
          loading={loading}
        />
      </div>

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
            rules={[]}
            tooltip="Requerido solo para instancias cloud; dejar vacío para on-premise"
          >
            <Input placeholder="buildingcenter (opcional para on-premise)" />
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
            label="Tipo de instalación"
            name="is_on_premise"
            valuePropName="checked"
            tooltip="Marca si es on-premise. Los on-premise no envían TenantName en la cabecera"
          >
            <Checkbox>
              Esta es una instalación On-Premise (no usar TenantName)
            </Checkbox>
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
