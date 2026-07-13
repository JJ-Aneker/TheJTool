/**
 * Parser de cuestionarios de seguridad IT en Excel.
 *
 * Objetivo: leer un .xlsx (formato desconocido de antemano, cada cliente lo
 * estructura distinto) y devolver una lista normalizada de preguntas, cada
 * una con: hoja, categoría/sección, texto de la pregunta, respuesta existente
 * (si la hay), fila/columna de origen (para poder rellenar después) y el
 * método de detección usado (para poder revisar los casos "heurísticos" con
 * más cuidado).
 *
 * Estrategia en dos fases:
 *   1. Intentar detectar una fila de cabeceras real (Pregunta/Respuesta/...)
 *      en las primeras N filas de cada hoja. Si se encuentra, se usa mapeo
 *      de columnas por cabecera.
 *   2. Si no hay cabeceras claras, modo heurístico: se buscan celdas que
 *      parezcan preguntas (terminan en "?", o contienen palabras clave tipo
 *      "indicar", "describir") y se intenta capturar la celda de respuesta
 *      como la celda vacía más cercana a la derecha o debajo.
 *
 * Las celdas combinadas de una sola columna ancha (p.ej. "1. AUTENTICACIÓN")
 * se tratan como cabeceras de sección y se propagan a las preguntas
 * siguientes hasta la próxima sección.
 *
 * @module excelParser
 * @version 1.0.0 - Portado desde excel_parser.py (Python/openpyxl)
 */

import ExcelJS from 'exceljs';

// Palabras clave para detectar columnas por cabecera (case-insensitive).
// Nota: se evitan palabras demasiado genéricas (p.ej. "control" a secas)
// porque colisionan con títulos de sección tipo "Access Control".
const HEADER_KEYWORDS = {
  question: ['pregunta', 'question', 'requisito', 'requirement', 'item'],
  answer: ['respuesta', 'answer', 'response'],
  evidence: ['evidencia', 'evidence', 'comentario', 'comment', 'notes', 'nota', 'observaciones'],
  category: ['categoría', 'categoria', 'category', 'sección', 'seccion', 'section'],
  id: ['id', 'ref.', 'referencia', 'reference', 'no.', 'n°']
};

const MIN_ROLES_FOR_HEADER = 2;  // una fila necesita al menos 2 roles distintos para contar como cabecera

// Señales de que una celda es una pregunta en modo heurístico
const QUESTION_MARKERS = ['?', 'indicar', 'describir', 'especificar', 'detallar', 'explicar'];

const MAX_HEADER_SEARCH_ROWS = 10;
const MIN_AVG_LEN_FOR_INFERRED_QUESTION = 25;
const INFERENCE_SAMPLE_ROWS = 15;
const MIN_QUESTION_TEXT_LENGTH = 5;  // descarta ruido tipo "?" suelto

// Hojas conocidas como tablas de referencia/mapeo interno (no son
// preguntas a responder por el proveedor). Confirmado con plantilla ING
// "Third Party IT Security Compliance". Ajustar por cliente/plantilla si
// hace falta pasando excludedSheets a parseWorkbook().
const DEFAULT_EXCLUDED_SHEETS = new Set([
  'mapper',
  'mapperold',
  'itss v3 mapper',
  'rating',
  'process catalogue',
  'itss'
]);

/**
 * @typedef {Object} Question
 * @property {string} sheet - Nombre de la hoja de Excel
 * @property {string} section - Sección/categoría (de celda combinada o columna explícita)
 * @property {string} question_id - ID de referencia del propio Excel (si existe)
 * @property {string} text - Texto de la pregunta
 * @property {string} existing_answer - Respuesta existente (si la hay en el Excel)
 * @property {string} evidence_note - Nota/evidencia (si existe en el Excel)
 * @property {string} cell_ref - Referencia de celda de la pregunta (p.ej. "C5")
 * @property {string} answer_cell_ref - Referencia de celda donde va la respuesta
 * @property {string} detection_method - "header" o "heuristic"
 * @property {string} confidence - "alta" o "baja"
 */

/**
 * Normaliza texto de celda para comparar cabeceras.
 * @param {*} text - Valor de la celda
 * @returns {string} - Texto normalizado (lowercase, sin espacios extra)
 */
function norm(text) {
  if (text == null) return '';
  return String(text).trim().toLowerCase();
}

/**
 * Convierte un valor de celda de ExcelJS a texto plano.
 * ExcelJS puede devolver objetos RichText cuando hay formato enriquecido.
 * @param {*} value - Valor de la celda
 * @returns {string} - Texto plano
 */
