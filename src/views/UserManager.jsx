import { useState } from 'react'
import { Card, Table, Button, Space, Modal, Form, Input, Select, Tag, message, Spin, Badge, Avatar, Tabs, Popconfirm, Tooltip } from 'antd'
import { UserOutlined, PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined, CheckCircleOutlined, CloseCircleOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons'

export default function UserManager() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('users')

  const mockUsers = [
    {
      id: '1',
      email: 'admin@buildingcenter.com',
      fullName: 'Juan Jiménez',
      role: 'admin',
      status: 'active',
      department: 'IT',
      lastLogin: '2025-04-28 14:30:00',
      createdAt: '2025-01-15 09:00:00',
      phone: '+34 912 345 678',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan'
    },
    {
      id: '2',
      email: 'manager@buildingcenter.com',
      fullName: 'María García',
      role: 'manager',
      status: 'active',
      department: 'Operations',
      lastLogin: '2025-04-27 16:45:00',
      createdAt: '2025-02-20 10:30:00',
      phone: '+34 912 345 679',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria'
    },
    {
      id: '3',
      email: 'user@buildingcenter.com',
      fullName: 'Carlos López',
      role: 'user',
      status: 'active',
      department: 'Finance',
      lastLogin: '2025-04-25 11:20:00',
      createdAt: '2025-03-10 08:15:00',
      phone: '+34 912 345 680',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos'
    },
    {
      id: '4',
      email: 'inactive@buildingcenter.com',
      fullName: 'Ana Martínez',
      role: 'user',
      status: 'inactive',
      department: 'HR',
      lastLogin: '2025-03-15 09:30:00',
      createdAt: '2024-12-05 14:45:00',
      phone: '+34 912 345 681',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana'
    }
  ]

  const roleOptions = [
    { label: 'Administrador', value: 'admin' },
    { label: 'Gerente', value: 'manager' },
    { label: 'Usuario', value: 'user' },
    { label: 'Auditor', value: 'auditor' }
  ]

  const departmentOptions = [
    { label: 'IT', value: 'IT' },
    { label: 'Operations', value: 'Operations' },
    { label: 'Finance', value: 'Finance' },
    { label: 'HR', value: 'HR' },
    { label: 'Sales', value: 'Sales' },
    { label: 'Legal', value: 'Legal' }
  ]

  const columns = [
    {
      title: 'Usuario',
      key: 'user',
      width: 200,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar
            size={40}
            src={record.avatar}
            icon={<UserOutlined />}
          />
          <div>
            <div style={{ fontWeight: '500' }}>{record.fullName}</div>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.email}</div>
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
      title: 'Departamento',
      dataIndex: 'department',
      key: 'department',
      width: 120
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag icon={status === 'active' ? <CheckCircleOutlined /> : <CloseCircleOutlined />} color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Activo' : 'Inactivo'}
        </Tag>
      )
    },
    {
      title: 'Último Acceso',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 150,
      render: (text) => <span style={{ fontSize: '12px' }}>{text}</span>
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
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone,
      status: user.status
    })
    setIsModalVisible(true)
  }

  const deleteUser = (user) => {
    setUsers(users.filter(u => u.id !== user.id))
    message.success(`Usuario ${user.fullName} eliminado`)
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
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))

      if (selectedUser) {
        setUsers(users.map(u =>
          u.id === selectedUser.id
            ? {
              ...u,
              ...values,
              lastLogin: new Date().toLocaleString('es-ES')
            }
            : u
        ))
        message.success('Usuario actualizado exitosamente')
      } else {
        const newUser = {
          id: Date.now().toString(),
          ...values,
          createdAt: new Date().toLocaleString('es-ES'),
          lastLogin: '-',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${values.fullName}`
        }
        setUsers([...users, newUser])
        message.success('Usuario creado exitosamente')
      }

      setIsModalVisible(false)
      form.resetFields()
      setSelectedUser(null)
    } catch (error) {
      message.error('Error al guardar usuario')
    } finally {
      setLoading(false)
    }
  }

  if (users.length === 0) {
    setUsers(mockUsers)
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
                    >
                      Crear Usuario
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
        visible={isModalVisible}
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
            label="Nombre Completo"
            name="fullName"
            rules={[{ required: true, message: 'Nombre requerido' }]}
          >
            <Input placeholder="Ej: Juan Jiménez" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Email requerido' },
              { type: 'email', message: 'Email inválido' }
            ]}
          >
            <Input placeholder="usuario@buildingcenter.com" prefix={<MailOutlined />} />
          </Form.Item>

          <Form.Item
            label="Teléfono"
            name="phone"
            rules={[{ required: true, message: 'Teléfono requerido' }]}
          >
            <Input placeholder="+34 912 345 678" prefix={<PhoneOutlined />} />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              label="Rol"
              name="role"
              rules={[{ required: true, message: 'Rol requerido' }]}
            >
              <Select options={roleOptions} placeholder="Selecciona un rol" />
            </Form.Item>

            <Form.Item
              label="Departamento"
              name="department"
              rules={[{ required: true, message: 'Departamento requerido' }]}
            >
              <Select options={departmentOptions} placeholder="Selecciona departamento" />
            </Form.Item>
          </div>

          <Form.Item
            label="Estado"
            name="status"
            initialValue="active"
          >
            <Select
              options={[
                { label: 'Activo', value: 'active' },
                { label: 'Inactivo', value: 'inactive' }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
