import { useState } from 'react'
import { Form, Input, Select, Button, Upload, Tag, Alert, Space, Card, Row, Col } from 'antd'
import { CloudUploadOutlined, BulbOutlined, ThunderboltOutlined } from '@ant-design/icons'
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
  const [promptImproved, setPromptImproved] = useState(false)

  const handleImprovePrompt = async () => {
    try {
      const values = await form.validateFields(['request', 'environment', 'tenant', 'serverUrl'])
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

      const response = await axios.post('/api/eform-ai?action=propose', payload, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.questions) {
        // Hay preguntas aclaratorias - ir al paso de preguntas
        updateFormData({
          request: values.request,
          environment: values.environment,
          tenant: values.tenant,
          serverUrl: values.serverUrl,
          questions: response.data.questions
        })
        goToStep(1)
      } else {
        // Actualizar el textarea con el prompt mejorado
        form.setFieldsValue({
          request: response.data.detailedPrompt,
          formName: response.data.suggestedFormName,
          formId: response.data.suggestedFormId
        })
        updateFormData({
          environment: values.environment,
          tenant: values.tenant,
          serverUrl: values.serverUrl,
          detailedPrompt: response.data.detailedPrompt,
          formName: response.data.suggestedFormName,
          formId: response.data.suggestedFormId
        })
        setPromptImproved(true)
      }
    } catch (err) {
      console.error('Error mejorando prompt:', err)
      const errorMsg = err.response?.data?.error || err.message
      alert(`Error: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No autenticado')
      }

      const response = await axios.post('/api/eform-ai?action=generate', {
        detailedPrompt: values.request,
        formName: values.formName,
        formId: values.formId,
        environment: values.environment,
        tenant: values.tenant,
        serverUrl: values.serverUrl,
        blocks: formData.blocks,
        categoryXml: formData.categoryXml,
        requestText: formData.request || values.request
      }, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      console.log('🔍 Respuesta del servidor:', response.data)
      console.log('🔍 Components:', response.data.components)
      console.log('🔍 Validation:', response.data.validation)

      updateFormData({
        request: values.request,
        environment: values.environment,
        tenant: values.tenant,
        serverUrl: values.serverUrl,
        detailedPrompt: values.request,
        formName: values.formName,
        formId: values.formId,
        generationId: response.data.generationId,
        components: response.data.components,
        xml: response.data.xml,
        validation: response.data.validation
      })
      goToStep(3) // Ir a resultado
    } catch (err) {
      console.error('Error generando eForm:', err)
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

        const response = await axios.post('/api/eform-ai?action=parse-category',
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
            <li>Haz clic en "Mejorar Prompt" para obtener un prompt detallado (editable)</li>
            <li>Haz clic en "Generar eForm" para crear el XML</li>
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
          request: formData.request || formData.detailedPrompt,
          environment: formData.environment || 'online',
          tenant: formData.tenant,
          serverUrl: formData.serverUrl,
          formName: formData.formName,
          formId: formData.formId
        }}
      >
        <Form.Item
          label="Describe tu eForm (editable)"
          name="request"
          rules={[{ required: true, message: 'Describe el formulario' }]}
        >
          <TextArea
            rows={promptImproved ? 12 : 6}
            placeholder="Ejemplo: Crea un eForm para el registro de libros que además lea QRs. Campos: código QR, título, autor, ISBN, fecha de alta. El código QR es obligatorio."
            showCount
            maxLength={5000}
          />
        </Form.Item>

        <Row gutter={8} style={{ marginBottom: 24 }}>
          <Col>
            <Button
              icon={<BulbOutlined />}
              onClick={handleImprovePrompt}
            >
              Mejorar Prompt
            </Button>
          </Col>
          {promptImproved && (
            <Col>
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={handleGenerate}
              >
                Generar eForm
              </Button>
            </Col>
          )}
        </Row>

        {promptImproved && (
          <>
            <Form.Item label="Nombre del formulario" name="formName" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <Form.Item
              label="FormID (sin espacios)"
              name="formId"
              rules={[
                { required: true },
                { pattern: /^[A-Za-z][A-Za-z0-9_]*$/, message: 'Solo [A-Za-z0-9_], empezando con letra' }
              ]}
            >
              <Input />
            </Form.Item>
          </>
        )}

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

      </Form>
    </Space>
  )
}
