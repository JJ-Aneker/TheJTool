/**
 * DELETE /api/questionnaires/:id
 *
 * Elimina un formulario completo: registro en BD + preguntas + fichero en Storage.
 * Operación en cascada gracias a la FK con ON DELETE CASCADE.
 *
 * @module api/questionnaires/delete
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
      console.error('[delete] Supabase config missing');
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
    console.error('[delete] Auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Handler principal: elimina formulario + preguntas + fichero.
 */
async function deleteHandler(req, res) {
  try {
    const { id } = req.params;
    const supabase = req.supabase;

    // 1. Obtener formulario para conocer la ruta del fichero
    const { data: formulario, error: formularioError } = await supabase
      .from('formularios')
      .select('*')
      .eq('id', id)
      .single();

    if (formularioError || !formulario) {
      return res.status(404).json({ error: 'Formulario no encontrado' });
    }

    console.log(`[delete] Eliminando formulario ${id}: ${formulario.cliente} / ${formulario.nombre_formulario}`);

    // 2. Eliminar fichero de Supabase Storage (si existe)
    if (formulario.ruta_archivo_original) {
      const { error: storageError } = await supabase.storage
        .from('questionnaires')
        .remove([formulario.ruta_archivo_original]);

      if (storageError) {
        console.warn(`[delete] No se pudo eliminar fichero en Storage:`, storageError.message);
        // No bloqueamos la eliminación del registro por esto
      } else {
        console.log(`[delete] Fichero eliminado: ${formulario.ruta_archivo_original}`);
      }
    }

    // 3. Eliminar registro de formulario (cascada elimina preguntas automáticamente)
    const { error: deleteError } = await supabase
      .from('formularios')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[delete] Error eliminando formulario:', deleteError);
      return res.status(500).json({ error: 'Error al eliminar el formulario', details: deleteError.message });
    }

    console.log(`[delete] Formulario ${id} eliminado correctamente (incluidas ${formulario.total_preguntas || 0} preguntas)`);

    res.json({
      message: 'Formulario eliminado correctamente',
      id: parseInt(id),
      cliente: formulario.cliente,
      preguntas_eliminadas: formulario.total_preguntas || 0
    });

  } catch (err) {
    console.error('[delete] Error:', err);
    res.status(500).json({ error: 'Error al eliminar formulario', message: err.message });
  }
}

/**
 * Export del handler con autenticación.
 */
export default function deleteRoute(req, res) {
  verifyAuth(req, res, () => deleteHandler(req, res));
}
