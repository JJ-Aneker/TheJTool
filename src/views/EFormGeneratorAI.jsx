import { useState, useEffect } from 'react'
import { Steps, Spin } from 'antd'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from 'react-i18next'
import HelpButton from '../components/HelpButton'
import StepRequest from '../components/eform-ai/StepRequest'
import StepPrompt from '../components/eform-ai/StepPrompt'
import StepResult from '../components/eform-ai/StepResult'
import StepHistory from '../components/eform-ai/StepHistory'

export default function EFormGeneratorAI() {
  const { t } = useTranslation()
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

  return (
    <div className="container-main">
      {/* HEADER */}
      <div className="header-main">
        <div>
          <h1 className="header-title">⚡ {t('eformGeneratorAI.title')}</h1>
          <p className="header-subtitle">Genera eForms con IA desde descripción natural · Adaptación a categorías · Form.io JSON · v2.0</p>
        </div>
        <div className="header-actions">
          <HelpButton section="eformGeneratorAI" />
        </div>
      </div>

      {/* CONTENT */}
      <div className="content-main" style={{ maxWidth: 1200, margin: '0 auto' }}>
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
            <StepPrompt
              formData={formData}
              updateFormData={updateFormData}
              goToStep={goToStep}
              setLoading={setLoading}
            />
          )}

          {currentStep === 2 && (
            <StepResult
              formData={formData}
              updateFormData={updateFormData}
              goToStep={goToStep}
              setLoading={setLoading}
            />
          )}

          {currentStep === 3 && (
            <StepHistory
              formData={formData}
              updateFormData={updateFormData}
              goToStep={goToStep}
              setLoading={setLoading}
            />
          )}
        </Spin>
      </div>
    </div>
  )
}
