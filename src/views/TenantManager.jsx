import { useState } from 'react'
import { Card, Table, Button, Space, Modal, Form, Input, Select, Tag, message, Statistic, Row, Col, Alert, Spin, Tabs } from 'antd'
import { CloudOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SyncOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'

export default function TenantManager() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [tenants, setTenants] = useState([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState(null)

  const mockTenants = [
    {
      id: 1,
      name: 'BuildingCenter',
      url: 'https://buildingcenter.thereforeonline.com',
      baseUrl: 'https://buildingcenter.thereforeonline.com/theservice/v0001/restun',
      status: 'active',
      categories: 145,
      documents: 2847,
      users: 23,
      lastSync: '2025-04-28 10:30:00',
      version: '2024.1'
    },
    {
      id: 2,
      name: 'Naturgy',
      url: 'https://naturgy.casp.biscloud.canon-europe.com',
      baseUrl: 'https://naturgy.casp.biscloud.canon-europe.com/theservice/v0001/restun',
      status: 'active',
      categories: 89,
      documents: 1243,
      users: 15,
      lastSync: '2025-04-27 15:45:00',
      version: '2024.1'
    }
  ]

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      width: 250,
      render: (url) => (
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px' }}>
          {url}
        </a>
      )
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        status === 'active' ?
          <Tag icon={<CheckCircleOutlined />} color="green">Activo</Tag> :
          <Tag icon={<CloseCircleOutlined />} color="red">Inactivo</Tag>
      )
    },
    {
      title: 'Documentos',
      dataIndex: 'documents',
      key: 'documents',
      width: 100
    },
    {
      title: 'Última Sincronización',
      dataIndex: 'lastSync',
      key: 'lastSync',
      width: 180,
      render: (text) => <span style={{ fontSize: '12px' }}>{text}</span>
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<SyncOutlined />}
            onClick={() => syncTenant(record)}
          >
            Sincronizar
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => editTenant(record)}
          >
            Editar
          </Button>
          <Button
            type="link"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => deleteTenant(record)}
          >
            Eliminar
          </Button>
        </Space>
      )
    }
  ]

  const syncTenant = (tenant) => {
    setLoading(true)
    message.loading(`Sincronizando ${tenant.name}...`)
    setTimeout(() => {
      const updated = tenants.map(t =>
        t.id === tenant.id ? { ...t, lastSync: new Date().toLocaleString() } : t
      )
      setTenants(updated)
      message.success(`${tenant.name} sincronizado exitosamente`)
      setLoading(false)
    }, 2000)
  }

  const editTenant = (tenant) => {
    setSelectedTenant(tenant)
    form.setFieldsValue({
      name: tenant.name,
      url: tenant.url,
      baseUrl: tenant.baseUrl,
      status: tenant.status,
      version: tenant.version
    })
    setIsModalVisible(true)
  }

  const deleteTenant = (tenant) => {
    Modal.confirm({
      title: `Eliminar ${tenant.name}`,
      content: '¿Estás seguro de que quieres eliminar este tenant?',
      okText: 'Sí',
      cancelText: 'No',
      onOk() {
        setTenants(tenants.filter(t => t.id !== tenant.id))
        message.success(`${tenant.name} eliminado`)
      }
    })
  }

  const handleAddTenant = () => {
    setSelectedTenant(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleModalOk = async (values) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))

      if (selectedTenant) {
        setTenants(tenants.map(t =>
          t.id === selectedTenant.id ? { ...selectedTenant, ...values } : t
        ))
        message.success('Tenant actualizado')
      } else {
        setTenants([...tenants, {
          id: Date.now(),
          ...values,
          categories: 0,
          documents: 0,
          users: 0,
          lastSync: '-'
        }])
        message.success('Tenant creado')
      }

      setIsModalVisible(false)
      form.resetFields()
    } finally {
      setLoading(false)
    }
  }

  const getTotalStats = () => {
    if (tenants.length === 0) return { categories: 0, documents: 0, users: 0 }
    return {
      categories: tenants.reduce((sum, t) => sum + t.categories, 0),
      documents: tenants.reduce((sum, t) => sum + t.documents, 0),
      users: tenants.reduce((sum, t) => sum + t.users, 0)
    }
  }

  if (tenants.length === 0) {
    setTenants(mockTenants)
  }

  const stats = getTotalStats()

  return (
    <>
      <Card
        style={{ borderRadius: 0, margin: 0, height: '100%', display: 'flex', flexDirection: 'column', padding: 0 }}
        bodyStyle={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
        title={<><CloudOutlined /> Gestión de Tenants Therefore™</>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0, flex: 1 }}>
          <Alert
            type="info"
            message="Administración de Instancias"
            description="Gestiona múltiples instancias de Therefore™ Online. Sincroniza datos, monitora estadísticas y administra acceso a tenants."
            style={{ margin: 0 }}
            showIcon
          />

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic title="Tenants Activos" value={tenants.length} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic title="Documentos Totales" value={stats.documents} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic title="Usuarios Totales" value={stats.users} />
              </Card>
            </Col>
          </Row>

          <Spin spinning={loading} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Space style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddTenant}
              >
                Agregar Tenant
              </Button>
            </Space>

            <div style={{ flex: 1, minHeight: 0 }}>
              <Table
                columns={columns}
                dataSource={tenants}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                size="middle"
              />
            </div>
          </Spin>
        </div>
      </Card>

      <Modal
        title={selectedTenant ? 'Editar Tenant' : 'Nuevo Tenant'}
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalOk}
        >
          <Form.Item
            label="Nombre del Tenant"
            name="name"
            rules={[{ required: true, message: 'Nombre requerido' }]}
          >
            <Input placeholder="Ej: BuildingCenter" />
          </Form.Item>

          <Form.Item
            label="URL Base"
            name="url"
            rules={[
              { required: true, message: 'URL requerida' },
              { type: 'url', message: 'URL inválida' }
            ]}
          >
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item
            label="URL de API REST"
            name="baseUrl"
            rules={[
              { required: true, message: 'URL de API requerida' },
              { type: 'url', message: 'URL inválida' }
            ]}
          >
            <Input placeholder="https://...../theservice/v0001/restun" />
          </Form.Item>

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

          <Form.Item
            label="Versión de Therefore"
            name="version"
            initialValue="2024.1"
          >
            <Input placeholder="Ej: 2024.1" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
