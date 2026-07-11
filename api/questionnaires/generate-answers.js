/**
 * POST /api/questionnaires/:id/generate-answers
 *
 * Genera respuestas automáticas para las preguntas de un cuestionario
 * usando AWS Bedrock (Claude). Actualiza las preguntas en la BD con
 * las respuestas generadas.
 *
 * @module api/questionnaires/generate-answers
 */

import { createClient } from '@supabase/supabase-js';
import { callBedrock } from '../_lib/bedrockClient.js';
import { buildEnrichedPrompt } from '../_lib/questionnaires/knowledge-base.js';

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
      console.error('[generate-answers] Supabase config missing');
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
    console.error('[generate-answers] Auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Genera una respuesta usando Bedrock para una pregunta específica.
 */
async function generateAnswer(pregunta, contexto) {
  try {
    const prompt = buildEnrichedPrompt(pregunta, contexto);

    const response = await callBedrock({
      model: 'claude-sonnet-4-5',
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 300
    }, {
      module: 'questionnaires'
    });

    return response.content[0].text.trim();
  } catch (err) {
    console.error('[generate-answers] Error en Bedrock:', err.message);
    return `[ERROR: No se pudo generar respuesta automática]`;
  }
}

/**
 * Handler principal: genera respuestas para todas las preguntas del formulario.
 */
async function generateAnswersHandler(req, res) {
  try {
    const { id } = req.params;
    const supabase = req.supabase;

    // 1. Obtener formulario
    const { data: formulario, error: formularioError } = await supabase
      .from('formularios')
      .select('*')
      .eq('id', id)
      .single();

    if (formularioError || !formulario) {
      return res.status(404).json({ error: 'Formulario no encontrado' });
    }

    if (formulario.estado !== 'completado') {
      return res.status(400).json({ error: 'El formulario debe estar completado antes de generar respuestas' });
    }

    // 2. Obtener preguntas
    const { data: preguntas, error: preguntasError } = await supabase
      .from('formulario_preguntas_extraidas')
      .select('*')
      .eq('formulario_id', id)
      .order('id', { ascending: true });

    if (preguntasError) {
      return res.status(500).json({ error: 'Error al obtener las preguntas' });
    }

    if (!preguntas || preguntas.length === 0) {
      return res.status(400).json({ error: 'No hay preguntas para procesar' });
    }

    console.log(`[generate-answers] Formulario ${id}: Generando respuestas para ${preguntas.length} preguntas`);

    // 3. Contexto para generar respuestas
    const contexto = {
      cliente: formulario.cliente,
      nombre_formulario: formulario.nombre_formulario,
      producto_afectado: formulario.producto_afectado
    };

    // 4. Generar respuestas en lotes (para no saturar Bedrock)
    const BATCH_SIZE = 5;
    let processedCount = 0;
    const respuestasGeneradas = [];

    for (let i = 0; i < preguntas.length; i += BATCH_SIZE) {
      const batch = preguntas.slice(i, i + BATCH_SIZE);

      // Generar respuestas en paralelo para el lote actual
      const respuestasBatch = await Promise.all(
        batch.map(async (pregunta) => {
          // Si ya tiene respuesta existente, no generar nueva
          if (pregunta.respuesta_existente && pregunta.respuesta_existente.trim() !== '') {
            return {
              id: pregunta.id,
              respuesta: pregunta.respuesta_existente,
              generada: false
            };
          }

          const respuesta = await generateAnswer(pregunta, contexto);
          return {
            id: pregunta.id,
            respuesta,
            generada: true
          };
        })
      );

      // Actualizar preguntas en BD con las respuestas generadas
      for (const item of respuestasBatch) {
        if (item.generada) {
          await supabase
            .from('formulario_preguntas_extraidas')
            .update({ respuesta_existente: item.respuesta })
            .eq('id', item.id);
        }
      }

      processedCount += batch.length;
      respuestasGeneradas.push(...respuestasBatch);

      console.log(`[generate-answers] Formulario ${id}: ${processedCount}/${preguntas.length} procesadas`);

      // Pequeña pausa entre lotes para no saturar Bedrock
      if (i + BATCH_SIZE < preguntas.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // 5. Actualizar formulario con nota de respuestas generadas
    const respuestasNuevas = respuestasGeneradas.filter(r => r.generada).length;
    await supabase
      .from('formularios')
      .update({
        notas: `Respuestas generadas automáticamente con IA: ${respuestasNuevas} nuevas, ${preguntas.length - respuestasNuevas} existentes`
      })
      .eq('id', id);

    console.log(`[generate-answers] Formulario ${id}: Completado - ${respuestasNuevas} respuestas generadas`);

    res.json({
      message: 'Respuestas generadas correctamente',
      total: preguntas.length,
      generadas: respuestasNuevas,
      existentes: preguntas.length - respuestasNuevas
    });

  } catch (err) {
    console.error('[generate-answers] Error:', err);
    res.status(500).json({ error: 'Error al generar respuestas', message: err.message });
  }
}

/**
 * Export del handler con autenticación.
 */
export default function generateAnswersRoute(req, res) {
  verifyAuth(req, res, () => generateAnswersHandler(req, res));
}
