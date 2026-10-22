import { useState } from 'react'
import { Form, Input, Select, Button, Upload, Tag, Alert, Space, Card } from 'antd'
import { CloudUploadOutlined, ArrowRightOutlined } from '@ant-design/icons'
import axios from 'axios'
import { supabase } from '../../config/supabaseClient'

const { TextArea } = Input
const { Option } = Select

const BLOCKS = [
  { key: 'qr', label: '📷 Lector QR / códigos de barras' },
  { key: 'autofill', label: '👤 Autorrelleno con usuario conectado' },
  { key: 'lookup', label: '🔍 Buscar en categoría maestra' },
  { key: 'modal', label: '✏️ Modal de actualización de datos' },
  { key: 'signature', label: '✍️ Firma (canvas)' }
]

const EXAMPLES = [
  {
    title: 'Alta de cliente',
    text: 'Crear un eForm para dar de alta clientes con nombre, NIF, email, teléfono y dirección. El NIF es obligatorio.'
  },
  {
    title: 'Registro de libros con QR',
    text: 'Formulario para registrar libros en biblioteca con lector de códigos QR. Campos: código (leído por QR), título, autor, ISBN, fecha de alta.'
  }
]

export default function StepRequest({ formData, updateFormData, goToStep, setLoading }) {
  const [form] = Form.useForm()
  const [categoryFileName, setCategoryFileName] = useState(null)

  const handleSubmit = async (values) => {
    try {
      setLoading(true)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No autenticado')
      }

      const payload = {
        request: values.request,
        environment: values.environment,
        tenant: values.tenant,
        serverUrl: values.serverUrl,
        blocks: formData.blocks,
        categoryXml: formData.categoryXml,
        answers: []
      }

      const response = await axios.post('/api/eform-ai/propose', payload, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.questions) {
        // Hay preguntas aclaratorias
        updateFormData({
          request: values.request,
          environment: values.environment,
          tenant: values.tenant,
          serverUrl: values.serverUrl,
          questions: response.data.questions
        })
        goToStep(1) // Ir a paso de preguntas
      } else {
        // Prompt detallado directo
        updateFormData({
          request: values.request,
          environment: values.environment,
          tenant: values.tenant,
          serverUrl: values.serverUrl,
          detailedPrompt: response.data.detailedPrompt,
          formName: response.data.suggestedFormName,
          formId: response.data.suggestedFormId
        })
        goToStep(2) // Ir directamente al prompt
      }
    } catch (err) {
      console.error('Error en propose:', err)
      const errorMsg = err.response?.data?.error || err.message
      alert(`Error: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  const handleBlockToggle = (blockKey) => {
    const newBlocks = formData.blocks.includes(blockKey)
      ? formData.blocks.filter(b => b !== blockKey)
      : [...formData.blocks, blockKey]

    updateFormData({ blocks: newBlocks })
  }

  const handleCategoryUpload = async (file) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const xml = e.target.result

      try {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()

        const response = await axios.post('/api/eform-ai/parse-category',
          { categoryXml: xml },
          { headers: { 'Authorization': `Bearer ${session.access_token}` } }
        )

        updateFormData({
          categoryXml: xml,
          categoryFields: response.data.fields
        })
        setCategoryFileName(file.name)
      } catch (err) {
        console.error('Error parseando categoría:', err)
        alert('Error parseando XML de categoría: ' + (err.response?.data?.error || err.message))
      } finally {
        setLoading(false)
      }
    }
    reader.readAsText(file)
    return false // Prevenir upload automático
  }

  const loadExample = (example) => {
    form.setFieldsValue({ request: example.text })
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Alert
        message="Cómo funciona"
        description={
          <ol style={{ marginBottom: 0, paddingLeft: 20 }}>
            <li>Describe el formulario en lenguaje natural</li>
            <li>Revisa el prompt detallado que propone la IA</li>
            <li>Descarga el XML listo para importar en Therefore</li>
          </ol>
        }
        type="info"
        showIcon
      />

      <Card title="Ejemplos rápidos" size="small">
        <Space wrap>
          {EXAMPLES.map((ex, i) => (
            <Button key={i} size="small" onClick={() => loadExample(ex)}>
              {ex.title}
            </Button>
          ))}
        </Space>
      </Card>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          request: formData.request,
          environment: formData.environment || 'online',
          tenant: formData.tenant,
          serverUrl: formData.serverUrl
        }}
        onFinish={handleSubmit}
      >
        <Form.Item
          label="Describe tu eForm"
          name="request"
          rules={[{ required: true, message: 'Describe el formulario' }]}
        >
          <TextArea
            rows={6}
            placeholder="Ejemplo: Crea un eForm para el registro de libros que además lea QRs. Campos: código QR, título, autor, ISBN, fecha de alta. El código QR es obligatorio."
            showCount
            maxLength={2000}
          />
        </Form.Item>

        <Form.Item label="Entorno destino" name="environment" rules={[{ required: true }]}>
          <Select>
            <Option value="online">Therefore Online</Option>
            <Option value="onpremise">On-Premise</Option>
          </Select>
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.environment !== currentValues.environment}
        >
          {({ getFieldValue }) =>
            getFieldValue('environment') === 'online' ? (
              <Form.Item label="Tenant (opcional)" name="tenant">
                <Input placeholder="ej: buildingcenter" />
              </Form.Item>
            ) : (
              <Form.Item label="URL del servidor (opcional)" name="serverUrl">
                <Input placeholder="ej: https://servidor.local.com" />
              </Form.Item>
            )
          }
        </Form.Item>

        <Form.Item label="Bloques predefinidos (opcional)">
          <Space wrap>
            {BLOCKS.map(block => (
              <Tag.CheckableTag
                key={block.key}
                checked={formData.blocks.includes(block.key)}
                onChange={() => handleBlockToggle(block.key)}
              >
                {block.label}
              </Tag.CheckableTag>
            ))}
          </Space>
        </Form.Item>

        <Form.Item label="Categoría destino (opcional)">
          <Upload
            accept=".xml"
            beforeUpload={handleCategoryUpload}
            showUploadList={false}
          >
            <Button icon={<CloudUploadOutlined />}>
              {categoryFileName || 'Subir XML de categoría'}
            </Button>
          </Upload>
          {formData.categoryFields.length > 0 && (
            <Alert
              type="success"
              message={`${formData.categoryFields.length} campos detectados`}
              style={{ marginTop: 8 }}
            />
          )}
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" icon={<ArrowRightOutlined />}>
            Proponer prompt
          </Button>
        </Form.Item>
      </Form>
    </Space>
  )
}
