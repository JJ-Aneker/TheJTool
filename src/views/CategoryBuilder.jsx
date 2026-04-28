import { useState } from 'react'
import { Card, Form, Input, Button, Space, Table, Modal, message, Tabs, Tree, Collapse, Select, InputNumber, Checkbox, Spin } from 'antd'
import { AppstoreOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons'

export default function CategoryBuilder() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [fields, setFields] = useState([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('list')

  const mockCategories = [
    {
      id: 1,
      ctgryId: 'MatriculaMaestro',
      name: 'Matrícula Maestro',
      description: 'Estructura para gestión de matrículas',
      fieldCount: 116,
      indexFields: 8,
      counters: 14,
      templates: 2
    },
    {
      id: 2,
      ctgryId: 'DocumentoGeneral',
      name: 'Documento General',
      description: 'Categoría genérica para documentos',
      fieldCount: 45,
      indexFields: 5,
      counters: 3,
      templates: 1
    }
  ]

  const fieldTypeOptions = [
    { label: 'Texto', value: 'String' },
    { label: 'Número', value: 'Integer' },
    { label: 'Fecha', value: 'Date' },
    { label: 'Dinero', value: 'Money' },
    { label: 'Booleano', value: 'Logical' },
    { label: 'Palabra Clave Simple', value: 'SingleKeyword' },
    { label: 'Palabras Clave Múltiples', value: 'MultipleKeyword' }
  ]

  const categoryColumns = [
    {
      title: 'ID Categoría',
      dataIndex: 'ctgryId',
      key: 'ctgryId',
      width: 150
    },
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Campos',
      dataIndex: 'fieldCount',
      key: 'fieldCount',
      width: 80
    },
    {
      title: 'Índices',
      dataIndex: 'indexFields',
      key: 'indexFields',
      width: 80
    },
    {
      title: 'Contadores',
      dataIndex: 'counters',
      key: 'counters',
      width: 80
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
            onClick={() => editCategory(record)}
          >
            Editar
          </Button>
          <Button
            type="link"
            size="small"
            icon={<DeleteOutlined />}
            danger
            onClick={() => deleteCategory(record)}
          >
            Eliminar
          </Button>
        </Space>
      )
    }
  ]

  const fieldColumns = [
    {
      title: 'Nombre de Campo',
      dataIndex: 'name',
      key: 'name',
      width: 150,
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
      width: 150,
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
      title: 'Obligatorio',
      dataIndex: 'required',
      key: 'required',
      width: 80,
      render: (checked, record, index) => (
        <Checkbox
          checked={checked}
          onChange={(e) => {
            const newFields = [...fields]
            newFields[index].required = e.target.checked
            setFields(newFields)
          }}
        />
      )
    },
    {
      title: 'Índice',
      dataIndex: 'isIndex',
      key: 'isIndex',
      width: 70,
      render: (checked, record, index) => (
        <Checkbox
          checked={checked}
          onChange={(e) => {
            const newFields = [...fields]
            newFields[index].isIndex = e.target.checked
            setFields(newFields)
          }}
        />
      )
    },
    {
      title: 'Acción',
      key: 'action',
      width: 60,
      render: (_, record) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => setFields(fields.filter(f => f.id !== record.id))}
        />
      )
    }
  ]

  if (categories.length === 0) {
    setCategories(mockCategories)
  }

  const editCategory = (category) => {
    setSelectedCategory(category)
    form.setFieldsValue({
      ctgryId: category.ctgryId,
      name: category.name,
      description: category.description
    })
    setFields([
      { id: 1, name: 'campo1', label: 'Campo 1', type: 'String', required: true, isIndex: true },
      { id: 2, name: 'campo2', label: 'Campo 2', type: 'Text', required: false, isIndex: false },
      { id: 3, name: 'fecha_creacion', label: 'Fecha Creación', type: 'Date', required: true, isIndex: true }
    ])
    setActiveTab('editor')
  }

  const deleteCategory = (category) => {
    Modal.confirm({
      title: `Eliminar ${category.name}`,
      content: '¿Estás seguro? Esta acción no se puede deshacer.',
      okText: 'Sí',
      cancelText: 'No',
      onOk() {
        setCategories(categories.filter(c => c.id !== category.id))
        message.success('Categoría eliminada')
      }
    })
  }

  const createNewCategory = () => {
    setSelectedCategory(null)
    form.resetFields()
    setFields([])
    setActiveTab('editor')
  }

  const addField = () => {
    const newField = {
      id: fields.length ? Math.max(...fields.map(f => f.id)) + 1 : 1,
      name: `campo_nuevo`,
      label: `Nuevo Campo`,
      type: 'String',
      required: false,
      isIndex: false
    }
    setFields([...fields, newField])
  }

  const saveCategory = async (values) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))

      const indexFieldCount = fields.filter(f => f.isIndex).length

      const newCategory = {
        id: selectedCategory?.id || Date.now(),
        ctgryId: values.ctgryId,
        name: values.name,
        description: values.description,
        fieldCount: fields.length,
        indexFields: indexFieldCount,
        counters: values.counters || 3,
        templates: values.templates || 1
      }

      if (selectedCategory) {
        setCategories(categories.map(c => c.id === newCategory.id ? newCategory : c))
        message.success('Categoría actualizada')
      } else {
        setCategories([...categories, newCategory])
        message.success('Categoría creada')
      }

      setActiveTab('list')
      form.resetFields()
      setSelectedCategory(null)
      setFields([])
    } catch (error) {
      message.error('Error al guardar categoría')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 1400 }}>
      <Card title={<><AppstoreOutlined /> Category Builder Therefore™</>}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'list',
              label: 'Categorías',
              children: (
                <div>
                  <Space style={{ marginBottom: 16 }}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={createNewCategory}
                    >
                      Nueva Categoría
                    </Button>
                  </Space>

                  <Table
                    columns={categoryColumns}
                    dataSource={categories}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
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
                    onFinish={saveCategory}
                  >
                    <Form.Item
                      label="ID de Categoría"
                      name="ctgryId"
                      rules={[{ required: true, message: 'ID requerido' }]}
                    >
                      <Input placeholder="Ej: MiCategoria" />
                    </Form.Item>

                    <Form.Item
                      label="Nombre"
                      name="name"
                      rules={[{ required: true, message: 'Nombre requerido' }]}
                    >
                      <Input placeholder="Ej: Mi Categoría" />
                    </Form.Item>

                    <Form.Item
                      label="Descripción"
                      name="description"
                    >
                      <Input.TextArea rows={2} />
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                      <Form.Item
                        label="Contadores"
                        name="counters"
                        initialValue={3}
                      >
                        <InputNumber min={0} max={20} />
                      </Form.Item>

                      <Form.Item
                        label="Templates"
                        name="templates"
                        initialValue={1}
                      >
                        <InputNumber min={0} max={10} />
                      </Form.Item>
                    </div>

                    <div style={{
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      padding: '16px',
                      marginBottom: '16px',
                      background: '#fafafa'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px'
                      }}>
                        <h4>Campos de la Categoría</h4>
                        <Button
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={addField}
                        >
                          Agregar Campo
                        </Button>
                      </div>

                      {fields.length === 0 ? (
                        <p style={{ color: '#8c8c8c' }}>No hay campos. Haz clic en "Agregar Campo".</p>
                      ) : (
                        <Table
                          columns={fieldColumns}
                          dataSource={fields}
                          rowKey="id"
                          pagination={false}
                          size="small"
                          scroll={{ x: 800 }}
                        />
                      )}
                    </div>

                    <Space>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        icon={<SaveOutlined />}
                      >
                        Guardar Categoría
                      </Button>
                      <Button
                        onClick={() => {
                          setActiveTab('list')
                          form.resetFields()
                          setSelectedCategory(null)
                          setFields([])
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
      </Card>
    </div>
  )
}
