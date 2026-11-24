import { Form, Input, Button, Space } from 'antd'
import { ArrowRightOutlined, ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import axios from 'axios'
import { supabase } from '../../config/supabaseClient'

const { TextArea } = Input

export default function StepPrompt({ formData, updateFormData, goToStep, setLoading }) {
  const [form] = Form.useForm()

  const handleGenerate = async (values) => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      const response = await axios.post('/api/eform-ai?action=generate', {
        detailedPrompt: values.detailedPrompt,
        formName: values.formName,
        formId: values.formId,
        environment: formData.environment,
        tenant: formData.tenant,
        serverUrl: formData.serverUrl,
        blocks: formData.blocks,
        categoryXml: formData.categoryXml,
        requestText: formData.request
      }, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      updateFormData({
        detailedPrompt: values.detailedPrompt,
        formName: values.formName,
        formId: values.formId,
        generationId: response.data.generationId,
        components: response.data.components,
        xml: response.data.xml,
        validation: response.data.validation
      })
      goToStep(2)
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        detailedPrompt: formData.detailedPrompt,
        formName: formData.formName,
        formId: formData.formId
      }}
      onFinish={handleGenerate}
    >
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

      <Form.Item label="Prompt detallado (editable)" name="detailedPrompt" rules={[{ required: true }]}>
        <TextArea rows={15} />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button onClick={() => goToStep(0)} icon={<ArrowLeftOutlined />}>
            Volver
          </Button>
          <Button type="primary" htmlType="submit" icon={<ArrowRightOutlined />}>
            Generar eForm
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}
