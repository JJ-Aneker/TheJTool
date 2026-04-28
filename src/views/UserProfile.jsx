import { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Avatar, Space, message, Spin, Tabs, Alert, Divider, Row, Col, Upload } from 'antd'
import { UserOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined, SaveOutlined, LockOutlined, CameraOutlined } from '@ant-design/icons'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../config/supabaseClient'
import { storageService } from '../services/storageService'

export default function UserProfile() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
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
        .eq('user_id', user.id)
        .single()

      if (error) throw error

      setProfile(data)
      form.setFieldsValue({
        name: data.name || '',
        surname: data.surname || '',
        email: user.email,
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        province: data.province || '',
        postal: data.postal || '',
        role: data.role || ''
      })
    } catch (err) {
      console.error('Error loading profile:', err)
      try {
        const newProfile = {
          user_id: user.id,
          name: user.user_metadata?.name || '',
          surname: user.user_metadata?.surname || '',
          email: user.email,
          phone: user.user_metadata?.phone || '',
          address: user.user_metadata?.address || '',
          city: user.user_metadata?.city || '',
          province: user.user_metadata?.province || '',
          postal: user.user_metadata?.postal || '',
          role: user.user_metadata?.role || 'user',
          approved: false,
          created_at: new Date().toISOString()
        }
        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single()

        if (createError) throw createError
        setProfile(createdProfile)
        form.setFieldsValue({
          name: createdProfile.name,
          surname: createdProfile.surname,
          email: user.email,
          phone: createdProfile.phone,
          address: createdProfile.address,
          city: createdProfile.city,
          province: createdProfile.province,
          postal: createdProfile.postal,
          role: createdProfile.role
        })
      } catch (createErr) {
        console.error('Error creating profile:', createErr)
        message.error('No se pudo cargar el perfil')
      }
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
          name: values.name,
          surname: values.surname,
          phone: values.phone,
          address: values.address,
          city: values.city,
          province: values.province,
          postal: values.postal,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

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

  const handleAvatarUpload = async (file) => {
    setAvatarLoading(true)
    try {
      const result = await storageService.uploadAvatar(file, user.id)
      if (result.success) {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: result.url })
          .eq('user_id', user.id)

        if (error) throw error

        setProfile({ ...profile, avatar_url: result.url })
        message.success('Avatar actualizado exitosamente')
      } else {
        message.error('Error al cargar avatar: ' + result.error)
      }
    } catch (err) {
      message.error('Error al actualizar avatar: ' + err.message)
    } finally {
      setAvatarLoading(false)
    }
    return false
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
    <Card
      style={{ borderRadius: 0, margin: 0, height: '100%', display: 'flex', flexDirection: 'column', padding: 0 }}
      bodyStyle={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
      title={<><UserOutlined /> Mi Perfil</>}
    >
        {/* Encabezado con avatar y info básica */}
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={6} style={{ textAlign: 'center' }}>
            <Upload
              name="avatar"
              maxCount={1}
              beforeUpload={handleAvatarUpload}
              showUploadList={false}
              accept="image/*"
            >
              <div style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}>
                <Avatar
                  size={120}
                  src={profile.avatar_url}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1890ff' }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  background: '#1890ff',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  border: '3px solid white',
                  opacity: avatarLoading ? 0.6 : 1
                }}>
                  {avatarLoading ? <Spin size="small" /> : <CameraOutlined />}
                </div>
              </div>
            </Upload>
          </Col>
          <Col xs={24} sm={18}>
            <h2 style={{ margin: '0 0 2px 0' }}>
              {profile.name && profile.surname ? `${profile.name} ${profile.surname}` : profile.name || 'Usuario'}
            </h2>
            <p style={{ color: '#8c8c8c', marginBottom: '16px' }}>
              {user?.email}
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
                background: profile.approved ? '#f6ffed' : '#fff1f0',
                borderRadius: '4px',
                fontSize: '12px',
                color: profile.approved ? '#52c41a' : '#ff4d4f'
              }}>
                <strong>Estado:</strong> {profile.approved ? 'Aprobado' : 'Pendiente'}
              </div>
            </Space>
          </Col>
        </Row>

        <Divider style={{ margin: '16px 0' }} />

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
                      <Form.Item
                        label="Nombre"
                        name="name"
                        rules={[{ required: true, message: 'Nombre requerido' }]}
                      >
                        <Input
                          prefix={<UserOutlined />}
                          placeholder="Tu nombre"
                          size="large"
                        />
                      </Form.Item>

                      <Form.Item
                        label="Apellido"
                        name="surname"
                        rules={[{ required: true, message: 'Apellido requerido' }]}
                      >
                        <Input
                          placeholder="Tu apellido"
                          size="large"
                        />
                      </Form.Item>
                    </div>

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
                      label="Dirección"
                      name="address"
                    >
                      <Input
                        placeholder="Calle principal, 123"
                        size="large"
                      />
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
                      <Form.Item
                        label="Ciudad"
                        name="city"
                      >
                        <Input
                          placeholder="Madrid"
                          size="large"
                        />
                      </Form.Item>

                      <Form.Item
                        label="Provincia"
                        name="province"
                      >
                        <Input
                          placeholder="Madrid"
                          size="large"
                        />
                      </Form.Item>
                    </div>

                    <Form.Item
                      label="Código Postal"
                      name="postal"
                    >
                      <Input
                        placeholder="28001"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item
                      label="Rol"
                      name="role"
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
  )
}
