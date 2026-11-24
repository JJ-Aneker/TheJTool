import ExcelJS from 'exceljs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Convierte fecha a número serial de Excel sin hora
 */
const dateToExcelSerial = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const excelEpoch = new Date(1899, 11, 30)
  return Math.floor((d - excelEpoch) / (1000 * 60 * 60 * 24))
}

/**
 * Aplana tareas y subtareas (mismo código que GanttViewer.jsx)
 */
const flattenTasksForExport = (tasksWithDates) => {
  const flat = []
  let taskNumber = 1

  tasksWithDates.forEach(task => {
    const fechaInicioPadre = task.startDate

    flat.push({
      numero: taskNumber,
      nombre: task.descripcion || task.nombre || 'Tarea',
      responsable: task.responsable || 'Equipo',
      fechaInicio: fechaInicioPadre,
      dias: Math.ceil(task.dias || 1),
      progreso: (task.progress || task.progreso || 0) / 100
    })
    taskNumber++

    if (task.subtareas && Array.isArray(task.subtareas)) {
      task.subtareas.forEach(subtask => {
        flat.push({
          numero: null,
          nombre: `├─ ${subtask.descripcion || subtask.nombre || 'Subtarea'}`,
          responsable: subtask.responsable || task.responsable || 'Equipo',
          fechaInicio: fechaInicioPadre,
          dias: Math.ceil(subtask.dias || 1),
          progreso: (subtask.progress || subtask.progreso || 0) / 100
        })
      })
    }
  })

  return flat
}

/**
 * Crea tareas de ejemplo con fechas calculadas
 */
function createExampleTasks() {
  let currentDate = new Date(2026, 5, 8) // 8 junio 2026
  const tasks = []

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

  // Tarea 1
  let taskStart = new Date(currentDate)
  let taskEnd = addWorkingDays(taskStart, 5)
  tasks.push({
    descripcion: 'Análisis de Requisitos',
    dias: 5,
    responsable: 'Juan García',
    progress: 100,
    startDate: taskStart,
    endDate: taskEnd,
    subtareas: [
      {
        descripcion: 'Entrevista con cliente',
        dias: 2,
        responsable: 'María López',
        progress: 100
      },
      {
        descripcion: 'Documentación',
        dias: 2,
        responsable: 'Carlos Ruiz',
        progress: 100
      }
    ]
  })
  currentDate = new Date(taskEnd)
  currentDate.setDate(currentDate.getDate() + 1)

  // Tarea 2
  taskStart = new Date(currentDate)
  taskEnd = addWorkingDays(taskStart, 8)
  tasks.push({
    descripcion: 'Diseño del Sistema',
    dias: 8,
    responsable: 'Ana Martínez',
    progress: 75,
    startDate: taskStart,
    endDate: taskEnd,
    subtareas: [
      {
        descripcion: 'Arquitectura',
        dias: 3,
        responsable: 'Ana Martínez',
        progress: 100
      },
      {
        descripcion: 'Base de Datos',
        dias: 3,
        responsable: 'Pedro Gómez',
        progress: 50
      },
      {
        descripcion: 'Interfaz de Usuario',
        dias: 2,
        responsable: 'Ana Martínez',
        progress: 50
      }
    ]
  })
  currentDate = new Date(taskEnd)
  currentDate.setDate(currentDate.getDate() + 1)

  // Tarea 3
  taskStart = new Date(currentDate)
  taskEnd = addWorkingDays(taskStart, 10)
  tasks.push({
    descripcion: 'Desarrollo Frontend',
    dias: 10,
    responsable: 'Laura Fernández',
    progress: 50,
    startDate: taskStart,
    endDate: taskEnd,
    subtareas: [
      {
        descripcion: 'Componentes React',
        dias: 5,
        responsable: 'Laura Fernández',
        progress: 80
      },
      {
        descripcion: 'Integración API',
        dias: 4,
        responsable: 'David López',
        progress: 30
      }
    ]
  })
  currentDate = new Date(taskEnd)
  currentDate.setDate(currentDate.getDate() + 1)

  // Tarea 4
  taskStart = new Date(currentDate)
  taskEnd = addWorkingDays(taskStart, 10)
  tasks.push({
    descripcion: 'Desarrollo Backend',
    dias: 10,
    responsable: 'Roberto Sánchez',
    progress: 25,
    startDate: taskStart,
    endDate: taskEnd,
    subtareas: [
      {
        descripcion: 'API REST',
        dias: 5,
        responsable: 'Roberto Sánchez',
        progress: 40
      },
      {
        descripcion: 'Validaciones',
        dias: 3,
        responsable: 'Miguel Torres',
        progress: 10
      }
    ]
  })
  currentDate = new Date(taskEnd)
  currentDate.setDate(currentDate.getDate() + 1)

  // Tarea 5
  taskStart = new Date(currentDate)
  taskEnd = addWorkingDays(taskStart, 7)
  tasks.push({
    descripcion: 'Testing & QA',
    dias: 7,
    responsable: 'Sofia Díaz',
    progress: 0,
    startDate: taskStart,
    endDate: taskEnd,
    subtareas: [
      {
        descripcion: 'Unit Tests',
        dias: 3,
        responsable: 'Sofia Díaz',
        progress: 0
      },
      {
        descripcion: 'Integration Tests',
        dias: 2,
        responsable: 'Elena Costa',
        progress: 0
      }
    ]
  })

  return tasks
}

