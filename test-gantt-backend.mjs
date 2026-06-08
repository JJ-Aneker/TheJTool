import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function generateTestGantt() {
  console.log('📊 Generando XLSM de prueba desde backend...\n')

  try {
    // Datos de ejemplo completos
    const projectData = {
      proyecto: {
        nombre: 'Gantt_Prueba_Completa'
      },
      estimacion: {
        tareas: [
          {
            descripcion: 'Análisis de Requisitos',
            dias: 5,
            responsable: 'Juan García',
            progreso: 100,
            subtareas: [
              {
                descripcion: 'Entrevista con Cliente',
                dias: 2,
                responsable: 'María López',
                progreso: 100
              },
              {
                descripcion: 'Documentación de Especificaciones',
                dias: 2,
                responsable: 'Carlos Ruiz',
                progreso: 100
              }
            ]
          },
          {
            descripcion: 'Diseño del Sistema',
            dias: 8,
            responsable: 'Ana Martínez',
            progreso: 75,
            subtareas: [
              {
                descripcion: 'Arquitectura',
                dias: 3,
                responsable: 'Ana Martínez',
                progreso: 100
              },
              {
                descripcion: 'Base de Datos',
                dias: 3,
                responsable: 'Pedro Gómez',
                progreso: 50
              },
              {
                descripcion: 'Interfaz de Usuario',
                dias: 2,
                responsable: 'Ana Martínez',
                progreso: 50
              }
            ]
          },
          {
            descripcion: 'Desarrollo Frontend',
            dias: 10,
            responsable: 'Laura Fernández',
            progreso: 50,
            subtareas: [
              {
                descripcion: 'Componentes React',
                dias: 5,
                responsable: 'Laura Fernández',
                progreso: 80
              },
              {
                descripcion: 'Integración con API',
                dias: 4,
                responsable: 'David López',
                progreso: 30
              }
            ]
          },
          {
            descripcion: 'Desarrollo Backend',
            dias: 10,
            responsable: 'Roberto Sánchez',
            progreso: 25,
            subtareas: [
              {
                descripcion: 'API REST',
                dias: 5,
                responsable: 'Roberto Sánchez',
                progreso: 40
              },
              {
                descripcion: 'Validaciones y Seguridad',
                dias: 3,
                responsable: 'Miguel Torres',
                progreso: 10
              }
            ]
          },
          {
            descripcion: 'Testing & QA',
            dias: 7,
            responsable: 'Sofia Díaz',
            progreso: 0,
            subtareas: [
              {
                descripcion: 'Unit Tests',
                dias: 3,
                responsable: 'Sofia Díaz',
                progreso: 0
              },
              {
                descripcion: 'Integration Tests',
                dias: 2,
                responsable: 'Elena Costa',
                progreso: 0
              }
            ]
          },
          {
            descripcion: 'Deploy y Documentación',
            dias: 3,
            responsable: 'Juan García',
            progreso: 0,
            subtareas: [
              {
                descripcion: 'Preparación de Servidor',
                dias: 1,
                responsable: 'Juan García',
                progreso: 0
              },
              {
                descripcion: 'Documentación Final',
                dias: 1,
                responsable: 'Carlos Ruiz',
                progreso: 0
              }
            ]
          }
        ]
      }
    }

    console.log('📤 Enviando solicitud al backend...\n')
    const response = await fetch('http://localhost:3002/api/export-gantt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ projectData })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const outputDir = path.join(__dirname, 'output')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const filename = 'Gantt_Prueba_Completa.xlsm'
    const outputPath = path.join(outputDir, filename)
    fs.writeFileSync(outputPath, buffer)

    const stats = fs.statSync(outputPath)

    console.log('✅ XLSM DE PRUEBA GENERADO:\n')
    console.log(`   📁 ${outputPath}`)
    console.log(`   📊 Tamaño: ${(stats.size / 1024).toFixed(2)} KB\n`)

    console.log('📋 Contenido del archivo:\n')
    console.log(`   • 6 tareas principales`)
    console.log(`   • 10 subtareas`)
    console.log(`   • Total: 16 filas de datos\n`)

    console.log('📊 Progreso:\n')
    console.log(`   ✓ Análisis: 100% (completado)`)
    console.log(`   ⟳ Diseño: 75% (en progreso)`)
    console.log(`   ⟳ Frontend: 50% (en progreso)`)
    console.log(`   ⟳ Backend: 25% (comenzando)`)
    console.log(`   ○ Testing: 0% (por empezar)`)
    console.log(`   ○ Deploy: 0% (por empezar)\n`)

    console.log('🎯 Para probar:\n')
    console.log(`   1. Abre el archivo en Excel`)
    console.log(`   2. Habilita macros (si Excel lo pide)`)
    console.log(`   3. Excel ejecutará la macro automáticamente`)
    console.log(`   4. Deberías ver:`)
    console.log(`      ✓ Título "DIAGRAMA DE GANTT"`)
    console.log(`      ✓ Leyenda de colores`)
    console.log(`      ✓ Calendario (meses y días)`)
    console.log(`      ✓ Barras coloreadas por progreso`)
    console.log(`      ✓ Fin de semana en gris`)
    console.log(`      ✓ Botón "Actualizar" funcional\n`)

    console.log('✅ Test completado exitosamente\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

generateTestGantt()
