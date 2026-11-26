// Componente de Scoring para RFP Analyzer
import { useState, useEffect } from 'react'
import { Card, Slider, Button, Input, Progress, Tag, Spin } from 'antd'
import { TrophyOutlined, SaveOutlined } from '@ant-design/icons'
import { supabase } from '../config/supabaseClient'
import { message } from '../utils/message'
import axios from 'axios'

const { TextArea } = Input

const SCORE_COMPONENTS = [
  { key: 'viabilidad_tecnica', label: 'Viabilidad Técnica', weight: 0.30, color: '#3b82f6' },
  { key: 'margen_esperado', label: 'Margen Esperado', weight: 0.25, color: '#10b981' },
  { key: 'expertise_equipo', label: 'Expertise Equipo', weight: 0.20, color: '#8b5cf6' },
  { key: 'riesgo_contractual', label: 'Riesgo Contractual', weight: 0.15, color: '#f59e0b' },
  { key: 'timeline_factible', label: 'Timeline Factible', weight: 0.10, color: '#ec4899' }
]

export default function RFPScoring({ rfpId }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [scores, setScores] = useState({
    viabilidad_tecnica: 50,
    margen_esperado: 50,
    expertise_equipo: 50,
    riesgo_contractual: 50,
    timeline_factible: 50,
    notes: ''
  })
  const [totalScore, setTotalScore] = useState(0)
  const [recommendation, setRecommendation] = useState('review')

  useEffect(() => {
    loadScoring()
  }, [rfpId])

  useEffect(() => {
    // Calcular score total
    const total = SCORE_COMPONENTS.reduce((sum, comp) => {
      return sum + (scores[comp.key] * comp.weight)
    }, 0)
    setTotalScore(Math.round(total * 100) / 100)

    // Determinar recomendación
    if (total >= 70) setRecommendation('go')
    else if (total >= 50) setRecommendation('review')
    else setRecommendation('no_go')
  }, [scores])

  const loadScoring = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const response = await axios.get(`/api/rfp-scoring/${rfpId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })

      if (response.data) {
        setScores({
          viabilidad_tecnica: response.data.viabilidad_tecnica || 50,
          margen_esperado: response.data.margen_esperado || 50,
          expertise_equipo: response.data.expertise_equipo || 50,
          riesgo_contractual: response.data.riesgo_contractual || 50,
          timeline_factible: response.data.timeline_factible || 50,
          notes: response.data.notes || ''
        })
      }
    } catch (error) {
      console.error('Error loading scoring:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const { data: { session } } = await supabase.auth.getSession()
      await axios.post('/api/rfp-scoring', {
        rfp_id: rfpId,
        ...scores
      }, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })

      message.success('Scoring guardado')
    } catch (error) {
      console.error('Error saving scoring:', error)
      message.error('Error al guardar scoring')
    } finally {
      setSaving(false)
    }
  }

  const getRecommendationConfig = () => {
    if (recommendation === 'go') return { label: 'GO ✅', color: '#10b981', bgcolor: 'rgba(16, 185, 129, 0.1)' }
    if (recommendation === 'review') return { label: 'REVIEW 📋', color: '#f59e0b', bgcolor: 'rgba(245, 158, 11, 0.1)' }
    return { label: 'NO-GO ❌', color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.1)' }
  }

  const recConfig = getRecommendationConfig()

  if (loading) return <Card><Spin /></Card>

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrophyOutlined />
          <span>Sistema de Scoring Automático</span>
        </div>
      }
      extra={
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={saving}
        >
          Guardar
        </Button>
      }
    >
      {/* Score Total y Recomendación */}
      <div style={{
        display: 'flex',
        gap: 24,
        marginBottom: 24,
        padding: 16,
        background: recConfig.bgcolor,
        border: `2px solid ${recConfig.color}`,
        borderRadius: 10
      }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: recConfig.color }}>
            {totalScore}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Puntuación Total / 100
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{
            fontSize: 24,
            fontWeight: 600,
            color: recConfig.color,
            marginBottom: 8
          }}>
            {recConfig.label}
          </div>
          <Progress
            percent={totalScore}
            strokeColor={recConfig.color}
            showInfo={false}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Componentes del Score */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {SCORE_COMPONENTS.map(comp => (
          <div key={comp.key}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8,
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{comp.label}</span>
                <Tag color="blue" style={{ fontSize: 10 }}>
                  {(comp.weight * 100)}% peso
                </Tag>
              </div>
              <span style={{
                fontSize: 16,
                fontWeight: 600,
                color: comp.color
              }}>
                {scores[comp.key]}
              </span>
            </div>
            <Slider
              min={0}
              max={100}
              value={scores[comp.key]}
              onChange={(value) => setScores({ ...scores, [comp.key]: value })}
              trackStyle={{ background: comp.color }}
              handleStyle={{ borderColor: comp.color }}
              tooltip={{
                formatter: (value) => `${value} pts`
              }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Contribuye {Math.round(scores[comp.key] * comp.weight * 100) / 100} pts al total
            </div>
          </div>
        ))}
      </div>

      {/* Notas */}
      <div style={{ marginTop: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
          Notas del Análisis
        </label>
        <TextArea
          rows={3}
          value={scores.notes}
          onChange={e => setScores({ ...scores, notes: e.target.value })}
          placeholder="Justificación del scoring, consideraciones adicionales..."
        />
      </div>
    </Card>
  )
}
