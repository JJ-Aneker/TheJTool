import React, { useState, useMemo } from 'react'
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
    // 1 = Monday, 5 = Friday, 6 = Saturday, 0 = Sunday
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
  const [tasks, setTasks] = useState(projectData?.estimacion?.tareas || [])
  const [projectStart] = useState(new Date(2026, 2, 1))

  // Recalcular fechas basadas en duración en días laborables
  const tasksWithDates = useMemo(() => {
    let currentDate = new Date(projectStart)

    return tasks.map((task, idx) => {
      const startDate = new Date(currentDate)
      const endDate = addWorkingDays(startDate, Math.ceil(task.dias))

      const subtasks = task.subtareas?.map((subtask, subIdx) => ({
        ...subtask,
        startDate: addWorkingDays(startDate, Math.ceil(subtask.dias * subIdx)),
        endDate: addWorkingDays(
          startDate,
          Math.ceil(subtask.dias * (subIdx + 1))
        )
      })) || []

      currentDate = endDate

      return {
        ...task,
        id: `task-${idx}`,
        startDate,
        endDate,
        subtasks
      }
    })
  }, [tasks, projectStart])

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
  const handleProgressChange = (taskId, value) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, progress: value } : t
    ))
  }

  // Actualizar fecha inicio
  const handleStartDateChange = (taskId, newDate) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, startDate: new Date(newDate) } : t
    ))
  }

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
              ⏱️ {Math.ceil(tasks.reduce((s, t) => s + (t.dias || 0), 0))} días
            </Tag>
          </Col>
          <Col span={6}>
            <Tag color="purple">
              👥 {Math.round(tasks.reduce((s, t) => s + (t.horas || 0), 0))}h
            </Tag>
          </Col>
          <Col span={6}>
            <Tag color="orange">
              💰 {tasks.reduce((s, t) => s + (t.importe || 0), 0).toLocaleString('es-ES')}€
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
                    const isInRange =
                      date >= task.startDate && date < task.endDate
                    const isCompleted =
                      isInRange &&
                      countWorkingDays(task.startDate, date) <=
                        Math.ceil(
                          (task.dias * (task.progress || 0)) / 100
                        )

                    return (
                      <Tooltip
                        key={dateIdx}
                        title={date.toLocaleDateString('es-ES')}
                      >
                        <div
                          className={`gantt-bar ${
                            isInRange
                              ? isCompleted
                                ? 'completed'
                                : 'pending'
                              : ''
                          }`}
                        >
                          {isInRange && '█'}
                        </div>
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
                        <Tooltip
                          key={dateIdx}
                          title={date.toLocaleDateString('es-ES')}
                        >
                          <div
                            className={`gantt-bar ${
                              isInRange ? 'subtask' : ''
                            }`}
                          >
                            {isInRange && '—'}
                          </div>
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
