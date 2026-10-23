/**
 * GET /api/questionnaires/:id/status
 *
 * Endpoint de consulta de estado de procesamiento de un cuestionario.
 * Devuelve estado actual (pendiente | procesando | completado | error),
 * progreso si es posible (preguntas procesadas / total), y si está completado,
 * el resultado (lista de preguntas extraídas).
 *
 * Autenticación: JWT de Supabase Auth.
 *
 * @module api/questionnaires/status
 */

import { createClient } from '@supabase/supabase-js';

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
      console.error('[status] Supabase config missing');
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
    console.error('[status] Auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Handler principal: consulta estado del formulario y devuelve resultado si está completado.
 */
async function statusHandler(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'ID de formulario inválido' });
    }

    const supabase = req.supabase;

    // 1. Obtener registro de formulario
    const { data: formulario, error: formularioError } = await supabase
      .from('formularios')
      .select('*')
      .eq('id', id)
      .single();

    if (formularioError || !formulario) {
      console.error('[status] Formulario not found:', formularioError);
      return res.status(404).json({ error: 'Formulario no encontrado' });
    }

    // 2. Construir respuesta base
    const response = {
      id: formulario.id,
      cliente: formulario.cliente,
      nombre_formulario: formulario.nombre_formulario,
      producto_afectado: formulario.producto_afectado,
      estado: formulario.estado,
      fecha_recepcion: formulario.fecha_recepcion,
      fecha_envio_respuesta: formulario.fecha_envio_respuesta,
      notas: formulario.notas,
      creado_en: formulario.creado_en,
      actualizado_en: formulario.actualizado_en
    };

    // 3. Añadir progreso si está procesando
    if (formulario.estado === 'procesando' && formulario.total_preguntas) {
      response.progreso = {
        procesadas: formulario.preguntas_procesadas || 0,
        total: formulario.total_preguntas,
        porcentaje: Math.round(
          ((formulario.preguntas_procesadas || 0) / formulario.total_preguntas) * 100
        )
      };
    }

    // 4. Añadir mensaje de error si estado es 'error'
    if (formulario.estado === 'error') {
      response.mensaje_error = formulario.mensaje_error;
    }

    // 5. Si está completado, obtener las preguntas extraídas
    if (formulario.estado === 'completado') {
      const { data: preguntas, error: preguntasError } = await supabase
        .from('formulario_preguntas_extraidas')
        .select('*')
        .eq('formulario_id', id)
        .order('id', { ascending: true });

      if (preguntasError) {
        console.error('[status] Error fetching questions:', preguntasError);
        return res.status(500).json({ error: 'Error al obtener las preguntas', details: preguntasError.message });
      }

      response.total_preguntas = preguntas.length;
      response.preguntas = preguntas.map(p => ({
        id: p.id,
        hoja: p.hoja,
        seccion: p.seccion,
        question_id_origen: p.question_id_origen,
        texto_pregunta: p.texto_pregunta,
        respuesta_existente: p.respuesta_existente,
        evidencia_nota: p.evidencia_nota,
        cell_ref: p.cell_ref,
        answer_cell_ref: p.answer_cell_ref,
        detection_method: p.detection_method,
        confidence: p.confidence,
        pregunta_normalizada_id: p.pregunta_normalizada_id,
        revisado: p.revisado
      }));

      // Estadísticas adicionales útiles para el aplicativo externo
      response.estadisticas = {
        total: preguntas.length,
        por_confianza: {
          alta: preguntas.filter(p => p.confidence === 'alta').length,
          baja: preguntas.filter(p => p.confidence === 'baja').length
        },
        por_metodo: {
          header: preguntas.filter(p => p.detection_method === 'header').length,
          heuristic: preguntas.filter(p => p.detection_method === 'heuristic').length
        },
        revisadas: preguntas.filter(p => p.revisado).length,
        pendientes_revision: preguntas.filter(p => !p.revisado).length
      };
    }

    res.json(response);

  } catch (err) {
    console.error('[status] Unexpected error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}

/**
 * Export del handler con autenticación.
 */
export default function statusRoute(req, res) {
  verifyAuth(req, res, () => statusHandler(req, res));
}
