import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function testGanttExport() {
  console.log('📊 Test de exportación Gantt desde plantilla...\n')

  // Datos de ejemplo
  const projectData = {
    proyecto: {
      nombre: 'Test_Project'
    },
    estimacion: {
      tareas: [
        {
          descripcion: 'Análisis',
          dias: 5,
          responsable: 'Juan',
          progreso: 100,
          subtareas: [
            { descripcion: 'Entrevista', dias: 2, progreso: 100 },
            { descripcion: 'Documentar', dias: 2, progreso: 100 }
          ]
        },
        {
          descripcion: 'Diseño',
          dias: 8,
          responsable: 'María',
          progreso: 50,
          subtareas: [
            { descripcion: 'UI', dias: 4, progreso: 75 },
            { descripcion: 'BD', dias: 3, progreso: 25 }
          ]
        },
        {
          descripcion: 'Desarrollo',
          dias: 10,
          responsable: 'Carlos',
          progreso: 25,
          subtareas: []
        }
      ]
    }
  }

  try {
    console.log('📤 Enviando solicitud al servidor...\n')
    const response = await fetch('http://localhost:3002/api/export-gantt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ projectData })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Error del servidor:', error)
      process.exit(1)
    }

    const arrayBuffer = await response.arrayBuffer()
    const blob = Buffer.from(arrayBuffer)
    const filename = response.headers.get('content-disposition')
      ?.match(/filename="?([^"]+)"?/)?.[1] || 'Gantt_Test.xlsm'

    const outputDir = path.join(__dirname, 'output')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const outputPath = path.join(outputDir, filename)
    fs.writeFileSync(outputPath, blob)

    console.log('✅ Archivo descargado:\n')
    console.log(`   📁 ${outputPath}`)
    const stats = fs.statSync(outputPath)
    console.log(`   📊 Tamaño: ${(stats.size / 1024).toFixed(2)} KB\n`)

    console.log('✅ Test completado exitosamente\n')
    console.log('🎯 Próximos pasos:')
    console.log('   1. Abre el archivo en Excel')
    console.log('   2. Haz clic en "Actualizar" para ejecutar la macro')
    console.log('   3. Las barras del Gantt se generarán automáticamente\n')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error en el test:', error.message)
    process.exit(1)
  }
}

testGanttExport()
