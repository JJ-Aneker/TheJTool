/**
 * POST /api/questionnaires/upload
 *
 * Endpoint asíncrono de subida de cuestionarios de seguridad IT en Excel.
 * Recibe multipart/form-data con el fichero Excel + metadatos, guarda el
 * registro inicial en Supabase con estado 'pendiente', y lanza el procesamiento
 * en background (no bloquea la respuesta HTTP).
 *
 * Autenticación: JWT de Supabase Auth (cuenta de servicio/aplicativo externo).
 *
 * @module api/questionnaires/upload
 */

import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import { parseWorkbook } from '../_lib/questionnaires/excelParser.js';
import { isXML, convertXMLToExcel } from '../_lib/questionnaires/xmlToExcel.js';

// Configuración de multer: en memoria, límite 20MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/xml', // .xml
      'text/xml' // .xml (alternativo)
    ];
    const allowedExtensions = ['.xlsx', '.xls', '.xml'];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));

    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten ficheros Excel (.xlsx) o XML (.xml)'));
    }
  }
});

/**
 * Middleware de autenticación: verifica JWT de Supabase Auth.
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
      console.error('[upload] Supabase config missing');
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
    console.error('[upload] Auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Handler principal: guarda el formulario inicial y lanza procesamiento en background.
 */
async function uploadHandler(req, res) {
  try {
    const { cliente, nombre_formulario, producto_afectado } = req.body;
    const file = req.file;

    // Validación de campos requeridos
    if (!cliente || !nombre_formulario) {
      return res.status(400).json({
        error: 'Faltan campos requeridos',
        required: ['cliente', 'nombre_formulario']
      });
    }

    if (!file) {
      return res.status(400).json({ error: 'No se recibió ningún fichero' });
    }

    const supabase = req.supabase;

    // 1. Guardar fichero en Supabase Storage (bucket 'questionnaires')
    const timestamp = Date.now();
    const filename = `${cliente.replace(/[^a-z0-9]/gi, '_')}_${timestamp}_${file.originalname}`;
    const storagePath = `uploads/${filename}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('questionnaires')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('[upload] Storage upload error:', uploadError);
      return res.status(500).json({ error: 'Error al guardar el fichero', details: uploadError.message });
    }

    // 2. Crear registro de formulario en estado 'pendiente'
    const { data: formulario, error: insertError } = await supabase
      .from('formularios')
      .insert({
        cliente,
        nombre_formulario,
        producto_afectado: producto_afectado || null,
        ruta_archivo_original: storagePath,
        estado: 'pendiente',
        fecha_recepcion: new Date().toISOString().split('T')[0] // YYYY-MM-DD
      })
      .select()
      .single();

    if (insertError) {
      console.error('[upload] DB insert error:', insertError);
      return res.status(500).json({ error: 'Error al crear el registro de formulario', details: insertError.message });
    }

    console.log(`[upload] Formulario ${formulario.id} creado: ${cliente} / ${nombre_formulario}`);

    // 3. Lanzar procesamiento en background (no esperar a que termine)
    processQuestionnaireBackground(formulario.id, file.buffer, supabase)
      .catch(err => {
        console.error(`[upload] Background processing failed for formulario ${formulario.id}:`, err);
      });

    // 4. Respuesta 202 Accepted inmediata
    res.status(202).json({
      message: 'Cuestionario recibido y en procesamiento',
      id: formulario.id,
      estado: 'pendiente',
      cliente,
      nombre_formulario
    });

  } catch (err) {
    console.error('[upload] Unexpected error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}

/**
 * Procesamiento en background: parsea el Excel, extrae preguntas e inserta en BD.
 * @param {number} formularioId
 * @param {Buffer} fileBuffer
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
async function processQuestionnaireBackground(formularioId, fileBuffer, supabase) {
  try {
    console.log(`[bg-processor] Iniciando procesamiento de formulario ${formularioId}`);

    // Actualizar estado a 'procesando'
    await supabase
      .from('formularios')
      .update({ estado: 'procesando' })
      .eq('id', formularioId);

    // Si es XML, convertir a Excel primero
    let bufferToProcess = fileBuffer;
    if (isXML(fileBuffer)) {
      console.log(`[bg-processor] Formulario ${formularioId}: Detectado XML, convirtiendo a Excel...`);
      bufferToProcess = await convertXMLToExcel(fileBuffer);
    }

    // Parsear Excel
    const questions = await parseWorkbook(bufferToProcess);

    console.log(`[bg-processor] Formulario ${formularioId}: ${questions.length} preguntas extraídas`);

    // Insertar preguntas en lotes (Supabase tiene límite de ~1000 filas por insert)
    const BATCH_SIZE = 500;
    let processedCount = 0;

    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE);

      const rows = batch.map(q => ({
        formulario_id: formularioId,
        hoja: q.sheet,
        seccion: q.section || null,
        question_id_origen: q.question_id || null,
        texto_pregunta: q.text,
        respuesta_existente: q.existing_answer || null,
        evidencia_nota: q.evidence_note || null,
        cell_ref: q.cell_ref,
        answer_cell_ref: q.answer_cell_ref,
        detection_method: q.detection_method,
        confidence: q.confidence
      }));

      const { error: insertError } = await supabase
        .from('formulario_preguntas_extraidas')
        .insert(rows);

      if (insertError) {
        throw new Error(`Error insertando lote: ${insertError.message}`);
      }

      processedCount += batch.length;

      // Actualizar progreso cada lote
      await supabase
        .from('formularios')
        .update({
          preguntas_procesadas: processedCount,
          total_preguntas: questions.length
        })
        .eq('id', formularioId);
    }

    // Actualizar estado a 'completado'
    await supabase
      .from('formularios')
      .update({
        estado: 'completado',
        preguntas_procesadas: questions.length,
        total_preguntas: questions.length
      })
      .eq('id', formularioId);

    console.log(`[bg-processor] Formulario ${formularioId} completado: ${questions.length} preguntas`);

  } catch (err) {
    console.error(`[bg-processor] Error procesando formulario ${formularioId}:`, err);

    // Actualizar estado a 'error'
    await supabase
      .from('formularios')
      .update({
        estado: 'error',
        mensaje_error: err.message
      })
      .eq('id', formularioId);
  }
}

/**
 * Middleware wrapper para multer + handler.
 * Express necesita que multer se ejecute antes del handler principal.
 */
export default function uploadRoute(req, res) {
  // Ejecutar multer, luego auth, luego handler
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'Fichero demasiado grande (máximo 20MB)' });
        }
        return res.status(400).json({ error: 'Error en la subida', details: err.message });
      }
      return res.status(400).json({ error: err.message });
    }

    // Continuar con autenticación y handler
    verifyAuth(req, res, () => uploadHandler(req, res));
  });
}
