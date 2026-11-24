/**
 * Conversor de XML a Excel para cuestionarios.
 * Detecta estructura XML de cuestionarios y la convierte a formato Excel
 * para que pueda ser procesada por excelParser.js
 */

import ExcelJS from 'exceljs';
import { parseStringPromise } from 'xml2js';

/**
 * Detecta el formato del XML y extrae las preguntas.
 * Soporta formatos comunes de cuestionarios XML.
 */
async function parseQuestionsFromXML(xmlBuffer) {
  const xmlString = xmlBuffer.toString('utf-8');
  const xmlObj = await parseStringPromise(xmlString);

  // Intentar detectar estructura común
  const questions = [];

  // Formato 1: <questionnaire><question>...</question></questionnaire>
  if (xmlObj.questionnaire?.question) {
    const items = Array.isArray(xmlObj.questionnaire.question)
      ? xmlObj.questionnaire.question
      : [xmlObj.questionnaire.question];

    for (const item of items) {
      questions.push({
        id: item.$.id || item.$.ref || '',
        section: item.section?.[0] || item.category?.[0] || '',
        text: item.text?.[0] || item._  || item.$.text || '',
        answer: item.answer?.[0] || '',
        evidence: item.evidence?.[0] || item.notes?.[0] || ''
      });
    }
  }
  // Formato 2: <questions><item>...</item></questions>
  else if (xmlObj.questions?.item) {
    const items = Array.isArray(xmlObj.questions.item)
      ? xmlObj.questions.item
      : [xmlObj.questions.item];

    for (const item of items) {
      questions.push({
        id: item.$.id || item.$.ref || '',
        section: item.section?.[0] || item.category?.[0] || '',
        text: item.question?.[0] || item.text?.[0] || item._ || '',
        answer: item.answer?.[0] || item.response?.[0] || '',
        evidence: item.evidence?.[0] || item.notes?.[0] || ''
      });
    }
  }
  // Formato 3: Estructura genérica - buscar elementos con texto
  else {
    // Recursivamente buscar nodos que parezcan preguntas
    const findQuestions = (obj, parentKey = '') => {
      if (!obj || typeof obj !== 'object') return;

      for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
          value.forEach((item, idx) => {
            if (typeof item === 'object') {
              // Si tiene texto y parece una pregunta
              const text = item.text?.[0] || item.question?.[0] || item._ || '';
              if (text && text.length > 20 && text.includes('?')) {
                questions.push({
                  id: item.$.id || item.$.ref || `${parentKey}_${idx}`,
                  section: item.section?.[0] || item.category?.[0] || parentKey,
                  text,
                  answer: item.answer?.[0] || item.response?.[0] || '',
                  evidence: item.evidence?.[0] || item.notes?.[0] || ''
                });
              } else {
                findQuestions(item, key);
              }
            }
          });
        } else if (typeof value === 'object') {
          findQuestions(value, key);
        }
      }
    };

    findQuestions(xmlObj);
  }

  return questions;
}

/**
 * Convierte buffer XML a buffer Excel.
 */
export async function convertXMLToExcel(xmlBuffer) {
  try {
    // Parsear XML y extraer preguntas
    const questions = await parseQuestionsFromXML(xmlBuffer);

    if (questions.length === 0) {
      throw new Error('No se encontraron preguntas en el XML');
    }

    // Crear nuevo workbook Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Questions');

    // Cabeceras
    const headers = ['ID', 'Pregunta', 'Respuesta', 'Evidencia', 'Categoría'];
    const headerRow = worksheet.addRow(headers);

    // Formatear cabecera
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };

    // Añadir preguntas
    for (const q of questions) {
      worksheet.addRow([
        q.id,
        q.text,
        q.answer,
        q.evidence,
        q.section
      ]);
    }

    // Ajustar anchos de columna
    worksheet.columns = [
      { width: 15 },  // ID
      { width: 80 },  // Pregunta
      { width: 50 },  // Respuesta
      { width: 30 },  // Evidencia
      { width: 30 }   // Categoría
    ];

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();

    console.log(`[xmlToExcel] Convertido XML a Excel: ${questions.length} preguntas`);

    return buffer;

  } catch (err) {
    console.error('[xmlToExcel] Error:', err);
    throw new Error(`Error convirtiendo XML a Excel: ${err.message}`);
  }
}

/**
 * Detecta si un buffer es XML.
 */
export function isXML(buffer) {
  const header = buffer.slice(0, 200).toString('utf-8').trim();
  return header.startsWith('<?xml') || header.startsWith('<');
}
