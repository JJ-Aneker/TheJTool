import { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Avatar, message, Spin, Tabs, Alert, Upload } from 'antd'
import { UserOutlined, SaveOutlined, LockOutlined, CameraOutlined } from '@ant-design/icons'
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

  return (
    <Card
      style={{ borderRadius: 0, margin: 0, height: '100%', display: 'flex', flexDirection: 'column', padding: 0 }}
      bodyStyle={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
      title={<><UserOutlined /> Mi Perfil</>}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
        items={[
          {
            key: 'profile',
            label: 'Mi Perfil',
            children: (
              <Spin spinning={loading}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '24px', alignItems: 'start' }}>
                    <div style={{ textAlign: 'center' }}>
                      <Upload
                        name="avatar"
                        maxCount={1}
                        beforeUpload={handleAvatarUpload}
                        showUploadList={false}
                        accept="image/*"
                      >
                        <div style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}>
                          <Avatar
                            size={60}
                            src={profile.avatar_url}
                            icon={<UserOutlined />}
                            style={{ backgroundColor: '#1890ff' }}
                          />
                          <div style={{
                            position: 'absolute',
                            bottom: -4,
                            right: -4,
                            background: '#1890ff',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            border: '2px solid white',
                            opacity: avatarLoading ? 0.6 : 1
                          }}>
                            {avatarLoading ? <Spin size="small" /> : <CameraOutlined style={{ fontSize: '12px' }} />}
                          </div>
                        </div>
                      </Upload>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>Email</div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#1890ff' }}>{user?.email}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>ID</div>
                      <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#666' }}>{user?.id}</div>
                    </div>
                  </div>
                </div>

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleUpdateProfile}
                  style={{ marginTop: '-8px' }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Form.Item
                      label="Nombre"
                      name="name"
                      rules={[{ required: true, message: 'Nombre requerido' }]}
                    >
                      <Input placeholder="Tu nombre" />
                    </Form.Item>

                    <Form.Item
                      label="Apellido"
                      name="surname"
                      rules={[{ required: true, message: 'Apellido requerido' }]}
                    >
                      <Input placeholder="Tu apellido" />
                    </Form.Item>
                  </div>

                  <Form.Item
                    label="Teléfono"
                    name="phone"
                  >
                    <Input placeholder="+34 912 345 678" />
                  </Form.Item>

                  <Form.Item
                    label="Email"
                    name="email"
                    hidden
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    label="Dirección"
                    name="address"
                  >
                    <Input placeholder="Calle principal, 123" />
                  </Form.Item>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Form.Item
                      label="Ciudad"
                      name="city"
                    >
                      <Input placeholder="Madrid" />
                    </Form.Item>

                    <Form.Item
                      label="Provincia"
                      name="province"
                    >
                      <Input placeholder="Madrid" />
                    </Form.Item>
                  </div>

                  <Form.Item
                    label="Código Postal"
                    name="postal"
                  >
                    <Input placeholder="28001" />
                  </Form.Item>

                  <Form.Item
                    label="Rol"
                    name="role"
                  >
                    <Input disabled />
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
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
                      placeholder="Nueva contraseña"
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
                      placeholder="Repite la contraseña"
                    />
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
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
