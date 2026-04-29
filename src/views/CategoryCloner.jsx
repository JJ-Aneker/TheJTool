import { useState } from 'react'
import { Card, Form, Input, Button, Select, Space, Alert, Table, Modal, message, Upload, Spin } from 'antd'
import { CopyOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons'

export default function CategoryCloner() {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [form] = Form.useForm()
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [cloneData, setCloneData] = useState({})

  const columns = [
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
      width: 100
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleSelectCategory(record)}
          >
            Clonar
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => downloadCategory(record)}
          >
            Descargar XML
          </Button>
        </Space>
      )
    }
  ]

  const handleSelectCategory = (category) => {
    setSelectedCategory(category)
    form.setFieldsValue({
      sourceCategory: category.ctgryId,
      sourceTemplate: category.name
    })
    setCloneData({})
  }

  const downloadCategory = (category) => {
    message.info(`Descargando XML de ${category.name}...`)
    // Aquí iría la lógica para descargar el XML
  }

  const handleClone = async (values) => {
    setLoading(true)
    try {
      // Simular carga
      await new Promise(resolve => setTimeout(resolve, 2000))

      message.success(`Categoría "${values.newName}" clonada exitosamente`)
      form.resetFields()
      setSelectedCategory(null)
      setCloneData({})

      // Actualizar lista
      setCategories([...categories, {
        ctgryId: values.newId,
        name: values.newName,
        fieldCount: selectedCategory?.fieldCount || 0
      }])
    } catch (error) {
      message.error('Error al clonar categoría: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadXml = (file) => {
    message.loading('Procesando XML...')
    // Aquí iría la lógica para procesar el XML subido
    setTimeout(() => {
      message.success('XML procesado correctamente')
      setCategories([...categories, {
        ctgryId: 'NEW_CAT_' + Date.now(),
        name: 'Categoría Importada',
        fieldCount: 116
      }])
    }, 1500)
    return false
  }

  // Categorías de ejemplo
  const mockCategories = [
    { ctgryId: 'MatriculaMaestro', name: 'Matrícula Maestro', fieldCount: 116 },
    { ctgryId: 'DocumentoGeneral', name: 'Documento General', fieldCount: 45 },
    { ctgryId: 'Expediente', name: 'Expediente', fieldCount: 78 }
  ]

  if (mockCategories.length > 0 && categories.length === 0) {
    setCategories(mockCategories)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <CopyOutlined /> Clonador de Categorías Therefore™
        </h1>
        <Upload
          beforeUpload={handleUploadXml}
          accept=".xml"
          maxCount={1}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>Importar XML</Button>
        </Upload>
      </div>
        <Spin spinning={loading} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h3 style={{ margin: '0 0 16px 0' }}>Categorías Disponibles</h3>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Table
              columns={columns}
              dataIndex={categories}
              rowKey="ctgryId"
              size="small"
              pagination={{ pageSize: 10 }}
            />
          </div>

          {selectedCategory && (
            <Card
              title="Parámetros de Clonación"
              style={{ marginTop: 24, background: 'var(--bg-hover)' }}
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handleClone}
                initialValues={{
                  sourceCategory: selectedCategory.ctgryId,
                  sourceTemplate: selectedCategory.name
                }}
              >
                <Form.Item
                  label="Categoría Origen"
                  name="sourceCategory"
                >
                  <Input disabled />
                </Form.Item>

                <Form.Item
                  label="Template Origen"
                  name="sourceTemplate"
                >
                  <Input disabled />
                </Form.Item>

                <Form.Item
                  label="Nuevo ID de Categoría"
                  name="newId"
                  rules={[
                    { required: true, message: 'Ingresa un ID único' },
                    { pattern: /^[A-Za-z_][A-Za-z0-9_]*$/, message: 'ID inválido' }
                  ]}
                >
                  <Input placeholder="Ej: MiNuevaCategoria" />
                </Form.Item>

                <Form.Item
                  label="Nombre de la Nueva Categoría"
                  name="newName"
                  rules={[{ required: true, message: 'El nombre es requerido' }]}
                >
                  <Input placeholder="Ej: Mi Nueva Categoría" />
                </Form.Item>

                <Form.Item
                  label="Descripción"
                  name="description"
                >
                  <Input.TextArea rows={3} placeholder="Descripción opcional" />
                </Form.Item>

                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<CopyOutlined />}
                  >
                    Clonar Categoría
                  </Button>
                  <Button onClick={() => {
                    setSelectedCategory(null)
                    form.resetFields()
                  }}>
                    Cancelar
                  </Button>
                </Space>
              </Form>
            </Card>
          )}
        </Spin>
    </div>
  )
}
