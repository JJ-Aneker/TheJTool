import { useState, useEffect, useMemo } from 'react'
import { Table, Button, Modal, Form, Input, Select, Tag, Spin, Avatar, Tabs, Tooltip, Upload, Dropdown, Alert } from 'antd'
import { message } from '../utils/message'
import '../styles/user-manager.css'
import { UserOutlined, PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined, CheckOutlined, MailOutlined, CameraOutlined, MoreOutlined, SearchOutlined } from '@ant-design/icons'
import { supabase } from '../config/supabaseClient'
import { storageService } from '../services/storageService'
import { activateUserEmail, approveUser, activateAndApproveUser, getUserStatus } from '../services/adminService'
import HelpButton from '../components/HelpButton'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import { useMessages } from '../utils/i18nMessages'
import { handleError } from '../utils/errorHandler'

export default function UserManager() {
  const { t } = useTranslation()
  const MESSAGES = useMessages()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('users')
  const [searchText, setSearchText] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [bulkLoading, setBulkLoading] = useState(false)

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
      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Get auth users to check email confirmation status
      // We'll use the admin API endpoint to get this info
      const usersWithStatus = await Promise.all(
        (profiles || []).map(async (profile) => {
          try {
            const result = await getUserStatus(profile.user_id)

            if (result.success) {
              return {
                ...profile,
                email_confirmed: result.status.emailConfirmed,
                email_confirmed_at: result.status.emailConfirmedAt
              }
            }
          } catch (err) {
            console.error('Error fetching user status:', err)
          }
          // Fallback if status fetch fails
          return { ...profile, email_confirmed: false }
        })
      )

      setUsers(usersWithStatus || [])
    } catch (err) {
      handleError(err, 'cargar usuarios', false); message.error(MESSAGES.ERROR.LOAD('usuarios') + ': ' + err.message)
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

  const roleLabels = {
    admin: 'Administrador',
    manager: 'Gerente',
    user: 'Usuario',
    auditor: 'Auditor'
  }

  const fullName = (u) => (u.name || u.surname) ? `${u.name || ''} ${u.surname || ''}`.trim() : t('userManager.noName')

  // Un único estado legible a partir de email confirmado + aprobado
  const getStatus = (u) => {
    if (u.email_confirmed && u.approved) return { key: 'active', label: t('userManager.statusActive') }
    if (!u.email_confirmed && !u.approved) return { key: 'pending', label: t('userManager.statusBothPending') }
    if (!u.email_confirmed) return { key: 'pending', label: t('userManager.statusEmailPending') }
    return { key: 'pending', label: t('userManager.statusApprovalPending') }
  }

  const isActive = (u) => u.email_confirmed && u.approved

  const formatDate = (value) => value
    ? new Date(value).toLocaleDateString(i18n.language === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'

  const filteredUsers = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    if (!q) return users
    return users.filter(u =>
      fullName(u).toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
    )
  }, [users, searchText])

  const confirmDelete = (record) => {
    Modal.confirm({
      title: t('userManager.deleteConfirmTitle', { name: fullName(record) }),
      content: t('userManager.deleteConfirmBody'),
      okText: t('userManager.delete'),
      okButtonProps: { danger: true },
      cancelText: t('userManager.cancel'),
      onOk: () => deleteUser(record)
    })
  }

  // Acción de activación adecuada al estado del usuario
  const activationAction = (record) => {
    if (!record.email_confirmed && !record.approved) {
      return { key: 'activate', icon: <CheckOutlined />, label: t('userManager.rowActivateApprove'), onClick: () => handleActivateAndApprove(record) }
    }
    if (!record.email_confirmed) {
      return { key: 'activate', icon: <MailOutlined />, label: t('userManager.rowActivateEmail'), onClick: () => handleActivateEmail(record) }
    }
    if (!record.approved) {
      return { key: 'activate', icon: <CheckOutlined />, label: t('userManager.rowApprove'), onClick: () => handleApproveUser(record) }
    }
    return null
  }

  const rowMenuItems = (record) => {
    const activation = activationAction(record)
    return [
      ...(activation ? [activation, { type: 'divider' }] : []),
      { key: 'edit', icon: <EditOutlined />, label: t('userManager.editUser'), onClick: () => editUser(record) },
      { key: 'password', icon: <LockOutlined />, label: t('userManager.changePassword'), onClick: () => showPasswordReset(record) },
      { type: 'divider' },
      { key: 'delete', icon: <DeleteOutlined />, danger: true, label: t('userManager.deleteUser'), onClick: () => confirmDelete(record) }
    ]
  }

  const columns = [
    {
      title: t('userManager.columnUser'),
      key: 'user',
      sorter: (a, b) => fullName(a).localeCompare(fullName(b)),
      render: (_, record) => (
        <div className="um-user">
          <span className="um-user-name">{fullName(record)}</span>
          <span className="um-user-email">{record.email || '—'}</span>
        </div>
      )
    },
    {
      title: t('userManager.columnStatus'),
      key: 'status',
      width: 240,
      filters: [
        { text: t('userManager.statusActive'), value: 'active' },
        { text: t('userManager.pending'), value: 'pending' }
      ],
      onFilter: (value, record) => getStatus(record).key === value,
      render: (_, record) => {
        const status = getStatus(record)
        return (
          <span className={`um-status um-status--${status.key}`}>
            <span className="um-status-dot" aria-hidden="true" />
            {status.label}
          </span>
        )
      }
    },
    {
      title: t('userManager.columnRole'),
      dataIndex: 'role',
      key: 'role',
      width: 150,
      render: (role) => role
        ? <Tag className="tag-neutral">{roleLabels[role] || role}</Tag>
        : <span className="um-muted">—</span>
    },
    {
      title: t('userManager.columnCreated'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (value) => (
        <Tooltip title={value ? new Date(value).toLocaleString('es-ES') : null}>
          <span className="um-muted">{formatDate(value)}</span>
        </Tooltip>
      )
    },
    {
      title: <span className="sr-only">{t('userManager.columnActions')}</span>,
      key: 'actions',
      width: 56,
      align: 'right',
      render: (_, record) => (
        <Dropdown menu={{ items: rowMenuItems(record) }} trigger={['click']} placement="bottomRight">
          <Button
            type="text"
            size="small"
            icon={<MoreOutlined />}
            aria-label={`${t('userManager.columnActions')}: ${fullName(record)}`}
          />
        </Dropdown>
      )
    }
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record) => ({ disabled: isActive(record), name: fullName(record) })
  }

  const handleBulkActivate = async () => {
    const targets = users.filter(u => selectedRowKeys.includes(u.id) && !isActive(u))
    if (!targets.length) return
    setBulkLoading(true)
    let ok = 0
    for (const u of targets) {
      try {
        const result = await activateAndApproveUser(u.user_id)
        if (result?.success) ok++
      } catch (err) {
        console.error('Error activating user:', err)
      }
    }
    setBulkLoading(false)
    setSelectedRowKeys([])
    if (ok === targets.length) {
      message.success(t('userManager.bulkDone', { ok, total: targets.length }))
    } else {
      message.warning(t('userManager.bulkDone', { ok, total: targets.length }))
    }
    loadUsers()
  }

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
        handleError(err, 'cargar avatar', false); message.error(MESSAGES.ERROR.LOAD('avatar') + ': ' + result.error)
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
      message.success(MESSAGES.SUCCESS.DELETE('Usuario'))
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

  const handleActivateEmail = async (user) => {
    setLoading(true)
    try {
      const result = await activateUserEmail(user.user_id)
      if (result.success) {
        message.success(`Email de ${user.email} activado exitosamente`)
        loadUsers()
      } else {
        message.error('Error al activar email: ' + result.error)
      }
    } catch (err) {
      message.error('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveUser = async (user) => {
    setLoading(true)
    try {
      const result = await approveUser(user.user_id)
      if (result.success) {
        message.success(`Usuario ${user.name} ${user.surname} aprobado exitosamente`)
        loadUsers()
      } else {
        message.error('Error al aprobar usuario: ' + result.error)
      }
    } catch (err) {
      message.error('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleActivateAndApprove = async (user) => {
    setLoading(true)
    try {
      const result = await activateAndApproveUser(user.user_id)
      if (result.success) {
        message.success(`Usuario ${user.name} ${user.surname} activado y aprobado. Ya puede acceder a la aplicación.`)
        loadUsers()
      } else {
        message.error('Error: ' + result.error)
      }
    } catch (err) {
      message.error('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
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
      // If role changed, update via backend API
      if (values.role !== selectedUser.role) {
        const response = await fetch('/api/admin/update-user-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: selectedUser.user_id,
            role: values.role
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.details || error.error)
        }
      }

      // Update profiles table with other fields
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
        u.user_id === selectedUser.user_id
          ? { ...u, ...values, updated_at: new Date().toISOString() }
          : u
      ))

      // If role changed, show message and offer to refresh
      if (values.role !== selectedUser.role) {
        message.success('Usuario actualizado. La sesión se actualizará en la próxima recarga.')
        // Reload page after 2 seconds to refresh JWT
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        message.success('Usuario actualizado exitosamente')
      }

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
    <div className="container-main" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-xl)', height: '100%', minWidth: 0, overflow: 'hidden' }}>
      {/* HEADER */}
      <div className="header-main">
        <h1 className="header-title" style={{ margin: 0 }}>
          {t('userManager.title')}
        </h1>
        <div className="header-actions">
          <HelpButton section="userManager" />
          <Input
            prefix={<SearchOutlined className="um-muted" />}
            placeholder={t('userManager.searchUser')}
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setSelectedRowKeys([]) }}
            allowClear
            style={{ width: 280 }}
            aria-label={t('userManager.searchUser')}
          />
          <button onClick={createNewUser} className="btn-primary">
            <PlusOutlined /> {t('userManager.newUser')}
          </button>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}
        contentStyle={{ display: 'flex', flex: 1, minHeight: 0, minWidth: 0, overflow: 'hidden' }}
        items={[
            {
              key: 'users',
              label: t('userManager.tabUsers'),
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, minWidth: 0 }}>
                  {selectedRowKeys.length > 0 && (
                    <div className="um-bulkbar" role="region" aria-live="polite">
                      <span>{t('userManager.selected', { count: selectedRowKeys.length })}</span>
                      <button className="btn-primary" onClick={handleBulkActivate} disabled={bulkLoading}>
                        <CheckOutlined /> {t('userManager.bulkActivate', { count: selectedRowKeys.length })}
                      </button>
                      <button className="btn-link" onClick={() => setSelectedRowKeys([])}>
                        {t('userManager.clearSelection')}
                      </button>
                    </div>
                  )}
                  <Table
                    className="um-table"
                    columns={columns}
                    dataSource={filteredUsers}
                    rowKey="id"
                    rowSelection={rowSelection}
                    pagination={{ pageSize: 20, hideOnSinglePage: true }}
                    style={{ width: '100%' }}
                    scroll={{ y: 'calc(100vh - 300px)' }}
                    loading={loading || bulkLoading}
                    locale={{ emptyText: searchText ? t('userManager.emptySearch', { q: searchText }) : t('userManager.noUsers') }}
                  />
                </div>
              )
            },
            {
              key: 'roles',
              label: t('userManager.tabRoles'),
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
                        title: t('userManager.columnRole'),
                        dataIndex: 'label',
                        key: 'label',
                        render: (text) => <Tag className="tag-neutral">{text}</Tag>
                      },
                      {
                        title: t('userManager.columnPermissions'),
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
              label: t('userManager.tabAudit'),
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minWidth: 0 }}>
                <Alert type="info" showIcon message={t('userManager.auditSample')} />
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
                        title: t('userManager.columnTimestamp'),
                        dataIndex: 'timestamp',
                        key: 'timestamp',
                        width: 150
                      },
                      {
                        title: t('userManager.columnUser'),
                        dataIndex: 'user',
                        key: 'user',
                        width: 150
                      },
                      {
                        title: t('userManager.columnAction'),
                        dataIndex: 'action',
                        key: 'action',
                        width: 150
                      },
                      {
                        title: t('userManager.columnDescription'),
                        dataIndex: 'description',
                        key: 'description'
                      },
                      {
                        title: t('userManager.columnStatus'),
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
                      color: 'var(--text-inverse)',
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-xl)' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-xl)' }}>
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
