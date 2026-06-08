import ExcelJS from 'exceljs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

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
 * Copia vbaProject.bin de plantilla original a archivo generado
 * para preservar las macros
 */
async function preserveVBA(templatePath, outputPath) {
  console.log('🔧 Preservando VBA de la plantilla...')
  
  try {
    // Leer plantilla como ZIP
    const fs_module = await import('fs').then(m => m.default || m)
    
    // Usar comando unzip/zip directo
    const tempDir = path.join(__dirname, '.temp-vba-' + Date.now())
    fs.mkdirSync(tempDir, { recursive: true })
    
    try {
      // Extraer vbaProject.bin de la plantilla
      execSync(`cd "${tempDir}" && unzip -q "${templatePath}" xl/vbaProject.bin`, { stdio: 'pipe' })
      
      // Inyectar en archivo de salida
      execSync(`cd "${tempDir}" && zip -q -j "${outputPath}" xl/vbaProject.bin`, { stdio: 'pipe' })
      
      console.log('✓ VBA preservado\n')
    } finally {
      // Limpiar temp
      execSync(`rm -rf "${tempDir}"`, { stdio: 'pipe' })
    }
  } catch (error) {
    console.warn('⚠️  Aviso: No se pudo preservar VBA (' + error.message + ')')
  }
}

async function generateGanttWithVBA() {
  console.log('📊 Generando XLSM CON VBA PRESERVADO...\n')

  try {
    const templatePath = path.join(__dirname, 'public/templates/gantt-template.xlsm')
    
    // Cargar plantilla
    console.log('📖 Cargando plantilla...')
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(templatePath)
    const ws = workbook.getWorksheet('Gantt')
    
    if (!ws) {
      throw new Error('Hoja Gantt no encontrada')
    }
    console.log('✓ Plantilla cargada\n')

    // Datos de ejemplo
    const tareas = [
      {
        numero: 1,
        nombre: 'Análisis',
        responsable: 'Juan',
        fechaInicio: new Date(2026, 5, 8),
        dias: 5,
        progreso: 1.00
      },
      {
        numero: null,
        nombre: '├─ Entrevista',
        responsable: 'María',
        fechaInicio: new Date(2026, 5, 8),
        dias: 2,
        progreso: 0.75
      },
      {
        numero: 2,
        nombre: 'Diseño',
        responsable: 'Ana',
        fechaInicio: new Date(2026, 5, 15),
        dias: 8,
        progreso: 0.50
      }
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
    console.log('✓ Datos escritos\n')

    // Guardar temporalmente sin VBA
    const outputPath = path.join(__dirname, 'output', 'Gantt_ConVBA.xlsm')
    console.log('💾 Guardando XLSM...')
    await workbook.xlsx.writeFile(outputPath)
    console.log('✓ Guardado (sin VBA aún)\n')

    // Preservar VBA de plantilla original
    await preserveVBA(templatePath, outputPath)

    const stats = fs.statSync(outputPath)
    console.log('✅ Archivo listo:\n')
    console.log('   📁 ' + outputPath)
    console.log('   📊 Tamaño: ' + (stats.size / 1024).toFixed(2) + ' KB\n')

    // Verificar que tiene VBA
    const hasVBA = execSync('unzip -l "' + outputPath + '" | grep -c vbaProject.bin', { encoding: 'utf-8' }).trim()
    if (hasVBA === '1') {
      console.log('✅ VERIFICADO: Archivo tiene VBA incrustado\n')
    } else {
      console.log('⚠️  AVISO: No se verificó presencia de VBA\n')
    }

    console.log('🎯 Próximos pasos:\n')
    console.log('   1. Abre el archivo en Excel')
    console.log('   2. Permite la ejecución de macros')
    console.log('   3. Excel debería ejecutar Workbook_Open automáticamente')
    console.log('   4. Las barras se colorearán automáticamente\n')

  } catch (error) {
    console.error('❌ Error: ' + error.message)
    process.exit(1)
  }
}

generateGanttWithVBA()
