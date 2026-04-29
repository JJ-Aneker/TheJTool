import { useState } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, Tag, message, Tabs, Tree, Collapse, List, Switch, InputNumber, Spin, Popover, Empty } from 'antd'
import { BgColorsOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CopyOutlined, AlertOutlined } from '@ant-design/icons'

export default function WorkflowSettings() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [workflows, setWorkflows] = useState([])
  const [selectedWorkflow, setSelectedWorkflow] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('list')
  const [steps, setSteps] = useState([])
  const [conditions, setConditions] = useState([])

  const mockWorkflows = [
    {
      id: 1,
      name: 'Aprobación de Matrículas',
      description: 'Flujo de trabajo para aprobación de solicitudes de matrículas',
      status: 'active',
      version: '1.3',
      stepCount: 4,
      modified: '2025-04-25 14:30:00',
      triggerEvent: 'DocumentCreated',
      notifyOnError: true
    },
    {
      id: 2,
      name: 'Generación de Reportes',
      description: 'Workflow automático para generar reportes mensuales',
      status: 'active',
      version: '2.1',
      stepCount: 6,
      modified: '2025-04-20 09:15:00',
      triggerEvent: 'ScheduledTask',
      notifyOnError: false
    },
    {
      id: 3,
      name: 'Validación de Documentos',
      description: 'Proceso de validación y archivo de documentos',
      status: 'inactive',
      version: '1.0',
      stepCount: 3,
      modified: '2025-04-15 16:45:00',
      triggerEvent: 'DocumentIndexed',
      notifyOnError: true
    }
  ]

  const stepTypes = [
    { label: 'Paso Manual', value: 'manual' },
    { label: 'Ejecución de Script', value: 'script' },
    { label: 'Notificación', value: 'notification' },
    { label: 'Aprobación', value: 'approval' },
    { label: 'Condicional', value: 'conditional' },
    { label: 'Generación de Documento', value: 'document_gen' }
  ]

  const triggerEvents = [
    { label: 'Documento Creado', value: 'DocumentCreated' },
    { label: 'Documento Indexado', value: 'DocumentIndexed' },
    { label: 'Documento Archivado', value: 'DocumentArchived' },
    { label: 'Tarea Programada', value: 'ScheduledTask' },
    { label: 'Evento Manual', value: 'ManualTrigger' }
  ]

  const workflowColumns = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Activo' : 'Inactivo'}
        </Tag>
      )
    },
    {
      title: 'Pasos',
      dataIndex: 'stepCount',
      key: 'stepCount',
      width: 80
    },
    {
      title: 'Versión',
      dataIndex: 'version',
      key: 'version',
      width: 80
    },
    {
      title: 'Modificado',
      dataIndex: 'modified',
      key: 'modified',
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
            icon={<EditOutlined />}
            onClick={() => editWorkflow(record)}
          >
            Editar
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => duplicateWorkflow(record)}
          >
            Duplicar
          </Button>
          <Button
            type="link"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => deleteWorkflow(record)}
          >
            Eliminar
          </Button>
        </Space>
      )
    }
  ]

  const stepColumns = [
    {
      title: 'No.',
      key: 'order',
      width: 50,
      render: (_, record, index) => index + 1
    },
    {
      title: 'Nombre del Paso',
      dataIndex: 'name',
      key: 'name',
      render: (text, record, index) => (
        <Input
          value={text}
          onChange={(e) => {
            const newSteps = [...steps]
            newSteps[index].name = e.target.value
            setSteps(newSteps)
          }}
          size="small"
          placeholder="Nombre del paso"
        />
      )
    },
    {
      title: 'Tipo',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (text, record, index) => (
        <Select
          value={text}
          onChange={(value) => {
            const newSteps = [...steps]
            newSteps[index].type = value
            setSteps(newSteps)
          }}
          options={stepTypes}
          size="small"
        />
      )
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
      render: (text, record, index) => (
        <Input
          value={text}
          onChange={(e) => {
            const newSteps = [...steps]
            newSteps[index].description = e.target.value
            setSteps(newSteps)
          }}
          size="small"
          placeholder="Descripción"
        />
      )
    },
    {
      title: 'Acción',
      key: 'action',
      width: 60,
      render: (_, record, index) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => setSteps(steps.filter((_, i) => i !== index))}
        />
      )
    }
  ]

  const editWorkflow = (workflow) => {
    setSelectedWorkflow(workflow)
    form.setFieldsValue({
      name: workflow.name,
      description: workflow.description,
      triggerEvent: workflow.triggerEvent,
      status: workflow.status,
      notifyOnError: workflow.notifyOnError
    })
    setSteps([
      { id: 1, name: 'Paso 1', type: 'manual', description: 'Primer paso manual' },
      { id: 2, name: 'Validar Datos', type: 'script', description: 'Ejecutar validación' },
      { id: 3, name: 'Notificar', type: 'notification', description: 'Enviar notificación' }
    ])
    setConditions([
      { id: 1, field: 'status', operator: 'equals', value: 'approved', action: 'proceed' },
      { id: 2, field: 'amount', operator: 'greater_than', value: '1000', action: 'escalate' }
    ])
    setActiveTab('editor')
  }

  const deleteWorkflow = (workflow) => {
    Modal.confirm({
      title: `Eliminar ${workflow.name}`,
      content: '¿Estás seguro de que quieres eliminar este workflow? Esta acción no se puede deshacer.',
      okText: 'Sí',
      cancelText: 'No',
      onOk() {
        setWorkflows(workflows.filter(w => w.id !== workflow.id))
        message.success('Workflow eliminado')
      }
    })
  }

  const duplicateWorkflow = (workflow) => {
    const newWorkflow = {
      ...workflow,
      id: Date.now(),
      name: `${workflow.name} (Copia)`,
      version: '1.0',
      modified: new Date().toLocaleString()
    }
    setWorkflows([...workflows, newWorkflow])
    message.success('Workflow duplicado exitosamente')
  }

  const createNewWorkflow = () => {
    setSelectedWorkflow(null)
    form.resetFields()
    setSteps([])
    setConditions([])
    setActiveTab('editor')
  }

  const addStep = () => {
    const newStep = {
      id: steps.length ? Math.max(...steps.map(s => s.id || 0)) + 1 : 1,
      name: `Paso ${steps.length + 1}`,
      type: 'manual',
      description: ''
    }
    setSteps([...steps, newStep])
  }

  const addCondition = () => {
    const newCondition = {
      id: conditions.length ? Math.max(...conditions.map(c => c.id || 0)) + 1 : 1,
      field: '',
      operator: 'equals',
      value: '',
      action: 'proceed'
    }
    setConditions([...conditions, newCondition])
  }

  const saveWorkflow = async (values) => {
    if (steps.length === 0) {
      message.error('Debes agregar al menos un paso al workflow')
      return
    }

    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))

      const newWorkflow = {
        id: selectedWorkflow?.id || Date.now(),
        name: values.name,
        description: values.description,
        status: values.status || 'active',
        version: selectedWorkflow?.version || '1.0',
        stepCount: steps.length,
        modified: new Date().toLocaleString(),
        triggerEvent: values.triggerEvent,
        notifyOnError: values.notifyOnError
      }

      if (selectedWorkflow) {
        setWorkflows(workflows.map(w => w.id === newWorkflow.id ? newWorkflow : w))
        message.success('Workflow actualizado exitosamente')
      } else {
        setWorkflows([...workflows, newWorkflow])
        message.success('Workflow creado exitosamente')
      }

      setActiveTab('list')
      form.resetFields()
      setSelectedWorkflow(null)
      setSteps([])
      setConditions([])
    } catch (error) {
      message.error('Error al guardar workflow')
    } finally {
      setLoading(false)
    }
  }

  if (workflows.length === 0) {
    setWorkflows(mockWorkflows)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
        <BgColorsOutlined /> Gestor de Workflows Therefore™
      </h1>

      <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'list',
              label: 'Workflows',
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0, flex: 1 }}>
                  <Space>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={createNewWorkflow}
                    >
                      Crear Nuevo Workflow
                    </Button>
                  </Space>

                  <div style={{ flex: 1, minHeight: 0 }}>
                    <Table
                      columns={workflowColumns}
                      dataSource={workflows}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                    />
                  </div>
                </div>
              )
            },
            {
              key: 'editor',
              label: 'Editor',
              children: (
                <Spin spinning={loading}>
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={saveWorkflow}
                  >
                    <Form.Item
                      label="Nombre del Workflow"
                      name="name"
                      rules={[{ required: true, message: 'Nombre requerido' }]}
                    >
                      <Input placeholder="Ej: Aprobación de Matrículas" />
                    </Form.Item>

                    <Form.Item
                      label="Descripción"
                      name="description"
                    >
                      <Input.TextArea rows={2} placeholder="Describe el propósito del workflow" />
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                      <Form.Item
                        label="Evento Disparador"
                        name="triggerEvent"
                        rules={[{ required: true, message: 'Evento requerido' }]}
                      >
                        <Select
                          options={triggerEvents}
                          placeholder="Selecciona el evento que inicia el workflow"
                        />
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
                    </div>

                    <Form.Item
                      label="Notificar en caso de error"
                      name="notifyOnError"
                      valuePropName="checked"
                      initialValue={false}
                    >
                      <Switch />
                    </Form.Item>

                    <div style={{
                      border: '1px solid var(--border-default)',
                      borderRadius: '4px',
                      padding: '16px',
                      marginBottom: '16px',
                      background: 'var(--bg-hover)'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px'
                      }}>
                        <h4>Pasos del Workflow</h4>
                        <Button
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={addStep}
                        >
                          Agregar Paso
                        </Button>
                      </div>

                      {steps.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No hay pasos definidos. Haz clic en "Agregar Paso".</p>
                      ) : (
                        <Table
                          columns={stepColumns}
                          dataSource={steps}
                          rowKey="id"
                          pagination={false}
                          size="small"
                          scroll={{ x: 900 }}
                        />
                      )}
                    </div>

                    <Collapse
                      style={{ marginBottom: '16px' }}
                      items={[
                        {
                          key: '1',
                          label: 'Condiciones del Workflow',
                          children: (
                            <div>
                              <Button
                                size="small"
                                icon={<PlusOutlined />}
                                onClick={addCondition}
                                style={{ marginBottom: '12px' }}
                              >
                                Agregar Condición
                              </Button>

                              {conditions.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)' }}>No hay condiciones definidas.</p>
                              ) : (
                                <List
                                  dataSource={conditions}
                                  renderItem={(condition, index) => (
                                    <List.Item
                                      extra={
                                        <Button
                                          type="text"
                                          danger
                                          size="small"
                                          icon={<DeleteOutlined />}
                                          onClick={() => setConditions(conditions.filter((_, i) => i !== index))}
                                        />
                                      }
                                    >
                                      <div style={{ width: '100%' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                          <Input
                                            value={condition.field}
                                            onChange={(e) => {
                                              const newConditions = [...conditions]
                                              newConditions[index].field = e.target.value
                                              setConditions(newConditions)
                                            }}
                                            placeholder="Campo"
                                            size="small"
                                          />
                                          <Select
                                            value={condition.operator}
                                            onChange={(value) => {
                                              const newConditions = [...conditions]
                                              newConditions[index].operator = value
                                              setConditions(newConditions)
                                            }}
                                            options={[
                                              { label: 'Igual a', value: 'equals' },
                                              { label: 'Mayor que', value: 'greater_than' },
                                              { label: 'Menor que', value: 'less_than' },
                                              { label: 'Contiene', value: 'contains' }
                                            ]}
                                            size="small"
                                          />
                                          <Input
                                            value={condition.value}
                                            onChange={(e) => {
                                              const newConditions = [...conditions]
                                              newConditions[index].value = e.target.value
                                              setConditions(newConditions)
                                            }}
                                            placeholder="Valor"
                                            size="small"
                                          />
                                          <Select
                                            value={condition.action}
                                            onChange={(value) => {
                                              const newConditions = [...conditions]
                                              newConditions[index].action = value
                                              setConditions(newConditions)
                                            }}
                                            options={[
                                              { label: 'Continuar', value: 'proceed' },
                                              { label: 'Escalar', value: 'escalate' },
                                              { label: 'Rechazar', value: 'reject' }
                                            ]}
                                            size="small"
                                          />
                                        </div>
                                      </div>
                                    </List.Item>
                                  )}
                                />
                              )}
                            </div>
                          )
                        }
                      ]}
                    />

                    <Space>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        icon={<SaveOutlined />}
                      >
                        Guardar Workflow
                      </Button>
                      <Button
                        onClick={() => {
                          setActiveTab('list')
                          form.resetFields()
                          setSelectedWorkflow(null)
                          setSteps([])
                          setConditions([])
                        }}
                      >
                        Cancelar
                      </Button>
                    </Space>
                  </Form>
                </Spin>
              )
            }
          ]}
        />
    </div>
  )
}
