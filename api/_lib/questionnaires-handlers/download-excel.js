/**
 * GET /api/questionnaires/:id/download-excel
 *
 * Descarga el fichero Excel original con las respuestas completadas.
 * Lee el Excel original de Supabase Storage, rellena las celdas de respuesta
 * con los datos generados/existentes, y devuelve el fichero modificado.
 *
 * @module api/questionnaires/download-excel
 */

import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';

/**
 * Middleware de autenticación.
 */
async function verifyAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[download-excel] Supabase config missing');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    req.supabase = supabase;
    next();
  } catch (err) {
    console.error('[download-excel] Auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Convierte referencia de celda (A1, B2) a {row, col}.
 */
function cellRefToCoords(cellRef) {
  const match = cellRef.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;

  const col = match[1].split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0);
  const row = parseInt(match[2], 10);

  return { row, col };
}

/**
 * Handler principal: descarga Excel completado.
 */
async function downloadExcelHandler(req, res) {
  try {
    const { id } = req.params;
    const supabase = req.supabase;

    console.log(`[download-excel] Iniciando descarga para formulario ${id}`);

    // 1. Obtener formulario
    const { data: formulario, error: formularioError } = await supabase
      .from('formularios')
      .select('*')
      .eq('id', id)
      .single();

    if (formularioError || !formulario) {
      return res.status(404).json({ error: 'Formulario no encontrado' });
    }

    if (!formulario.ruta_archivo_original) {
      return res.status(400).json({ error: 'No hay fichero original asociado' });
    }

    // 2. Descargar fichero original desde Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('questionnaires')
      .download(formulario.ruta_archivo_original);

    if (downloadError) {
      console.error('[download-excel] Error descargando fichero:', downloadError);
      return res.status(500).json({ error: 'Error al descargar el fichero original' });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[download-excel] Fichero original descargado: ${buffer.length} bytes`);

    // 3. Obtener preguntas con respuestas
    const { data: preguntas, error: preguntasError } = await supabase
      .from('formulario_preguntas_extraidas')
      .select('*')
      .eq('formulario_id', id)
      .order('id', { ascending: true });

    if (preguntasError) {
      return res.status(500).json({ error: 'Error al obtener las preguntas' });
    }

    console.log(`[download-excel] ${preguntas.length} preguntas a completar`);

    // 4. Cargar Excel con ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    // 5. Completar celdas de respuesta
    let completedCount = 0;

    for (const pregunta of preguntas) {
      if (!pregunta.respuesta_existente || pregunta.respuesta_existente.trim() === '') {
        continue; // No hay respuesta que escribir
      }

      if (!pregunta.answer_cell_ref) {
        console.warn(`[download-excel] Pregunta ${pregunta.id} sin answer_cell_ref`);
        continue;
      }

      // Buscar la hoja
      const sheet = workbook.getWorksheet(pregunta.hoja);
      if (!sheet) {
        console.warn(`[download-excel] Hoja "${pregunta.hoja}" no encontrada`);
        continue;
      }

      // Obtener coordenadas de la celda
      const coords = cellRefToCoords(pregunta.answer_cell_ref);
      if (!coords) {
        console.warn(`[download-excel] Ref inválida: ${pregunta.answer_cell_ref}`);
        continue;
      }

      // Escribir respuesta en la celda
      const cell = sheet.getCell(coords.row, coords.col);
      cell.value = pregunta.respuesta_existente;

      // Aplicar estilo para destacar respuestas generadas
      cell.font = { color: { argb: 'FF0066CC' }, bold: false };
      cell.alignment = { wrapText: true, vertical: 'top' };

      completedCount++;
    }

    console.log(`[download-excel] ${completedCount} celdas completadas`);

    // 6. Generar buffer del Excel modificado
    const outputBuffer = await workbook.xlsx.writeBuffer();

    // 7. Enviar fichero como descarga
    const filename = `${formulario.cliente}_${formulario.nombre_formulario}_COMPLETADO.xlsx`
      .replace(/[^a-z0-9_\-\.]/gi, '_')
      .replace(/__+/g, '_');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', outputBuffer.length);

    console.log(`[download-excel] Enviando fichero: ${filename} (${outputBuffer.length} bytes)`);

    res.send(outputBuffer);

  } catch (err) {
    console.error('[download-excel] Error:', err);
    res.status(500).json({ error: 'Error al generar el Excel', message: err.message });
  }
}

/**
 * Export del handler con autenticación.
 */
export default function downloadExcelRoute(req, res) {
  verifyAuth(req, res, () => downloadExcelHandler(req, res));
}
