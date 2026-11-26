import { useMemo, useState } from 'react'
import { DatePicker, Empty, Tooltip } from 'antd'
import { DownloadOutlined, LoadingOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { message } from '../utils/message'
import { ganttService } from '../services/ganttService.js'
import '../styles/gantt-viewer.css'

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const WEEKDAYS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

const isWorkday = d => d.getDay() >= 1 && d.getDay() <= 5
const fmt = d => `${d.getDate()} ${MONTHS[d.getMonth()]}`

// Primer día laborable a partir de una semana desde hoy
export function defaultGanttStart() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 7)
  while (!isWorkday(d)) d.setDate(d.getDate() + 1)
  return dayjs(d)
}

// n días laborables a partir de start (start incluido si es laborable)
function workdays(start, n) {
  const out = []
  const d = new Date(start)
  while (!isWorkday(d)) d.setDate(d.getDate() + 1)
  while (out.length < n) {
    if (isWorkday(d)) out.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return out
}

/**
 * Planificación de las tareas de la estimación, una detrás de otra, en días
 * laborables. Se recalcula al cambiar la estimación o la fecha de inicio.
 * Las tareas pendientes de valorar se muestran sin barra.
 */
export default function GanttViewer({ projectData, startDate, onStartDateChange }) {
  const [localStart, setLocalStart] = useState(defaultGanttStart)
  const start = startDate || localStart
  const setStart = onStartDateChange || setLocalStart
  const [downloading, setDownloading] = useState(false)

  const tareas = projectData?.estimacion?.tareas || []

  const { rows, days, totalDays } = useMemo(() => {
    let offset = 0
    const rows = tareas.map((t, i) => {
      if (t.pendiente) return { ...t, key: i, pending: true }
      const dias = Math.max(Number(t.dias) || 0, 0.25)
      const from = Math.floor(offset + 1e-9)
      const to = Math.max(from, Math.ceil(offset + dias - 1e-9) - 1)
      offset += dias
      return { ...t, key: i, from, to, dias }
    })
    const totalDays = Math.max(1, Math.ceil(offset - 1e-9))
    return { rows, totalDays, days: workdays(start.toDate(), totalDays) }
  }, [tareas, start])

  const download = async () => {
    setDownloading(true)
    try {
      await ganttService.generateGantt(projectData, start.format('YYYY-MM-DD'))
      message.success('Gantt descargado. Ábrelo y pulsa «Actualizar» para ejecutar la macro.')
    } catch (err) {
      message.error('No se pudo descargar el Gantt: ' + err.message)
    } finally {
      setDownloading(false)
    }
  }

  if (!tareas.length) return <Empty description="No hay tareas en la estimación" />

  const end = days[days.length - 1]

  return (
    <div className="gv">
      <div className="gv-toolbar">
        <span className="gv-summary">
          {rows.filter(r => !r.pending).length} tareas · {totalDays} {totalDays === 1 ? 'día laborable' : 'días laborables'}
          {end && <> · del {fmt(days[0])} al {fmt(end)} {end.getFullYear()}</>}
        </span>
        <div className="gv-controls">
          <label className="gv-start">
            <span className="cell-muted">Inicio</span>
            <DatePicker
              value={start}
              onChange={v => v && setStart(v)}
              format="DD/MM/YYYY"
              allowClear={false}
              disabledDate={d => d.day() === 0 || d.day() === 6}
            />
          </label>
          <button className="btn-default" onClick={download} disabled={downloading}>
            {downloading ? <LoadingOutlined /> : <DownloadOutlined />} Descargar Gantt (.xlsm)
          </button>
        </div>
      </div>

      <div className="gv-scroll">
        <div className="gv-grid" style={{ '--gv-days': days.length }}>
          {/* Cabecera */}
          <div className="gv-head gv-col-task">Tarea</div>
          <div className="gv-head gv-col-date">Inicio</div>
          <div className="gv-head gv-col-date">Fin</div>
          <div className="gv-head gv-timeline">
            {days.map((d, i) => (
              <div key={i} className={`gv-day ${d.getDay() === 1 ? 'is-monday' : ''}`}>
                <span className="gv-day-w">{WEEKDAYS[d.getDay()]}</span>
                <span className="gv-day-n">{d.getDate()}</span>
              </div>
            ))}
          </div>

          {/* Filas */}
          {rows.map(r => (
            <div key={r.key} className={`gv-row ${r.pending ? 'is-pending' : ''}`}>
              <div className="gv-col-task" title={r.descripcion}>{r.descripcion}</div>
              <div className="gv-col-date">{r.pending ? '—' : fmt(days[r.from])}</div>
              <div className="gv-col-date">{r.pending ? <span className="gv-pending">Pendiente</span> : fmt(days[r.to])}</div>
              <div className="gv-timeline">
                {days.map((d, i) => <div key={i} className={`gv-cell ${d.getDay() === 1 ? 'is-monday' : ''}`} />)}
                {!r.pending && (
                  <Tooltip title={`${r.descripcion} · ${String(r.dias).replace('.', ',')} ${r.dias === 1 ? 'día' : 'días'}`}>
                    <div className="gv-bar" style={{ gridColumn: `${r.from + 1} / ${r.to + 2}` }} />
                  </Tooltip>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
