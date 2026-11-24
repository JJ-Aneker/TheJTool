/**
 * POST /api/therefore-connect   { tenantId }
 *
 * Obtiene un token de conexión de Therefore™ desde el servidor, para que la
 * contraseña de la instancia no tenga que viajar al navegador.
 *
 * Devuelve { baseUrl, usuario, token, tenantName }. El navegador usa ese token
 * (temporal) para las consultas, igual que antes.
 *
 * Si el servidor no puede llegar a la instancia (p. ej. un Therefore on-premise
 * dentro de una red interna), responde 502 con code: 'UNREACHABLE' y el
 * navegador recurre a la conexión directa de siempre.
 */
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  return createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
}

async function getUser(req, supabase) {
  const authHeader = req.headers.authorization || req.headers.Authorization
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

const buildBaseUrl = (url) => url.trim().replace(/\/$/, '') + '/theservice/v0001/restun'

async function requestToken(baseUrl, headers, withBody) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    return await fetch(baseUrl + '/GetConnectionToken', {
      method: 'POST',
      headers,
      ...(withBody ? { body: '{}' } : {}),
      signal: controller.signal
    })
  } finally {
    clearTimeout(timer)
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  try {
    const supabase = getSupabaseClient()
    const user = await getUser(req, supabase)
    if (!user) return res.status(401).json({ error: 'No autorizado' })

    const tenantId = req.body?.tenantId
    if (!tenantId) return res.status(400).json({ error: 'Falta tenantId' })

    const { data: tenant, error: tErr } = await supabase
      .from('tenants')
      .select('id, url, tenant, usuario, password, is_on_premise, shared, owner_id')
      .eq('id', tenantId)
      .single()
    if (tErr || !tenant) return res.status(404).json({ error: 'Instancia no encontrada' })

    // Acceso: propietario, instancia compartida o administrador
    if (tenant.owner_id !== user.id && !tenant.shared) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
      if (profile?.role !== 'admin') return res.status(403).json({ error: 'No tienes acceso a esta instancia' })
    }

    const usuario = (tenant.usuario || '').trim()
    const password = (tenant.password || '').trim()
    if (!tenant.url || !usuario || !password) {
      return res.status(400).json({ error: 'La instancia no tiene URL, usuario o contraseña configurados' })
    }

    const baseUrl = buildBaseUrl(tenant.url)
    const tenantName = !tenant.is_on_premise && tenant.tenant ? String(tenant.tenant).trim() : ''
    const headers = {
      Authorization: 'Basic ' + Buffer.from(`${usuario}:${password}`, 'utf8').toString('base64'),
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(tenantName ? { TenantName: tenantName } : {})
    }

    let resp
    try {
      resp = await requestToken(baseUrl, headers, true)
      if (!resp.ok && resp.status === 500) resp = await requestToken(baseUrl, headers, false)
    } catch (netErr) {
      // Red no alcanzable desde el servidor (on-premise interno, DNS, timeout…)
      return res.status(502).json({ code: 'UNREACHABLE', error: 'El servidor no puede llegar a la instancia' })
    }

    if (resp.status === 401) {
      return res.status(400).json({ code: 'BAD_CREDENTIALS', error: 'Credenciales inválidas. Revisa el usuario y la contraseña de la instancia.' })
    }
    if (!resp.ok) {
      return res.status(502).json({ error: `La instancia respondió con error ${resp.status}` })
    }

    const data = await resp.json().catch(() => ({}))
    if (!data.Token) return res.status(502).json({ error: 'La instancia no devolvió un token' })

    return res.json({ baseUrl, usuario, token: data.Token, tenantName })
  } catch (err) {
    console.error('Error en /therefore-connect:', err)
    return res.status(500).json({ error: err.message })
  }
}
