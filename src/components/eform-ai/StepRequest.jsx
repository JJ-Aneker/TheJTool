import { useState } from 'react'
import { Form, Input, Select, Button, Upload, Tag, Alert, Space, Card, Row, Col } from 'antd'
import { CloudUploadOutlined, BulbOutlined, ThunderboltOutlined } from '@ant-design/icons'
import axios from 'axios'
import { supabase } from '../../config/supabaseClient'
import { useTranslation } from 'react-i18next'

const { TextArea } = Input
const { Option } = Select

export default function StepRequest({ formData, updateFormData, goToStep, setLoading }) {
  const { t } = useTranslation()

  const FUNCTIONAL_BLOCKS = [
    { key: 'qr', label: t('eformGeneratorAI.blocks.qr') },
    { key: 'autofill', label: t('eformGeneratorAI.blocks.autofill') },
    { key: 'lookup', label: t('eformGeneratorAI.blocks.lookup') },
    { key: 'modal', label: t('eformGeneratorAI.blocks.modal') },
    { key: 'signature', label: t('eformGeneratorAI.blocks.signature') }
  ]

  const FORMAT_BLOCKS = [
    { key: 'header', label: t('eformGeneratorAI.blocks.header') },
    { key: 'columns2', label: t('eformGeneratorAI.blocks.columns2') },
    { key: 'columns3', label: t('eformGeneratorAI.blocks.columns3') }
  ]

  const EXAMPLES = [
    {
      title: t('eformGeneratorAI.examples.customerRegistration'),
      text: 'Crear un eForm para dar de alta clientes con nombre, NIF, email, teléfono y dirección. El NIF es obligatorio.'
    },
    {
      title: t('eformGeneratorAI.examples.booksWithQr'),
      text: 'Formulario para registrar libros en biblioteca con lector de códigos QR. Campos: código (leído por QR), título, autor, ISBN, fecha de alta.'
    }
  ]

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
        message={t('eformGeneratorAI.help.howItWorks')}
        description={
          <ol style={{ marginBottom: 0, paddingLeft: 20 }}>
            <li>{t('eformGeneratorAI.help.step1')}</li>
            <li>{t('eformGeneratorAI.help.step2')}</li>
            <li>{t('eformGeneratorAI.help.step3')}</li>
            <li>{t('eformGeneratorAI.help.step4')}</li>
          </ol>
        }
        type="info"
        showIcon
      />

      <Card title={t('common.examples')} size="small">
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
          label={t('eformGeneratorAI.describeForm')}
          name="request"
          rules={[{ required: true, message: t('eformGeneratorAI.describeForm') }]}
        >
          <TextArea
            rows={promptImproved ? 12 : 6}
            placeholder={t('eformGeneratorAI.describeFormPlaceholder')}
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
              {t('eformGeneratorAI.improvePrompt')}
            </Button>
          </Col>
          {promptImproved && (
            <Col>
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={handleGenerate}
              >
                {t('eformGeneratorAI.generateEform')}
              </Button>
            </Col>
          )}
        </Row>

        {promptImproved && (
          <>
            <Form.Item label={t('eformGeneratorAI.formName')} name="formName" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <Form.Item
              label={t('eformGeneratorAI.formId')}
              name="formId"
              rules={[
                { required: true },
                { pattern: /^[A-Za-z][A-Za-z0-9_]*$/, message: t('eformGeneratorAI.formIdPattern') }
              ]}
            >
              <Input />
            </Form.Item>
          </>
        )}

        <Form.Item label={t('eformGeneratorAI.targetEnvironment')} name="environment" rules={[{ required: true }]}>
          <Select>
            <Option value="online">{t('eformGeneratorAI.online')}</Option>
            <Option value="onpremise">{t('eformGeneratorAI.onpremise')}</Option>
          </Select>
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.environment !== currentValues.environment}
        >
          {({ getFieldValue }) =>
            getFieldValue('environment') === 'online' ? (
              <Form.Item label={t('eformGeneratorAI.tenant')} name="tenant">
                <Input placeholder={t('eformGeneratorAI.tenantPlaceholder')} />
              </Form.Item>
            ) : (
              <Form.Item label={t('eformGeneratorAI.serverUrl')} name="serverUrl">
                <Input placeholder={t('eformGeneratorAI.serverUrlPlaceholder')} />
              </Form.Item>
            )
          }
        </Form.Item>

        <Form.Item label={t('eformGeneratorAI.functionalBlocks')}>
          <Space wrap>
            {FUNCTIONAL_BLOCKS.map(block => (
              <Tag.CheckableTag
                key={block.key}
                checked={formData.blocks?.includes(block.key) || false}
                onChange={() => handleBlockToggle(block.key)}
              >
                {block.label}
              </Tag.CheckableTag>
            ))}
          </Space>
        </Form.Item>

        <Form.Item label={t('eformGeneratorAI.formatDesign')}>
          <Space wrap>
            {FORMAT_BLOCKS.map(block => (
              <Tag.CheckableTag
                key={block.key}
                checked={formData.blocks?.includes(block.key) || false}
                onChange={() => handleBlockToggle(block.key)}
              >
                {block.label}
              </Tag.CheckableTag>
            ))}
          </Space>
        </Form.Item>

        <Form.Item label={t('eformGeneratorAI.targetCategory')}>
          <Upload
            accept=".xml"
            beforeUpload={handleCategoryUpload}
            showUploadList={false}
          >
            <Button icon={<CloudUploadOutlined />}>
              {categoryFileName || t('eformGeneratorAI.uploadCategoryXml')}
            </Button>
          </Upload>
          {formData.categoryFields && formData.categoryFields.length > 0 && (
            <Card
              size="small"
              title={`${formData.categoryFields.length} ${t('eformGeneratorAI.categoryDetection.fieldsDetectedInCategory')}`}
              style={{ marginTop: 8 }}
            >
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #d9d9d9' }}>
                      <th style={{ padding: '4px 8px', textAlign: 'left' }}>{t('eformGeneratorAI.categoryDetection.colName')}</th>
                      <th style={{ padding: '4px 8px', textAlign: 'left' }}>{t('eformGeneratorAI.categoryDetection.caption')}</th>
                      <th style={{ padding: '4px 8px', textAlign: 'left' }}>{t('eformGeneratorAI.categoryDetection.type')}</th>
                      <th style={{ padding: '4px 8px', textAlign: 'center' }}>{t('eformGeneratorAI.categoryDetection.length')}</th>
                      <th style={{ padding: '4px 8px', textAlign: 'center' }}>{t('eformGeneratorAI.categoryDetection.required')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.categoryFields.map((field, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '4px 8px', fontFamily: 'monospace' }}>{field.colName}</td>
                        <td style={{ padding: '4px 8px' }}>{field.caption}</td>
                        <td style={{ padding: '4px 8px', fontSize: '11px', color: '#666' }}>{field.typeName}</td>
                        <td style={{ padding: '4px 8px', textAlign: 'center', fontSize: '11px' }}>{field.length > 0 ? field.length : '-'}</td>
                        <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                          {field.required ? '✓' : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Alert
                type="info"
                message={t('eformGeneratorAI.aiWillUseExactColNames')}
                style={{ marginTop: 8 }}
                showIcon={false}
              />
            </Card>
          )}
        </Form.Item>

      </Form>
    </Space>
  )
}
