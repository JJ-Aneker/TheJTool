import ExcelJS from 'exceljs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const dateToExcelSerial = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const excelEpoch = new Date(1899, 11, 30)
  return Math.floor((d - excelEpoch) / (1000 * 60 * 60 * 24))
}

async function generateGantt() {
  console.log('📊 Generando XLSM con VBA...\n')

  try {
    const templatePath = path.join(__dirname, 'public/templates/gantt-template.xlsm')
    
    // Cargar plantilla
    console.log('📖 Cargando plantilla...')
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(templatePath)
    const ws = workbook.getWorksheet('Gantt')
    
    if (!ws) throw new Error('Hoja Gantt no encontrada')
    console.log('✓ Plantilla cargada\n')

    // Datos de ejemplo
    const tareas = [
      { numero: 1, nombre: 'Análisis', responsable: 'Juan', fechaInicio: new Date(2026, 5, 8), dias: 5, progreso: 1.00 },
      { numero: null, nombre: '├─ Entrevista', responsable: 'María', fechaInicio: new Date(2026, 5, 8), dias: 2, progreso: 0.75 },
      { numero: 2, nombre: 'Diseño', responsable: 'Ana', fechaInicio: new Date(2026, 5, 15), dias: 8, progreso: 0.50 },
      { numero: null, nombre: '├─ Arquitectura', responsable: 'Ana', fechaInicio: new Date(2026, 5, 15), dias: 3, progreso: 1.00 },
      { numero: null, nombre: '├─ BD', responsable: 'Pedro', fechaInicio: new Date(2026, 5, 15), dias: 3, progreso: 0.50 },
      { numero: 3, nombre: 'Desarrollo', responsable: 'Carlos', fechaInicio: new Date(2026, 5, 27), dias: 10, progreso: 0.25 }
    ]

    // Escribir datos
    console.log('✏️  Escribiendo datos...')
    tareas.forEach((tarea, index) => {
      const rowIndex = 5 + index
      const row = ws.getRow(rowIndex)
      
      row.getCell(1).value = tarea.numero ?? null
      row.getCell(2).value = tarea.nombre
      row.getCell(3).value = tarea.responsable
      row.getCell(4).value = dateToExcelSerial(tarea.fechaInicio)
      row.getCell(4).numFmt = 'dd/mm/yyyy'
      row.getCell(5).value = null
      row.getCell(6).value = tarea.dias
      row.getCell(7).value = tarea.progreso
      row.getCell(7).numFmt = '0%'
      row.commit()
    })
    console.log('✓ ' + tareas.length + ' filas escritas\n')

    // Guardar
    const outputPath = path.join(__dirname, 'output', 'Gantt_Prueba.xlsm')
    console.log('💾 Guardando...')
    await workbook.xlsx.writeFile(outputPath)
    console.log('✓ Guardado\n')

    // Preservar VBA
    console.log('🔧 Preservando VBA...')
    const preserveScript = path.join(__dirname, 'docs', 'preserve-vba.ps1')
    try {
      execSync(`powershell -ExecutionPolicy Bypass -File "${preserveScript}" -TemplatePath "${templatePath}" -OutputPath "${outputPath}"`, {
        stdio: 'inherit'
      })
    } catch (error) {
      console.error('⚠️  Error al preservar VBA: ' + error.message)
    }
    console.log('')

    const stats = fs.statSync(outputPath)
    console.log('✅ Archivo creado:\n')
    console.log('   📁 ' + outputPath)
    console.log('   📊 Tamaño: ' + (stats.size / 1024).toFixed(2) + ' KB\n')

    console.log('🎯 Próximos pasos:\n')
    console.log('   1. Abre el archivo en Excel')
    console.log('   2. Habilita macros (si Excel lo pide)')
    console.log('   3. Deberías ver automáticamente:')
    console.log('      - Título y leyenda')
    console.log('      - Calendario con meses y días')
    console.log('      - Barras coloreadas según progreso\n')

  } catch (error) {
    console.error('❌ Error: ' + error.message)
    process.exit(1)
  }
}

generateGantt()
