// Acceso a tabla verticales en Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;

function getSupabaseClient() {
  if (!supabase && supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

// Obtener una vertical por nombre
export async function getVertical(nombre) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('verticales')
      .select('*')
      .eq('nombre', nombre)
      .eq('activo', true)
      .single();

    if (error) {
      console.warn(`[VerticalesDB] Error fetching vertical ${nombre}:`, error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.warn('[VerticalesDB] Connection error:', err.message);
    return null;
  }
}

// Obtener todas las verticales activas
export async function getAllVerticals() {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('verticales')
      .select('nombre, titulo, descripcion_intro')
      .eq('activo', true)
      .order('titulo');

    if (error) {
      console.warn('[VerticalesDB] Error fetching all verticals:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn('[VerticalesDB] Connection error:', err.message);
    return [];
  }
}

// Construir objeto vertical en formato compatible con analyze.js
// (para backward compatibility mientras migramos completamente)
export async function buildVerticalObject(nombre) {
  const vert = await getVertical(nombre);
  if (!vert) return null;

  return {
    nombre: vert.titulo,
    subtitulo: 'Therefore™ Solution',
    descripcion_intro: vert.descripcion_intro,
    claves: vert.claves || [],
    premisas_especificas: vert.premisas_especificas || [],
    tablas_maestras: vert.tablas_maestras || [],
    herramientas_recomendadas: vert.herramientas_recomendadas || [],
    categorias_arquitectura: vert.categorias_arquitectura || {},
    ejemplo_workflows: vert.ejemplo_workflows || [],
    integraciones_comunes: vert.integraciones_comunes || [],
    workflows: vert.ejemplo_workflows || [],
    // Para backward compatibility con código existente
    descripcion_intro_func: vert.descripcion_intro,
    claves_proyecto: vert.claves || [],
  };
}

export const VerticalesDb = {
  getVertical,
  getAllVerticals,
  buildVerticalObject,
};
