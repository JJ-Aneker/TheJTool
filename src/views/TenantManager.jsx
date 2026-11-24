import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Spin, Tag, Popconfirm, Tooltip, Checkbox, Dropdown } from 'antd'
import { message } from '../utils/message'
import HelpButton from '../components/HelpButton'
import { CloudOutlined, PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined, GlobalOutlined, LockOutlined, MoreOutlined } from '@ant-design/icons'
import { formatShortDate, formatFullDate } from '../utils/format'
import { supabase } from '../config/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { useMessages } from '../utils/i18nMessages'
import { handleError } from '../utils/errorHandler'
import { useRole } from '../hooks/useRole'
import '../styles/tenant-manager.css'

export default function TenantManager() {
  const { t } = useTranslation()
  const MESSAGES = useMessages()
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
      handleError(err, 'cargar tenants', false); message.error(MESSAGES.ERROR.LOAD('tenants') + ': ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const confirmDeleteTenant = (record) => {
    Modal.confirm({
      title: `¿Eliminar la instancia «${record.nombre || record.tenant}»?`,
      content: 'Se borrará su configuración en theJay. Esta acción no se puede deshacer.',
      okText: 'Eliminar',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: () => deleteTenant(record)
    })
  }

  const columns = [
    {
      title: 'Instancia',
      key: 'nombre',
      sorter: (a, b) => (a.nombre || '').localeCompare(b.nombre || ''),
      render: (_, record) => (
        <div className="cell-stack">
          <span className="cell-title">{record.nombre || '—'}</span>
          <span className="cell-sub">{record.url || '—'}</span>
        </div>
      )
    },
    {
      title: 'Tenant ID',
      dataIndex: 'tenant',
      key: 'tenant',
      render: (text) => <span className="cell-mono">{text || '—'}</span>
    },
    {
      title: 'Tipo',
      dataIndex: 'is_on_premise',
      key: 'is_on_premise',
      width: 130,
      render: (isOnPremise) => <Tag className="tag-neutral">{isOnPremise ? 'On-Premise' : 'Cloud'}</Tag>
    },
    {
      title: 'Usuario',
      dataIndex: 'usuario',
      key: 'usuario',
      render: (text) => <span className="cell-muted">{text || '—'}</span>
    },
    {
      title: 'Acceso',
      dataIndex: 'shared',
      key: 'shared',
      width: 130,
      render: (shared) => (
        <span className="cell-inline">
          {shared ? <GlobalOutlined /> : <LockOutlined />}
          {shared ? 'Compartida' : 'Privada'}
        </span>
      )
    },
    {
      title: 'Alta',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (value) => (
        <Tooltip title={formatFullDate(value)}>
          <span className="cell-muted">{formatShortDate(value)}</span>
        </Tooltip>
      )
    },
    {
      title: <span className="sr-only">Acciones</span>,
      key: 'actions',
      width: 56,
      align: 'right',
      render: (_, record) => {
        // El backend valida permisos; aquí solo se desactivan las opciones
        const canModify = record.owner_id === user?.id || isAdmin
        const items = [
          { key: 'open', icon: <LinkOutlined />, label: 'Abrir en una pestaña nueva', disabled: !record.url, onClick: () => window.open(record.url, '_blank', 'noopener') },
          { key: 'edit', icon: <EditOutlined />, label: 'Editar', disabled: !canModify, onClick: () => editTenant(record) },
          { type: 'divider' },
          { key: 'delete', icon: <DeleteOutlined />, label: 'Eliminar', danger: true, disabled: !canModify, onClick: () => confirmDeleteTenant(record) }
        ]
        return (
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            <Button type="text" size="small" icon={<MoreOutlined />} aria-label={`Acciones: ${record.nombre || record.tenant}`} />
          </Dropdown>
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
        message.success(MESSAGES.SUCCESS.UPDATE('Tenant'))
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
        message.success(MESSAGES.SUCCESS.CREATE('Tenant'))
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
        <h1 className="header-title">Instancias</h1>
        <div className="header-actions">
          <HelpButton section="tenantManager" />
          <button
            onClick={createNewTenant}
            className="btn-primary"
          >
            <PlusOutlined /> Nueva instancia
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, minWidth: 0 }}>
        {loading && <Spin style={{ position: 'absolute', zIndex: 10 }} />}
        <Table
          className="data-table"
          columns={columns}
          dataSource={tenants}
          rowKey="id"
          pagination={{ pageSize: 20, hideOnSinglePage: true }}
          style={{ width: '100%' }}
          scroll={{ y: 'calc(100vh - 260px)' }}
          loading={loading}
          locale={{ emptyText: 'Aún no hay instancias. Añade la primera con «Nueva instancia».' }}
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
            <Input placeholder={t('tenantManager.namePlaceholder')} />
          </Form.Item>

          <Form.Item
            label="URL"
            name="url"
            rules={[
              { required: true, message: 'URL requerida' },
              { type: 'url', message: 'Debe ser una URL válida' }
            ]}
          >
            <Input placeholder={t('tenantManager.serverPlaceholder')} />
          </Form.Item>

          <Form.Item
            label="Tenant ID"
            name="tenant"
            rules={[]}
            tooltip="Requerido solo para instancias cloud; dejar vacío para on-premise"
          >
            <Input placeholder={t('tenantManager.tenantNamePlaceholder')} />
          </Form.Item>

          <Form.Item
            label="Usuario"
            name="usuario"
            rules={[{ required: true, message: 'Usuario requerido' }]}
          >
            <Input placeholder={t('tenantManager.emailPlaceholder')} />
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
