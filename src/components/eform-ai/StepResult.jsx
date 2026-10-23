import { Button, Space, Alert, Tabs, Table, theme } from 'antd'
import { DownloadOutlined, CopyOutlined } from '@ant-design/icons'

export default function StepResult({ formData, updateFormData, goToStep, setLoading }) {
  const { token } = theme.useToken()
  const { validation, xml, components } = formData

  const handleDownload = () => {
    const blob = new Blob([xml], { type: 'text/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `TheConfiguration_${formData.formId}.xml`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(components, null, 2))
    alert('JSON copiado al portapapeles')
  }

  const handleNewEForm = () => {
    updateFormData({
      request: '',
      questions: null,
      answers: [],
      detailedPrompt: '',
      formName: '',
      formId: '',
      generationId: null,
      components: null,
      xml: null,
      validation: null
    })
    goToStep(0)
  }

  // Extraer campos recursivamente (también dentro de paneles, columns, etc.)
  const extractFields = (comps, fields = []) => {
    if (!comps) return fields

    comps.forEach(comp => {
      if (comp.input && comp.key && comp.key !== 'submit') {
        fields.push({
          key: comp.key,
          field: comp.key,
          label: comp.label || comp.key,
          type: comp.type,
          required: comp.validate?.required ? 'Sí' : 'No'
        })
      }

      // Recursión en componentes hijos
      if (comp.components) extractFields(comp.components, fields)
      if (comp.columns) {
        comp.columns.forEach(col => {
          if (col.components) extractFields(col.components, fields)
        })
      }
    })

    return fields
  }

  const fieldsTableData = extractFields(components)

  const tabItems = [
    {
      key: 'fields',
      label: 'Resumen',
      children: (
        <Table
          dataSource={fieldsTableData}
          columns={[
            { title: 'Key', dataIndex: 'field', key: 'field' },
            { title: 'Label', dataIndex: 'label', key: 'label' },
            { title: 'Tipo', dataIndex: 'type', key: 'type' },
            { title: 'Obligatorio', dataIndex: 'required', key: 'required' }
          ]}
          pagination={false}
          size="small"
        />
      )
    },
    {
      key: 'json',
      label: 'JSON',
      children: (
        <div>
          <Button icon={<CopyOutlined />} onClick={handleCopyJSON} style={{ marginBottom: 8 }}>
            Copiar JSON
          </Button>
          <pre style={{
            background: token.colorBgLayout,
            color: token.colorText,
            padding: 16,
            borderRadius: 4,
            maxHeight: 400,
            overflow: 'auto',
            border: `1px solid ${token.colorBorder}`
          }}>
            {JSON.stringify(components, null, 2)}
          </pre>
        </div>
      )
    }
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {validation?.errors?.length > 0 && (
        <Alert
          message="Errores de validación (bloquean descarga)"
          description={
            <ul>
              {validation.errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          }
          type="error"
          showIcon
        />
      )}

      {validation?.warnings?.length > 0 && (
        <Alert
          message="Avisos (no bloquean descarga)"
          description={
            <ul>
              {validation.warnings.map((warn, i) => <li key={i}>{warn}</li>)}
            </ul>
          }
          type="warning"
          showIcon
        />
      )}

      {validation?.errors?.length === 0 && (
        <Alert
          message="✅ eForm generado correctamente"
          type="success"
          showIcon
        />
      )}

      <Tabs items={tabItems} />

      <Space>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
          disabled={validation?.errors?.length > 0}
        >
          Descargar XML
        </Button>
        <Button onClick={handleNewEForm}>
          Nuevo eForm
        </Button>
        <Button onClick={() => goToStep(4)}>
          Ver historial
        </Button>
      </Space>
    </Space>
  )
}
