import { useState, useEffect } from 'react'
import { Table, Button, Tag } from 'antd'
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

      const response = await axios.get('/api/eform-ai/history', {
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

      const response = await axios.get(`/api/eform-ai/${id}`, {
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
      goToStep(3)
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleString('es-ES')
    },
    {
      title: 'Nombre',
      dataIndex: 'form_name',
      key: 'form_name'
    },
    {
      title: 'FormID',
      dataIndex: 'form_id',
      key: 'form_id'
    },
    {
      title: 'Entorno',
      dataIndex: 'environment',
      key: 'environment',
      render: (env) => env === 'online' ? 'Online' : 'On-Premise'
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = status === 'generated' ? 'green' : status === 'invalid' ? 'red' : 'default'
        return <Tag color={color}>{status}</Tag>
      }
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleView(record.id)}
        >
          Ver
        </Button>
      )
    }
  ]

  return (
    <div>
      <Table
        dataSource={generations}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Button onClick={() => goToStep(0)} style={{ marginTop: 16 }}>
        Nuevo eForm
      </Button>
    </div>
  )
}
