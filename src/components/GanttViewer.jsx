import React, { useState, useMemo, useCallback } from 'react'
import { Card, Input, Button, Space, Slider, Empty, Tag, Tooltip, Row, Col } from 'antd'
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import '../styles/gantt-viewer.css'

/**
 * Calcula solo días laborables (lunes a viernes)
 */
function addWorkingDays(date, days) {
  let current = new Date(date)
  let daysAdded = 0

  while (daysAdded < days) {
    current.setDate(current.getDate() + 1)
    const dayOfWeek = current.getDay()
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      daysAdded++
    }
  }

  return current
}

/**
 * Calcula días laborables entre dos fechas
 */
function countWorkingDays(start, end) {
  let current = new Date(start)
  let count = 0

  while (current < end) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      count++
    }
    current.setDate(current.getDate() + 1)
  }

  return count
}

export default function GanttViewer({ projectData }) {
  const [tasksState, setTasksState] = useState(
    projectData?.estimacion?.tareas?.map((t, i) => ({
      ...t,
      id: `task-${i}`,
      dias: t.dias || 1,  // Asegurar que tiene dias
      progress: t.progress || 0
    })) || []
  )
  const [projectStart] = useState(new Date(2026, 2, 1))

  // Recalcular fechas basadas en duración en días laborables
  const tasksWithDates = useMemo(() => {
    if (!tasksState || tasksState.length === 0) return []

    let currentDate = new Date(projectStart)

    return tasksState.map((task) => {
      const dias = Math.max(task.dias || 1, 0.5)
      const startDate = new Date(currentDate)
      const endDate = addWorkingDays(startDate, Math.ceil(dias))

      const subtasks = task.subtareas?.map((subtask, subIdx) => {
        const subtaskDias = Math.max(subtask.dias || 0.5, 0.5)
        return {
          ...subtask,
          startDate: addWorkingDays(startDate, Math.ceil(subtaskDias * subIdx)),
          endDate: addWorkingDays(
            startDate,
            Math.ceil(subtaskDias * (subIdx + 1))
          )
        }
      }) || []

      currentDate = endDate

      return {
        ...task,
        dias,
        startDate,
        endDate,
        subtasks
      }
    })
  }, [tasksState, projectStart])

  // Rango de fechas para visualización
  const allDates = useMemo(() => {
    if (tasksWithDates.length === 0) return []

    const start = new Date(projectStart)
    const end = tasksWithDates[tasksWithDates.length - 1]?.endDate || new Date()

    const dates = []
    let current = new Date(start)

    while (current <= end) {
      if (current.getDay() >= 1 && current.getDay() <= 5) {
        dates.push(new Date(current))
      }
      current.setDate(current.getDate() + 1)
    }

    return dates
  }, [tasksWithDates, projectStart])

  // Actualizar progreso
  const handleProgressChange = useCallback((taskId, value) => {
    setTasksState(prev =>
      prev.map(t =>
        t.id === taskId ? { ...t, progress: value } : t
      )
    )
  }, [])

  // Actualizar fecha inicio
  const handleStartDateChange = useCallback((taskId, newDate) => {
    setTasksState(prev =>
      prev.map(t =>
        t.id === taskId ? { ...t, startDate: new Date(newDate) } : t
      )
    )
  }, [])

  if (!tasksWithDates.length) {
    return <Empty description="No hay tareas para mostrar" />
  }

  return (
    <div className="gantt-viewer">
      <Card
        title="📊 Diagrama Gantt Interactivo"
        className="gantt-card"
        extra={
          <Space>
            <Button type="primary" icon={<ReloadOutlined />} size="small">
              Recalcular
            </Button>
            <Button icon={<DownloadOutlined />} size="small">
              Exportar Excel
            </Button>
          </Space>
        }
      >
        {/* Resumen */}
        <Row gutter={[16, 16]} className="gantt-summary">
          <Col span={6}>
            <Tag color="blue">
              📅 {tasksWithDates.length} Tareas
            </Tag>
          </Col>
          <Col span={6}>
            <Tag color="green">
              ⏱️ {Math.ceil(tasksWithDates.reduce((s, t) => s + (t.dias || 0), 0))} días
            </Tag>
          </Col>
          <Col span={6}>
            <Tag color="purple">
              👥 {Math.round(tasksWithDates.reduce((s, t) => s + (t.horas || 0), 0))}h
            </Tag>
          </Col>
          <Col span={6}>
            <Tag color="orange">
              💰 {tasksWithDates.reduce((s, t) => s + (t.importe || 0), 0).toLocaleString('es-ES')}€
            </Tag>
          </Col>
        </Row>

        {/* Tabla Gantt */}
        <div className="gantt-table">
          <div className="gantt-header">
            <div className="gantt-col gantt-col-task">Tarea</div>
            <div className="gantt-col gantt-col-dates">Inicio</div>
            <div className="gantt-col gantt-col-dates">Fin</div>
            <div className="gantt-col gantt-col-progress">%</div>
            <div className="gantt-col-timeline">
              {allDates.map((date, idx) => (
                <div key={idx} className="gantt-day-header">
                  {date.getDate()}
                </div>
              ))}
            </div>
          </div>

          {/* Filas de tareas */}
          {tasksWithDates.map((task, taskIdx) => (
            <div key={task.id} className="gantt-row">
              {/* Tarea principal */}
              <div className="gantt-row-main">
                <div className="gantt-col gantt-col-task gantt-task-main">
                  <strong>{task.descripcion}</strong>
                </div>
                <div className="gantt-col gantt-col-dates">
                  {task.startDate.toLocaleDateString('es-ES')}
                </div>
                <div className="gantt-col gantt-col-dates">
                  {task.endDate.toLocaleDateString('es-ES')}
                </div>
                <div className="gantt-col gantt-col-progress">
                  <Slider
                    value={task.progress || 0}
                    onChange={(val) => handleProgressChange(task.id, val)}
                    max={100}
                    step={10}
                    tooltipVisible={false}
                    className="gantt-slider"
                  />
                  <span className="gantt-percent">{task.progress || 0}%</span>
                </div>
                <div className="gantt-col-timeline">
                  {allDates.map((date, dateIdx) => {
                    const isInRange = date >= task.startDate && date < task.endDate
                    const daysFromStart = countWorkingDays(task.startDate, date)
                    const totalDays = Math.ceil(task.dias)
                    const completedDays = Math.ceil((totalDays * (task.progress || 0)) / 100)
                    const isCompleted = isInRange && daysFromStart < completedDays

                    return (
                      <Tooltip key={dateIdx} title={date.toLocaleDateString('es-ES')}>
                        <div className={`gantt-bar ${isInRange ? (isCompleted ? 'completed' : 'pending') : ''}`} />
                      </Tooltip>
                    )
                  })}
                </div>
              </div>

              {/* Subtareas */}
              {task.subtareas?.map((subtask, subIdx) => (
                <div key={`${task.id}-sub-${subIdx}`} className="gantt-row-sub">
                  <div className="gantt-col gantt-col-task gantt-task-sub">
                    ├─ {subtask.descripcion}
                  </div>
                  <div className="gantt-col gantt-col-dates">
                    {subtask.startDate?.toLocaleDateString('es-ES') || '-'}
                  </div>
                  <div className="gantt-col gantt-col-dates">
                    {subtask.endDate?.toLocaleDateString('es-ES') || '-'}
                  </div>
                  <div className="gantt-col gantt-col-progress">
                    <span className="gantt-percent">-</span>
                  </div>
                  <div className="gantt-col-timeline">
                    {allDates.map((date, dateIdx) => {
                      const isInRange =
                        subtask.startDate &&
                        subtask.endDate &&
                        date >= subtask.startDate &&
                        date < subtask.endDate

                      return (
                        <Tooltip key={dateIdx} title={date.toLocaleDateString('es-ES')}>
                          <div className={`gantt-bar ${isInRange ? 'subtask' : ''}`} />
                        </Tooltip>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Leyenda */}
        <div className="gantt-legend">
          <Tag color="purple">█ Completado</Tag>
          <Tag color="cyan">█ Pendiente</Tag>
          <Tag color="green">— Subtarea</Tag>
        </div>
      </Card>
    </div>
  )
}
