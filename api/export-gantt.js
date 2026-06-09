import ExcelJS from 'exceljs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

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
    // Ajustar fecha de inicio al lunes si es fin de semana
    let taskStartDate = new Date(currentDate)
    while (taskStartDate.getDay() === 0 || taskStartDate.getDay() === 6) {
      taskStartDate.setDate(taskStartDate.getDate() + 1)
    }

    const dias = task.dias || task.duracion || 1
    const taskEndDate = addWorkingDays(taskStartDate, Math.ceil(dias))

    // Tarea principal
    tareas.push({
      numero: idx + 1,
      nombre: task.descripcion || task.nombre || 'Sin nombre',
      responsable: task.responsable || 'Equipo',
      fechaInicio: taskStartDate,
      dias: Math.ceil(dias),
      progreso: (task.progreso || task.porcentaje || 0) / 100,
      esSubtarea: false
    })

    // Subtareas (heredan fecha de inicio de tarea principal)
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
 * Exporta Gantt usando ExcelJS (funciona en Vercel + Local)
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

    // Mapear tareas
    const tareas = mapTasksToExcel(projectData, startDate)

    // Intentar cargar plantilla si existe (local)
    let workbook = new ExcelJS.Workbook()
    const templatePath = path.join(__dirname, '../public/templates/gantt-template.xlsm')

    if (fs.existsSync(templatePath)) {
      console.log('Cargando plantilla XLSM...')
      await workbook.xlsx.readFile(templatePath)
    } else {
      console.log('Plantilla no encontrada, creando desde cero (Vercel)')
      workbook.addWorksheet('Gantt')
    }

    const ws = workbook.getWorksheet('Gantt')
    if (!ws) {
      throw new Error('No hay hoja "Gantt"')
    }

    // Configurar columnas
    ws.columns = [
      { header: 'N°', key: 'numero', width: 5 },
      { header: 'Tarea', key: 'nombre', width: 25 },
      { header: 'Responsable', key: 'responsable', width: 15 },
      { header: 'F.Inicio', key: 'fechaInicio', width: 12 },
      { header: 'F.Fin', key: 'fechaFin', width: 12 },
      { header: 'Días', key: 'dias', width: 7 },
      { header: '%', key: 'progreso', width: 7 }
    ]

    // Escribir datos en filas 5+
    tareas.forEach((tarea, index) => {
      const rowNum = 5 + index
      const row = ws.getRow(rowNum)

      // Col A: Número
      row.getCell(1).value = tarea.numero ?? null
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'center' }
      if (tarea.numero) {
        row.getCell(1).font = { bold: true }
      }

      // Col B: Nombre
      row.getCell(2).value = tarea.nombre
      row.getCell(2).alignment = { horizontal: 'left', vertical: 'center' }
      if (tarea.esSubtarea) {
        row.getCell(2).font = { italic: true, color: { argb: 'FF666666' } }
      } else {
        row.getCell(2).font = { bold: true }
      }

      // Col C: Responsable
      row.getCell(3).value = tarea.responsable
      row.getCell(3).alignment = { horizontal: 'left', vertical: 'center' }
      row.getCell(3).font = { size: 9 }

      // Col D: F.Inicio
      row.getCell(4).value = tarea.fechaInicio
      row.getCell(4).numFmt = 'dd/mm/yyyy'
      row.getCell(4).alignment = { horizontal: 'center', vertical: 'center' }
      row.getCell(4).font = { size: 9 }

      // Col E: F.Fin (fórmula WORKDAY)
      row.getCell(5).value = { formula: `=WORKDAY(D${rowNum},F${rowNum})` }
      row.getCell(5).numFmt = 'dd/mm/yyyy'
      row.getCell(5).alignment = { horizontal: 'center', vertical: 'center' }
      row.getCell(5).font = { size: 9 }

      // Col F: Días
      row.getCell(6).value = tarea.dias
      row.getCell(6).numFmt = '0'
      row.getCell(6).alignment = { horizontal: 'center', vertical: 'center' }
      row.getCell(6).font = { size: 9 }

      // Col G: Progreso (%)
      row.getCell(7).value = tarea.progreso
      row.getCell(7).numFmt = '0%'
      row.getCell(7).alignment = { horizontal: 'center', vertical: 'center' }
      row.getCell(7).font = { size: 9 }

      // Color de progreso (sin caracteres, solo color de fondo)
      const colors = {
        0: 'FFBDDDF2',    // 0-25%: Azul claro
        25: 'FF7BBFE8',   // 26-50%: Azul medio
        50: 'FF2E8DD4',   // 51-75%: Azul oscuro
        75: 'FF1A5E9A'    // 76-100%: Azul muy oscuro
      }

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

    // Generar nombre de archivo
    const projectName = projectData.proyecto?.nombre || 'gantt'
    const safeName = projectName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `Gantt_${safeName}_${timestamp}.xlsx`

    // Generar buffer Excel
    const buffer = await workbook.xlsx.writeBuffer()

    // Headers de respuesta (XLSX, no XLSM)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', buffer.length)

    console.log(`✓ Gantt generado: ${filename} (${tareas.length} filas)`)
    res.send(buffer)
  } catch (error) {
    console.error('❌ Error exportando Gantt:', error.message)
    res.status(500).json({ error: error.message })
  }
}
