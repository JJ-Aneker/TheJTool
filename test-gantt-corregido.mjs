import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function generateTestGantt() {
  console.log('📊 Generando XLSM corregido...\n')

  try {
    const projectData = {
      proyecto: { nombre: 'Proyecto_Corregido' },
      estimacion: {
        tareas: [
          {
            descripcion: 'Análisis de Requisitos',
            dias: 5,
            responsable: 'Juan García',
            progreso: 100,
            subtareas: [
              { descripcion: 'Entrevista con Cliente', dias: 2, responsable: 'María López', progreso: 100 },
              { descripcion: 'Documentación', dias: 2, responsable: 'Carlos Ruiz', progreso: 100 }
            ]
          },
          {
            descripcion: 'Diseño del Sistema',
            dias: 8,
            responsable: 'Ana Martínez',
            progreso: 75,
            subtareas: [
              { descripcion: 'Arquitectura', dias: 3, responsable: 'Ana Martínez', progreso: 100 },
              { descripcion: 'Base de Datos', dias: 3, responsable: 'Pedro Gómez', progreso: 50 }
            ]
          }
        ]
      }
    }

    const response = await fetch('http://localhost:3002/api/export-gantt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectData })
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const outputDir = path.join(__dirname, 'output')
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

    const filename = 'Gantt_Corregido.xlsm'
    const outputPath = path.join(outputDir, filename)
    fs.writeFileSync(outputPath, buffer)

    const stats = fs.statSync(outputPath)

    console.log('✅ XLSM CORREGIDO GENERADO:\n')
    console.log(`   📁 ${outputPath}`)
    console.log(`   📊 Tamaño: ${(stats.size / 1024).toFixed(2)} KB\n`)

    console.log('🔧 Correcciones implementadas:\n')
    console.log(`   ✓ Tareas principales en NEGRITA`)
    console.log(`   ✓ Subtareas en formato normal`)
    console.log(`   ✓ UTF-8 sin BOM (caracteres españoles correctos)`)
    console.log(`   ✓ Workbook_Open ejecuta ActualizarGantt automáticamente\n`)

    console.log('🎯 Para probar:\n')
    console.log(`   1. Abre el archivo en Excel`)
    console.log(`   2. Macro se ejecuta automáticamente`)
    console.log(`   3. Verifica: negrita en tareas, caracteres españoles, barras coloreadas\n`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

generateTestGantt()
