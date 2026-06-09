import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs'
import { execSync } from 'child_process'

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
      fechaInicio: taskStartDate.toISOString().split('T')[0],
      dias: Math.ceil(dias),
      progreso: (task.progreso || task.porcentaje || 0) / 100
    })

    // Subtareas (heredan fecha de inicio de tarea principal)
    if (task.subtareas && Array.isArray(task.subtareas)) {
      task.subtareas.forEach(subtask => {
        const subtaskDias = subtask.dias || subtask.duracion || 0.5

        tareas.push({
          numero: null,
          nombre: `├─ ${subtask.descripcion || subtask.nombre || 'Subtarea'}`,
          responsable: subtask.responsable || task.responsable || 'Equipo',
          fechaInicio: taskStartDate.toISOString().split('T')[0],
          dias: Math.ceil(subtaskDias),
          progreso: (subtask.progreso || subtask.porcentaje || 0) / 100
        })
      })
    }

    currentDate = new Date(taskEndDate)
    currentDate.setDate(currentDate.getDate() + 1)
  })

  return tareas
}

/**
 * Exporta Gantt usando PowerShell COM
 * Preserva el VBA automáticamente
 */
export default async function exportGanttWithVBAHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  let tempExcelPath = null

  try {
    const { projectData, startDate } = req.body

    if (!projectData) {
      return res.status(400).json({ error: 'projectData es requerido' })
    }

    // Mapear tareas
    const tareas = mapTasksToExcel(projectData, startDate)

    // Paths
    const templatePath = path.join(__dirname, '../public/templates/gantt-template.xlsm')
    const outputDir = path.join(__dirname, '../output')

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Nombre de archivo
    const projectName = projectData.proyecto?.nombre || 'gantt'
    const safeName = projectName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `Gantt_${safeName}_${timestamp}.xlsm`
    tempExcelPath = path.join(outputDir, filename)

    // Escribir JSON a archivo temporal (UTF-8 sin BOM)
    const tempJsonPath = path.join(outputDir, `.temp-${Date.now()}.json`)
    const jsonContent = JSON.stringify({ tareas }, null, 2)
    fs.writeFileSync(tempJsonPath, jsonContent, { encoding: 'utf8' })

    // Ejecutar PowerShell para escribir en Excel
    const psScript = path.join(__dirname, '../docs/write-gantt-excel.ps1')

    console.log(`📊 Generando Gantt con ${tareas.length} filas...`)

    try {
      execSync(
        `powershell -ExecutionPolicy Bypass -File "${psScript}" ` +
        `-TemplatePath "${templatePath}" ` +
        `-OutputPath "${tempExcelPath}" ` +
        `-JsonDataPath "${tempJsonPath}"`,
        { stdio: 'inherit' }
      )
    } catch (error) {
      console.error('PowerShell error:', error.message)
      throw new Error('Error al generar Gantt con macros: ' + error.message)
    } finally {
      // Limpiar JSON temporal
      if (fs.existsSync(tempJsonPath)) {
        try {
          fs.unlinkSync(tempJsonPath)
        } catch (err) {
          console.warn('No se pudo limpiar JSON temp:', err.message)
        }
      }
    }

    // Verificar que el archivo se creó
    if (!fs.existsSync(tempExcelPath)) {
      throw new Error('El archivo no se creó correctamente')
    }

    // Leer y enviar archivo
    const fileBuffer = fs.readFileSync(tempExcelPath)

    res.setHeader('Content-Type', 'application/vnd.ms-excel.sheet.macroEnabled.12')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', fileBuffer.length)

    console.log(`✓ Descargando: ${filename}`)
    res.send(fileBuffer)
  } catch (error) {
    console.error('❌ Error exportando Gantt:', error.message)
    res.status(500).json({ error: error.message })
  } finally {
    // Limpiar archivo temporal después de enviar
    if (tempExcelPath && fs.existsSync(tempExcelPath)) {
      try {
        // Esperar un poco para asegurar que se descargó
        setTimeout(() => {
          if (fs.existsSync(tempExcelPath)) {
            fs.unlinkSync(tempExcelPath)
            console.log(`Limpiado: ${tempExcelPath}`)
          }
        }, 1000)
      } catch (err) {
        console.warn('No se pudo limpiar temp:', err.message)
      }
    }
  }
}
