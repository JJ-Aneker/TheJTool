import { exportGanttFromTemplate } from './api/exportGanttTemplate.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { execFileSync } from 'child_process'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Calcula días laborables correctamente
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
 * Mapea tareas con subtareas SECUENCIALES (como lo hace el backend real)
 */
function mapProjectDataToTasks(projectData, startDate = null) {
  const projectStartDate = startDate ? new Date(startDate) : new Date(2026, 5, 8)
  let currentDate = new Date(projectStartDate)

  return projectData.estimacion.tareas.map((task) => {
    // Si es fin de semana, saltar a lunes
    let taskStartDate = new Date(currentDate)
    while (taskStartDate.getDay() === 0 || taskStartDate.getDay() === 6) {
      taskStartDate.setDate(taskStartDate.getDate() + 1)
    }

    const dias = task.dias || 1
    const taskEndDate = addWorkingDays(taskStartDate, Math.ceil(dias))

    currentDate = new Date(taskEndDate)
    currentDate.setDate(currentDate.getDate() + 1)

    // Subtareas SECUENCIALES
    let subtaskDate = new Date(taskStartDate)
    const subtareas = (task.subtareas || []).map((subtask) => {
      const subtaskDias = subtask.dias || 0.5
      const subtaskStartDate = new Date(subtaskDate)
      const subtaskEndDate = addWorkingDays(subtaskStartDate, Math.ceil(subtaskDias))

      subtaskDate = new Date(subtaskEndDate)
      subtaskDate.setDate(subtaskDate.getDate() + 1)

      return {
        tarea: subtask.descripcion || subtask.nombre || 'Subtarea',
        responsable: subtask.responsable || 'Equipo',
        dias: subtaskDias,
        inicio: subtaskStartDate,
        endDate: subtaskEndDate,
        pct: subtask.progreso || 0,
        isSubtask: true
      }
    })

    return {
      descripcion: task.descripcion || task.nombre,
      responsable: task.responsable || 'Equipo',
      dias: dias,
      inicio: taskStartDate,
      endDate: taskEndDate,
      progreso: task.progreso || 0,
      subtareas: subtareas
    }
  })
}

/**
 * Genera datos de ejemplo
 */
function generateExampleData() {
  const projectData = {
    estimacion: {
      tareas: [
        {
          descripcion: 'Análisis de Requisitos',
          dias: 5,
          progreso: 100,
          subtareas: [
            { descripcion: 'Entrevista', dias: 2, progreso: 100 },
            { descripcion: 'Documentar', dias: 2, progreso: 100 }
          ]
        },
        {
          descripcion: 'Diseño de Sistema',
          dias: 8,
          progreso: 75,
          subtareas: [
            { descripcion: 'Arquitectura', dias: 3, progreso: 100 },
            { descripcion: 'Base de datos', dias: 3, progreso: 50 },
            { descripcion: 'Interfaz', dias: 2, progreso: 50 }
          ]
        },
        {
          descripcion: 'Desarrollo Frontend',
          dias: 10,
          progreso: 50,
          subtareas: [
            { descripcion: 'Componentes', dias: 3, progreso: 80 },
            { descripcion: 'Integración', dias: 4, progreso: 30 }
          ]
        },
        {
          descripcion: 'Desarrollo Backend',
          dias: 10,
          progreso: 25,
          subtareas: [
            { descripcion: 'Endpoints', dias: 4, progreso: 40 },
            { descripcion: 'Validaciones', dias: 3, progreso: 10 }
          ]
        },
        {
          descripcion: 'Testing',
          dias: 7,
          progreso: 0,
          subtareas: [
            { descripcion: 'Unit tests', dias: 3, progreso: 0 },
            { descripcion: 'Integration', dias: 2, progreso: 0 }
          ]
        }
      ]
    }
  }

  return mapProjectDataToTasks(projectData)
}


/**
 * Función principal
 */
async function main() {
  console.log('📊 Generando XLSM de ejemplo...\n')

  try {
    const tasks = generateExampleData()
    const outputDir = path.join(__dirname, 'output')

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const xlsxPath = path.join(outputDir, 'Gantt_Ejemplo_Test.xlsx')

    console.log('✅ Datos generados:')
    console.log(`   • ${tasks.length} tareas principales`)
    console.log(`   • ${tasks.reduce((sum, t) => sum + (t.subtareas?.length || 0), 0)} subtareas`)
    console.log(`   • Periodo: ${tasks[0].inicio.toLocaleDateString('es-ES')} → ${tasks[tasks.length - 1].endDate.toLocaleDateString('es-ES')}\n`)

    console.log(`📝 Generando XLSX: ${xlsxPath}`)
    await exportGanttFromTemplate(tasks, xlsxPath)
    console.log('✅ XLSX generado exitosamente\n')

    console.log('🔄 Convirtiendo a XLSM con VBA...')
    const scriptPath = path.join(__dirname, 'docs', 'convertir-xlsx-a-xlsm-con-vba.ps1')

    try {
      execFileSync('powershell.exe', [
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', scriptPath,
        '-xlsxPath', xlsxPath
      ], {
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
        stdio: 'pipe'
      })

      const xlsmPath = xlsxPath.replace(/\.xlsx$/, '.xlsm')

      // Esperar a que se cree el archivo
      for (let i = 0; i < 10; i++) {
        if (fs.existsSync(xlsmPath)) {
          console.log(`✅ XLSM generado exitosamente\n`)
          console.log('📂 Archivo creado:')
          console.log(`   ${xlsmPath}\n`)

          const stats = fs.statSync(xlsmPath)
          console.log(`📊 Tamaño: ${(stats.size / 1024).toFixed(2)} KB\n`)

          console.log('🎯 Próximos pasos:')
          console.log('1. Abre el archivo en Excel')
          console.log('2. Verifica que aparezca:')
          console.log('   ✓ Título en A1:G1 (oscuro con texto blanco)')
          console.log('   ✓ Leyenda en H1:L1 (colores + "Fin Semana")')
          console.log('   ✓ Botón "Actualizar Gantt" en columna M')
          console.log('   ✓ Meses en fila 2')
          console.log('   ✓ Días en fila 3 (formato "14L")')
          console.log('   ✓ Tareas desde fila 5')
          console.log('   ✓ Barras coloreadas según progreso %')
          console.log('   ✓ Fin de semana en gris')
          console.log('3. Haz clic en "Actualizar Gantt" para ejecutar la macro')
          console.log('4. Si todo funciona, la aplicación está lista ✅\n')

          return
        }
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      console.log('⚠️  XLSM no encontrado tras conversión')
      console.log(`   Revisa: ${xlsxPath}`)
    } catch (error) {
      console.error('❌ Error en PowerShell:', error.message)
      console.log('   Intenta ejecutar manualmente:')
      console.log(`   PowerShell -ExecutionPolicy Bypass -File "${scriptPath}" -xlsxPath "${xlsxPath}"\n`)
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main()
