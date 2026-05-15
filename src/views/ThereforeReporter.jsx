import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, message, Spin, Popconfirm, Tooltip, Card, Empty, Tabs } from 'antd'
import { ThunderboltOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { supabase } from '../config/supabaseClient'
import { useAuth } from '../hooks/useAuth'

export default function ThereforeReporter() {
  const { user } = useAuth()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [profiles, setProfiles] = useState([])
  const [tenants, setTenants] = useState([])
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('profiles')
  const [reportData, setReportData] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadTenants()
      loadProfiles()
    }
  }, [user])

  useEffect(() => {
    if (isModalVisible && selectedProfile) {
      form.setFieldsValue({
        nombre: selectedProfile.nombre || '',
        tenant_id: selectedProfile.tenant_id || '',
        descripcion: selectedProfile.descripcion || ''
      })
    } else if (isModalVisible && !selectedProfile) {
      form.resetFields()
    }
  }, [isModalVisible, selectedProfile, form])

  const loadTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, nombre, url, tenant')
        .order('nombre', { ascending: true })

      if (error) throw error
      setTenants(data || [])
    } catch (err) {
      console.error('Error loading tenants:', err.message)
    }
  }

  const loadProfiles = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('reporter_profiles')
        .select(`
          *,
          tenants:tenant_id (id, nombre, url, tenant, usuario)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProfiles(data || [])
    } catch (err) {
      message.error('Error al cargar perfiles: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Nombre del Perfil',
      dataIndex: 'nombre',
      key: 'nombre',
      width: 200,
      render: (text) => <span style={{ fontWeight: '600', fontSize: '14px' }}>{text || '-'}</span>
    },
    {
      title: 'Servidor (Tenant)',
      key: 'tenant_nombre',
      width: 250,
      render: (_, record) => (
        <span style={{ color: 'var(--accent-primary)' }}>
          {record.tenants?.nombre || '-'}
        </span>
      )
    },
    {
      title: 'URL del Servidor',
      key: 'tenant_url',
      width: 250,
      render: (_, record) => (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {record.tenants?.url || '-'}
        </span>
      )
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      width: 200,
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
          <Tooltip title="Ver datos extraídos">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => viewProfileData(record)}
            />
          </Tooltip>
          <Tooltip title="Editar perfil">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => editProfile(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Eliminar perfil"
            description="¿Estás seguro de que quieres eliminar este perfil?"
            onConfirm={() => deleteProfile(record)}
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

  const editProfile = (profile) => {
    setSelectedProfile(profile)
    setIsModalVisible(true)
  }

  const createNewProfile = () => {
    setSelectedProfile(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const viewProfileData = async (profile) => {
    setReportLoading(true)
    try {
      // Aquí iría la lógica para extraer datos del servidor
      // Por ahora, será un placeholder
      setReportData({
        nombre: profile.nombre,
        tenant: profile.tenants?.nombre,
        url: profile.tenants?.url,
        datos: {
          documentos: 0,
          casos: 0,
          usuarios: 0,
          workflows: 0
        }
      })
      setActiveTab('datos')
    } catch (err) {
      message.error('Error al extraer datos: ' + err.message)
    } finally {
      setReportLoading(false)
    }
  }

  const deleteProfile = async (profile) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('reporter_profiles')
        .delete()
        .eq('id', profile.id)

      if (error) throw error
      setProfiles(profiles.filter(p => p.id !== profile.id))
      message.success('Perfil eliminado correctamente')
    } catch (err) {
      message.error('Error al eliminar perfil: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleModalOk = async (values) => {
    if (!user) {
      message.error('Usuario no autenticado')
      return
    }

    setLoading(true)
    try {
      if (selectedProfile) {
        // Actualizar
        const { error } = await supabase
          .from('reporter_profiles')
          .update({
            nombre: values.nombre,
            tenant_id: values.tenant_id,
            descripcion: values.descripcion,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedProfile.id)

        if (error) throw error

        setProfiles(profiles.map(p =>
          p.id === selectedProfile.id
            ? { ...p, ...values, updated_at: new Date().toISOString() }
            : p
        ))
        message.success('Perfil actualizado correctamente')
      } else {
        // Crear
        const { data, error } = await supabase
          .from('reporter_profiles')
          .insert([{
            user_id: user.id,
            nombre: values.nombre,
            tenant_id: values.tenant_id,
            descripcion: values.descripcion,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select(`
            *,
            tenants:tenant_id (id, nombre, url, tenant, usuario)
          `)

        if (error) throw error

        setProfiles([data[0], ...profiles])
        message.success('Perfil creado correctamente')
      }

      setIsModalVisible(false)
      form.resetFields()
      setSelectedProfile(null)
    } catch (error) {
      message.error('Error al guardar perfil: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const tenantOptions = tenants.map(t => ({
    label: `${t.nombre} (${t.tenant})`,
    value: t.id
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-xl)', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <ThunderboltOutlined /> Therefore Reporter
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={createNewProfile}
          size="large"
        >
          Nuevo Perfil
        </Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
        items={[
          {
            key: 'profiles',
            label: 'Mis Perfiles',
            children: (
              <Spin spinning={loading} style={{ display: 'flex', flex: 1 }}>
                {profiles.length === 0 ? (
                  <Empty
                    description="No hay perfiles creados"
                    style={{ marginTop: '50px', flex: 1 }}
                  />
                ) : (
                  <Table
                    columns={columns}
                    dataSource={profiles}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    style={{ width: '100%' }}
                    scroll={{ x: 1300, y: 'calc(100vh - 250px)' }}
                  />
                )}
              </Spin>
            )
          },
          {
            key: 'datos',
            label: 'Datos Extraídos',
            children: reportLoading ? (
              <Spin spinning style={{ marginTop: '50px' }} />
            ) : reportData ? (
              <Card style={{ marginTop: '20px' }}>
                <h3>{reportData.nombre}</h3>
                <p><strong>Servidor:</strong> {reportData.tenant}</p>
                <p><strong>URL:</strong> {reportData.url}</p>
                <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                  <Card>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                        {reportData.datos.documentos}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Documentos</div>
                    </div>
                  </Card>
                  <Card>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                        {reportData.datos.casos}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Casos</div>
                    </div>
                  </Card>
                  <Card>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                        {reportData.datos.usuarios}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Usuarios</div>
                    </div>
                  </Card>
                  <Card>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                        {reportData.datos.workflows}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Workflows</div>
                    </div>
                  </Card>
                </div>
              </Card>
            ) : (
              <Empty description="Selecciona un perfil y haz clic en 'Ver datos' para extraer información" style={{ marginTop: '50px' }} />
            )
          }
        ]}
      />

      <Modal
        title={selectedProfile ? 'Editar Perfil' : 'Crear Nuevo Perfil'}
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
            label="Nombre del Perfil"
            name="nombre"
            rules={[{ required: true, message: 'Nombre requerido' }]}
          >
            <Input placeholder="ej: Reportes de Matrículas" />
          </Form.Item>

          <Form.Item
            label="Servidor (Tenant)"
            name="tenant_id"
            rules={[{ required: true, message: 'Servidor requerido' }]}
          >
            <Select
              placeholder="Selecciona un servidor"
              options={tenantOptions}
            />
          </Form.Item>

          <Form.Item
            label="Descripción (opcional)"
            name="descripcion"
          >
            <Input.TextArea
              placeholder="Descripción del perfil de reporte"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