function cellValueToText(value) {
  if (value == null) {
    return '';
  }

  // Si es un objeto RichText (tiene propiedad richText)
  if (typeof value === 'object' && value.richText) {
    return value.richText.map(part => part.text || '').join('');
  }

  // Si es un objeto de fórmula (tiene propiedad result)
  if (typeof value === 'object' && 'result' in value) {
    return cellValueToText(value.result);
  }

  // Si es un string o número, devolverlo tal cual
  return String(value);
}

/**
 * Devuelve el valor de una celda, resolviendo celdas combinadas.
 * En ExcelJS, las celdas combinadas tienen master cell; el resto son undefined.
 * @param {ExcelJS.Worksheet} sheet
 * @param {number} row - Fila (1-indexed)
 * @param {number} col - Columna (1-indexed)
 * @param {Map} mergedLookup - Mapa {address: masterAddress}
 * @returns {string} - Valor de la celda como texto plano
 */
function cellValue(sheet, row, col, mergedLookup) {
  const address = sheet.getCell(row, col).address;
  const masterAddress = mergedLookup.get(address) || address;
  const rawValue = sheet.getCell(masterAddress).value;
  return cellValueToText(rawValue);
}

/**
 * Construye un mapa {cellAddress: masterCellAddress} para celdas combinadas.
 * @param {ExcelJS.Worksheet} sheet
 * @returns {Map<string, string>}
 */
function buildMergedLookup(sheet) {
  const lookup = new Map();

  // ExcelJS expone merged cells como objetos { model: { top, left, bottom, right } }
  // o directamente como strings "A1:C3"
  const merges = sheet._merges || {};

  for (const mergeRange in merges) {
    const merge = merges[mergeRange];
    const topLeft = sheet.getCell(merge.top, merge.left).address;

    for (let r = merge.top; r <= merge.bottom; r++) {
      for (let c = merge.left; c <= merge.right; c++) {
        const addr = sheet.getCell(r, c).address;
        lookup.set(addr, topLeft);
      }
    }
  }

  return lookup;
}

/**
 * Identifica filas que son títulos de sección: rangos combinados de una
 * sola fila que abarcan 2+ columnas (p.ej. "1. AUTENTICACIÓN" en A1:D1).
 * @param {ExcelJS.Worksheet} sheet
 * @returns {Map<number, string>} - {fila: texto_seccion}
 */
function findSectionRows(sheet) {
  const sectionRows = new Map();
  const merges = sheet._merges || {};

  for (const mergeRange in merges) {
    const merge = merges[mergeRange];
    const spansOneRow = merge.top === merge.bottom;
    const spansMultipleCols = merge.right > merge.left;

    if (spansOneRow && spansMultipleCols) {
      const cell = sheet.getCell(merge.top, merge.left);
      if (cell.value) {
        sectionRows.set(merge.top, String(cell.value).trim());
      }
    }
  }

  return sectionRows;
}

/**
 * Infiere columna de pregunta por longitud media de texto cuando no hay
 * cabecera "question" explícita pero sí hay otras cabeceras reconocidas.
 * @param {ExcelJS.Worksheet} sheet
 * @param {number} headerRow
 * @param {Object} colMap - {role: colIndex}
 * @param {Map} mergedLookup
 * @returns {number|null} - Índice de columna (1-indexed) o null
 */
function inferQuestionColumn(sheet, headerRow, colMap, mergedLookup) {
  const usedCols = new Set(Object.values(colMap));
  const maxCol = sheet.columnCount;
  const sampleEnd = Math.min(headerRow + INFERENCE_SAMPLE_ROWS, sheet.rowCount);

  let bestCol = null;
  let bestAvg = 0;

  for (let colIdx = 1; colIdx <= maxCol; colIdx++) {
    if (usedCols.has(colIdx)) continue;

    const lengths = [];
    for (let rowIdx = headerRow + 1; rowIdx <= sampleEnd; rowIdx++) {
      const val = cellValue(sheet, rowIdx, colIdx, mergedLookup);
      if (val != null) {
        lengths.push(String(val).length);
      }
    }

    if (lengths.length > 0) {
      const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestCol = colIdx;
      }
    }
  }

  if (bestCol && bestAvg >= MIN_AVG_LEN_FOR_INFERRED_QUESTION) {
    return bestCol;
  }
  return null;
}

