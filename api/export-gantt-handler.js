import { exportGanttFromTemplate } from './exportGanttTemplate.js'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))


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
    // Si currentDate es fin de semana, saltar al siguiente lunes
    let taskStartDate = new Date(currentDate)
    while (taskStartDate.getDay() === 0 || taskStartDate.getDay() === 6) {
      taskStartDate.setDate(taskStartDate.getDate() + 1)
    }

    const dias = task.dias || task.duracion || 1
    const taskEndDate = addWorkingDays(taskStartDate, Math.ceil(dias))

    // Actualizar fecha actual para la siguiente tarea (día siguiente a que termine)
    currentDate = new Date(taskEndDate)
    currentDate.setDate(currentDate.getDate() + 1)

    return {
      n: idx + 1,
      tarea: task.descripcion || task.nombre || 'Sin nombre',
      responsable: task.responsable || 'Equipo',
      inicio: taskStartDate,
      endDate: taskEndDate,
      dias: dias,
      pct: task.progreso || task.porcentaje || 0,
      isSubtask: false,
      // Para subtareas - secuenciales
      subtareas: (() => {
        let subtaskDate = new Date(taskStartDate)
        return (task.subtareas || []).map((subtask) => {
          const subtaskDias = subtask.dias || subtask.duracion || 0.5
          const subtaskStartDate = new Date(subtaskDate)
          const subtaskEndDate = addWorkingDays(subtaskStartDate, Math.ceil(subtaskDias))

          // Próxima subtarea comienza después de esta
          subtaskDate = new Date(subtaskEndDate)
          subtaskDate.setDate(subtaskDate.getDate() + 1)

          return {
            n: 0,
            tarea: subtask.descripcion || subtask.nombre || 'Sin nombre',
            responsable: subtask.responsable || 'Equipo',
            inicio: subtaskStartDate,
            endDate: subtaskEndDate,
            dias: subtaskDias,
            pct: subtask.progreso || subtask.porcentaje || 0,
            isSubtask: true
          }
        })
      })()
    }
  })
}

/**
 * Handler para exportar Gantt desde plantilla .xlsm
 * La plantilla debe estar en public/templates/gantt-template.xlsm
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

    console.log(`✓ Tareas mapeadas: ${tasks.length} tareas`)

    // Exportar Gantt desde plantilla (devuelve buffer)
    const fileBuffer = await exportGanttFromTemplate(tasks)

    // Generar nombre de archivo
    const projectName = projectData.proyecto?.nombre || 'gantt'
    const safeName = projectName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30)
    const filename = `Gantt_${safeName}.xlsm`

    // Establecer headers para descargar como .xlsm
    res.setHeader('Content-Type', 'application/vnd.ms-excel.sheet.macroEnabled.12')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', fileBuffer.length)

    console.log(`✓ Descargando: ${filename}`)
    res.send(fileBuffer)
  } catch (error) {
    console.error('❌ Error exportando Gantt:', error.message)
    res.status(500).json({ error: error.message })
  }
}
