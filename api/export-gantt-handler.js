import { exportGantt } from './exportGantt.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Mapea la estructura de projectData al formato requerido por exportGantt
 */
function mapProjectDataToTasks(projectData) {
  if (!projectData?.estimacion?.tareas) {
    throw new Error('No hay tareas en los datos del proyecto')
  }

  return projectData.estimacion.tareas.map(task => ({
    n: task.n || 0,
    tarea: task.descripcion || task.nombre || 'Sin nombre',
    responsable: task.responsable || '',
    inicio: task.fechaInicio ? new Date(task.fechaInicio) : new Date(),
    dias: task.dias || task.duracion || 1,
    pct: task.progreso || task.porcentaje || 0,
    // Para subtareas
    subtareas: (task.subtareas || []).map(subtask => ({
      n: subtask.n || 0,
      tarea: subtask.descripcion || subtask.nombre || 'Sin nombre',
      responsable: subtask.responsable || '',
      inicio: subtask.fechaInicio ? new Date(subtask.fechaInicio) : new Date(),
      dias: subtask.dias || subtask.duracion || 0.5,
      pct: subtask.progreso || subtask.porcentaje || 0
    }))
  }))
}

/**
 * Handler para exportar Gantt
 */
export default async function exportGanttHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    const { projectData } = req.body

    if (!projectData) {
      return res.status(400).json({ error: 'projectData es requerido' })
    }

    // Mapear datos
    const tasks = mapProjectDataToTasks(projectData)

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
