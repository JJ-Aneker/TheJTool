import { useState, useEffect } from 'react'
import { Modal, Form, Input, Button, Avatar, message, Spin, Alert, Upload } from 'antd'
import { UserOutlined, CameraOutlined } from '@ant-design/icons'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../config/supabaseClient'
import { storageService } from '../services/storageService'

export default function UserProfile() {
  const [form] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [profile, setProfile] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
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
        passwordForm.resetFields()
        setShowPasswordModal(false)
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
    <>
      <Modal
        title="Mi Perfil"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={700}
      >
        {profile && (
          <Spin spinning={loading}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 'var(--gap-2xl)', alignItems: 'start' }}>
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
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: -4,
                        right: -4,
                        background: 'var(--accent-primary)',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        border: '2px solid var(--bg-canvas)',
                        opacity: avatarLoading ? 0.6 : 1
                      }}>
                        {avatarLoading ? <Spin size="small" /> : <CameraOutlined style={{ fontSize: '12px' }} />}
                      </div>
                    </div>
                  </Upload>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Email</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--accent-primary)' }}>{user?.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>ID</div>
                  <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{user?.id}</div>
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
                block
                loading={loading}
              >
                Guardar Cambios
              </Button>
            </Form>

            <Button
              type="link"
              style={{ marginTop: '16px', display: 'block' }}
              onClick={() => setShowPasswordModal(true)}
            >
              Cambiar Contraseña
            </Button>
          </Spin>
        )}
      </Modal>

      <Modal
        title="Cambiar Contraseña"
        open={showPasswordModal}
        onCancel={() => setShowPasswordModal(false)}
        footer={null}
        width={500}
      >
        <Spin spinning={loading}>
          <Alert
            message="Seguridad"
            description="Por favor ingresa una contraseña segura con al menos 8 caracteres"
            type="info"
            showIcon
            style={{ marginBottom: '24px', borderRadius: 'var(--radius-md)' }}
          />

          <Form
            form={passwordForm}
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
              <Input.Password placeholder="Nueva contraseña" />
            </Form.Item>

            <Form.Item
              label="Confirmar Contraseña"
              name="confirmPassword"
              rules={[
                { required: true, message: 'Confirma tu contraseña' }
              ]}
            >
              <Input.Password placeholder="Repite la contraseña" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
            >
              Cambiar Contraseña
            </Button>
          </Form>
        </Spin>
      </Modal>
    </>
  )
}
