import { useState } from 'react'
import { Form, Input, Button, Select, Space, Alert, Table, Upload, message, Spin, InputNumber } from 'antd'
import { FormOutlined, DownloadOutlined, UploadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'

export default function EFormGenerator() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [eforms, setEforms] = useState([])
  const [selectedEForm, setSelectedEForm] = useState(null)
  const [fields, setFields] = useState([])
  const [activeTab, setActiveTab] = useState('list')

  const eformColumns = [
    {
      title: 'Nombre del eForm',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 150
    },
    {
      title: 'Campos',
      dataIndex: 'fieldCount',
      key: 'fieldCount',
      width: 100
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <span style={{
          color: status === 'published' ? 'var(--accent-success)' : 'var(--kpi-amber)',
          fontWeight: 'bold'
        }}>
          {status === 'published' ? '✓ Publicado' : '● Borrador'}
        </span>
      )
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => editEForm(record)}>
            Editar
          </Button>
          <Button type="link" size="small" onClick={() => downloadEForm(record)}>
            Descargar XML
          </Button>
          <Button type="link" danger size="small" onClick={() => deleteEForm(record)}>
            Eliminar
          </Button>
        </Space>
      )
    }
  ]

  const mockEForms = [
    {
      id: 'EFORM_MATRICULAS_001',
      name: 'eForm Matrículas',
      fieldCount: 12,
      status: 'published',
      description: 'Formulario electrónico para solicitud de matrículas'
    },
    {
      id: 'EFORM_SOLICITUD_002',
      name: 'eForm Solicitud General',
      fieldCount: 8,
      status: 'draft',
      description: 'Solicitud general con campos básicos'
    }
  ]

  const fieldTypeOptions = [
    { label: 'Texto', value: 'text' },
    { label: 'Texto Largo', value: 'textarea' },
    { label: 'Email', value: 'email' },
    { label: 'Número', value: 'number' },
    { label: 'Fecha', value: 'date' },
    { label: 'Selección', value: 'select' },
    { label: 'Checkbox', value: 'checkbox' },
    { label: 'Archivo', value: 'file' }
  ]

  const editEForm = (eform) => {
    setSelectedEForm(eform)
    setActiveTab('editor')
    form.setFieldsValue({
      name: eform.name,
      id: eform.id,
      description: eform.description
    })
    setFields([
      { id: 1, name: 'campo1', label: 'Campo 1', type: 'text', required: true },
      { id: 2, name: 'campo2', label: 'Campo 2', type: 'text', required: false }
    ])
  }

  const downloadEForm = (eform) => {
    message.info(`Descargando eForm "${eform.name}" en formato XML...`)
  }

  const deleteEForm = (eform) => {
    setEforms(eforms.filter(e => e.id !== eform.id))
    message.success(`eForm "${eform.name}" eliminado`)
  }

  const createNewEForm = () => {
    setSelectedEForm(null)
    setActiveTab('editor')
    form.resetFields()
    setFields([])
  }

  const addField = () => {
    const newField = {
      id: fields.length + 1,
      name: `campo_${fields.length + 1}`,
      label: `Campo ${fields.length + 1}`,
      type: 'text',
      required: false
    }
    setFields([...fields, newField])
  }

  const removeField = (fieldId) => {
    setFields(fields.filter(f => f.id !== fieldId))
  }

  const saveEForm = async (values) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))

      const newEForm = {
        id: values.id,
        name: values.name,
        fieldCount: fields.length,
        status: values.status || 'draft',
        description: values.description
      }

      if (selectedEForm) {
        setEforms(eforms.map(e => e.id === newEForm.id ? newEForm : e))
        message.success('eForm actualizado exitosamente')
      } else {
        setEforms([...eforms, newEForm])
        message.success('eForm creado exitosamente')
      }

      setActiveTab('list')
      form.resetFields()
      setSelectedEForm(null)
      setFields([])
    } catch (error) {
      message.error('Error al guardar eForm')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadXml = (file) => {
    message.loading('Procesando eForm XML...')
    setTimeout(() => {
      message.success('eForm importado exitosamente')
      setEforms([...eforms, {
        id: 'EFORM_IMPORTED_' + Date.now(),
        name: 'eForm Importado',
        fieldCount: 10,
        status: 'draft'
      }])
    }, 1500)
    return false
  }

  // Simular carga inicial
  if (eforms.length === 0) {
    setEforms(mockEForms)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
        <FormOutlined /> Generador de eForms Therefore™
      </h1>

      {/* Tabs + Botones en la misma línea */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border-default)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '0' }}>
            <button
              onClick={() => setActiveTab('list')}
              style={{
                padding: '8px 16px',
                background: activeTab === 'list' ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === 'list' ? 'white' : 'var(--text-primary)',
                border: 'none',
                borderBottom: activeTab === 'list' ? '2px solid var(--accent-primary)' : 'none',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                fontSize: '14px'
              }}
            >
              Lista de eForms
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              style={{
                padding: '8px 16px',
                background: activeTab === 'editor' ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === 'editor' ? 'white' : 'var(--text-primary)',
                border: 'none',
                borderBottom: activeTab === 'editor' ? '2px solid var(--accent-primary)' : 'none',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                fontSize: '14px'
              }}
            >
              Editor de eForm
            </button>
          </div>
        </div>

        {/* Botones alineados a la derecha */}
        {activeTab === 'list' && (
          <Space style={{ paddingBottom: '6px', paddingRight: '0' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={createNewEForm}
              size="small"
            >
              Crear Nuevo eForm
            </Button>
            <Upload
              beforeUpload={handleUploadXml}
              accept=".xml"
              maxCount={1}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} size="small">Importar XML</Button>
            </Upload>
          </Space>
        )}
      </div>

      {/* Contenido de los tabs */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {activeTab === 'list' && (
          <div style={{ flex: 1, overflow: 'auto' }}>
            <Table
              columns={eformColumns}
              dataSource={eforms}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </div>
        )}

        {activeTab === 'editor' && (
          <Spin spinning={loading} style={{ flex: 1 }}>
            <div style={{ flex: 1, overflow: 'auto', paddingRight: '16px' }}>
              <Form
                form={form}
                layout="vertical"
                onFinish={saveEForm}
              >
                <Form.Item
                  label="ID del eForm"
                  name="id"
                  rules={[
                    { required: true, message: 'ID requerido' },
                    { pattern: /^[A-Z_0-9]+$/, message: 'Solo mayúsculas y números' }
                  ]}
                >
                  <Input placeholder="Ej: EFORM_MATRICULAS_001" />
                </Form.Item>

                <Form.Item
                  label="Nombre del eForm"
                  name="name"
                  rules={[{ required: true, message: 'Nombre requerido' }]}
                >
                  <Input placeholder="Ej: eForm Matrículas" />
                </Form.Item>

                <Form.Item
                  label="Descripción"
                  name="description"
                >
                  <Input.TextArea rows={2} />
                </Form.Item>

                <Form.Item
                  label="Estado"
                  name="status"
                  initialValue="draft"
                >
                  <Select
                    options={[
                      { label: 'Borrador', value: 'draft' },
                      { label: 'Publicado', value: 'published' }
                    ]}
                  />
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
                    <h4>Campos del Formulario</h4>
                    <Button
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={addField}
                    >
                      Agregar Campo
                    </Button>
                  </div>

                  {fields.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No hay campos definidos. Haz clic en "Agregar Campo".</p>
                  ) : (
                    <Table
                      dataSource={fields}
                      columns={[
                        {
                          title: 'Nombre',
                          dataIndex: 'name',
                          key: 'name',
                          render: (text, record, index) => (
                            <Input
                              value={text}
                              onChange={(e) => {
                                const newFields = [...fields]
                                newFields[index].name = e.target.value
                                setFields(newFields)
                              }}
                              size="small"
                            />
                          )
                        },
                        {
                          title: 'Etiqueta',
                          dataIndex: 'label',
                          key: 'label',
                          render: (text, record, index) => (
                            <Input
                              value={text}
                              onChange={(e) => {
                                const newFields = [...fields]
                                newFields[index].label = e.target.value
                                setFields(newFields)
                              }}
                              size="small"
                            />
                          )
                        },
                        {
                          title: 'Tipo',
                          dataIndex: 'type',
                          key: 'type',
                          width: 120,
                          render: (text, record, index) => (
                            <Select
                              value={text}
                              onChange={(value) => {
                                const newFields = [...fields]
                                newFields[index].type = value
                                setFields(newFields)
                              }}
                              options={fieldTypeOptions}
                              size="small"
                            />
                          )
                        },
                        {
                          title: 'Acción',
                          key: 'action',
                          width: 80,
                          render: (_, record) => (
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => removeField(record.id)}
                            />
                          )
                        }
                      ]}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  )}
                </div>

                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                  >
                    Guardar eForm
                  </Button>
                  <Button
                    onClick={() => {
                      setActiveTab('list')
                      form.resetFields()
                      setSelectedEForm(null)
                      setFields([])
                    }}
                  >
                    Cancelar
                  </Button>
                  {selectedEForm && (
                    <Button
                      type="default"
                      onClick={() => downloadEForm(selectedEForm)}
                      icon={<DownloadOutlined />}
                    >
                      Descargar XML
                    </Button>
                  )}
                </Space>
              </Form>
            </div>
          </Spin>
        )}
      </div>
    </div>
  )
}
