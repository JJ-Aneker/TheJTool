// Componente de Tags para RFP Analyzer
import { useState, useEffect } from 'react'
import { Tag, Select, Popover, Button, Input, ColorPicker, message as antdMessage } from 'antd'
import { PlusOutlined, TagOutlined } from '@ant-design/icons'
import { supabase } from '../config/supabaseClient'
import { message } from '../utils/message'
import axios from 'axios'

const TAG_COLORS = [
  { name: 'Blue', value: 'blue' },
  { name: 'Purple', value: 'purple' },
  { name: 'Green', value: 'green' },
  { name: 'Orange', value: 'orange' },
  { name: 'Red', value: 'red' },
  { name: 'Pink', value: 'pink' },
  { name: 'Cyan', value: 'cyan' },
  { name: 'Gold', value: 'gold' }
]

export default function RFPTags({ rfpId, currentTags = [], onTagsChange }) {
  const [allTags, setAllTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('blue')

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await axios.get('/api/rfp-tags', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      setAllTags(response.data)
    } catch (error) {
      console.error('Error loading tags:', error)
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      message.error('Escribe un nombre para el tag')
      return
    }

    try {
      setCreating(true)
      const { data: { session } } = await supabase.auth.getSession()
      const response = await axios.post('/api/rfp-tags', {
        name: newTagName.trim(),
        color: newTagColor
      }, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })

      setAllTags([...allTags, response.data])
      setNewTagName('')
      setNewTagColor('blue')
      message.success('Tag creado')
    } catch (error) {
      console.error('Error creating tag:', error)
      message.error('Error al crear tag')
    } finally {
      setCreating(false)
    }
  }

  const handleAssignTag = async (tagId) => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      await axios.post('/api/rfp-tags/assign', {
        rfp_id: rfpId,
        tag_id: tagId
      }, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })

      const tag = allTags.find(t => t.id === tagId)
      onTagsChange([...currentTags, tag])
      message.success('Tag asignado')
    } catch (error) {
      console.error('Error assigning tag:', error)
      message.error('Error al asignar tag')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveTag = async (tagId) => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      await axios.delete('/api/rfp-tags/assign', {
        data: { rfp_id: rfpId, tag_id: tagId },
        headers: { Authorization: `Bearer ${session.access_token}` }
      })

      onTagsChange(currentTags.filter(t => t.id !== tagId))
      message.success('Tag removido')
    } catch (error) {
      console.error('Error removing tag:', error)
      message.error('Error al remover tag')
    } finally {
      setLoading(false)
    }
  }

  const availableTags = allTags.filter(tag =>
    !currentTags.some(ct => ct.id === tag.id)
  )

  const createTagContent = (
    <div style={{ width: 280 }}>
      <Input
        placeholder="Nombre del tag"
        value={newTagName}
        onChange={e => setNewTagName(e.target.value)}
        onPressEnter={handleCreateTag}
        style={{ marginBottom: 8 }}
      />
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginRight: 8 }}>Color:</span>
        {TAG_COLORS.map(c => (
          <Tag
            key={c.value}
            color={c.value}
            style={{
              cursor: 'pointer',
              border: newTagColor === c.value ? '2px solid var(--accent-primary)' : 'none'
            }}
            onClick={() => setNewTagColor(c.value)}
          >
            {newTagColor === c.value ? '✓' : ' '}
          </Tag>
        ))}
      </div>
      <Button
        type="primary"
        size="small"
        block
        onClick={handleCreateTag}
        loading={creating}
      >
        Crear Tag
      </Button>
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      {currentTags.map(tag => (
        <Tag
          key={tag.id}
          color={tag.color}
          closable
          onClose={() => handleRemoveTag(tag.id)}
        >
          {tag.name}
        </Tag>
      ))}

      <Select
        size="small"
        placeholder={<><TagOutlined /> Añadir tag</>}
        style={{ minWidth: 120 }}
        onChange={handleAssignTag}
        value={null}
        loading={loading}
        dropdownRender={menu => (
          <>
            {menu}
            {availableTags.length > 0 && <div style={{ borderTop: '1px solid var(--border-default)', margin: '4px 0' }} />}
            <Popover content={createTagContent} trigger="click" placement="bottomLeft">
              <Button type="text" size="small" block icon={<PlusOutlined />}>
                Crear nuevo tag
              </Button>
            </Popover>
          </>
        )}
      >
        {availableTags.map(tag => (
          <Select.Option key={tag.id} value={tag.id}>
            <Tag color={tag.color} style={{ marginRight: 4 }}>{tag.name}</Tag>
          </Select.Option>
        ))}
      </Select>
    </div>
  )
}
