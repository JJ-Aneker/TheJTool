import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, Tag, message, Spin, Badge, Avatar, Tabs, Popconfirm, Tooltip, Upload } from 'antd'
import { UserOutlined, PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined, CheckCircleOutlined, CloseCircleOutlined, MailOutlined, PhoneOutlined, CameraOutlined } from '@ant-design/icons'
import { supabase } from '../config/supabaseClient'
import { storageService } from '../services/storageService'

export default function UserManager() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('users')

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    if (isModalVisible && selectedUser) {
      // Ensure form is populated when modal opens
      form.setFieldsValue({
        name: selectedUser.name || '',
        surname: selectedUser.surname || '',
        email: selectedUser.email || '',
        role: selectedUser.role || 'user',
        phone: selectedUser.phone || '',
        address: selectedUser.address || '',
        city: selectedUser.city || '',
        province: selectedUser.province || '',
        postal: selectedUser.postal || '',
        approved: selectedUser.approved || false
      })
    }
  }, [isModalVisible, selectedUser, form])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      message.error('Error al cargar usuarios: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const roleOptions = [
    { label: 'Administrador', value: 'admin' },
    { label: 'Gerente', value: 'manager' },
    { label: 'Usuario', value: 'user' },
    { label: 'Auditor', value: 'auditor' }
  ]

  const columns = [
    {
      title: 'Usuario',
      key: 'user',
      width: 200,
      render: (_, record) => (
        <div style={{ fontWeight: '600', fontSize: '14px' }}>
          {record.name && record.surname ? `${record.name} ${record.surname}` : 'Sin nombre'}
        </div>
      )
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 220,
      render: (text) => <span style={{ color: 'var(--accent-primary)' }}>{text || '-'}</span>
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role) => {
        const colors = {
          admin: 'red',
          manager: 'orange',
          user: 'blue',
          auditor: 'purple'
        }
        const labels = {
          admin: 'Administrador',
          manager: 'Gerente',
          user: 'Usuario',
          auditor: 'Auditor'
        }
        return <Tag color={colors[role]}>{labels[role]}</Tag>
      }
    },
    {
      title: 'Aprobado',
      dataIndex: 'approved',
      key: 'approved',
      width: 100,
      render: (approved) => (
        <Tag icon={approved ? <CheckCircleOutlined /> : <CloseCircleOutlined />} color={approved ? 'green' : 'red'}>
          {approved ? 'Sí' : 'No'}
        </Tag>
      )
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
      width: 180,
      render: (_, record) => (
        <Space>
          <Tooltip title="Editar usuario">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => editUser(record)}
            />
          </Tooltip>
          <Tooltip title="Cambiar contraseña">
            <Button
              type="link"
              size="small"
              icon={<LockOutlined />}
              onClick={() => showPasswordReset(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Eliminar usuario"
            description="¿Estás seguro de que quieres eliminar este usuario?"
            onConfirm={() => deleteUser(record)}
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

  const editUser = (user) => {
    setSelectedUser(user)
    setIsModalVisible(true)
  }

  const handleAvatarUpload = async (file) => {
    setAvatarLoading(true)
    try {
      const result = await storageService.uploadAvatar(file, selectedUser.user_id)
      if (result.success) {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: result.url })
          .eq('user_id', selectedUser.user_id)

        if (error) throw error

        setSelectedUser({ ...selectedUser, avatar_url: result.url })
        setUsers(users.map(u =>
          u.id === selectedUser.id
            ? { ...u, avatar_url: result.url }
            : u
        ))
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

  const deleteUser = async (user) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.user_id)

      if (error) throw error
      setUsers(users.filter(u => u.id !== user.id))
      message.success('Usuario eliminado')
    } catch (err) {
      message.error('Error al eliminar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const showPasswordReset = (user) => {
    Modal.confirm({
      title: `Restablecer contraseña`,
      content: `Se enviará un enlace de restablecimiento a ${user.email}`,
      okText: 'Enviar',
      cancelText: 'Cancelar',
      onOk() {
        message.success(`Enlace de restablecimiento enviado a ${user.email}`)
      }
    })
  }

  const createNewUser = () => {
    setSelectedUser(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleModalOk = async (values) => {
    if (!selectedUser) {
      message.error('Los usuarios nuevos se deben crear a través del formulario de registro')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: values.name,
          surname: values.surname,
          role: values.role,
          phone: values.phone,
          address: values.address,
          city: values.city,
          province: values.province,
          postal: values.postal,
          approved: values.approved,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', selectedUser.user_id)

      if (error) throw error
      setUsers(users.map(u =>
        u.id === selectedUser.id
          ? { ...u, ...values }
          : u
      ))
      message.success('Usuario actualizado exitosamente')

      setIsModalVisible(false)
      form.resetFields()
      setSelectedUser(null)
    } catch (error) {
      message.error('Error al guardar usuario: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatistics = () => {
    const stats = {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status === 'inactive').length,
      admins: users.filter(u => u.role === 'admin').length
    }
    return stats
  }

  const stats = getStatistics()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
        <UserOutlined /> Gestión de Usuarios
      </h1>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
        items={[
            {
              key: 'users',
              label: 'Usuarios',
              children: (
                <Spin spinning={loading} style={{ display: 'flex', flex: 1 }}>
                  <Table
                    columns={columns}
                    dataSource={users}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    style={{ width: '100%' }}
                    scroll={{ y: 'calc(100vh - 250px)' }}
                  />
                </Spin>
              )
            },
            {
              key: 'roles',
              label: 'Roles y Permisos',
              children: (
                <Table
                    dataSource={[
                      {
                        role: 'admin',
                        label: 'Administrador',
                        permissions: ['Gestión de usuarios', 'Configuración del sistema', 'Auditoría', 'Todos los permisos']
                      },
                      {
                        role: 'manager',
                        label: 'Gerente',
                        permissions: ['Crear/editar documentos', 'Gestión básica', 'Reportes', 'Asignación de tareas']
                      },
                      {
                        role: 'user',
                        label: 'Usuario',
                        permissions: ['Ver documentos', 'Crear solicitudes', 'Ver reportes propios']
                      },
                      {
                        role: 'auditor',
                        label: 'Auditor',
                        permissions: ['Ver registros de auditoría', 'Generar reportes', 'Análisis de cambios']
                      }
                    ]}
                    columns={[
                      {
                        title: 'Rol',
                        dataIndex: 'label',
                        key: 'label',
                        render: (text, record) => {
                          const colors = {
                            admin: 'red',
                            manager: 'orange',
                            user: 'blue',
                            auditor: 'purple'
                          }
                          return <Tag color={colors[record.role]}>{text}</Tag>
                        }
                      },
                      {
                        title: 'Permisos',
                        dataIndex: 'permissions',
                        key: 'permissions',
                        render: (permissions) => (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {permissions.map(perm => (
                              <Tag key={perm}>{perm}</Tag>
                            ))}
                          </div>
                        )
                      }
                    ]}
                    rowKey="role"
                    pagination={false}
                  />
              )
            },
            {
              key: 'audit',
              label: 'Auditoría',
              children: (
                <Table
                    dataSource={[
                      {
                        id: 1,
                        timestamp: '2025-04-28 14:30:00',
                        user: 'Juan Jiménez',
                        action: 'Acceso al sistema',
                        description: 'Login exitoso desde IP 192.168.1.100',
                        status: 'success'
                      },
                      {
                        id: 2,
                        timestamp: '2025-04-28 14:00:00',
                        user: 'María García',
                        action: 'Crear documento',
                        description: 'Creación de documento en categoría Matrículas',
                        status: 'success'
                      },
                      {
                        id: 3,
                        timestamp: '2025-04-28 13:15:00',
                        user: 'Carlos López',
                        action: 'Intentó acceso',
                        description: 'Fallo de autenticación - contraseña incorrecta',
                        status: 'error'
                      },
                      {
                        id: 4,
                        timestamp: '2025-04-28 12:30:00',
                        user: 'Juan Jiménez',
                        action: 'Modificar usuario',
                        description: 'Cambio de rol para usuario manager@buildingcenter.com',
                        status: 'success'
                      }
                    ]}
                    columns={[
                      {
                        title: 'Timestamp',
                        dataIndex: 'timestamp',
                        key: 'timestamp',
                        width: 150
                      },
                      {
                        title: 'Usuario',
                        dataIndex: 'user',
                        key: 'user',
                        width: 150
                      },
                      {
                        title: 'Acción',
                        dataIndex: 'action',
                        key: 'action',
                        width: 150
                      },
                      {
                        title: 'Descripción',
                        dataIndex: 'description',
                        key: 'description'
                      },
                      {
                        title: 'Estado',
                        dataIndex: 'status',
                        key: 'status',
                        render: (status) => (
                          <Tag color={status === 'success' ? 'green' : 'red'}>
                            {status === 'success' ? 'Éxito' : 'Error'}
                          </Tag>
                        )
                      }
                    ]}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
              )
            }
          ]}
        />
      <Modal
        title={selectedUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
        width={700}
      >
        {selectedUser && (
          <div style={{
            marginBottom: '16px'
          }}>
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
                      src={selectedUser.avatar_url}
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
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Email</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--accent-primary)' }}>{selectedUser.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>ID</div>
                <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{selectedUser.user_id}</div>
              </div>
            </div>
          </div>
        )}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalOk}
          style={{ marginTop: '-8px' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              label="Nombre"
              name="name"
              rules={[{ required: true, message: 'Nombre requerido' }]}
            >
              <Input placeholder="Juan" />
            </Form.Item>

            <Form.Item
              label="Apellido"
              name="surname"
              rules={[{ required: true, message: 'Apellido requerido' }]}
            >
              <Input placeholder="Jiménez" />
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
            label="Rol"
            name="role"
            rules={[{ required: true, message: 'Rol requerido' }]}
          >
            <Select options={roleOptions} placeholder="Selecciona un rol" />
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
            label="Aprobado"
            name="approved"
            initialValue={false}
          >
            <Select
              options={[
                { label: 'Sí', value: true },
                { label: 'No', value: false }
              ]}
              placeholder="Selecciona"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
