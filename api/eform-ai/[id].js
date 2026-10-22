/**
 * api/eform-ai/[id].js
 * Endpoint: GET /api/eform-ai/:id
 *
 * Obtiene una generación completa por ID
 */

import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )
}

async function verifyAdmin(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization
  if (!authHeader) {
    throw new Error('No autorizado: falta token')
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = getSupabaseClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  if (userError || !user) {
    throw new Error('No autorizado: token inválido')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile || profile.role !== 'admin') {
    throw new Error('Acceso denegado: solo administradores')
  }

  return user
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const user = await verifyAdmin(req)
    const supabase = getSupabaseClient()

    // Extraer ID de la query (Vercel lo pasa así)
    const id = req.query.id

    if (!id) {
      return res.status(400).json({ error: 'Falta parámetro: id' })
    }

    const { data: generation, error } = await supabase
      .from('eform_generations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // Solo sus propias generaciones
      .single()

    if (error || !generation) {
      return res.status(404).json({ error: 'Generación no encontrada' })
    }

    return res.json({ generation })
  } catch (err) {
    console.error('Error en /[id]:', err)
    res.status(err.message.includes('admin') ? 403 : 500).json({
      error: err.message
    })
  }
}
