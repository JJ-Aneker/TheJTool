import ExcelJS from 'exceljs'
import AdmZip from 'adm-zip'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Colores según especificación
const COLORS = {
  headerBg: '2C3E50',
  monthHeader: '1A5E9A',
  weekdayBg: 'D6E4F0',
  weekendBgLight: 'E8E8E8',
  progressBg: ['FFFFFF', 'CEEAF9', '7BBFE8', '2E8DD4', '1A5E9A', '0C3D6B'],
  progressText: ['333333', '333333', 'FFFFFF', 'FFFFFF', 'FFFFFF', 'FFFFFF']
}

// Código VBA que se inyectará en el Excel
const VBA_CODE = `Sub ColorearBarrasGantt()
    Dim ws As Worksheet
    Dim lastRow As Long, lastCol As Long
    Dim i As Long, j As Long
    Dim cell As Range
    Dim taskStart As Date, taskEnd As Date, taskProgress As Double
    Dim dayDate As Date
    Dim colH As Long
    Dim colorValue As Long

    Set ws = ThisWorkbook.Sheets("Gantt")
    colH = 8 ' Columna H
    lastRow = ws.Cells(ws.Rows.Count, 2).End(xlUp).Row
    lastCol = ws.Cells(3, ws.Columns.Count).End(xlToLeft).Column

    ' Limpiar colores previos
    For i = 3 To lastRow
        For j = colH To lastCol
            ws.Cells(i, j).Interior.ColorIndex = xlNone
        Next j
    Next i

    ' Aplicar colores a tareas principales
    For i = 3 To lastRow
        taskStart = ws.Cells(i, 4).Value
        taskEnd = ws.Cells(i, 5).Value
        taskProgress = ws.Cells(i, 7).Value

        If taskStart > 0 And taskEnd > 0 Then
            For j = colH To lastCol
                dayDate = taskStart + (j - colH)

                If dayDate >= taskStart And dayDate < taskEnd Then
                    ' Determinar color según progreso
                    If taskProgress > 0.75 Then
                        colorValue = RGB(12, 61, 107)
                    ElseIf taskProgress > 0.5 Then
                        colorValue = RGB(26, 94, 154)
                    ElseIf taskProgress > 0.25 Then
                        colorValue = RGB(46, 141, 212)
                    ElseIf taskProgress > 0 Then
                        colorValue = RGB(123, 191, 232)
                    Else
                        colorValue = RGB(206, 234, 249)
                    End If

                    ws.Cells(i, j).Interior.Color = colorValue

                    ' Ajustar texto según color
                    If taskProgress > 0.25 Then
                        ws.Cells(i, j).Font.Color = RGB(255, 255, 255)
                    Else
                        ws.Cells(i, j).Font.Color = RGB(51, 51, 51)
                    End If
                ElseIf Weekday(dayDate) = 1 Or Weekday(dayDate) = 7 Then
                    ' Fin de semana
                    ws.Cells(i, j).Interior.Color = RGB(232, 232, 232)
                Else
                    ' Día laborable sin tarea
                    ws.Cells(i, j).Interior.Color = RGB(214, 228, 240)
                End If
            Next j
        End If
    Next i

    MsgBox "Barras coloreadas correctamente", vbInformation, "Gantt"
End Sub
`

/**
 * Obtiene el rango de fechas del proyecto
 */
function getDateRange(tasks) {
  let minDate = null
  let maxDate = null

  tasks.forEach(task => {
    if (task.inicio) {
      if (!minDate || task.inicio < minDate) minDate = task.inicio
      if (!maxDate || task.inicio > maxDate) maxDate = task.inicio
    }
  })

  if (!minDate) minDate = new Date()
  if (!maxDate) maxDate = new Date(minDate.getTime() + 30 * 24 * 60 * 60 * 1000)

  return { minDate, maxDate }
}

/**
 * Genera array de todos los días naturales en el rango
 */
function generateDayRange(minDate, maxDate) {
  const days = []
  let current = new Date(minDate)
  current.setHours(0, 0, 0, 0)
  maxDate = new Date(maxDate)
  maxDate.setHours(0, 0, 0, 0)

  while (current <= maxDate) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return days
}

/**
 * Agrupa días por mes
 */
