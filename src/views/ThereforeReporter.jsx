import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, message, Spin, Popconfirm, Tooltip, Card, Empty, Tabs } from 'antd'
import { ThunderboltOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons'
import { supabase } from '../config/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { useRole } from '../hooks/useRole'
import { thereforeService } from '../services/thereforeService'

export default function ThereforeReporter() {
  const { user } = useAuth()
  const { isAdmin } = useRole()
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
  }, [user, isAdmin])

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
  }, [isModalVisible, selectedProfile])

  const loadTenants = async () => {
    if (!user) return

    try {
      let query = supabase
        .from('tenants')
        .select('id, nombre, url, tenant, shared, owner_id')

      // Filtro en la app: admins ven todos, usuarios normales ven sus propios + compartidos
      if (!isAdmin) {
        query = query.or(`owner_id.eq.${user.id},shared.eq.true`)
      }

      const { data, error } = await query.order('nombre', { ascending: true })

      if (error) throw error
      setTenants(data || [])
    } catch (err) {
      console.error('Error loading tenants:', err.message)
      message.error('Error al cargar tenants: ' + err.message)
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
          tenants:tenant_id (id, nombre, url, tenant, usuario, shared, owner_id)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Filtro en la app: solo perfiles del usuario actual
      const filteredProfiles = data?.filter(p => p.user_id === user.id) || []
      setProfiles(filteredProfiles)
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

  const refreshReportData = async () => {
    if (!reportData || !reportData.id) return

    const profile = profiles.find(p => p.id === reportData.id)
    if (profile) {
      await viewProfileData(profile)
    }
  }

  const viewProfileData = async (profile) => {
    setReportLoading(true)
    try {
      if (!profile.tenants?.url || !profile.tenants?.usuario) {
        message.error('El tenant no tiene URL o credenciales configuradas')
        setReportLoading(false)
        return
      }

      // Extract credentials from tenant
      const url = profile.tenants.url.replace(/\/$/, '') + '/theservice/v0001/restun'
      const usuario = profile.tenants.usuario
      const password = profile.tenants?.password || ''

      // Fetch report data from Therefore
      const datos = await thereforeService.extractReportData(url, usuario, password)

      setReportData({
        id: profile.id,
        nombre: profile.nombre,
        tenant: profile.tenants?.nombre,
        url: profile.tenants?.url,
        datos,
        extractedAt: new Date().toISOString()
      })
      setActiveTab('datos')
    } catch (err) {
      const errorMsg = err.message || 'Error desconocido al extraer datos'

      // Mostrar error específico
      if (errorMsg.includes('Credenciales')) {
        message.error('❌ Credenciales inválidas. Verifica el usuario y contraseña en la configuración del tenant.')
      } else if (errorMsg.includes('timeout')) {
        message.error('⏱️ El servidor Therefore tarda demasiado en responder. Intenta de nuevo.')
      } else if (errorMsg.includes('CORS')) {
        message.error('🔒 Error CORS: Contacta al administrador para configurar el acceso.')
      } else {
        message.error('❌ Error: ' + errorMsg)
      }

      // Aún así mostrar un reporte vacío para que vea la estructura
      setReportData({
        id: profile.id,
        nombre: profile.nombre,
        tenant: profile.tenants?.nombre,
        url: profile.tenants?.url,
        datos: {
          documentos: 0,
          casos: 0,
          usuarios: 0,
          workflows: 0
        },
        error: errorMsg,
        extractedAt: new Date().toISOString()
      })
      setActiveTab('datos')
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
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              loadTenants()
              loadProfiles()
            }}
            loading={loading}
            title="Recargar datos"
          >
            Recargar
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={createNewProfile}
            size="large"
            disabled={tenants.length === 0}
            title={tenants.length === 0 ? 'Primero debes crear un tenant en Gestión de Tenants' : ''}
          >
            Nuevo Perfil
          </Button>
        </Space>
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
              <Spin spinning style={{ marginTop: '50px' }} tip="Extrayendo datos del servidor..." />
            ) : reportData ? (
              <Card style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>{reportData.nombre}</h3>
                    <p style={{ margin: '5px 0', color: 'var(--text-secondary)' }}><strong>Servidor:</strong> {reportData.tenant}</p>
                    <p style={{ margin: '5px 0', color: 'var(--text-secondary)', fontSize: '12px' }}><strong>URL:</strong> {reportData.url}</p>
                  </div>
                  <Space direction="vertical" align="end">
                    {reportData.extractedAt && (
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Actualizado: {new Date(reportData.extractedAt).toLocaleString('es-ES')}
                      </p>
                    )}
                    <Button
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={refreshReportData}
                      loading={reportLoading}
                    >
                      Refrescar
                    </Button>
                  </Space>
                </div>

                {reportData.error && (
                  <div style={{
                    marginTop: '15px',
                    marginBottom: '20px',
                    padding: '12px 15px',
                    backgroundColor: '#fff7e6',
                    border: '1px solid #ffc069',
                    borderRadius: '4px',
                    color: '#d46b08'
                  }}>
                    <strong>⚠️ Advertencia:</strong> {reportData.error}
                  </div>
                )}

                <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  <Card hoverable style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent-primary)', marginBottom: '8px' }}>
                      {reportData.datos.documentos.toLocaleString('es-ES')}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Documentos</div>
                  </Card>
                  <Card hoverable style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent-primary)', marginBottom: '8px' }}>
                      {reportData.datos.casos.toLocaleString('es-ES')}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Casos</div>
                  </Card>
                  <Card hoverable style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent-primary)', marginBottom: '8px' }}>
                      {reportData.datos.usuarios.toLocaleString('es-ES')}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Usuarios</div>
                  </Card>
                  <Card hoverable style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent-primary)', marginBottom: '8px' }}>
                      {reportData.datos.workflows.toLocaleString('es-ES')}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Workflows</div>
                  </Card>
                </div>
              </Card>
            ) : (
              <Empty
                description="Selecciona un perfil y haz clic en el ojo para extraer información"
                style={{ marginTop: '100px' }}
              />
            )
          }
        ]}
      />

      <Modal
        title={selectedProfile ? '✏️ Editar Perfil' : '➕ Crear Nuevo Perfil'}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalVisible(false)
          setSelectedProfile(null)
          form.resetFields()
        }}
        confirmLoading={loading}
        width={600}
        okText={selectedProfile ? 'Actualizar' : 'Crear'}
        cancelText="Cancelar"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalOk}
          autoComplete="off"
        >
          <Form.Item
            label="Nombre del Perfil"
            name="nombre"
            rules={[
              { required: true, message: 'El nombre es requerido' },
              { min: 3, message: 'El nombre debe tener al menos 3 caracteres' },
              { max: 100, message: 'El nombre no puede exceder 100 caracteres' }
            ]}
          >
            <Input
              placeholder="ej: Reportes de Matrículas"
              maxLength={100}
            />
          </Form.Item>

          <Form.Item
            label="Servidor (Tenant)"
            name="tenant_id"
            rules={[{ required: true, message: 'Debes seleccionar un servidor' }]}
            tooltip="Selecciona el servidor Therefore que deseas monitorear"
          >
            <Select
              placeholder="Selecciona un servidor"
              options={tenantOptions}
              notFoundContent={
                tenants.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)' }}>
                    No hay servidores disponibles. Crea uno en Gestión de Tenants.
                  </div>
                ) : undefined
              }
            />
          </Form.Item>

          <Form.Item
            label="Descripción (opcional)"
            name="descripcion"
          >
            <Input.TextArea
              placeholder="Descripción del propósito de este perfil de reporte"
              rows={3}
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
