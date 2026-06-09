import ExcelJS from 'exceljs'
import fs from 'fs'
import path from 'path'
import os from 'os'
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
 * Obtiene path de la plantilla
 */
function getTemplatePath() {
  const possiblePaths = [
    path.join(__dirname, '../public/templates/gantt-template.xlsm'),
    path.join(process.cwd(), 'public/templates/gantt-template.xlsm'),
    path.resolve('public/templates/gantt-template.xlsm'),
    '/var/task/public/templates/gantt-template.xlsm'
  ]

  for (const templatePath of possiblePaths) {
    if (fs.existsSync(templatePath)) {
      console.log(`✓ Plantilla encontrada: ${templatePath}`)
      return templatePath
    }
  }

  throw new Error(
    `PLANTILLA XLSM NO ENCONTRADA. Vercel debe incluir public/templates/gantt-template.xlsm`
  )
}

/**
 * Exporta Gantt con plantilla XLSM + VBA
 * Escribe a archivo temporal para preservar VBA correctamente
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  let tempFile = null

  try {
    const { projectData, startDate } = req.body

    if (!projectData) {
      return res.status(400).json({ error: 'projectData es requerido' })
    }

    const tareas = mapTasksToExcel(projectData, startDate)

    // Cargar plantilla XLSM
    const templatePath = getTemplatePath()
    console.log(`Cargando plantilla XLSM desde: ${templatePath}`)

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(templatePath)

    const ws = workbook.getWorksheet('Gantt')
    if (!ws) {
      throw new Error('Hoja "Gantt" no encontrada en plantilla')
    }

    console.log(`✓ Plantilla cargada`)

    // Escribir datos
    tareas.forEach((tarea, index) => {
      const rowNum = 5 + index
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

      row.height = 16
      row.commit()
    })

    // Generar nombre
    const projectName = projectData.proyecto?.nombre || 'gantt'
    const safeName = projectName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `Gantt_${safeName}_${timestamp}.xlsm`

    // CLAVE: Escribir a archivo temporal primero (preserva VBA mejor)
    tempFile = path.join(os.tmpdir(), `temp-${Date.now()}.xlsm`)
    console.log(`Escribiendo a temporal: ${tempFile}`)
    await workbook.xlsx.writeFile(tempFile)

    // Leer desde archivo temporal
    console.log(`Leyendo desde temporal...`)
    const fileBuffer = fs.readFileSync(tempFile)
    console.log(`Buffer size: ${fileBuffer.length} bytes`)

    // Responder
    res.setHeader('Content-Type', 'application/vnd.ms-excel.sheet.macroEnabled.12')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', fileBuffer.length)

    console.log(`✓ Gantt enviado: ${filename} (${tareas.length} filas, ${fileBuffer.length} bytes)`)
    res.send(fileBuffer)
  } catch (error) {
    console.error('❌ ERROR:', error.message)
    res.status(500).json({ error: error.message })
  } finally {
    // Limpiar archivo temporal
    if (tempFile && fs.existsSync(tempFile)) {
      try {
        fs.unlinkSync(tempFile)
        console.log(`Limpiado: ${tempFile}`)
      } catch (err) {
        console.warn(`No se pudo limpiar ${tempFile}: ${err.message}`)
      }
    }
  }
}
