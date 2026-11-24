import ExcelJS from 'exceljs'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function createGanttTemplate() {
  const templatePath = path.join(__dirname, 'public/templates/gantt-template.xlsx')

  // Crear workbook
  const workbook = new ExcelJS.Workbook()
  const ws = workbook.addWorksheet('Gantt')

  // Establecer altura de filas
  ws.getRow(1).height = 25
  ws.getRow(2).height = 20
  ws.getRow(3).height = 20
  ws.getRow(4).height = 18

  // ═══ FILA 1-3: RESERVADAS PARA VBA (vacías, serán generadas por macro) ═══
  // No escribir nada aquí

  // ═══ FILA 4: ENCABEZADOS ═══
  const headers = ['Nº', 'Tarea', 'Responsable', 'F. Inicio', 'F. Fin', 'Días', '%']
  const headerRow = ws.getRow(4)

  headers.forEach((header, idx) => {
    const cell = headerRow.getCell(idx + 1)
    cell.value = header
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2C3E50' } // Gris oscuro
    }
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' }, // Blanco
      size: 10
    }
    cell.alignment = {
      horizontal: 'center',
      vertical: 'center',
      wrapText: true
    }
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF000000' } }
    }
  })

  // ═══ FILA 5+: FILAS VACÍAS PARA DATOS (no escribir nada, ExcelJS lo hará) ═══
  // Solo reservar 50 filas vacías
  for (let i = 5; i <= 54; i++) {
    const row = ws.getRow(i)
    row.height = 16

    // Establecer formato para todas las columnas de datos
    for (let col = 1; col <= 7; col++) {
      const cell = row.getCell(col)
      cell.border = {
        top: { style: 'hair', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'hair', color: { argb: 'FFCCCCCC' } },
        left: { style: 'hair', color: { argb: 'FFCCCCCC' } },
        right: { style: 'hair', color: { argb: 'FFCCCCCC' } }
      }
      cell.alignment = {
        horizontal: 'center',
        vertical: 'center'
      }
    }

    // Columnas para el calendario (H en adelante) — también vacías
    for (let col = 8; col <= 100; col++) {
      const cell = row.getCell(col)
      cell.border = {
        top: { style: 'hair', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'hair', color: { argb: 'FFCCCCCC' } },
        left: { style: 'hair', color: { argb: 'FFCCCCCC' } },
        right: { style: 'hair', color: { argb: 'FFCCCCCC' } }
      }
      cell.alignment = {
        horizontal: 'center',
        vertical: 'center'
      }
    }
  }

  // Establecer anchos de columna
  ws.columns = [
    { width: 5 },   // A: Nº
    { width: 30 },  // B: Tarea
    { width: 20 },  // C: Responsable
    { width: 14 },  // D: F. Inicio
    { width: 14 },  // E: F. Fin
    { width: 10 },  // F: Días
    { width: 10 },  // G: %
    // H en adelante: ancho 5 para el calendario (generado por VBA)
  ]

  for (let i = 8; i <= 100; i++) {
    ws.getColumn(i).width = 5
  }

  // Freeze panes en fila 5, columna H
  ws.views = [{ state: 'frozen', xSplit: 7, ySplit: 4 }]

  // Guardar como .xlsx (luego el usuario lo convertirá a .xlsm con VBA)
  await workbook.xlsx.writeFile(templatePath)

  console.log(`✅ Plantilla creada: ${templatePath}`)
  console.log(`📝 Instrucciones:`)
  console.log(`   1. Abre la plantilla en Excel`)
  console.log(`   2. En el módulo VBA, pega el código de CODIGO_VBA_COMPLETO.vba`)
  console.log(`   3. Guarda como Macro-Enabled Workbook (.xlsm)`)
  console.log(`   4. Coloca el .xlsm en public/templates/`)
}

createGanttTemplate().catch(console.error)