async function generateTestGantt() {
  console.log('📊 Generando XLSM de prueba...\n')

  try {
    // Crear tareas de ejemplo
    const tasksWithDates = createExampleTasks()
    console.log(`✅ Tareas creadas: ${tasksWithDates.length} tareas principales`)
    console.log(`   • Total subtareas: ${tasksWithDates.reduce((s, t) => s + (t.subtareas?.length || 0), 0)}`)
    console.log(`   • Período: ${tasksWithDates[0].startDate.toLocaleDateString('es-ES')} → ${tasksWithDates[tasksWithDates.length - 1].endDate.toLocaleDateString('es-ES')}\n`)

    // Aplanar tareas
    const tareas = flattenTasksForExport(tasksWithDates)
    console.log(`✅ Tareas aplanadas: ${tareas.length} filas para Excel\n`)

    // Cargar plantilla
    const templatePath = path.join(__dirname, 'public/templates/gantt-template.xlsm')
    console.log(`📂 Cargando plantilla desde: ${templatePath}`)
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(templatePath)
    const ws = workbook.getWorksheet('Gantt')

    if (!ws) {
      throw new Error('Hoja "Gantt" no encontrada')
    }
    console.log(`✅ Plantilla cargada\n`)

    // Escribir datos
    console.log(`📝 Escribiendo datos en filas 5+...`)
    tareas.forEach((tarea, index) => {
      const rowIndex = 5 + index
      const row = ws.getRow(rowIndex)
      row.height = 16

      // Col A: Número
      row.getCell(1).value = tarea.numero ?? null
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'center' }

      // Col B: Nombre
      row.getCell(2).value = tarea.nombre
      row.getCell(2).alignment = { horizontal: 'left', vertical: 'center' }
      if (tarea.nombre.includes('├─')) {
        row.getCell(2).font = { size: 9, italic: true, color: { argb: 'FF666666' } }
      }

      // Col C: Responsable
      row.getCell(3).value = tarea.responsable
      row.getCell(3).alignment = { horizontal: 'left', vertical: 'center' }
      row.getCell(3).font = { size: 9 }

      // Col D: F.Inicio
      if (tarea.fechaInicio) {
        row.getCell(4).value = dateToExcelSerial(tarea.fechaInicio)
        row.getCell(4).numFmt = 'dd/mm/yyyy'
      }
      row.getCell(4).alignment = { horizontal: 'center', vertical: 'center' }
      row.getCell(4).font = { size: 9 }

      // Col E: Vacío
      row.getCell(5).alignment = { horizontal: 'center', vertical: 'center' }
      row.getCell(5).numFmt = 'dd/mm/yyyy'
      row.getCell(5).font = { size: 9 }

      // Col F: Días
      row.getCell(6).value = tarea.dias
      row.getCell(6).numFmt = '0'
      row.getCell(6).alignment = { horizontal: 'center', vertical: 'center' }
      row.getCell(6).font = { size: 9 }

      // Col G: %
      row.getCell(7).value = tarea.progreso
      row.getCell(7).numFmt = '0%'
      row.getCell(7).alignment = { horizontal: 'center', vertical: 'center' }
      row.getCell(7).font = { size: 9 }

      row.commit()
    })
    console.log(`✅ Datos escritos\n`)

    // Guardar archivo
    const outputDir = path.join(__dirname, 'output')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const outputPath = path.join(outputDir, 'Gantt_Test_Prueba.xlsm')
    await workbook.xlsx.writeFile(outputPath)

    const stats = fs.statSync(outputPath)
    console.log(`✅ Archivo creado:\n`)
    console.log(`   📁 ${outputPath}`)
    console.log(`   📊 Tamaño: ${(stats.size / 1024).toFixed(2)} KB\n`)

    console.log(`🎯 Próximos pasos:\n`)
    console.log(`   1. Abre el archivo en Excel`)
    console.log(`   2. Excel ejecutará la macro automáticamente (Workbook_Open)`)
    console.log(`   3. Deberías ver:`)
    console.log(`      ✓ Título "DIAGRAMA DE GANTT" en A1:G1`)
    console.log(`      ✓ Leyenda en fila 2`)
    console.log(`      ✓ Meses en fila 2 (columnas H+)`)
    console.log(`      ✓ Días en fila 3 (con letras: L, M, X, J, V)`)
    console.log(`      ✓ Datos de tareas en filas 5+`)
    console.log(`      ✓ Barras coloreadas según % de progreso`)
    console.log(`      ✓ Fin de semana en gris`)
    console.log(`   4. Haz clic en botón "Actualizar" para recalcular\n`)

    console.log(`✅ Test completado exitosamente\n`)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

generateTestGantt()
