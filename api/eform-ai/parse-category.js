/**
 * api/eform-ai/parse-category.js
 * Endpoint: POST /api/eform-ai/parse-category
 *
 * Parsea un XML de categoría y extrae campos
 */

import { createClient } from '@supabase/supabase-js'
import { parseCategoryXml } from '../_lib/eformCategoryParser.js'

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    await verifyAdmin(req)

    const { categoryXml } = req.body

    if (!categoryXml) {
      return res.status(400).json({ error: 'Falta parámetro: categoryXml' })
    }

    const result = parseCategoryXml(categoryXml)

    return res.json(result)
  } catch (err) {
    console.error('Error en /parse-category:', err)
    res.status(err.message.includes('admin') ? 403 : 500).json({
      error: err.message
    })
  }
}
