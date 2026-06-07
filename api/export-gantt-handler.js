import { exportGantt } from './exportGantt.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Calcula solo días laborables
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
 * Mapea la estructura de projectData al formato requerido por exportGantt
 */
function mapProjectDataToTasks(projectData, startDate = null) {
  if (!projectData?.estimacion?.tareas) {
    throw new Error('No hay tareas en los datos del proyecto')
  }

  // Usar fecha proporcionada o default (Marzo 1, 2026)
  const projectStartDate = startDate ? new Date(startDate) : new Date(2026, 2, 1)
  let currentDate = new Date(projectStartDate)

  return projectData.estimacion.tareas.map((task, idx) => {
    const taskStartDate = new Date(currentDate)
    const dias = task.dias || task.duracion || 1
    const taskEndDate = addWorkingDays(taskStartDate, Math.ceil(dias))

    // Actualizar fecha actual para la siguiente tarea
    currentDate = new Date(taskEndDate)
    currentDate.setDate(currentDate.getDate() + 1) // Un día después de que termine

    return {
      n: idx + 1,
      tarea: task.descripcion || task.nombre || 'Sin nombre',
      responsable: task.responsable || 'Equipo',
      inicio: taskStartDate,
      endDate: taskEndDate,
      dias: dias,
      pct: task.progreso || task.porcentaje || 0,
      isSubtask: false,
      // Para subtareas
      subtareas: (task.subtareas || []).map((subtask, subIdx) => {
        const subtaskDias = subtask.dias || subtask.duracion || 0.5
        const subtaskStartDate = addWorkingDays(taskStartDate, Math.ceil(subtaskDias * subIdx))
        const subtaskEndDate = addWorkingDays(subtaskStartDate, Math.ceil(subtaskDias))

        return {
          n: 0, // Las subtareas no se numeran
          tarea: subtask.descripcion || subtask.nombre || 'Sin nombre',
          responsable: subtask.responsable || 'Equipo',
          inicio: subtaskStartDate,
          endDate: subtaskEndDate,
          dias: subtaskDias,
          pct: subtask.progreso || subtask.porcentaje || 0,
          isSubtask: true
        }
      })
    }
  })
}

/**
 * Handler para exportar Gantt
 */
export default async function exportGanttHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    const { projectData, startDate } = req.body

    if (!projectData) {
      return res.status(400).json({ error: 'projectData es requerido' })
    }

    // Mapear datos con fecha de comienzo opcional
    const tasks = mapProjectDataToTasks(projectData, startDate)

    // Crear carpeta de output si no existe
    const outputDir = path.join(__dirname, '..', 'output')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Generar nombre de archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const projectName = projectData.proyecto?.nombre || 'gantt'
    const safeName = projectName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 30)
    const filename = `Gantt_${safeName}_${timestamp}.xlsx`
    const outputPath = path.join(outputDir, filename)

    // Exportar Gantt
    await exportGantt(tasks, outputPath)

    // Leer el archivo y enviarlo
    const fileBuffer = fs.readFileSync(outputPath)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(fileBuffer)
  } catch (error) {
    console.error('Error exportando Gantt:', error)
    res.status(500).json({ error: error.message })
  }
}
