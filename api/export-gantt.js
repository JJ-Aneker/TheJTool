import ExcelJS from 'exceljs'

/**
 * Calcula solo días laborables (lunes-viernes)
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
 * Mapea tareas a formato para Excel
 */
function mapTasksToExcel(projectData, startDate) {
  if (!projectData?.estimacion?.tareas) {
    throw new Error('No hay tareas en los datos del proyecto')
  }

  const projectStartDate = startDate ? new Date(startDate) : new Date(2026, 2, 1)
  let currentDate = new Date(projectStartDate)
  const tareas = []

  projectData.estimacion.tareas.forEach((task, idx) => {
    let taskStartDate = new Date(currentDate)
    while (taskStartDate.getDay() === 0 || taskStartDate.getDay() === 6) {
      taskStartDate.setDate(taskStartDate.getDate() + 1)
    }

    const dias = task.dias || task.duracion || 1
    const taskEndDate = addWorkingDays(taskStartDate, Math.ceil(dias))

    tareas.push({
      numero: idx + 1,
      nombre: task.descripcion || task.nombre || 'Sin nombre',
      responsable: task.responsable || 'Equipo',
      fechaInicio: taskStartDate,
      dias: Math.ceil(dias),
      progreso: (task.progreso || task.porcentaje || 0) / 100,
      esSubtarea: false
    })

    if (task.subtareas && Array.isArray(task.subtareas)) {
      task.subtareas.forEach(subtask => {
        const subtaskDias = subtask.dias || subtask.duracion || 0.5

        tareas.push({
          numero: null,
          nombre: `├─ ${subtask.descripcion || subtask.nombre || 'Subtarea'}`,
          responsable: subtask.responsable || task.responsable || 'Equipo',
          fechaInicio: taskStartDate,
          dias: Math.ceil(subtaskDias),
          progreso: (subtask.progreso || subtask.porcentaje || 0) / 100,
          esSubtarea: true
        })
      })
    }

    currentDate = new Date(taskEndDate)
    currentDate.setDate(currentDate.getDate() + 1)
  })

  return tareas
}

/**
 * Exporta Gantt con ExcelJS (funciona en Vercel + Local)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    const { projectData, startDate } = req.body

    if (!projectData) {
      return res.status(400).json({ error: 'projectData es requerido' })
    }

    const tareas = mapTasksToExcel(projectData, startDate)

    const workbook = new ExcelJS.Workbook()
    const ws = workbook.addWorksheet('Gantt')

    // Headers
    ws.columns = [
      { header: 'N°', key: 'numero', width: 5 },
      { header: 'Tarea', key: 'nombre', width: 25 },
      { header: 'Responsable', key: 'responsable', width: 15 },
      { header: 'F.Inicio', key: 'fechaInicio', width: 12 },
      { header: 'F.Fin', key: 'fechaFin', width: 12 },
      { header: 'Días', key: 'dias', width: 7 },
      { header: '%', key: 'progreso', width: 7 }
    ]

    const colors = {
      0: 'FFBDDDF2',
      25: 'FF7BBFE8',
      50: 'FF2E8DD4',
      75: 'FF1A5E9A'
    }

    // Datos
    tareas.forEach((tarea, index) => {
      const rowNum = 2 + index
      const row = ws.getRow(rowNum)

      row.getCell(1).value = tarea.numero ?? null
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'center' }
      if (tarea.numero) row.getCell(1).font = { bold: true }

      row.getCell(2).value = tarea.nombre
      row.getCell(2).alignment = { horizontal: 'left', vertical: 'center' }
      if (tarea.esSubtarea) {
        row.getCell(2).font = { italic: true, color: { argb: 'FF666666' } }
      } else {
        row.getCell(2).font = { bold: true }
      }

      row.getCell(3).value = tarea.responsable
      row.getCell(3).alignment = { horizontal: 'left', vertical: 'center' }

      row.getCell(4).value = tarea.fechaInicio
      row.getCell(4).numFmt = 'dd/mm/yyyy'
      row.getCell(4).alignment = { horizontal: 'center', vertical: 'center' }

      row.getCell(5).value = { formula: `=WORKDAY(D${rowNum},F${rowNum})` }
      row.getCell(5).numFmt = 'dd/mm/yyyy'
      row.getCell(5).alignment = { horizontal: 'center', vertical: 'center' }

      row.getCell(6).value = tarea.dias
      row.getCell(6).numFmt = '0'
      row.getCell(6).alignment = { horizontal: 'center', vertical: 'center' }

      row.getCell(7).value = tarea.progreso
      row.getCell(7).numFmt = '0%'
      row.getCell(7).alignment = { horizontal: 'center', vertical: 'center' }

      let colorKey = 0
      if (tarea.progreso > 0.75) colorKey = 75
      else if (tarea.progreso > 0.5) colorKey = 50
      else if (tarea.progreso > 0.25) colorKey = 25

      for (let col = 1; col <= 7; col++) {
        row.getCell(col).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colors[colorKey] }
        }
      }

      row.height = 16
      row.commit()
    })

    const projectName = projectData.proyecto?.nombre || 'gantt'
    const safeName = projectName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `Gantt_${safeName}_${timestamp}.xlsx`

    const buffer = await workbook.xlsx.writeBuffer()

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', buffer.length)

    console.log(`✓ Gantt: ${filename}`)
    res.send(buffer)
  } catch (error) {
    console.error('Error:', error.message)
    res.status(500).json({ error: error.message })
  }
}
