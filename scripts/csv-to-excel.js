/**
 * Script temporal para convertir CSV a Excel para testing.
 * Uso: node scripts/csv-to-excel.js <input.csv> <output.xlsx>
 */

import ExcelJS from 'exceljs';
import { readFile } from 'fs/promises';

async function csvToExcel(csvPath, xlsxPath) {
  const csvContent = await readFile(csvPath, 'utf-8');
  const lines = csvContent.trim().split('\n');

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Questions');

  lines.forEach((line, rowIndex) => {
    const cells = line.split(',');
    cells.forEach((cell, colIndex) => {
      worksheet.getCell(rowIndex + 1, colIndex + 1).value = cell;
    });
  });

  // Formatear la primera fila como cabecera
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E1F2' }
  };

  // Autoajustar columnas
  worksheet.columns.forEach(column => {
    column.width = 50;
  });

  await workbook.xlsx.writeFile(xlsxPath);
  console.log(`✅ Excel generado: ${xlsxPath}`);
}

const [,, csvPath, xlsxPath] = process.argv;

if (!csvPath || !xlsxPath) {
  console.error('Uso: node scripts/csv-to-excel.js <input.csv> <output.xlsx>');
  process.exit(1);
}

csvToExcel(csvPath, xlsxPath).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
