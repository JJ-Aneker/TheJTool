import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Spin, Tag, Popconfirm, Tooltip, Dropdown } from 'antd'
import { message } from '../utils/message'
import HelpButton from '../components/HelpButton'
import { CloudOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, LinkOutlined, EyeOutlined, EyeInvisibleOutlined, ReloadOutlined, MoreOutlined } from '@ant-design/icons'
import { formatShortDate, formatFullDate } from '../utils/format'
import { supabase } from '../config/supabaseClient'
import { useTranslation } from 'react-i18next'
import { useMessages } from '../utils/i18nMessages'

export default function WebServicesManager() {
  const { t } = useTranslation()
  const MESSAGES = useMessages()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(false)

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

  const confirmDeleteService = (record) => {
    Modal.confirm({
      title: `¿Eliminar el servicio «${record.servername || 'sin nombre'}»?`,
      content: 'Se borrarán su URL y credenciales guardadas. Esta acción no se puede deshacer.',
      okText: 'Eliminar',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: () => deleteService(record)
    })
  }

  // La contraseña no se muestra en la tabla: se consulta y cambia desde «Editar»
  const columns = [
    {
      title: 'Servicio',
      key: 'servername',
      sorter: (a, b) => (a.servername || '').localeCompare(b.servername || ''),
      render: (_, record) => (
        <div className="cell-stack">
          <span className="cell-title">{record.servername || '—'}</span>
          <Tooltip title={record.url_base}>
            <span className="cell-sub">{record.url_base || '—'}</span>
          </Tooltip>
        </div>
      )
    },
    {
      title: 'Instancia',
      dataIndex: 'tenant_name',
      key: 'tenant_name',
      render: (text) => <span className="cell-muted">{text || '—'}</span>
    },
    {
      title: 'Usuario',
      dataIndex: 'username',
      key: 'username',
      render: (text) => <span className="cell-mono">{text || '—'}</span>
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
        const items = [
          { key: 'test', icon: <LinkOutlined />, label: 'Probar conexión', onClick: () => testConnection(record) },
          { key: 'edit', icon: <EditOutlined />, label: 'Editar', onClick: () => editService(record) },
          { type: 'divider' },
          { key: 'delete', icon: <DeleteOutlined />, label: 'Eliminar', danger: true, onClick: () => confirmDeleteService(record) }
        ]
        return (
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            <Button type="text" size="small" icon={<MoreOutlined />} aria-label={`Acciones: ${record.servername || 'servicio'}`} />
          </Dropdown>
        )
      }
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
          <h1 className="header-title">Servicios web</h1>
          <div className="header-actions">
            <HelpButton section="webServices" />
            <button
              className="btn-default"
              onClick={loadServices}
              disabled={loading}
            >
              <ReloadOutlined /> Actualizar
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                setSelectedService(null)
                form.resetFields()
                setIsModalVisible(true)
              }}
            >
              <PlusOutlined /> Nuevo servicio
            </button>
          </div>
        </div>

        <Spin spinning={loading} style={{ flex: 1, minHeight: 0, minWidth: 0, width: '100%', overflow: 'auto' }}>
          <Table
            className="data-table"
            columns={columns}
            dataSource={services}
            rowKey="id"
            pagination={{ pageSize: 20, hideOnSinglePage: true }}
            scroll={{ y: 'calc(100vh - 260px)' }}
            locale={{ emptyText: 'Aún no hay servicios. Añade el primero con «Nuevo servicio».' }}
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
