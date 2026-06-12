import { useState, useEffect } from 'react'
import { Card, Button, Space, Modal, Form, Input, Select, message, Spin, Tag, Tooltip, InputNumber, Tabs } from 'antd'
import { CloudOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { useMessages } from '../utils/i18nMessages'
import { handleError, logError } from '../utils/errorHandler'
import { logger } from '../utils/logger'
import '../styles/anthropic-panel.css'

export default function BedrrockPanel() {
  const { t } = useTranslation()
  const MESSAGES = useMessages()
  const { session } = useAuth()
  const [activeTab, setActiveTab] = useState('status')
  const [loading, setLoading] = useState(false)
  const [bedrockStatus, setBedrockStatus] = useState(null)
  const [usage, setUsage] = useState(null)
  const [history, setHistory] = useState(null)
  const [period, setPeriod] = useState(30)
  const [showKeys, setShowKeys] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    if (session?.access_token) {
      loadBedrockStatus()
      loadUsage()
    }
  }, [period, session?.access_token])

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  })

  const loadBedrockStatus = async () => {
    try {
      const resp = await fetch('/api/bedrock?action=status', {
        headers: getAuthHeaders()
      })
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`)
      }
      const data = await resp.json()
      setBedrockStatus(data)
    } catch (err) {
      handleError(err, 'Error loading Bedrock status')
      setBedrockStatus({ hasCredentials: false, error: err.message })
    }
  }

  const loadUsage = async () => {
    setLoading(true)
    try {
      const [usageResp, historyResp] = await Promise.all([
        fetch(`/api/bedrock?action=usage&days=${period}`, {
          headers: getAuthHeaders()
        }),
        fetch(`/api/bedrock?action=usage&days=${period}&history=true`, {
          headers: getAuthHeaders()
        })
      ])

      if (!usageResp.ok || !historyResp.ok) {
        throw new Error(`API error: ${usageResp.status} / ${historyResp.status}`)
      }

      const usageData = await usageResp.json()
      const historyData = await historyResp.json()

      setUsage(usageData)
      setHistory(historyData)
    } catch (err) {
      handleError(err, 'Error loading Bedrock usage')
      setUsage(null)
      setHistory(null)
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    setTestLoading(true)
    setTestResult(null)
    try {
      const resp = await fetch('/api/bedrock?action=test', {
        method: 'POST',
        headers: getAuthHeaders()
      })
      const data = await resp.json()

      if (data.success) {
        setTestResult({ success: true, ...data })
        message.success(MESSAGES.BEDROCK.TEST_SUCCESS)
      } else {
        setTestResult({ success: false, error: data.error })
        message.error(MESSAGES.BEDROCK.TEST_FAILED + ': ' + data.error)
      }
    } catch (err) {
      message.error('Error al probar Bedrock: ' + err.message)
      setTestResult({ success: false, error: err.message })
    } finally {
      setTestLoading(false)
    }
  }

  const handleUpdateCredentials = async (values) => {
    setLoading(true)
    try {
      const resp = await fetch('/api/bedrock?action=credentials', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          accessKeyId: values.accessKeyId,
          secretAccessKey: values.secretAccessKey,
          region: values.region
        })
      })
      const data = await resp.json()

      if (resp.ok) {
        message.success(MESSAGES.BEDROCK.CREDENTIALS_UPDATED)
        setIsModalVisible(false)
        form.resetFields()
        loadBedrockStatus()
      } else {
        message.error('Error: ' + data.error)
      }
    } catch (err) {
      message.error('Error al actualizar credenciales: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const periodOptions = [
    { label: 'Hoy', value: 1 },
    { label: '7 días', value: 7 },
    { label: '30 días', value: 30 },
    { label: 'Todo', value: 365 }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '20px', height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
          <CloudOutlined /> Gestión AWS Bedrock
        </h1>
        <Tag color="cyan">Converse API</Tag>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'status',
            label: 'Credenciales y Estado',
            children: <StatusTab bedrockStatus={bedrockStatus} testLoading={testLoading} testResult={testResult} handleTest={handleTest} setIsModalVisible={setIsModalVisible} showKeys={showKeys} setShowKeys={setShowKeys} />
          },
          {
            key: 'usage',
            label: 'Uso y Costes',
            children: <UsageTab loading={loading} usage={usage} history={history} period={period} setPeriod={setPeriod} periodOptions={periodOptions} onRefresh={loadUsage} />
          },
          {
            key: 'inference-profiles',
            label: 'Perfiles de Inferencia',
            children: <InferenceProfilesTab bedrockStatus={bedrockStatus} />
          }
        ]}
      />

      {/* Update Credentials Modal */}
      <Modal
        title="Actualizar Credenciales AWS Bedrock"
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateCredentials}
        >
          <Form.Item
            label="AWS Access Key ID"
            name="accessKeyId"
            rules={[{ required: true, message: 'Access Key ID requerido' }]}
          >
            <Input placeholder="AKIA..." />
          </Form.Item>
          <Form.Item
            label="AWS Secret Access Key"
            name="secretAccessKey"
            rules={[{ required: true, message: 'Secret Access Key requerido' }]}
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>
          <Form.Item
            label="AWS Region"
            name="region"
            initialValue="eu-south-2"
            rules={[{ required: true, message: 'Región requerida' }]}
          >
            <Select
              options={[
                { label: 'eu-south-2 (Milan)', value: 'eu-south-2' },
                { label: 'eu-west-1 (Ireland)', value: 'eu-west-1' },
                { label: 'eu-west-3 (Paris)', value: 'eu-west-3' },
                { label: 'eu-central-1 (Frankfurt)', value: 'eu-central-1' },
                { label: 'us-east-1 (N. Virginia)', value: 'us-east-1' }
              ]}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, color: 'var(--text-secondary)', fontSize: '12px' }}>
            ⚠️ Estas credenciales se almacenarán de forma segura y se usarán para llamadas a la API de Bedrock.
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

function StatusTab({ bedrockStatus, testLoading, testResult, handleTest, setIsModalVisible, showKeys, setShowKeys }) {
  return (
    <Card title="Credenciales AWS Bedrock y Estado de Conexión" className="anthropic-card">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {bedrockStatus?.hasCredentials ? (
            <Tag icon={<CheckCircleOutlined />} color="success">Credenciales AWS Válidas</Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color="error">
              {bedrockStatus?.error ? 'AWS No Disponible' : 'Credenciales No Configuradas'}
            </Tag>
          )}
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Última verificación: {bedrockStatus?.timestamp ? new Date(bedrockStatus.timestamp).toLocaleString() : 'Nunca'}
          </span>
          {bedrockStatus?.error && (
            <span style={{ fontSize: '11px', color: 'var(--kpi-red)' }}>
              ({bedrockStatus.error})
            </span>
          )}
        </div>

        {/* Credentials Display */}
        {bedrockStatus?.hasCredentials && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Input
                readOnly
                value={showKeys ? bedrockStatus.accessKeyId : 'AKIA' + '*'.repeat(16)}
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
              />
              <button
                className="btn-link"
                onClick={() => setShowKeys(!showKeys)}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}
              >
                {showKeys ? <EyeInvisibleOutlined style={{ fontSize: '12px' }} /> : <EyeOutlined style={{ fontSize: '12px' }} />}
              </button>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Region: <strong>{bedrockStatus.region}</strong>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            onClick={handleTest}
            disabled={testLoading}
          >
            {testLoading ? '⏳ Probando...' : 'Probar Conexión'}
          </button>
          <button className="btn-default" onClick={() => setIsModalVisible(true)}>
            Actualizar Credenciales
          </button>
        </div>

        {/* Test Result */}
        {testResult && (
          <div style={{
            padding: '12px',
            borderRadius: '4px',
            backgroundColor: testResult.success ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderLeft: `4px solid ${testResult.success ? 'var(--kpi-green)' : 'var(--kpi-red)'}`
          }}>
            {testResult.success ? (
              <>
                <div style={{ fontWeight: 500, color: 'var(--kpi-green)' }}>✓ Prueba Exitosa</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Modelo: {testResult.model} | Entrada: {testResult.inputTokens} | Salida: {testResult.outputTokens} | Duración: {testResult.durationMs}ms
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 500, color: 'var(--kpi-red)' }}>✗ Prueba Fallida</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{testResult.error}</div>
              </>
            )}
          </div>
        )}
      </Space>
    </Card>
  )
}

function UsageTab({ loading, usage, history, period, setPeriod, periodOptions, onRefresh }) {
  return (
    <Spin spinning={loading}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Period Selector & Refresh */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', fontWeight: 500 }}>Período:</label>
            <Select
              value={period}
              onChange={setPeriod}
              options={periodOptions}
              style={{ width: '150px' }}
            />
          </div>
          <button
            className="btn-default"
            onClick={onRefresh}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            🔄 Refrescar
          </button>
        </div>

        {/* Stats Cards */}
        {usage?.summary ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <StatCard
              title="Tokens Entrada"
              value={usage.summary.totalInputTokens.toLocaleString()}
              color="blue"
            />
            <StatCard
              title="Tokens Salida"
              value={usage.summary.totalOutputTokens.toLocaleString()}
              color="green"
            />
            <StatCard
              title="Coste Total (USD)"
              value={`$${usage.summary.totalCost.toFixed(2)}`}
              color="amber"
            />
            <StatCard
              title="Total Invocaciones"
              value={usage.summary.totalCalls.toLocaleString()}
              color="purple"
            />
          </div>
          ) : (
            <Card style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                <div style={{ marginBottom: '12px' }}>📊 No hay datos de uso disponibles para el período seleccionado</div>
                <button className="btn-default" onClick={onRefresh} disabled={loading}>
                  {loading ? 'Cargando...' : 'Cargar Datos de Uso'}
                </button>
              </div>
            </Card>
          )}

        {/* Tables */}
        {usage?.summary && (
          <>
            {usage.byModel?.length > 0 && (
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: 'var(--text-primary)' }}>Uso por Modelo</h3>
                <UsageTable data={usage.byModel} isModel={true} />
              </div>
            )}

            {usage.byModule?.length > 0 && (
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: 'var(--text-primary)' }}>Uso por Módulo</h3>
                <UsageTable data={usage.byModule} />
              </div>
            )}

            {usage.byUser?.length > 0 && (
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px' }}>Uso por Usuario</h3>
                <UsageTable data={usage.byUser} isUser={true} />
              </div>
            )}
          </>
        )}

        {/* Daily History Chart */}
        {history?.history && (
          <Card title="Historial de Coste Diario">
            <HistoryChart data={history.history} />
          </Card>
        )}
      </Space>
    </Spin>
  )
}

function InferenceProfilesTab({ bedrockStatus }) {
  if (!bedrockStatus?.inferenceProfiles) {
    return (
      <Card>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          Configura credenciales AWS para ver Perfiles de Inferencia disponibles
        </div>
      </Card>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {bedrockStatus.inferenceProfiles.map((profile, idx) => (
        <Card key={idx} style={{ backgroundColor: 'rgba(79, 142, 247, 0.05)' }}>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
              {profile.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              <div>ID: <code>{profile.id}</code></div>
              <div>Regions: {profile.regions.join(', ')}</div>
              <div>Models: {profile.models?.join(', ') || 'N/A'}</div>
            </div>
          </Space>
        </Card>
      ))}
    </div>
  )
}

function StatCard({ title, value, color = 'blue' }) {
  const colors = {
    blue: { bg: 'rgba(79, 142, 247, 0.1)', border: 'var(--kpi-blue)', text: 'var(--kpi-blue)' },
    green: { bg: 'rgba(52, 211, 153, 0.1)', border: 'var(--kpi-green)', text: 'var(--kpi-green)' },
    amber: { bg: 'rgba(251, 191, 36, 0.1)', border: 'var(--kpi-amber)', text: 'var(--kpi-amber)' },
    purple: { bg: 'rgba(124, 58, 237, 0.1)', border: '#7c3aed', text: '#7c3aed' }
  }
  const c = colors[color] || colors.blue

  return (
    <Card
      style={{
        backgroundColor: c.bg,
        borderColor: c.border,
        borderWidth: '1px'
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: c.text }}>{value}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{title}</div>
      </div>
    </Card>
  )
}

function UsageTable({ data, isUser = false, isModel = false }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        fontSize: '12px',
        borderCollapse: 'collapse'
      }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
            <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>
              {isModel ? 'Modelo' : isUser ? 'Usuario' : 'Módulo'}
            </th>
            <th style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>Llamadas</th>
            <th style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>Tokens Entrada</th>
            <th style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>Tokens Salida</th>
            <th style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>Coste (USD)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border-default)' }}>
              <td style={{ padding: '8px', textAlign: 'left' }}>
                {isUser ? row.userId?.substring(0, 8) + '...' : row.model || row.module}
              </td>
              <td style={{ padding: '8px', textAlign: 'right' }}>{row.calls}</td>
              <td style={{ padding: '8px', textAlign: 'right' }}>{row.inputTokens?.toLocaleString()}</td>
              <td style={{ padding: '8px', textAlign: 'right' }}>{row.outputTokens?.toLocaleString()}</td>
              <td style={{ padding: '8px', textAlign: 'right', fontWeight: 500, color: 'var(--accent-primary)' }}>
                ${row.cost?.toFixed(4)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function HistoryChart({ data }) {
  if (!data || data.length === 0) {
    return <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Sin datos</div>
  }

  const maxCost = Math.max(...data.map(d => d.cost), 1)
  const height = 200

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: `${height}px` }}>
      {data.map((d, i) => {
        const barHeight = (d.cost / maxCost) * height
        return (
          <Tooltip key={i} title={`${d.date}: $${d.cost.toFixed(4)}`}>
            <div
              style={{
                flex: 1,
                height: `${barHeight}px`,
                backgroundColor: 'var(--accent-primary)',
                borderRadius: '2px 2px 0 0',
                minHeight: '2px'
              }}
            />
          </Tooltip>
        )
      })}
    </div>
  )
}
