// Componente de Análisis de Cláusulas de Riesgo
import { useState, useEffect } from 'react'
import { Card, Timeline, Button, Tag, Spin, Empty, Modal, Alert } from 'antd'
import { WarningOutlined, ThunderboltOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { supabase } from '../config/supabaseClient'
import { message } from '../utils/message'
import axios from 'axios'

const CLAUSE_TYPE_CONFIG = {
  penalizacion: { label: 'Penalización', color: 'red', icon: '💰' },
  garantia: { label: 'Garantía', color: 'orange', icon: '📋' },
  exclusividad: { label: 'Exclusividad', color: 'purple', icon: '🔒' },
  restrictivo: { label: 'Restrictivo', color: 'volcano', icon: '⚠️' },
  oportunidad: { label: 'Oportunidad', color: 'green', icon: '✨' }
}

const RISK_LEVEL_CONFIG = {
  alto: { label: 'Alto', color: 'red', icon: <ExclamationCircleOutlined /> },
  medio: { label: 'Medio', color: 'orange', icon: <WarningOutlined /> },
  bajo: { label: 'Bajo', color: 'blue', icon: <CheckCircleOutlined /> },
  positivo: { label: 'Positivo', color: 'green', icon: <CheckCircleOutlined /> }
}

export default function RFPRiskAnalysis({ rfpId }) {
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [clauses, setClauses] = useState([])

  useEffect(() => {
    loadClauses()
  }, [rfpId])

  const loadClauses = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const response = await axios.get(`/api/rfp-risk-clauses/${rfpId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      setClauses(response.data)
    } catch (error) {
      console.error('Error loading clauses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    Modal.confirm({
      title: 'Análisis de Cláusulas de Riesgo',
      content: '¿Quieres que la IA analice el RFP y detecte cláusulas de riesgo (penalizaciones, garantías, exclusividad, etc.)? Esto puede tardar 30-60 segundos.',
      okText: 'Sí, analizar',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          setAnalyzing(true)
          const { data: { session } } = await supabase.auth.getSession()
          const response = await axios.post(`/api/rfp-risk-clauses/analyze/${rfpId}`, {}, {
            headers: { Authorization: `Bearer ${session.access_token}` }
          })

          message.success(`${response.data.count} cláusulas detectadas`)
          setClauses(response.data.clauses)
        } catch (error) {
          console.error('Error analyzing clauses:', error)
          message.error('Error al analizar: ' + (error.response?.data?.error || error.message))
        } finally {
          setAnalyzing(false)
        }
      }
    })
  }

  // Agrupar por nivel de riesgo
  const clausesByRisk = {
    alto: clauses.filter(c => c.risk_level === 'alto'),
    medio: clauses.filter(c => c.risk_level === 'medio'),
    bajo: clauses.filter(c => c.risk_level === 'bajo'),
    positivo: clauses.filter(c => c.risk_level === 'positivo')
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <WarningOutlined />
          <span>Análisis de Riesgo</span>
          {clauses.length > 0 && (
            <>
              {clausesByRisk.alto.length > 0 && (
                <Tag color="red">{clausesByRisk.alto.length} alto riesgo</Tag>
              )}
              {clausesByRisk.positivo.length > 0 && (
                <Tag color="green">{clausesByRisk.positivo.length} oportunidades</Tag>
              )}
            </>
          )}
        </div>
      }
      extra={
        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          onClick={handleAnalyze}
          loading={analyzing}
          disabled={loading}
        >
          {clauses.length > 0 ? 'Re-analizar con IA' : 'Analizar Riesgos con IA'}
        </Button>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin />
        </div>
      ) : clauses.length === 0 ? (
        <Empty
          description="No hay análisis de riesgo disponible"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" icon={<ThunderboltOutlined />} onClick={handleAnalyze}>
            Analizar Cláusulas con IA
          </Button>
        </Empty>
      ) : (
        <>
          {/* Alerta de alto riesgo */}
          {clausesByRisk.alto.length > 0 && (
            <Alert
              message={`⚠️ ${clausesByRisk.alto.length} cláusulas de alto riesgo detectadas`}
              description="Revisa estas cláusulas con Legal antes de continuar con la propuesta"
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Resumen por tipo */}
          <div style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 16,
            padding: 12,
            background: 'var(--bg-hover)',
            borderRadius: 8
          }}>
            {Object.keys(CLAUSE_TYPE_CONFIG).map(type => {
              const count = clauses.filter(c => c.clause_type === type).length
              if (count === 0) return null
              const config = CLAUSE_TYPE_CONFIG[type]
              return (
                <Tag key={type} color={config.color}>
                  {config.icon} {config.label}: {count}
                </Tag>
              )
            })}
          </div>

          {/* Timeline de cláusulas */}
          {['alto', 'medio', 'positivo', 'bajo'].map(risk => {
            const riskClauses = clausesByRisk[risk]
            if (riskClauses.length === 0) return null

            const riskConfig = RISK_LEVEL_CONFIG[risk]

            return (
              <div key={risk} style={{ marginBottom: 24 }}>
                <h4 style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                  color: 'var(--text-primary)'
                }}>
                  {riskConfig.icon}
                  <span>Riesgo {riskConfig.label}</span>
                  <Tag color={riskConfig.color}>{riskClauses.length}</Tag>
                </h4>

                <Timeline
                  items={riskClauses.map(clause => {
                    const typeConfig = CLAUSE_TYPE_CONFIG[clause.clause_type]
                    return {
                      color: riskConfig.color,
                      children: (
                        <div>
                          <div style={{ marginBottom: 4 }}>
                            <Tag color={typeConfig?.color || 'default'} style={{ marginRight: 6 }}>
                              {typeConfig?.icon} {typeConfig?.label || clause.clause_type}
                            </Tag>
                            {clause.section_reference && (
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                {clause.section_reference}
                              </span>
                            )}
                          </div>
                          <div style={{
                            fontSize: 13,
                            color: 'var(--text-primary)',
                            marginBottom: 6,
                            fontStyle: 'italic'
                          }}>
                            "{clause.clause_text}"
                          </div>
                          {clause.recommendation && (
                            <div style={{
                              fontSize: 12,
                              color: 'var(--text-secondary)',
                              padding: 8,
                              background: 'var(--bg-card)',
                              borderLeft: `3px solid ${riskConfig.color}`,
                              borderRadius: 4
                            }}>
                              💡 <strong>Recomendación:</strong> {clause.recommendation}
                            </div>
                          )}
                        </div>
                      )
                    }
                  })}
                />
              </div>
            )
          })}
        </>
      )}
    </Card>
  )
}
