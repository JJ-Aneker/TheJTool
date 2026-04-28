import { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Avatar, Space, message, Spin, Tabs, Alert, Divider, Row, Col } from 'antd'
import { UserOutlined, MailOutlined, PhoneOutlined, TeamOutlined, EnvironmentOutlined, SaveOutlined, LockOutlined } from '@ant-design/icons'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../config/supabaseClient'

export default function UserProfile() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState(null)
  const [activeTab, setActiveTab] = useState('profile')
  const { user, updatePassword } = useAuth()

  useEffect(() => {
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setProfile(data)
      form.setFieldsValue({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        department: data.department,
        role: data.role,
        status: data.status
      })
    } catch (err) {
      console.error('Error loading profile:', err)
      // Crear perfil básico si no existe
      setProfile({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || '',
        phone: user.user_metadata?.phone || '',
        department: user.user_metadata?.department || '',
        role: user.user_metadata?.role || 'user',
        status: 'active'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (values) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: values.full_name,
          phone: values.phone,
          department: values.department,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setProfile({ ...profile, ...values })
      message.success('Perfil actualizado exitosamente')
    } catch (err) {
      message.error('Error al actualizar perfil: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      const result = await updatePassword(values.newPassword)
      if (result.success) {
        message.success('Contraseña actualizada exitosamente')
        form.resetFields()
      } else {
        message.error(result.error || 'Error al cambiar contraseña')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!profile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  const getRoleColor = (role) => {
    const colors = {
      admin: 'red',
      manager: 'orange',
      user: 'blue',
      auditor: 'purple'
    }
    return colors[role] || 'default'
  }

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrador',
      manager: 'Gerente',
      user: 'Usuario',
      auditor: 'Auditor'
    }
    return labels[role] || role
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Card>
        {/* Encabezado con avatar y info básica */}
        <Row gutter={24} style={{ marginBottom: '32px' }}>
          <Col xs={24} sm={6} style={{ textAlign: 'center' }}>
            <Avatar
              size={120}
              src={profile.avatar_url}
              icon={<UserOutlined />}
              style={{ backgroundColor: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={18}>
            <h2 style={{ margin: '0 0 8px 0' }}>{profile.full_name || 'Usuario'}</h2>
            <p style={{ color: '#8c8c8c', marginBottom: '16px' }}>
              {profile.email}
            </p>
            <Space wrap>
              <div style={{
                padding: '8px 12px',
                background: '#f0f2f5',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                <strong>Rol:</strong> {getRoleLabel(profile.role)}
              </div>
              <div style={{
                padding: '8px 12px',
                background: profile.status === 'active' ? '#f6ffed' : '#fff1f0',
                borderRadius: '4px',
                fontSize: '12px',
                color: profile.status === 'active' ? '#52c41a' : '#ff4d4f'
              }}>
                <strong>Estado:</strong> {profile.status === 'active' ? 'Activo' : 'Inactivo'}
              </div>
            </Space>
          </Col>
        </Row>

        <Divider />

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'profile',
              label: 'Mi Perfil',
              children: (
                <Spin spinning={loading}>
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdateProfile}
                  >
                    <Form.Item
                      label="Nombre Completo"
                      name="full_name"
                      rules={[{ required: true, message: 'Nombre requerido' }]}
                    >
                      <Input
                        prefix={<UserOutlined />}
                        placeholder="Tu nombre completo"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      label="Email"
                      name="email"
                    >
                      <Input
                        prefix={<MailOutlined />}
                        disabled
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      label="Teléfono"
                      name="phone"
                    >
                      <Input
                        prefix={<PhoneOutlined />}
                        placeholder="+34 912 345 678"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      label="Departamento"
                      name="department"
                    >
                      <Input
                        prefix={<EnvironmentOutlined />}
                        placeholder="Tu departamento"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      label="Rol"
                      name="role"
                    >
                      <Input disabled size="large" />
                    </Form.Item>

                    <Form.Item
                      label="Estado"
                      name="status"
                    >
                      <Input disabled size="large" />
                    </Form.Item>

                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      icon={<SaveOutlined />}
                      block
                      loading={loading}
                    >
                      Guardar Cambios
                    </Button>
                  </Form>
                </Spin>
              )
            },
            {
              key: 'password',
              label: 'Cambiar Contraseña',
              children: (
                <Spin spinning={loading}>
                  <Alert
                    message="Seguridad"
                    description="Por favor ingresa una contraseña segura con al menos 8 caracteres"
                    type="info"
                    showIcon
                    style={{ marginBottom: '24px' }}
                  />

                  <Form
                    layout="vertical"
                    onFinish={handleChangePassword}
                  >
                    <Form.Item
                      label="Nueva Contraseña"
                      name="newPassword"
                      rules={[
                        { required: true, message: 'Contraseña requerida' },
                        { min: 8, message: 'Mínimo 8 caracteres' }
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="Nueva contraseña"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      label="Confirmar Contraseña"
                      name="confirmPassword"
                      rules={[
                        { required: true, message: 'Confirma tu contraseña' }
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="Repite la contraseña"
                        size="large"
                      />
                    </Form.Item>

                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      icon={<LockOutlined />}
                      block
                      loading={loading}
                    >
                      Cambiar Contraseña
                    </Button>
                  </Form>
                </Spin>
              )
            },
            {
              key: 'info',
              label: 'Información',
              children: (
                <div>
                  <h4>Información de tu Cuenta</h4>
                  <table style={{ width: '100%' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '8px', fontWeight: 'bold' }}>ID de Usuario:</td>
                        <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '12px' }}>
                          {user.id}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px', fontWeight: 'bold' }}>Email Confirmado:</td>
                        <td style={{ padding: '8px' }}>
                          {user.email_confirmed_at ? 'Sí' : 'No'}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px', fontWeight: 'bold' }}>Cuenta Creada:</td>
                        <td style={{ padding: '8px' }}>
                          {new Date(user.created_at).toLocaleString('es-ES')}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px', fontWeight: 'bold' }}>Última Actualización:</td>
                        <td style={{ padding: '8px' }}>
                          {new Date(user.updated_at).toLocaleString('es-ES')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )
            }
          ]}
        />
      </Card>
    </div>
  )
}
