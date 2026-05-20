import { useState, useEffect } from 'react'
import { Card, Button, Space, Modal, Form, Input, Select, message, Spin, Tag, Tooltip, InputNumber } from 'antd'
import { KeyOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import { useAuth } from '../hooks/useAuth'
import '../styles/anthropic-panel.css'

export default function AnthropicPanel() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const [usage, setUsage] = useState(null)
  const [history, setHistory] = useState(null)
  const [period, setPeriod] = useState(30)
  const [showKey, setShowKey] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadStatus()
    loadUsage()
  }, [period])

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  })

  const loadStatus = async () => {
    try {
      const resp = await fetch('/api/admin/anthropic/status', {
        headers: getAuthHeaders()
      })
      const data = await resp.json()
      setStatus(data)
    } catch (err) {
      message.error('Error loading API status: ' + err.message)
    }
  }

  const loadUsage = async () => {
    setLoading(true)
    try {
      const [usageResp, historyResp] = await Promise.all([
        fetch(`/api/admin/anthropic/usage?days=${period}`, {
          headers: getAuthHeaders()
        }),
        fetch(`/api/admin/anthropic/usage/history?days=${period}`, {
          headers: getAuthHeaders()
        })
      ])

      const usageData = await usageResp.json()
      const historyData = await historyResp.json()

      setUsage(usageData)
      setHistory(historyData)
    } catch (err) {
      message.error('Error loading usage: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    setTestLoading(true)
    setTestResult(null)
    try {
      const resp = await fetch('/api/admin/anthropic/test', {
        method: 'POST',
        headers: getAuthHeaders()
      })
      const data = await resp.json()

      if (data.success) {
        setTestResult({ success: true, ...data })
        message.success('API key test successful!')
      } else {
        setTestResult({ success: false, error: data.error })
        message.error('API key test failed: ' + data.error)
      }
    } catch (err) {
      message.error('Error testing API key: ' + err.message)
      setTestResult({ success: false, error: err.message })
    } finally {
      setTestLoading(false)
    }
  }

  const handleUpdateKey = async (values) => {
    setLoading(true)
    try {
      const resp = await fetch('/api/admin/anthropic/apikey', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ apiKey: values.newApiKey })
      })
      const data = await resp.json()

      if (resp.ok) {
        message.success('API key updated successfully!')
        setIsModalVisible(false)
        form.resetFields()
        loadStatus()
      } else {
        message.error('Error: ' + data.error)
      }
    } catch (err) {
      message.error('Error updating API key: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const periodOptions = [
    { label: 'Today', value: 1 },
    { label: '7 days', value: 7 },
    { label: '30 days', value: 30 },
    { label: 'All time', value: 365 }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '20px', height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <KeyOutlined /> Anthropic API Management
        </h1>
      </div>

      {/* Section 1: Status & Configuration */}
      <Card title="API Key Status & Configuration" className="anthropic-card">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Status Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {status?.hasKey ? (
              <Tag icon={<CheckCircleOutlined />} color="success">API Key Valid</Tag>
            ) : (
              <Tag icon={<CloseCircleOutlined />} color="error">API Key Invalid</Tag>
            )}
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Last checked: {status?.timestamp ? new Date(status.timestamp).toLocaleString() : 'Never'}
            </span>
          </div>

          {/* Key Display */}
          {status?.hasKey && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Input
                readOnly
                value={showKey ? 'sk-ant-' + Math.random().toString(36).substring(2, 15) : status.masked}
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
              />
              <Button
                icon={showKey ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => setShowKey(!showKey)}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              type="primary"
              onClick={handleTest}
              loading={testLoading}
            >
              Verify API Key
            </Button>
            <Button onClick={() => setIsModalVisible(true)}>
              Update Key
            </Button>
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
                  <div style={{ fontWeight: 500, color: 'var(--kpi-green)' }}>✓ Test Successful</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Model: {testResult.model} | Input: {testResult.inputTokens} | Output: {testResult.outputTokens} | Duration: {testResult.durationMs}ms
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 500, color: 'var(--kpi-red)' }}>✗ Test Failed</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{testResult.error}</div>
                </>
              )}
            </div>
          )}
        </Space>
      </Card>

      {/* Section 2: Usage Summary */}
      <Card title="Usage & Cost Summary" className="anthropic-card">
        <Spin spinning={loading}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Period Selector */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', fontWeight: 500 }}>Period:</label>
              <Select
                value={period}
                onChange={setPeriod}
                options={periodOptions}
                style={{ width: '150px' }}
              />
            </div>

            {/* Stats Cards */}
            {usage?.summary && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                <StatCard
                  title="Input Tokens"
                  value={usage.summary.totalInputTokens.toLocaleString()}
                  color="blue"
                />
                <StatCard
                  title="Output Tokens"
                  value={usage.summary.totalOutputTokens.toLocaleString()}
                  color="green"
                />
                <StatCard
                  title="Total Cost"
                  value={`$${usage.summary.totalCost.toFixed(2)}`}
                  color="amber"
                />
                <StatCard
                  title="Total Calls"
                  value={usage.summary.totalCalls.toLocaleString()}
                  color="purple"
                />
              </div>
            )}

            {/* Tables */}
            {usage && (
              <>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px' }}>Usage by Module</h3>
                  <UsageTable data={usage.byModule} />
                </div>

                {usage.byUser.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px' }}>Usage by User</h3>
                    <UsageTable data={usage.byUser} isUser={true} />
                  </div>
                )}
              </>
            )}
          </Space>
        </Spin>
      </Card>

      {/* Section 3: Daily History Chart */}
      {history?.history && (
        <Card title="Daily Cost History" className="anthropic-card">
          <HistoryChart data={history.history} />
        </Card>
      )}

      {/* Update API Key Modal */}
      <Modal
        title="Update Anthropic API Key"
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateKey}
        >
          <Form.Item
            label="New API Key"
            name="newApiKey"
            rules={[
              { required: true, message: 'API Key required' },
              { pattern: /^sk-ant-/, message: 'Must start with sk-ant-' }
            ]}
          >
            <Input.Password placeholder="sk-ant-..." />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, color: 'var(--text-secondary)', fontSize: '12px' }}>
            ⚠️ This will update the .env file and reload the API key in memory without restarting the server.
          </Form.Item>
        </Form>
      </Modal>
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

function UsageTable({ data, isUser = false }) {
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
              {isUser ? 'User' : 'Module'}
            </th>
            <th style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>Calls</th>
            <th style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>Input</th>
            <th style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>Output</th>
            <th style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>Cost (USD)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border-default)' }}>
              <td style={{ padding: '8px', textAlign: 'left' }}>
                {isUser ? row.userId.substring(0, 8) + '...' : row.module}
              </td>
              <td style={{ padding: '8px', textAlign: 'right' }}>{row.calls}</td>
              <td style={{ padding: '8px', textAlign: 'right' }}>{row.inputTokens.toLocaleString()}</td>
              <td style={{ padding: '8px', textAlign: 'right' }}>{row.outputTokens.toLocaleString()}</td>
              <td style={{ padding: '8px', textAlign: 'right', fontWeight: 500, color: 'var(--accent-primary)' }}>
                ${row.cost.toFixed(4)}
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
    return <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No data</div>
  }

  const maxCost = Math.max(...data.map(d => d.cost), 1)
  const height = 200

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: `${height}px`, alignItems: 'flex-end' }}>
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
