import { useState, useEffect } from 'react'
import { Table, Button, Tag, Tooltip } from 'antd'
import { formatShortDate, formatFullDate } from '../../utils/format'
import { EyeOutlined, DownloadOutlined } from '@ant-design/icons'
import axios from 'axios'
import { supabase } from '../../config/supabaseClient'

export default function StepHistory({ formData, updateFormData, goToStep, setLoading }) {
  const [generations, setGenerations] = useState([])

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      const response = await axios.get('/api/eform-ai?action=history', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      setGenerations(response.data.generations || [])
    } catch (err) {
      console.error('Error cargando historial:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (id) => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      const response = await axios.get(`/api/eform-ai?action=get&id=${id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      const gen = response.data.generation
      updateFormData({
        generationId: gen.id,
        detailedPrompt: gen.detailed_prompt,
        formName: gen.form_name,
        formId: gen.form_id,
        components: gen.components,
        xml: gen.xml,
        validation: gen.validation
      })
      goToStep(2)
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const STATUS = {
    generated: { key: 'active', text: 'Generado' },
    invalid: { key: 'error', text: 'No válido' }
  }

  const columns = [
    {
      title: 'eForm',
      key: 'form_name',
      render: (_, record) => (
        <div className="cell-stack">
          <span className="cell-title">{record.form_name || 'Sin nombre'}</span>
          <span className="cell-sub">{record.form_id || '—'}</span>
        </div>
      )
    },
    {
      title: 'Entorno',
      dataIndex: 'environment',
      key: 'environment',
      width: 140,
      render: (env) => <Tag className="tag-neutral">{env === 'online' ? 'Online' : 'On-Premise'}</Tag>
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status) => {
        const cfg = STATUS[status] || { key: 'pending', text: status || '—' }
        return (
          <span className="cell-inline" style={{ color: 'var(--text-primary)' }}>
            <span className={`status-dot status-dot--${cfg.key}`} aria-hidden="true" />
            {cfg.text}
          </span>
        )
      }
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      render: (date) => (
        <Tooltip title={formatFullDate(date)}>
          <span className="cell-muted">{formatShortDate(date)}</span>
        </Tooltip>
      )
    },
    {
      title: <span className="sr-only">Acciones</span>,
      key: 'actions',
      width: 90,
      align: 'right',
      render: (_, record) => (
        <button className="btn-default" onClick={() => handleView(record.id)}>Abrir</button>
      )
    }
  ]

  return (
    <div>
      <Table
        className="data-table"
        dataSource={generations}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 20, hideOnSinglePage: true }}
        locale={{ emptyText: 'Aún no has generado eForms.' }}
      />

      <Button onClick={() => goToStep(0)} style={{ marginTop: 16 }}>
        Nuevo eForm
      </Button>
    </div>
  )
}
