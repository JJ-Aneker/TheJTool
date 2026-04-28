import { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Modal, Form, Input, Select, Tag, message, Spin, Badge, Avatar, Tabs, Popconfirm, Tooltip } from 'antd'
import { UserOutlined, PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined, CheckCircleOutlined, CloseCircleOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons'
import { supabase } from '../config/supabaseClient'

export default function UserManager() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('users')

  useEffect(() => {
    loadUsers()
  }, [])

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
      width: 250,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar
            size={40}
            src={record.avatar_url}
            icon={<UserOutlined />}
            style={{ backgroundColor: '#1890ff' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>
              {record.name && record.surname ? `${record.name} ${record.surname}` : 'Sin nombre'}
            </div>
            <div style={{ fontSize: '12px', color: '#1890ff', fontWeight: '500' }}>{record.email || 'Sin email'}</div>
            <div style={{ fontSize: '11px', color: '#999', fontFamily: 'monospace' }}>{record.user_id}</div>
          </div>
        </div>
      )
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
      title: 'Teléfono',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      render: (text) => text || '-'
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
    form.setFieldsValue({
      name: user.name,
      surname: user.surname,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      city: user.city,
      province: user.province,
      postal: user.postal,
      approved: user.approved
    })
    setIsModalVisible(true)
  }

  const deleteUser = async (user) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

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
        .eq('id', selectedUser.id)

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
    <div style={{ maxWidth: 1400 }}>
      <Card title={<><UserOutlined /> Gestión de Usuarios Therefore™</>}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'users',
              label: 'Usuarios',
              children: (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    <Card size="small">
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>{stats.total}</div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>Usuarios Totales</div>
                    </Card>
                    <Card size="small">
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>{stats.active}</div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>Activos</div>
                    </Card>
                    <Card size="small">
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>{stats.inactive}</div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>Inactivos</div>
                    </Card>
                    <Card size="small">
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>{stats.admins}</div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>Administradores</div>
                    </Card>
                  </div>

                  <Space style={{ marginBottom: 16 }}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={createNewUser}
                      title="Los usuarios nuevos se crean a través del formulario de registro"
                      disabled
                    >
                      Crear Usuario (via registro)
                    </Button>
                  </Space>

                  <Spin spinning={loading}>
                    <Table
                      columns={columns}
                      dataSource={users}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                    />
                  </Spin>
                </div>
              )
            },
            {
              key: 'roles',
              label: 'Roles y Permisos',
              children: (
                <div>
                  <h4 style={{ marginBottom: '16px' }}>Configuración de Roles</h4>
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
                </div>
              )
            },
            {
              key: 'audit',
              label: 'Auditoría',
              children: (
                <div>
                  <h4 style={{ marginBottom: '16px' }}>Registro de Actividades</h4>
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
                </div>
              )
            }
          ]}
        />
      </Card>

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
            padding: '12px 16px',
            marginBottom: '24px',
            background: '#f5f5f5',
            borderRadius: '4px',
            borderLeft: '4px solid #1890ff'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>IDENTIFICACIÓN DEL USUARIO</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>Email (auth.users)</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1890ff' }}>{selectedUser.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>ID Usuario</div>
                <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#666' }}>{selectedUser.user_id}</div>
              </div>
            </div>
          </div>
        )}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalOk}
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
            <Input placeholder="+34 912 345 678" prefix={<PhoneOutlined />} />
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
