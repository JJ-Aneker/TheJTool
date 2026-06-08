import ExcelJS from 'exceljs'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Convierte una fecha JavaScript a número serial de Excel (sin hora)
 */
function dateToExcelSerial(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const excelEpoch = new Date(1899, 11, 30)
  return Math.floor((d - excelEpoch) / (1000 * 60 * 60 * 24))
}

/**
 * Aplana tareas y subtareas para escritura en Excel
 */
function flattenTasks(tasks) {
  const flat = []
  let taskNumber = 1

  tasks.forEach(task => {
    // Tarea principal
    flat.push({
      numero: taskNumber,
      nombre: task.descripcion || task.tarea || task.nombre || 'Tarea',
      responsable: task.responsable || 'Equipo',
      fechaInicio: task.inicio,
      dias: Math.ceil(task.dias || 1),
      progreso: (task.progreso || 0) / 100, // Convertir a decimal 0-1
      isSubtask: false
    })
    taskNumber++

    // Subtareas
    if (task.subtareas && Array.isArray(task.subtareas)) {
      task.subtareas.forEach(subtask => {
        flat.push({
          numero: null, // Las subtareas no tienen número
          nombre: `  ├─ ${subtask.descripcion || subtask.tarea || subtask.nombre || 'Subtarea'}`,
          responsable: subtask.responsable || 'Equipo',
          fechaInicio: subtask.inicio,
          dias: Math.ceil(subtask.dias || 1),
          progreso: (subtask.progreso || 0) / 100, // Convertir a decimal 0-1
          isSubtask: true
        })
        taskNumber++
      })
    }
  })

  return flat
}

/**
 * Exporta Gantt desde la plantilla .xlsm
 * La plantilla debe estar en public/templates/gantt-template.xlsm
 */
export async function exportGanttFromTemplate(tasks) {
  try {
    const templatePath = path.join(__dirname, '../public/templates/gantt-template.xlsm')

    // Verificar que la plantilla existe
    if (!fs.existsSync(templatePath)) {
      throw new Error(
        `Plantilla Gantt no encontrada en ${templatePath}. ` +
        'Ejecuta: node create-gantt-template.mjs'
      )
    }

    // Cargar plantilla
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(templatePath)
    const ws = workbook.getWorksheet('Gantt')

    if (!ws) {
      throw new Error('Hoja "Gantt" no encontrada en la plantilla')
    }

    // Aplanar tareas
    const flatTasks = flattenTasks(tasks)

    // Escribir datos a partir de fila 5
    flatTasks.forEach((task, idx) => {
      const rowNum = 5 + idx
      const row = ws.getRow(rowNum)
      row.height = 16

      // Columna A: Número de tarea (vacío si es subtarea)
      const cellA = row.getCell(1)
      cellA.value = task.numero ?? null
      cellA.alignment = { horizontal: 'center', vertical: 'center' }

      // Columna B: Nombre de tarea/subtarea
      const cellB = row.getCell(2)
      cellB.value = task.nombre
      cellB.alignment = { horizontal: 'left', vertical: 'center' }
      if (task.isSubtask) {
        cellB.font = { size: 9, italic: true, color: { argb: 'FF666666' } }
      } else {
        cellB.font = { bold: true, size: 10 }
      }

      // Columna C: Responsable
      const cellC = row.getCell(3)
      cellC.value = task.responsable
      cellC.alignment = { horizontal: 'left', vertical: 'center' }
      cellC.font = { size: 9 }

      // Columna D: F. Inicio (como número serial de Excel)
      const cellD = row.getCell(4)
      if (task.fechaInicio) {
        cellD.value = dateToExcelSerial(task.fechaInicio)
        cellD.numFmt = 'dd/mm/yyyy'
      }
      cellD.alignment = { horizontal: 'center', vertical: 'center' }
      cellD.font = { size: 9 }

      // Columna E: F. Fin (VACÍO — VBA lo calcula)
      // NO escribir nada aquí
      const cellE = row.getCell(5)
      cellE.alignment = { horizontal: 'center', vertical: 'center' }
      cellE.font = { size: 9 }
      cellE.numFmt = 'dd/mm/yyyy'

      // Columna F: Días
      const cellF = row.getCell(6)
      cellF.value = task.dias
      cellF.numFmt = '0'
      cellF.alignment = { horizontal: 'center', vertical: 'center' }
      cellF.font = { size: 9 }

      // Columna G: % (como porcentaje decimal)
      const cellG = row.getCell(7)
      cellG.value = task.progreso
      cellG.numFmt = '0%'
      cellG.alignment = { horizontal: 'center', vertical: 'center' }
      cellG.font = { size: 9 }

      // Commit para aplicar cambios
      row.commit()
    })

    // Generar buffer para descargar
    const buffer = await workbook.xlsx.writeBuffer()

    return buffer
  } catch (error) {
    console.error('Error exportando Gantt desde plantilla:', error)
    throw error
  }
}
