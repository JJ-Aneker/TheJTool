import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

// GET /api/verticales - Obtener todos los verticales
async function getAllVerticals(req, res) {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('verticales')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error getting verticales:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data || []);
  } catch (err) {
    console.error('Error in getAllVerticals:', err);
    res.status(500).json({ error: err.message });
  }
}

// GET /api/verticales/:id - Obtener un vertical por ID
async function getVerticalById(req, res) {
  try {
    const { id } = req.params;
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('verticales')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error getting vertical:', error);
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Vertical no encontrado' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error in getVerticalById:', err);
    res.status(500).json({ error: err.message });
  }
}

// POST /api/verticales - Crear nuevo vertical
async function createVertical(req, res) {
  try {
    const supabase = getSupabaseClient();

    // Validar campos requeridos
    if (!req.body.nombre || !req.body.titulo) {
      return res.status(400).json({
        error: 'Los campos nombre y titulo son requeridos'
      });
    }

    const { data, error } = await supabase
      .from('verticales')
      .insert([{
        nombre: req.body.nombre,
        titulo: req.body.titulo,
        descripcion_intro: req.body.descripcion_intro || null,
        claves: req.body.claves || [],
        premisas_especificas: req.body.premisas_especificas || [],
        tablas_maestras: req.body.tablas_maestras || [],
        herramientas_recomendadas: req.body.herramientas_recomendadas || [],
        tarifa_diaria: req.body.tarifa_diaria || 800,
        duracion_tipica_dias: req.body.duracion_tipica_dias || 10,
        margen_oferta_pct: req.body.margen_oferta_pct || 20,
        categorias_arquitectura: req.body.categorias_arquitectura || {
          Maestros: [],
          Documentacion: [],
          Operacion: []
        },
        ejemplo_workflows: req.body.ejemplo_workflows || [],
        integraciones_comunes: req.body.integraciones_comunes || [],
        descripcion_implementacion: req.body.descripcion_implementacion || null,
        casos_prueba_tipicos: req.body.casos_prueba_tipicos || [],
        criterios_aceptacion: req.body.criterios_aceptacion || [],
        modulos_funcionales: req.body.modulos_funcionales || [],
        procesos_clave: req.body.procesos_clave || [],
        integraciones_usuario: req.body.integraciones_usuario || [],
        plantilla_html_manual: req.body.plantilla_html_manual || null,
        activo: req.body.activo !== false
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating vertical:', error);
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Error in createVertical:', err);
    res.status(500).json({ error: err.message });
  }
}

// PUT /api/verticales/:id - Actualizar vertical
async function updateVertical(req, res) {
  try {
    const { id } = req.params;
    const supabase = getSupabaseClient();

    const updateData = {
      ...(req.body.titulo && { titulo: req.body.titulo }),
      ...(req.body.descripcion_intro !== undefined && { descripcion_intro: req.body.descripcion_intro }),
      ...(req.body.claves !== undefined && { claves: req.body.claves }),
      ...(req.body.premisas_especificas !== undefined && { premisas_especificas: req.body.premisas_especificas }),
      ...(req.body.tablas_maestras !== undefined && { tablas_maestras: req.body.tablas_maestras }),
      ...(req.body.herramientas_recomendadas !== undefined && { herramientas_recomendadas: req.body.herramientas_recomendadas }),
      ...(req.body.tarifa_diaria !== undefined && { tarifa_diaria: req.body.tarifa_diaria }),
      ...(req.body.duracion_tipica_dias !== undefined && { duracion_tipica_dias: req.body.duracion_tipica_dias }),
      ...(req.body.margen_oferta_pct !== undefined && { margen_oferta_pct: req.body.margen_oferta_pct }),
      ...(req.body.categorias_arquitectura !== undefined && { categorias_arquitectura: req.body.categorias_arquitectura }),
      ...(req.body.ejemplo_workflows !== undefined && { ejemplo_workflows: req.body.ejemplo_workflows }),
      ...(req.body.integraciones_comunes !== undefined && { integraciones_comunes: req.body.integraciones_comunes }),
      ...(req.body.descripcion_implementacion !== undefined && { descripcion_implementacion: req.body.descripcion_implementacion }),
      ...(req.body.casos_prueba_tipicos !== undefined && { casos_prueba_tipicos: req.body.casos_prueba_tipicos }),
      ...(req.body.criterios_aceptacion !== undefined && { criterios_aceptacion: req.body.criterios_aceptacion }),
      ...(req.body.modulos_funcionales !== undefined && { modulos_funcionales: req.body.modulos_funcionales }),
      ...(req.body.procesos_clave !== undefined && { procesos_clave: req.body.procesos_clave }),
      ...(req.body.integraciones_usuario !== undefined && { integraciones_usuario: req.body.integraciones_usuario }),
      ...(req.body.plantilla_html_manual !== undefined && { plantilla_html_manual: req.body.plantilla_html_manual }),
      ...(req.body.activo !== undefined && { activo: req.body.activo }),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('verticales')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating vertical:', error);
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Vertical no encontrado' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error in updateVertical:', err);
    res.status(500).json({ error: err.message });
  }
}

// DELETE /api/verticales/:id - Eliminar vertical
async function deleteVertical(req, res) {
  try {
    const { id } = req.params;
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('verticales')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting vertical:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, message: 'Vertical eliminado' });
  } catch (err) {
    console.error('Error in deleteVertical:', err);
    res.status(500).json({ error: err.message });
  }
}

export default {
  getAllVerticals,
  getVerticalById,
  createVertical,
  updateVertical,
  deleteVertical
};
