import { exportGanttFromTemplate } from './exportGanttTemplate.js'
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

    // Exportar Gantt desde plantilla con VBA
    await exportGanttFromTemplate(tasks, outputPath)

    // Crear archivo README con instrucciones sobre VBA
    const vbaInstructionsPath = path.join(outputDir, `${filename.replace('.xlsx', '')}_INSTRUCCIONES_VBA.txt`)
    const vbaInstructions = `INSTRUCCIONES PARA ACTIVAR COLOREADO DINÁMICO CON VBA
===============================================================

El archivo Gantt incluye una macro VBA que colorea automáticamente las barras.

PASO 1: Abrir el Editor de VBA
------
1. Abre el archivo Excel
2. Presiona: ALT + F11
3. Se abrirá el Editor de Visual Basic

PASO 2: Crear un nuevo módulo
------
1. En el panel izquierdo, haz clic derecho en "ThisWorkbook"
2. Selecciona "Insertar" → "Módulo"
3. Se creará un nuevo módulo

PASO 3: Copiar el código
------
1. Copia el código VBA de abajo
2. Pégalo en el módulo que acabas de crear
3. Guarda el archivo (Ctrl+S)

PASO 4: Ejecutar la macro
------
1. Cierra el Editor (Alt+F4)
2. Presiona: ALT + F8
3. Selecciona "ColorearBarrasGantt"
4. Haz clic en "Ejecutar"

RESULTADO:
Las barras se colorearán automáticamente según:
- 0%: Azul claro
- 1-25%: Azul
- 26-50%: Azul oscuro
- 51-75%: Azul marino
- 76-100%: Azul profundo

Si cambias el porcentaje (%) en la columna G, puedes:
Ejecutar nuevamente: ALT + F8 → ColorearBarrasGantt → Ejecutar

===============================================================
CÓDIGO VBA A COPIAR:

Sub ColorearBarrasGantt()
    Dim ws As Worksheet
    Dim lastRow As Long, lastCol As Long
    Dim i As Long, j As Long
    Dim taskStart As Date, taskEnd As Date, taskProgress As Double
    Dim dayDate As Date
    Dim colH As Long
    Dim colorValue As Long
    Dim weekday As Integer

    On Error GoTo ErrorHandler

    Set ws = ThisWorkbook.Sheets("Gantt")
    colH = 8

    lastRow = ws.Cells(ws.Rows.Count, 2).End(xlUp).Row
    lastCol = ws.Cells(3, ws.Columns.Count).End(xlToLeft).Column

    For i = 3 To lastRow
        For j = colH To lastCol
            ws.Cells(i, j).Interior.ColorIndex = xlNone
            ws.Cells(i, j).Font.ColorIndex = xlAutomatic
        Next j
    Next i

    For i = 3 To lastRow
        If ws.Cells(i, 4).Value <> "" And ws.Cells(i, 5).Value <> "" Then
            taskStart = ws.Cells(i, 4).Value
            taskEnd = ws.Cells(i, 5).Value
            taskProgress = ws.Cells(i, 7).Value

            For j = colH To lastCol
                dayDate = taskStart + (j - colH)
                weekday = Weekday(dayDate)

                If weekday = 1 Or weekday = 7 Then
                    ws.Cells(i, j).Interior.Color = RGB(232, 232, 232)
                ElseIf dayDate >= taskStart And dayDate < taskEnd Then
                    If taskProgress > 0.75 Then
                        colorValue = RGB(12, 61, 107)
                        ws.Cells(i, j).Font.Color = RGB(255, 255, 255)
                    ElseIf taskProgress > 0.5 Then
                        colorValue = RGB(26, 94, 154)
                        ws.Cells(i, j).Font.Color = RGB(255, 255, 255)
                    ElseIf taskProgress > 0.25 Then
                        colorValue = RGB(46, 141, 212)
                        ws.Cells(i, j).Font.Color = RGB(255, 255, 255)
                    ElseIf taskProgress > 0 Then
                        colorValue = RGB(123, 191, 232)
                        ws.Cells(i, j).Font.Color = RGB(255, 255, 255)
                    Else
                        colorValue = RGB(206, 234, 249)
                        ws.Cells(i, j).Font.Color = RGB(51, 51, 51)
                    End If
                    ws.Cells(i, j).Interior.Color = colorValue
                Else
                    ws.Cells(i, j).Interior.Color = RGB(214, 228, 240)
                End If
            Next j
        End If
    Next i

    MsgBox "✓ Barras coloreadas correctamente", vbInformation, "Gantt"
    Exit Sub

ErrorHandler:
    MsgBox "Error: " & Err.Description, vbCritical
End Sub
`

    fs.writeFileSync(vbaInstructionsPath, vbaInstructions)

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
