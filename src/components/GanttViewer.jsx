import React, { useState, useMemo, useCallback } from 'react'
import { Card, Input, Button, Space, Slider, Empty, Tag, Tooltip, Row, Col, message, DatePicker } from 'antd'
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import ExcelJS from 'exceljs'
import { ganttService } from '../services/ganttService'
import '../styles/gantt-viewer.css'

/**
 * Calcula solo días laborables (lunes-viernes)
 * Ignora sábados y domingos completamente
 * Si días=5, cuenta 5 días laborables desde la fecha de inicio
 */
function addWorkingDays(date, days) {
  let current = new Date(date)
  let daysAdded = 0

  while (daysAdded < days) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      daysAdded++
      if (daysAdded >= days) break
    }
    current.setDate(current.getDate() + 1)
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
  const [isDownloading, setIsDownloading] = useState(false)
  const [exportStartDate, setExportStartDate] = useState(dayjs(new Date(2026, 2, 1)))

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

  /**
   * Convierte fecha a número serial de Excel sin hora
   */
  const dateToExcelSerial = (date) => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    const excelEpoch = new Date(1899, 11, 30)
    return Math.floor((d - excelEpoch) / (1000 * 60 * 60 * 24))
  }

  const flattenTasksForExport = useCallback(() => {
    const flat = []
    let taskNumber = 1

    tasksWithDates.forEach(task => {
      const fechaInicioPadre = task.startDate

      flat.push({
        numero: taskNumber,
        nombre: task.descripcion || task.nombre || 'Tarea',
        responsable: task.responsable || 'Equipo',
        fechaInicio: fechaInicioPadre,
        dias: Math.ceil(task.dias || 1),
        progreso: (task.progress || task.progreso || 0) / 100
      })
      taskNumber++

      if (task.subtareas && Array.isArray(task.subtareas)) {
        task.subtareas.forEach(subtask => {
          flat.push({
            numero: null,
            nombre: `├─ ${subtask.descripcion || subtask.nombre || 'Subtarea'}`,
            responsable: subtask.responsable || task.responsable || 'Equipo',
            fechaInicio: fechaInicioPadre,
            dias: Math.ceil(subtask.dias || 1),
            progreso: (subtask.progress || subtask.progreso || 0) / 100
          })
        })
      }
    })

    return flat
  }, [tasksWithDates])

  /**
   * Exporta Gantt desde plantilla .xlsm
   */
  const handleDownloadExcel = useCallback(async () => {
    if (!projectData || tasksWithDates.length === 0) {
      message.error('No hay tareas para exportar')
      return
    }

    setIsDownloading(true)
    try {
      // Cargar plantilla
      const response = await fetch('/templates/gantt-template.xlsm')
      if (!response.ok) {
        throw new Error('No se pudo cargar la plantilla Gantt')
      }

      const arrayBuffer = await response.arrayBuffer()
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(arrayBuffer)
      const ws = workbook.getWorksheet('Gantt')

      if (!ws) {
        throw new Error('Hoja "Gantt" no encontrada en la plantilla')
      }

      // Obtener tareas aplanadas
      const tareas = flattenTasksForExport()

      // Escribir datos desde fila 5
      tareas.forEach((tarea, index) => {
        const rowIndex = 5 + index
        const row = ws.getRow(rowIndex)
        row.height = 16

        // Columna A: Número (vacío si es subtarea)
        row.getCell(1).value = tarea.numero ?? null
        row.getCell(1).alignment = { horizontal: 'center', vertical: 'center' }

        // Columna B: Nombre de tarea/subtarea
        row.getCell(2).value = tarea.nombre
        row.getCell(2).alignment = { horizontal: 'left', vertical: 'center' }
        if (tarea.nombre.includes('├─')) {
          row.getCell(2).font = { size: 9, italic: true, color: { argb: 'FF666666' } }
        }

        // Columna C: Responsable
        row.getCell(3).value = tarea.responsable
        row.getCell(3).alignment = { horizontal: 'left', vertical: 'center' }
        row.getCell(3).font = { size: 9 }

        // Columna D: F. Inicio (número serial Excel)
        if (tarea.fechaInicio) {
          row.getCell(4).value = dateToExcelSerial(tarea.fechaInicio)
          row.getCell(4).numFmt = 'dd/mm/yyyy'
        }
        row.getCell(4).alignment = { horizontal: 'center', vertical: 'center' }
        row.getCell(4).font = { size: 9 }

        // Columna E: Vacía (VBA calcula F.Fin con WORKDAY)
        row.getCell(5).alignment = { horizontal: 'center', vertical: 'center' }
        row.getCell(5).numFmt = 'dd/mm/yyyy'
        row.getCell(5).font = { size: 9 }

        // Columna F: Días
        row.getCell(6).value = tarea.dias
        row.getCell(6).numFmt = '0'
        row.getCell(6).alignment = { horizontal: 'center', vertical: 'center' }
        row.getCell(6).font = { size: 9 }

        // Columna G: % (como decimal)
        row.getCell(7).value = tarea.progreso
        row.getCell(7).numFmt = '0%'
        row.getCell(7).alignment = { horizontal: 'center', vertical: 'center' }
        row.getCell(7).font = { size: 9 }

        row.commit()
      })

      // Descargar como .xlsm
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.ms-excel.sheet.macroEnabled.12'
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const projectName = projectData.proyecto?.nombre || 'Gantt'
      const safeName = projectName
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 30)
      link.download = `Gantt_${safeName}.xlsm`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      message.success('Gantt exportado. Abre el archivo y pulsa "Actualizar" para ejecutar la macro')
    } catch (error) {
      message.error(error.message || 'Error al exportar Gantt')
      console.error('Export error:', error)
    } finally {
      setIsDownloading(false)
    }
  }, [projectData, tasksWithDates, flattenTasksForExport])

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
            <DatePicker
              value={exportStartDate}
              onChange={setExportStartDate}
              format="DD/MM/YYYY"
              size="small"
            />
            <Button type="primary" icon={<ReloadOutlined />} size="small">
              Recalcular
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              size="small"
              loading={isDownloading}
              onClick={handleDownloadExcel}
            >
              Descargar Gantt .xlsm
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
                    const isInRange = date >= task.startDate && date <= task.endDate

                    let barClass = ''
                    if (isInRange) {
                      const pct = task.progress || 0
                      if (pct <= 0) barClass = 'progress-0'
                      else if (pct <= 25) barClass = 'progress-25'
                      else if (pct <= 50) barClass = 'progress-50'
                      else if (pct <= 75) barClass = 'progress-75'
                      else barClass = 'progress-100'
                    }

                    return (
                      <Tooltip key={dateIdx} title={date.toLocaleDateString('es-ES')}>
                        <div className={`gantt-bar ${barClass}`} />
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
                        date <= subtask.endDate

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
