import ExcelJS from 'exceljs'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const COLORS = {
  headerBg: '2C3E50',
  monthHeader: '1A5E9A',
  weekdayBg: 'D6E4F0',
  weekendBgLight: 'E8E8E8'
}

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
 * Exporta Gantt usando la plantilla.xlsm con VBA
 */
export async function exportGanttFromTemplate(tasks, outputPath) {
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

  // Cargar plantilla
  const templatePath = path.join(__dirname, '..', 'docs', 'Gantt_Plantilla.xlsm')

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Plantilla no encontrada: ${templatePath}. Ejecuta: PowerShell.exe -ExecutionPolicy Bypass -File docs/crear-plantilla-gantt.ps1`)
  }

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(templatePath)
  const worksheet = workbook.getWorksheet('Gantt')

  if (!worksheet) {
    throw new Error('La plantilla no tiene una hoja llamada "Gantt"')
  }

  // ═══ LIMPIAR HOJAS ADICIONALES ═══
  while (workbook.worksheets.length > 1) {
    workbook.removeWorksheet(workbook.worksheets[1].id)
  }

  // ═══ FILA 1: CABECERA DE MESES ═══
  // Limpiar filas anteriores si existen
  for (let i = worksheet.rowCount; i >= 1; i--) {
    worksheet.getRow(i).values = []
  }

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
    days.forEach((day, dayIdx) => {
      const col = colStartDays + dayIdx
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
    { text: '0%', bg: '206234249', fg: '333333' },
    { text: '1 – 25%', bg: '123191232', fg: 'FFFFFF' },
    { text: '26 – 50%', bg: '46141212', fg: 'FFFFFF' },
    { text: '51 – 75%', bg: '26941154', fg: 'FFFFFF' },
    { text: '76 – 100%', bg: '1261107', fg: 'FFFFFF' },
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

  // Guardar como .xlsm
  await workbook.xlsx.writeFile(outputPath)

  console.log(`✓ Gantt exportado desde plantilla: ${outputPath}`)
  console.log(`✨ VBA integrado - ejecutar macro: Alt+F8 → ColorearBarrasGantt`)

  return outputPath
}
