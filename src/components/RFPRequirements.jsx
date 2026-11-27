// Componente de Requisitos Extraídos con IA
import { useState, useEffect } from 'react'
import { Card, Table, Button, Tag, Select, Input, Spin, Empty, Modal } from 'antd'
import { FileSearchOutlined, ThunderboltOutlined, EditOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { supabase } from '../config/supabaseClient'
import { message } from '../utils/message'
import axios from 'axios'

const CATEGORIES = ['Core DMS', 'Autenticación', 'Web/Portal', 'Integración', 'Workflow', 'Seguridad', 'Búsqueda', 'Reporting', 'Otros']

const COVERAGE_CONFIG = {
  nativo: { label: 'Nativo', color: 'green', icon: '✓' },
  desarrollo: { label: 'Desarrollo', color: 'orange', icon: '⚒' },
  integracion: { label: 'Integración', color: 'blue', icon: '🔗' },
  no_aplica: { label: 'No Aplica', color: 'default', icon: '—' }
}

const EFFORT_CONFIG = {
  bajo: { label: '< 2 días', color: 'green' },
  medio: { label: '2-5 días', color: 'blue' },
  alto: { label: '5-10 días', color: 'orange' },
  muy_alto: { label: '> 10 días', color: 'red' }
}

export default function RFPRequirements({ rfpId }) {
  const [loading, setLoading] = useState(true)
  const [extracting, setExtracting] = useState(false)
  const [requirements, setRequirements] = useState([])
  const [editingKey, setEditingKey] = useState('')

  useEffect(() => {
    loadRequirements()
  }, [rfpId])

  const loadRequirements = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const response = await axios.get(`/api/rfp-requirements/${rfpId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      setRequirements(response.data)
    } catch (error) {
      console.error('Error loading requirements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExtract = async () => {
    Modal.confirm({
      title: 'Extraer Requisitos con IA',
      content: '¿Quieres que la IA analice el RFP y extraiga todos los requisitos técnicos automáticamente? Esto puede tardar 30-60 segundos.',
      okText: 'Sí, extraer',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          setExtracting(true)
          const { data: { session } } = await supabase.auth.getSession()
          const response = await axios.post(`/api/rfp-requirements/extract/${rfpId}`, {}, {
            headers: { Authorization: `Bearer ${session.access_token}` }
          })

          message.success(`${response.data.count} requisitos extraídos`)
          setRequirements(response.data.requirements)
        } catch (error) {
          console.error('Error extracting requirements:', error)
          message.error('Error al extraer requisitos: ' + (error.response?.data?.error || error.message))
        } finally {
          setExtracting(false)
        }
      }
    })
  }

  const handleUpdate = async (id, field, value) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await axios.put(`/api/rfp-requirements/${id}`, {
        [field]: value
      }, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })

      setRequirements(requirements.map(r =>
        r.id === id ? { ...r, [field]: value } : r
      ))
    } catch (error) {
      console.error('Error updating requirement:', error)
      message.error('Error al actualizar')
    }
  }

  const columns = [
    {
      title: '#',
      dataIndex: 'priority',
      key: 'priority',
      width: 60,
      render: (priority) => (
        <Tag color={priority >= 8 ? 'red' : priority >= 5 ? 'orange' : 'blue'}>
          {priority}
        </Tag>
      ),
      sorter: (a, b) => b.priority - a.priority
    },
    {
      title: 'Requisito',
      dataIndex: 'requirement_text',
      key: 'requirement_text',
      width: '35%',
      ellipsis: true
    },
    {
      title: 'Categoría',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      filters: CATEGORIES.map(c => ({ text: c, value: c })),
      onFilter: (value, record) => record.category === value,
      render: (category, record) => (
        <Select
          value={category}
          onChange={(value) => handleUpdate(record.id, 'category', value)}
          size="small"
          style={{ width: '100%' }}
        >
          {CATEGORIES.map(c => <Select.Option key={c} value={c}>{c}</Select.Option>)}
        </Select>
      )
    },
    {
      title: 'Cobertura Therefore™',
      dataIndex: 'therefore_coverage',
      key: 'therefore_coverage',
      width: 150,
      filters: Object.keys(COVERAGE_CONFIG).map(k => ({
        text: COVERAGE_CONFIG[k].label,
        value: k
      })),
      onFilter: (value, record) => record.therefore_coverage === value,
      render: (coverage, record) => {
        const config = COVERAGE_CONFIG[coverage] || COVERAGE_CONFIG.nativo
        return (
          <Select
            value={coverage}
            onChange={(value) => handleUpdate(record.id, 'therefore_coverage', value)}
            size="small"
            style={{ width: '100%' }}
          >
            {Object.keys(COVERAGE_CONFIG).map(k => {
              const c = COVERAGE_CONFIG[k]
              return (
                <Select.Option key={k} value={k}>
                  <span>{c.icon} {c.label}</span>
                </Select.Option>
              )
            })}
          </Select>
        )
      }
    },
    {
      title: 'Esfuerzo',
      dataIndex: 'effort_level',
      key: 'effort_level',
      width: 120,
      filters: Object.keys(EFFORT_CONFIG).map(k => ({
        text: EFFORT_CONFIG[k].label,
        value: k
      })),
      onFilter: (value, record) => record.effort_level === value,
      render: (effort, record) => {
        const config = EFFORT_CONFIG[effort] || EFFORT_CONFIG.medio
        return (
          <Select
            value={effort}
            onChange={(value) => handleUpdate(record.id, 'effort_level', value)}
            size="small"
            style={{ width: '100%' }}
          >
            {Object.keys(EFFORT_CONFIG).map(k => {
              const e = EFFORT_CONFIG[k]
              return (
                <Select.Option key={k} value={k}>
                  <Tag color={e.color} style={{ margin: 0 }}>{e.label}</Tag>
                </Select.Option>
              )
            })}
          </Select>
        )
      }
    },
    {
      title: 'Notas',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes, record) => (
        <Input.TextArea
          value={notes || ''}
          onChange={(e) => handleUpdate(record.id, 'notes', e.target.value)}
          placeholder="Notas..."
          size="small"
          autoSize={{ minRows: 1, maxRows: 3 }}
          onPressEnter={(e) => e.stopPropagation()}
        />
      )
    }
  ]

  // Calcular resumen
  const summary = {
    total: requirements.length,
    nativo: requirements.filter(r => r.therefore_coverage === 'nativo').length,
    desarrollo: requirements.filter(r => r.therefore_coverage === 'desarrollo').length,
    alto_esfuerzo: requirements.filter(r => r.effort_level === 'alto' || r.effort_level === 'muy_alto').length
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileSearchOutlined />
          <span>Requisitos Técnicos</span>
          {requirements.length > 0 && (
            <Tag color="blue">{requirements.length} requisitos</Tag>
          )}
        </div>
      }
      extra={
        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          onClick={handleExtract}
          loading={extracting}
          disabled={loading}
        >
          {requirements.length > 0 ? 'Re-extraer con IA' : 'Extraer con IA'}
        </Button>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin />
        </div>
      ) : requirements.length === 0 ? (
        <Empty
          description="No hay requisitos extraídos"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" icon={<ThunderboltOutlined />} onClick={handleExtract}>
            Extraer Requisitos con IA
          </Button>
        </Empty>
      ) : (
        <>
          {/* Resumen rápido */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 12,
            marginBottom: 16,
            padding: 12,
            background: 'var(--bg-hover)',
            borderRadius: 8
          }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--accent-primary)' }}>
                {summary.total}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#10b981' }}>
                {summary.nativo}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Nativos</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#f59e0b' }}>
                {summary.desarrollo}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Desarrollo</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#ef4444' }}>
                {summary.alto_esfuerzo}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Alto Esfuerzo</div>
            </div>
          </div>

          <Table
            columns={columns}
            dataSource={requirements}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 20 }}
            scroll={{ x: 1200 }}
          />
        </>
      )}
    </Card>
  )
}
