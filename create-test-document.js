import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableCell, TableRow } from 'docx'
import fs from 'fs'
import path from 'path'

const doc = new Document({
  sections: [
    {
      children: [
        new Paragraph({
          text: 'BRIEFING DE PROYECTO',
          heading: HeadingLevel.HEADING_1,
          bold: true,
          spacing: { after: 200 }
        }),

        new Paragraph({
          text: 'Proyecto: Desarrollo Plataforma E-Commerce',
          bold: true,
          spacing: { after: 100 }
        }),

        new Paragraph({
          text: 'Descripción General:',
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 100 }
        }),

        new Paragraph({
          text: 'Desarrollo de una plataforma de comercio electrónico completa con carrito de compras, sistema de pagos y panel de administración.',
          spacing: { after: 200 }
        }),

        new Paragraph({
          text: 'Tareas Principales:',
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 100 }
        }),

        new Paragraph({
          text: '1. Análisis y Diseño de Arquitectura',
          bold: true,
          spacing: { after: 50 }
        }),
        new Paragraph({
          text: 'Duración: 3 días laborables',
          spacing: { after: 50 }
        }),
        new Paragraph({
          text: '   - Diseño de base de datos (1.5 días)',
          spacing: { after: 30 }
        }),
        new Paragraph({
          text: '   - Arquitectura REST API (1.5 días)',
          spacing: { after: 100 }
        }),

        new Paragraph({
          text: '2. Desarrollo Frontend',
          bold: true,
          spacing: { after: 50 }
        }),
        new Paragraph({
          text: 'Duración: 5 días laborables',
          spacing: { after: 50 }
        }),
        new Paragraph({
          text: '   - Setup React y componentes (1 día)',
          spacing: { after: 30 }
        }),
        new Paragraph({
          text: '   - Página de productos y carrito (2 días)',
          spacing: { after: 30 }
        }),
        new Paragraph({
          text: '   - Formulario de checkout (2 días)',
          spacing: { after: 100 }
        }),

        new Paragraph({
          text: '3. Desarrollo Backend',
          bold: true,
          spacing: { after: 50 }
        }),
        new Paragraph({
          text: 'Duración: 6 días laborables',
          spacing: { after: 50 }
        }),
        new Paragraph({
          text: '   - API de productos (1.5 días)',
          spacing: { after: 30 }
        }),
        new Paragraph({
          text: '   - Sistema de carrito (1.5 días)',
          spacing: { after: 30 }
        }),
        new Paragraph({
          text: '   - Integración de pagos Stripe (2 días)',
          spacing: { after: 30 }
        }),
        new Paragraph({
          text: '   - Autenticación y usuarios (1 día)',
          spacing: { after: 100 }
        }),

        new Paragraph({
          text: '4. Testing y QA',
          bold: true,
          spacing: { after: 50 }
        }),
        new Paragraph({
          text: 'Duración: 3 días laborables',
          spacing: { after: 50 }
        }),
        new Paragraph({
          text: '   - Testing unitario (1 día)',
          spacing: { after: 30 }
        }),
        new Paragraph({
          text: '   - Testing integración (1 día)',
          spacing: { after: 30 }
        }),
        new Paragraph({
          text: '   - Testing de carga y bugs finales (1 día)',
          spacing: { after: 100 }
        }),

        new Paragraph({
          text: '5. Deployment y Documentación',
          bold: true,
          spacing: { after: 50 }
        }),
        new Paragraph({
          text: 'Duración: 2 días laborables',
          spacing: { after: 50 }
        }),
        new Paragraph({
          text: '   - Configuración de servidor (1 día)',
          spacing: { after: 30 }
        }),
        new Paragraph({
          text: '   - Documentación API y manual usuario (1 día)',
          spacing: { after: 200 }
        }),

        new Paragraph({
          text: 'Equipo:',
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: '- Arquitecto (Full Stack): 5 días',
          spacing: { after: 30 }
        }),
        new Paragraph({
          text: '- Developer Frontend: 5 días',
          spacing: { after: 30 }
        }),
        new Paragraph({
          text: '- Developer Backend: 6 días',
          spacing: { after: 30 }
        }),
        new Paragraph({
          text: '- QA Engineer: 3 días',
          spacing: { after: 30 }
        }),
        new Paragraph({
          text: '- DevOps: 2 días',
          spacing: { after: 200 }
        }),

        new Paragraph({
          text: 'Presupuesto Estimado:',
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: 'Presupuesto total: 45.000 EUR',
          spacing: { after: 30 }
        }),
        new Paragraph({
          text: 'Contingencia (15%): 6.750 EUR',
          spacing: { after: 100 }
        }),

        new Paragraph({
          text: 'Hitos y Entregas:',
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: '- Semana 1: Diseño y arquitectura completados',
          spacing: { after: 30 }
        }),
        new Paragraph({
          text: '- Semana 2-3: Frontend y Backend en desarrollo',
          spacing: { after: 30 }
        }),
        new Paragraph({
          text: '- Semana 4: Testing y fixes',
          spacing: { after: 30 }
        }),
        new Paragraph({
          text: '- Semana 5: Deployment en producción',
          spacing: { after: 100 }
        })
      ]
    }
  ]
})

Packer.toBuffer(doc).then(buffer => {
  const outputPath = path.join(process.cwd(), 'docs', 'Briefing_Ecommerce_Test.docx')
  fs.writeFileSync(outputPath, buffer)
  console.log(`✓ Documento de prueba creado: ${outputPath}`)
  console.log('Puedes subir este archivo a la aplicación para hacer test del Gantt')
})