/**
 * Busca en las primeras filas una que contenga cabeceras reconocibles.
 * Exige al menos MIN_ROLES_FOR_HEADER roles distintos.
 * @param {ExcelJS.Worksheet} sheet
 * @param {Map} mergedLookup
 * @param {Map<number, string>} sectionRows
 * @returns {{headerRow: number|null, colMap: Object, headerTexts: Object}}
 */
function detectHeaderRow(sheet, mergedLookup, sectionRows) {
  const maxRow = Math.min(MAX_HEADER_SEARCH_ROWS, sheet.rowCount);
  const maxCol = sheet.columnCount;

  for (let rowIdx = 1; rowIdx <= maxRow; rowIdx++) {
    if (sectionRows.has(rowIdx)) continue;

    const colMap = {};

    for (let colIdx = 1; colIdx <= maxCol; colIdx++) {
      const val = norm(cellValue(sheet, rowIdx, colIdx, mergedLookup));
      if (!val) continue;

      for (const [role, keywords] of Object.entries(HEADER_KEYWORDS)) {
        if (role in colMap) continue;

        if (keywords.some(kw => {
          const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          return regex.test(val);
        })) {
          colMap[role] = colIdx;
        }
      }
    }

    // Caso normal: cabecera con "question" etiquetado explícitamente
    if ('question' in colMap && Object.keys(colMap).length >= MIN_ROLES_FOR_HEADER) {
      const headerTexts = {};
      for (const [role, col] of Object.entries(colMap)) {
        headerTexts[role] = norm(cellValue(sheet, rowIdx, col, mergedLookup));
      }
      return { headerRow: rowIdx, colMap, headerTexts };
    }

    // Caso "Cyber Security": hay cabecera real pero ninguna columna se etiquetó como pregunta
    if (Object.keys(colMap).length > 0 && !('question' in colMap)) {
      const inferredCol = inferQuestionColumn(sheet, rowIdx, colMap, mergedLookup);
      if (inferredCol) {
        colMap.question = inferredCol;
        const headerTexts = {};
        for (const [role, col] of Object.entries(colMap)) {
          headerTexts[role] = norm(cellValue(sheet, rowIdx, col, mergedLookup));
        }
        return { headerRow: rowIdx, colMap, headerTexts };
      }
    }
  }

  return { headerRow: null, colMap: {}, headerTexts: {} };
}

/**
 * Extrae preguntas cuando se detectó una fila de cabeceras clara.
 * @param {ExcelJS.Worksheet} sheet
 * @param {string} sheetName
 * @param {number} headerRow
 * @param {Object} colMap
 * @param {Map} mergedLookup
 * @param {Map<number, string>} sectionRows
 * @param {Object} headerTexts
 * @returns {Question[]}
 */
function extractWithHeaders(sheet, sheetName, headerRow, colMap, mergedLookup, sectionRows, headerTexts) {
  const questions = [];
  const qCol = colMap.question;

  // Si había un título de sección ANTES de la fila de cabecera, lo heredamos
  let currentSection = '';
  for (const [rowIdx, sectionText] of sectionRows) {
    if (rowIdx < headerRow) {
      currentSection = sectionText;
    } else {
      break;
    }
  }

  for (let rowIdx = headerRow + 1; rowIdx <= sheet.rowCount; rowIdx++) {
    if (sectionRows.has(rowIdx)) {
      currentSection = sectionRows.get(rowIdx);
      continue;
    }

    let questionText = cellValue(sheet, rowIdx, qCol, mergedLookup);
    if (questionText == null || String(questionText).trim() === '') {
      continue;
    }

    // Cabecera repetida dentro de la misma hoja: si el texto coincide con la cabecera original, se salta
    if (norm(questionText) === headerTexts.question) {
      continue;
    }

    questionText = String(questionText).trim();
    if (questionText.length < MIN_QUESTION_TEXT_LENGTH) {
      continue;
    }

    const answer = colMap.answer
      ? cellValue(sheet, rowIdx, colMap.answer, mergedLookup)
      : null;

    const evidence = colMap.evidence
      ? cellValue(sheet, rowIdx, colMap.evidence, mergedLookup)
      : null;

    const qid = colMap.id
      ? cellValue(sheet, rowIdx, colMap.id, mergedLookup)
      : null;

    // Si hay columna de categoría explícita, tiene prioridad sobre la sección heredada
    let section = currentSection;
    if (colMap.category) {
      const catVal = cellValue(sheet, rowIdx, colMap.category, mergedLookup);
      if (catVal != null && String(catVal).trim() !== '') {
        section = String(catVal).trim();
      }
    }

    const answerCol = colMap.answer || qCol + 1;

    questions.push({
      sheet: sheetName,
      section,
      question_id: qid != null ? String(qid) : '',
      text: questionText,
      existing_answer: answer != null && String(answer).trim() !== '' ? String(answer).trim() : '',
      evidence_note: evidence != null && String(evidence).trim() !== '' ? String(evidence).trim() : '',
      cell_ref: sheet.getCell(rowIdx, qCol).address,
      answer_cell_ref: sheet.getCell(rowIdx, answerCol).address,
      detection_method: 'header',
      confidence: 'alta'
    });
  }

  return questions;
}

