/**
 * api/eform-ai/history.js
 * Endpoint: GET /api/eform-ai/history
 *
 * Lista las generaciones del usuario (resumen)
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

    // Listar generaciones del usuario (sin parent_id = solo versiones originales)
    // O todas si queremos incluir refinamientos
    const { data: generations, error } = await supabase
      .from('eform_generations')
      .select('id, created_at, form_name, form_id, environment, status, version, parent_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      throw error
    }

    return res.json({ generations: generations || [] })
  } catch (err) {
    console.error('Error en /history:', err)
    res.status(err.message.includes('admin') ? 403 : 500).json({
      error: err.message
    })
  }
}
