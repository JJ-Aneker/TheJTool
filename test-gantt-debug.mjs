import ExcelJS from 'exceljs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function debugGantt() {
  console.log('🔍 Debug: Probando carga de plantilla...\n')

  try {
    const templatePath = path.join(__dirname, 'public/templates/gantt-template.xlsm')

    console.log('📂 Ruta: ' + templatePath)
    console.log('✓ Existe: ' + fs.existsSync(templatePath))
    const stats = fs.statSync(templatePath)
    console.log('✓ Tamaño: ' + stats.size + ' bytes\n')

    console.log('📖 Abriendo con ExcelJS...')
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(templatePath)
    console.log('✓ Plantilla cargada\n')

    console.log('📋 Hojas del workbook:')
    workbook.worksheets.forEach(ws => {
      console.log('   - ' + ws.name + ' (' + ws.rowCount + ' filas, ' + ws.columnCount + ' columnas)')
    })

    const ws = workbook.getWorksheet('Gantt')
    if (!ws) {
      throw new Error('Hoja Gantt no encontrada')
    }
    console.log('\n✓ Hoja Gantt encontrada\n')

    console.log('📊 Información de la hoja Gantt:')
    console.log('   - Filas: ' + ws.rowCount)
    console.log('   - Columnas: ' + ws.columnCount)
    console.log('   - Merged cells: ' + (ws.merged?.length || 0) + '\n')

    console.log('📝 Contenido de filas 1-4:')
    for (let i = 1; i <= 4; i++) {
      const row = ws.getRow(i)
      const values = []
      for (let j = 1; j <= 7; j++) {
        values.push('"' + row.getCell(j).value + '"')
      }
      console.log('   Fila ' + i + ': ' + values.join(' | '))
    }

    console.log('\n✅ Plantilla válida\n')

    console.log('✏️  Escribiendo datos de prueba en fila 5...')
    const row5 = ws.getRow(5)
    row5.getCell(1).value = 1
    row5.getCell(2).value = 'Test Tarea'
    row5.getCell(3).value = 'Juan'
    row5.getCell(4).value = 44911
    row5.getCell(4).numFmt = 'dd/mm/yyyy'
    row5.getCell(5).value = null
    row5.getCell(6).value = 5
    row5.getCell(7).value = 0.75
    row5.getCell(7).numFmt = '0%'
    row5.commit()
    console.log('✓ Datos escritos\n')

    console.log('💾 Guardando como XLSM...')
    const outputPath = path.join(__dirname, 'output', 'Gantt_Debug.xlsm')
    await workbook.xlsx.writeFile(outputPath)
    console.log('✓ Guardado en: ' + outputPath)

    const outputStats = fs.statSync(outputPath)
    console.log('✓ Tamaño: ' + (outputStats.size / 1024).toFixed(2) + ' KB\n')

    console.log('✅ Debug completado\n')

  } catch (error) {
    console.error('❌ Error: ' + error.message)
    console.error('\nStack:')
    console.error(error.stack)
    process.exit(1)
  }
}

debugGantt()
