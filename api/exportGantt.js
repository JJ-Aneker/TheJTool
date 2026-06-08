import ExcelJS from 'exceljs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Colores según especificación
const COLORS = {
  headerBg: '2C3E50',
  monthHeader: '1A5E9A',
  weekdayBg: 'D6E4F0',
  weekendBg: 'CCCCCC',
  weekendBgLight: 'E8E8E8',
  progressBg: [
    'FFFFFF', // 0%
    'CEEAF9', // 0%
    '7BBFE8', // 1-25%
    '2E8DD4', // 26-50%
    '1A5E9A', // 51-75%
    '0C3D6B'  // 76-100%
  ],
  progressText: [
    '333333',
    '333333',
    'FFFFFF',
    'FFFFFF',
    'FFFFFF',
    'FFFFFF'
  ]
}

/**
 * Convierte una fecha JS a número serial Excel
 */
function dateToExcelSerial(date) {
  const baseDate = new Date(1899, 11, 30)
  const timeDiff = date - baseDate
  const daysDiff = Math.floor(timeDiff / (24 * 60 * 60 * 1000))
  return daysDiff
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
 * Aplanifica tareas y subtareas en un único array
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
 * Función principal de exportación
 */
export async function exportGantt(tasks, outputPath) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Gantt')

  // Aplanar tareas y subtareas
  const allTasks = flattenTasks(tasks)

  if (allTasks.length === 0) {
    throw new Error('No hay tareas para exportar')
  }

  // Obtener rango de fechas
  const { minDate, maxDate } = getDateRange(allTasks)
  const days = generateDayRange(minDate, maxDate)
  const daysByMonth = groupDaysByMonth(days)
  const months = Object.keys(daysByMonth).sort()

  // Configurar columnas fijas
  const fixedCols = 7 // A-G
  const colStartDays = fixedCols + 1 // Columna H

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

  // Merge columnas fijas
  worksheet.mergeCells(1, 1, 1, fixedCols)
  const cellA1 = worksheet.getCell(1, 1)
  cellA1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLORS.headerBg } }
  cellA1.alignment = { horizontal: 'center', vertical: 'center' }

  // Merge meses
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
  const headerRow = worksheet.addRow([
    'Nº', 'Tarea', 'Responsable', 'F. Inicio', 'F. Fin', 'Días', '%'
  ])
  headerRow.height = 18

  for (let col = 1; col <= fixedCols; col++) {
    const cell = headerRow.getCell(col)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLORS.headerBg } }
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
    cell.alignment = { horizontal: 'center', vertical: 'center' }
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } }
  }

  // Añadir cabeceras de días
  days.forEach((day, idx) => {
    const col = colStartDays + idx
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

    // Columna A: Nº
    const cellN = row.getCell(1)
    cellN.value = task.isSubtask ? '' : task.n
    cellN.alignment = { horizontal: 'center', vertical: 'center' }

    // Columna B: Tarea
    const cellTask = row.getCell(2)
    cellTask.value = task.isSubtask ? `  ├─ ${task.tarea}` : task.tarea
    cellTask.alignment = { horizontal: 'left', vertical: 'center' }
    if (task.isSubtask) {
      cellTask.font = { size: 9, italic: true, color: { argb: 'FF666666' } }
    } else {
      cellTask.font = { bold: true }
    }

    // Columna C: Responsable
    const cellResp = row.getCell(3)
    cellResp.value = task.responsable || ''
    cellResp.alignment = { horizontal: 'left', vertical: 'center' }
    cellResp.font = { size: 9 }

    // Columna D: F. Inicio
    const cellInicio = row.getCell(4)
    cellInicio.value = task.inicio || ''
    cellInicio.numFmt = 'DD/MM/YYYY'
    cellInicio.alignment = { horizontal: 'center', vertical: 'center' }
    cellInicio.font = { size: 9 }

    // Columna E: F. Fin (FÓRMULA)
    const cellFin = row.getCell(5)
    cellFin.value = {
      formula: `=IFERROR(WORKDAY(D${rowNum},ROUNDUP(F${rowNum},0)-1),D${rowNum})`,
      result: task.endDate || new Date()
    }
    cellFin.numFmt = 'DD/MM/YYYY'
    cellFin.alignment = { horizontal: 'center', vertical: 'center' }
    cellFin.font = { size: 9 }

    // Columna F: Días
    const cellDias = row.getCell(6)
    cellDias.value = task.dias || 0
    cellDias.numFmt = '0.0'
    cellDias.alignment = { horizontal: 'center', vertical: 'center' }
    cellDias.font = { size: 9 }

    // Columna G: %
    const cellPct = row.getCell(7)
    cellPct.value = (task.pct || 0) / 100
    cellPct.numFmt = '0%'
    cellPct.alignment = { horizontal: 'center', vertical: 'center' }
    cellPct.font = { size: 9 }

    // ═══ BARRAS GANTT ═══
    days.forEach((day, dayIdx) => {
      const col = colStartDays + dayIdx
      const cell = row.getCell(col)
      cell.value = ''
      cell.alignment = { horizontal: 'center', vertical: 'center' }
      cell.border = { top: { style: 'hair', color: { argb: 'FFBBBBBB' } },
                      bottom: { style: 'hair', color: { argb: 'FFBBBBBB' } },
                      left: { style: 'hair', color: { argb: 'FFBBBBBB' } },
                      right: { style: 'hair', color: { argb: 'FFBBBBBB' } } }

      const isWeekend = day.getDay() === 0 || day.getDay() === 6

      if (isWeekend) {
        // Fines de semana siempre gris
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLORS.weekendBgLight } }
      } else if (!task.isSubtask && task.inicio && task.endDate) {
        // Para tareas principales, colorear según rango y progreso
        const isInRange = day >= task.inicio && day < task.endDate

        if (isInRange) {
          // Determinar color según porcentaje
          let bgColor = COLORS.progressBg[1] // 0%
          let fgColor = COLORS.progressText[1]

          if (task.pct > 75) {
            bgColor = COLORS.progressBg[5]
            fgColor = COLORS.progressText[5]
          } else if (task.pct > 50) {
            bgColor = COLORS.progressBg[4]
            fgColor = COLORS.progressText[4]
          } else if (task.pct > 25) {
            bgColor = COLORS.progressBg[3]
            fgColor = COLORS.progressText[3]
          } else if (task.pct > 0) {
            bgColor = COLORS.progressBg[2]
            fgColor = COLORS.progressText[2]
          }

          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bgColor } }
          cell.font = { color: { argb: 'FF' + fgColor } }
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLORS.weekdayBg } }
        }
      } else {
        // Subtareas y días sin tarea
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLORS.weekdayBg } }
      }
    })
  })

  // ═══ LEYENDA VERTICAL ═══
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

  // ═══ FREEZE PANES ═══
  worksheet.views = [{ state: 'frozen', xSplit: fixedCols, ySplit: 2 }]

  // ═══ GUARDAR ARCHIVO ═══
  await workbook.xlsx.writeFile(outputPath)
  console.log(`✓ Gantt exportado a: ${outputPath}`)

  return outputPath
}