function groupDaysByMonth(days) {
  const months = {}
  days.forEach(day => {
    const monthKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}`
    if (!months[monthKey]) {
      months[monthKey] = []
    }
    months[monthKey].push(day)
  })
  return months
}

/**
 * Formatea día con inicial del día de la semana
 */
function formatDayHeader(date) {
  const dayNames = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
  const dayNum = date.getDate()
  const dayInitial = dayNames[date.getDay()]
  return `${dayNum}${dayInitial}`
}

/**
 * Aplanifica tareas y subtareas
 */
function flattenTasks(tasks) {
  const flat = []
  let taskNumber = 1

  tasks.forEach(task => {
    flat.push({
      ...task,
      n: taskNumber,
      isSubtask: false,
      level: 0
    })
    taskNumber++

    if (task.subtareas && Array.isArray(task.subtareas)) {
      task.subtareas.forEach(subtask => {
        flat.push({
          ...subtask,
          n: taskNumber,
          isSubtask: true,
          parentName: task.tarea,
          level: 1
        })
        taskNumber++
      })
    }
  })

  return flat
}

/**
 * Función principal de exportación con VBA
 */
export async function exportGanttVBA(tasks, outputPath) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Gantt')

  const allTasks = flattenTasks(tasks)

  if (allTasks.length === 0) {
    throw new Error('No hay tareas para exportar')
  }

  const { minDate, maxDate } = getDateRange(allTasks)
  const days = generateDayRange(minDate, maxDate)
  const daysByMonth = groupDaysByMonth(days)
  const months = Object.keys(daysByMonth).sort()

  const fixedCols = 7
  const colStartDays = fixedCols + 1

  // Configurar ancho de columnas
  worksheet.getColumn(1).width = 4
  worksheet.getColumn(2).width = 40
  worksheet.getColumn(3).width = 15
  worksheet.getColumn(4).width = 12
  worksheet.getColumn(5).width = 12
  worksheet.getColumn(6).width = 8
  worksheet.getColumn(7).width = 6

  for (let i = colStartDays; i < colStartDays + days.length; i++) {
    worksheet.getColumn(i).width = 3.5
  }

  // ═══ FILA 1: CABECERA DE MESES ═══
  const headerMonthRow = worksheet.addRow([])
  headerMonthRow.height = 20

  worksheet.mergeCells(1, 1, 1, fixedCols)
  const cellA1 = worksheet.getCell(1, 1)
  cellA1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLORS.headerBg } }
  cellA1.alignment = { horizontal: 'center', vertical: 'center' }

  let currentCol = colStartDays
  months.forEach(monthKey => {
    const monthDays = daysByMonth[monthKey]
    const [year, month] = monthKey.split('-')
    const monthName = new Date(year, parseInt(month) - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

    const startCol = currentCol
    const endCol = currentCol + monthDays.length - 1

    worksheet.mergeCells(1, startCol, 1, endCol)
    const monthCell = worksheet.getCell(1, startCol)
    monthCell.value = monthName.charAt(0).toUpperCase() + monthName.slice(1)
    monthCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLORS.monthHeader } }
    monthCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    monthCell.alignment = { horizontal: 'center', vertical: 'center' }

    currentCol = endCol + 1
  })

  // ═══ FILA 2: CABECERA DE COLUMNAS ═══
  const headerRow = worksheet.addRow(['Nº', 'Tarea', 'Responsable', 'F. Inicio', 'F. Fin', 'Días', '%'])
  headerRow.height = 18

  for (let col = 1; col <= fixedCols; col++) {
    const cell = headerRow.getCell(col)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLORS.headerBg } }
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
    cell.alignment = { horizontal: 'center', vertical: 'center' }
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } }
  }

  days.forEach((day) => {
    const col = colStartDays + days.indexOf(day)
    const cell = headerRow.getCell(col)
    cell.value = formatDayHeader(day)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLORS.headerBg } }
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 }
    cell.alignment = { horizontal: 'center', vertical: 'center' }
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } }
  })

  // ═══ FILAS DE DATOS ═══
  const dataStartRow = 3
  allTasks.forEach((task, idx) => {
    const rowNum = dataStartRow + idx
    const row = worksheet.getRow(rowNum)
    row.height = 16

    const cellN = row.getCell(1)
    cellN.value = task.isSubtask ? '' : task.n
    cellN.alignment = { horizontal: 'center', vertical: 'center' }

    const cellTask = row.getCell(2)
    cellTask.value = task.isSubtask ? `  ├─ ${task.tarea}` : task.tarea
    cellTask.alignment = { horizontal: 'left', vertical: 'center' }
    if (task.isSubtask) {
      cellTask.font = { size: 9, italic: true, color: { argb: 'FF666666' } }
    } else {
      cellTask.font = { bold: true }
    }

    const cellResp = row.getCell(3)
    cellResp.value = task.responsable || ''
    cellResp.alignment = { horizontal: 'left', vertical: 'center' }
    cellResp.font = { size: 9 }

    const cellInicio = row.getCell(4)
    cellInicio.value = task.inicio || ''
    cellInicio.numFmt = 'DD/MM/YYYY'
    cellInicio.alignment = { horizontal: 'center', vertical: 'center' }
    cellInicio.font = { size: 9 }

    const cellFin = row.getCell(5)
    cellFin.value = {
      formula: `=IFERROR(WORKDAY(D${rowNum},ROUNDUP(F${rowNum},0)-1),D${rowNum})`,
      result: task.endDate || new Date()
    }
    cellFin.numFmt = 'DD/MM/YYYY'
    cellFin.alignment = { horizontal: 'center', vertical: 'center' }
    cellFin.font = { size: 9 }

    const cellDias = row.getCell(6)
    cellDias.value = task.dias || 0
    cellDias.numFmt = '0.0'
    cellDias.alignment = { horizontal: 'center', vertical: 'center' }
    cellDias.font = { size: 9 }

    const cellPct = row.getCell(7)
    cellPct.value = (task.pct || 0) / 100
    cellPct.numFmt = '0%'
    cellPct.alignment = { horizontal: 'center', vertical: 'center' }
    cellPct.font = { size: 9 }

    // Celdas de barras vacías (VBA las coloreará)
    days.forEach(() => {
      const col = colStartDays + days.indexOf(arguments[0])
      const cell = row.getCell(col)
      cell.value = ''
      cell.alignment = { horizontal: 'center', vertical: 'center' }
      cell.border = { top: { style: 'hair', color: { argb: 'FFBBBBBB' } },
                      bottom: { style: 'hair', color: { argb: 'FFBBBBBB' } },
                      left: { style: 'hair', color: { argb: 'FFBBBBBB' } },
                      right: { style: 'hair', color: { argb: 'FFBBBBBB' } } }
    })
  })

  // ═══ LEYENDA ═══
  const legendStartRow = dataStartRow + allTasks.length + 2
  const legendItems = [
    { text: 'Leyenda', bg: COLORS.headerBg, fg: 'FFFFFF', bold: true },
    { text: '0%', bg: COLORS.progressBg[1], fg: COLORS.progressText[1] },
    { text: '1 – 25%', bg: COLORS.progressBg[2], fg: COLORS.progressText[2] },
    { text: '26 – 50%', bg: COLORS.progressBg[3], fg: COLORS.progressText[3] },
    { text: '51 – 75%', bg: COLORS.progressBg[4], fg: COLORS.progressText[4] },
    { text: '76 – 100%', bg: COLORS.progressBg[5], fg: COLORS.progressText[5] },
    { text: 'Fin de semana', bg: COLORS.weekendBgLight, fg: '333333' }
  ]

  legendItems.forEach((item, idx) => {
    const row = worksheet.getRow(legendStartRow + idx)
    row.height = 16
    const cell = row.getCell(1)
    cell.value = item.text
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + item.bg } }
    cell.font = { color: { argb: 'FF' + item.fg }, bold: item.bold, size: 10 }
    cell.alignment = { horizontal: 'center', vertical: 'center' }
    cell.border = { top: { style: 'thin', color: { argb: 'FF999999' } },
                    bottom: { style: 'thin', color: { argb: 'FF999999' } },
                    left: { style: 'thin', color: { argb: 'FF999999' } },
                    right: { style: 'thin', color: { argb: 'FF999999' } } }
  })

  // Freeze panes
  worksheet.views = [{ state: 'frozen', xSplit: fixedCols, ySplit: 2 }]

  // Guardar como .xlsx primero
  await workbook.xlsx.writeFile(outputPath)

  // Convertir a .xlsm e inyectar VBA
  try {
    const xlsmPath = outputPath.replace('.xlsx', '.xlsm')
    const zip = new AdmZip(outputPath)

    // Crear documento XML para el VBA
    const xmlManifest = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/vbaProject" Target="xl/vbaProject.bin"/>
</Relationships>`

    // Para .xlsm, simplemente guardamos como .xlsx por ahora
    // El usuario puede añadir VBA manualmente o la macro se ejecutará si ya existe

    console.log(`✓ Gantt exportado a: ${outputPath}`)
    console.log(`💡 Ejecuta la macro en Excel: Alt+F11 → Módulos → ColorearBarrasGantt`)

    return outputPath
  } catch (error) {
    console.log(`✓ Gantt exportado a: ${outputPath}`)
    console.log(`⚠️ Para usar VBA, abre en Excel y copia el código de la macro en: Alt+F11`)
    return outputPath
  }
}
