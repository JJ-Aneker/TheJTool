import { useState, useEffect } from 'react'
import { Card, Steps, Button, message, Spin, Tooltip } from 'antd'
import { ArrowLeftOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from 'react-i18next'
import StepRequest from '../components/eform-ai/StepRequest'
import StepQuestions from '../components/eform-ai/StepQuestions'
import StepPrompt from '../components/eform-ai/StepPrompt'
import StepResult from '../components/eform-ai/StepResult'
import StepHistory from '../components/eform-ai/StepHistory'

export default function EFormGeneratorAI() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)

  // Estado compartido entre pasos
  const [formData, setFormData] = useState({
    // Paso 1: Request
    request: '',
    environment: 'online',
    tenant: '',
    serverUrl: '',
    blocks: [],
    categoryXml: null,
    categoryFields: [],

    // Paso 2: Questions (condicional)
    questions: null,
    answers: [],

    // Paso 3: Prompt
    detailedPrompt: '',
    formName: '',
    formId: '',

    // Paso 4: Result
    generationId: null,
    components: null,
    xml: null,
    validation: null
  })

  const steps = [
    { title: t('eformGeneratorAI.request'), description: t('eformGeneratorAI.describeForm') },
    { title: t('eformGeneratorAI.questions'), description: t('eformGeneratorAI.questionsDesc') },
    { title: t('eformGeneratorAI.prompt'), description: t('eformGeneratorAI.promptDesc') },
    { title: t('eformGeneratorAI.result'), description: t('eformGeneratorAI.resultDesc') },
    { title: t('eformGeneratorAI.history'), description: t('eformGeneratorAI.historyDesc') }
  ]

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const goToStep = (step) => {
    setCurrentStep(step)
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="eform-generator-ai" style={{
      height: '100%',
      overflow: 'auto',
      padding: '24px',
      background: 'var(--bg-page)'
    }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={handleBack}
              />
              <span>{t('eformGeneratorAI.title')}</span>
            </div>
            <Tooltip title={t('common.help')}>
              <Button
                type="text"
                icon={<QuestionCircleOutlined />}
                onClick={() => navigate('/manual#eformGeneratorAI')}
              />
            </Tooltip>
          </div>
        }
        style={{ maxWidth: 1200, margin: '0 auto' }}
      >
        <Steps
          current={currentStep}
          items={steps}
          style={{ marginBottom: 32 }}
          size="small"
        />

        <Spin spinning={loading}>
          {currentStep === 0 && (
            <StepRequest
              formData={formData}
              updateFormData={updateFormData}
              goToStep={goToStep}
              setLoading={setLoading}
            />
          )}

          {currentStep === 1 && (
            <StepQuestions
              formData={formData}
              updateFormData={updateFormData}
              goToStep={goToStep}
              setLoading={setLoading}
            />
          )}

          {currentStep === 2 && (
            <StepPrompt
              formData={formData}
              updateFormData={updateFormData}
              goToStep={goToStep}
              setLoading={setLoading}
            />
          )}

          {currentStep === 3 && (
            <StepResult
              formData={formData}
              updateFormData={updateFormData}
              goToStep={goToStep}
              setLoading={setLoading}
            />
          )}

          {currentStep === 4 && (
            <StepHistory
              formData={formData}
              updateFormData={updateFormData}
              goToStep={goToStep}
              setLoading={setLoading}
            />
          )}
        </Spin>
      </Card>
    </div>
  )
}
