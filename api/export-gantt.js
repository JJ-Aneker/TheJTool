import AdmZip from 'adm-zip'
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
    '/var/task/public/templates/gantt-template.xlsm'
  ]

  for (const templatePath of possiblePaths) {
    if (fs.existsSync(templatePath)) {
      console.log(`✓ Plantilla encontrada: ${templatePath}`)
      return templatePath
    }
  }

  throw new Error('PLANTILLA XLSM NO ENCONTRADA')
}

/**
 * Genera XML para fila de Excel
 */
function generateRowXML(rowNum, tarea) {
  const bold = tarea.numero ? ' b="1"' : ''
  const boldFont = tarea.numero ? '<font b="1"/>' : '<font/>'
  const isSubtarea = tarea.esSubtarea

  return `<row r="${rowNum}">
    <c r="A${rowNum}" s="1"${bold}><v>${tarea.numero ?? ''}</v></c>
    <c r="B${rowNum}" s="2"${isSubtarea ? '' : bold}><v>${escapeXml(tarea.nombre)}</v></c>
    <c r="C${rowNum}" s="2"><v>${escapeXml(tarea.responsable)}</v></c>
    <c r="D${rowNum}" s="3"><v>${Math.floor((tarea.fechaInicio - new Date(1899, 11, 30)) / 86400000)}</v></c>
    <c r="E${rowNum}" s="3"><f>=WORKDAY(D${rowNum},F${rowNum})</f></c>
    <c r="F${rowNum}" s="4"><v>${tarea.dias}</v></c>
    <c r="G${rowNum}" s="5"><v>${tarea.progreso}</v></c>
  </row>`
}

function escapeXml(str) {
  if (!str) return ''
  return str.replace(/[<>&'"]/g, c => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;'
  }[c]))
}

/**
 * Exporta Gantt manipulando XLSM como ZIP
 * Preserva VBA intacto
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  let tempZip = null

  try {
    const { projectData, startDate } = req.body

    if (!projectData) {
      return res.status(400).json({ error: 'projectData es requerido' })
    }

    const tareas = mapTasksToExcel(projectData, startDate)
    console.log(`Procesando ${tareas.length} tareas`)

    // Cargar plantilla XLSM como ZIP
    const templatePath = getTemplatePath()
    console.log(`Abriendo XLSM como ZIP: ${templatePath}`)

    const zip = new AdmZip(templatePath)

    // VERIFICAR que tiene VBA
    const vbaProject = zip.getEntry('xl/vbaProject.bin')
    if (!vbaProject) {
      throw new Error('PLANTILLA NO TIENE VBA - vbaProject.bin no encontrado')
    }
    console.log(`✓ vbaProject.bin encontrado (${vbaProject.header.size} bytes)`)

    // Listar todos los archivos en el ZIP
    console.log(`Archivos en ZIP:`)
    zip.getEntries().forEach(e => {
      console.log(`  - ${e.entryName} (${e.header.size} bytes)`)
    })

    // Extraer sheet1.xml
    const sheet1Entry = zip.getEntry('xl/worksheets/sheet1.xml')
    if (!sheet1Entry) {
      throw new Error('No se encontró xl/worksheets/sheet1.xml')
    }

    let sheet1Xml = sheet1Entry.getData().toString('utf-8')

    // Generar filas
    const rowsXml = tareas
      .map((tarea, idx) => generateRowXML(5 + idx, tarea))
      .join('\n')

    console.log(`Inyectando ${tareas.length} filas en XML`)

    // Reemplazar las filas (entre </sheetData> y </worksheet>)
    sheet1Xml = sheet1Xml.replace(
      /<sheetData>[\s\S]*?<\/sheetData>/,
      `<sheetData>\n${rowsXml}\n</sheetData>`
    )

    // Actualizar en ZIP
    zip.updateFile(sheet1Entry, Buffer.from(sheet1Xml, 'utf-8'))

    // Escribir a temporal
    tempZip = path.join(os.tmpdir(), `gantt-${Date.now()}.xlsm`)
    zip.writeZip(tempZip)
    console.log(`ZIP escrito: ${tempZip}`)

    // Leer buffer
    const fileBuffer = fs.readFileSync(tempZip)
    console.log(`Buffer: ${fileBuffer.length} bytes`)

    // Generar nombre
    const projectName = projectData.proyecto?.nombre || 'gantt'
    const safeName = projectName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `Gantt_${safeName}_${timestamp}.xlsm`

    res.setHeader('Content-Type', 'application/vnd.ms-excel.sheet.macroEnabled.12')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', fileBuffer.length)
    // Intentar evitar "Mark of the Web" (puede no funcionar en todos los navegadores)
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Content-Security-Policy', "default-src 'self'")

    console.log(`✓ Gantt: ${filename} (${tareas.length} filas con VBA preservado)`)
    res.send(fileBuffer)
  } catch (error) {
    console.error('❌ ERROR:', error.message)
    res.status(500).json({ error: error.message })
  } finally {
    if (tempZip && fs.existsSync(tempZip)) {
      try {
        fs.unlinkSync(tempZip)
      } catch (err) {
        console.warn(`No se pudo limpiar ${tempZip}`)
      }
    }
  }
}