/**
 * Modo heurístico: sin cabeceras claras. Busca celdas que parezcan
 * preguntas y asume que la respuesta va en la celda vacía inmediatamente
 * a la derecha, o si no, en la celda vacía inmediatamente debajo.
 * @param {ExcelJS.Worksheet} sheet
 * @param {string} sheetName
 * @param {Map} mergedLookup
 * @param {Map<number, string>} sectionRows
 * @returns {Question[]}
 */
function extractHeuristic(sheet, sheetName, mergedLookup, sectionRows) {
  const questions = [];
  let currentSection = '';

  for (let rowIdx = 1; rowIdx <= sheet.rowCount; rowIdx++) {
    if (sectionRows.has(rowIdx)) {
      currentSection = sectionRows.get(rowIdx);
      continue;
    }

    for (let colIdx = 1; colIdx <= sheet.columnCount; colIdx++) {
      const val = cellValue(sheet, rowIdx, colIdx, mergedLookup);
      if (val == null) continue;

      const text = String(val).trim();
      if (!text) continue;

      const isQuestion = QUESTION_MARKERS.some(marker => text.toLowerCase().includes(marker));
      if (!isQuestion) {
        // ¿Es un título de sección? (heurística de mayúsculas/longitud corta)
        if (text === text.toUpperCase() && text.length < 80) {
          currentSection = text;
        }
        continue;
      }

      if (text.length < MIN_QUESTION_TEXT_LENGTH) {
        continue;
      }

      // Buscar celda de respuesta: primero a la derecha, luego debajo
      let answerCell = sheet.getCell(rowIdx, colIdx + 1);
      let answerRef = answerCell.address;

      if (answerCell.value != null && String(answerCell.value).trim() !== '') {
        // la celda a la derecha ya tiene contenido -> probar debajo
        const belowCell = sheet.getCell(rowIdx + 1, colIdx);
        if (belowCell.value == null || String(belowCell.value).trim() === '') {
          answerRef = belowCell.address;
        }
      }

      questions.push({
        sheet: sheetName,
        section: currentSection,
        question_id: '',
        text,
        existing_answer: '',
        evidence_note: '',
        cell_ref: sheet.getCell(rowIdx, colIdx).address,
        answer_cell_ref: answerRef,
        detection_method: 'heuristic',
        confidence: 'baja'
      });
    }
  }

  return questions;
}

/**
 * Punto de entrada principal. Parsea un workbook de Excel y devuelve
 * todas las preguntas extraídas de todas las hojas.
 * @param {Buffer|string} source - Buffer del fichero o ruta al fichero
 * @param {Set<string>|null} excludedSheets - Nombres de hoja a ignorar (case-insensitive)
 * @returns {Promise<Question[]>}
 */
export async function parseWorkbook(source, excludedSheets = null) {
  const excluded = new Set(
    Array.from(excludedSheets || DEFAULT_EXCLUDED_SHEETS).map(s => s.toLowerCase())
  );

  const workbook = new ExcelJS.Workbook();

  if (Buffer.isBuffer(source)) {
    await workbook.xlsx.load(source);
  } else {
    await workbook.xlsx.readFile(source);
  }

  const allQuestions = [];

  for (const sheet of workbook.worksheets) {
    const sheetName = sheet.name;
    if (excluded.has(sheetName.trim().toLowerCase())) {
      continue;
    }

    const mergedLookup = buildMergedLookup(sheet);
    const sectionRows = findSectionRows(sheet);

    const { headerRow, colMap, headerTexts } = detectHeaderRow(sheet, mergedLookup, sectionRows);

    let qs;
    if (headerRow !== null) {
      qs = extractWithHeaders(sheet, sheetName, headerRow, colMap, mergedLookup, sectionRows, headerTexts);
    } else {
      qs = extractHeuristic(sheet, sheetName, mergedLookup, sectionRows);
    }

    allQuestions.push(...qs);
  }

  return allQuestions;
}
