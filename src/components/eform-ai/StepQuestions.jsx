import { Form, Input, Button, Space, Alert } from 'antd'
import { ArrowRightOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import axios from 'axios'
import { supabase } from '../../config/supabaseClient'

export default function StepQuestions({ formData, updateFormData, goToStep, setLoading }) {
  const [form] = Form.useForm()

  // Si no hay preguntas, saltar este paso
  if (!formData.questions || formData.questions.length === 0) {
    goToStep(2)
    return null
  }

  const handleSubmit = async (values) => {
    try {
      setLoading(true)
      const answers = Object.values(values)

      const { data: { session } } = await supabase.auth.getSession()

      const response = await axios.post('/api/eform-ai/propose', {
        request: formData.request,
        environment: formData.environment,
        tenant: formData.tenant,
        serverUrl: formData.serverUrl,
        blocks: formData.blocks,
        categoryXml: formData.categoryXml,
        answers
      }, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      updateFormData({
        answers,
        detailedPrompt: response.data.detailedPrompt,
        formName: response.data.suggestedFormName,
        formId: response.data.suggestedFormId
      })
      goToStep(2)
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    goToStep(2) // Saltar preguntas y usar defaults de IA
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Alert
        message="La IA necesita aclaraciones"
        type="info"
        showIcon
      />

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {formData.questions.map((q, i) => (
          <Form.Item
            key={i}
            label={q.question}
            name={`q${i}`}
            rules={[{ required: true, message: 'Responde la pregunta' }]}
          >
            <Input />
          </Form.Item>
        ))}

        <Form.Item>
          <Space>
            <Button onClick={() => goToStep(0)} icon={<ArrowLeftOutlined />}>
              Volver
            </Button>
            <Button onClick={handleSkip}>
              Saltar
            </Button>
            <Button type="primary" htmlType="submit" icon={<ArrowRightOutlined />}>
              Continuar
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Space>
  )
}
