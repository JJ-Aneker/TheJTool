import { Form, Input, Button, Space, Alert } from 'antd'
import { ArrowRightOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { supabase } from '../../config/supabaseClient'

export default function StepQuestions({ formData, updateFormData, goToStep, setLoading }) {
  const { t } = useTranslation()
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

      const response = await axios.post('/api/eform-ai?action=propose', {
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
      alert(t('common.error') + ': ' + (err.response?.data?.error || err.message))
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
        message={t('eformGeneratorAI.aiNeedsClarifications')}
        type="info"
        showIcon
      />

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {formData.questions.map((q, i) => (
          <Form.Item
            key={i}
            label={q.question}
            name={`q${i}`}
            rules={[{ required: true, message: t('eformGeneratorAI.answerRequired') }]}
          >
            <Input />
          </Form.Item>
        ))}

        <Form.Item>
          <Space>
            <Button onClick={() => goToStep(0)} icon={<ArrowLeftOutlined />}>
              {t('common.back')}
            </Button>
            <Button onClick={handleSkip}>
              {t('eformGeneratorAI.skip')}
            </Button>
            <Button type="primary" htmlType="submit" icon={<ArrowRightOutlined />}>
              {t('common.next')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Space>
  )
}
