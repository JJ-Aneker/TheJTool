// Conexión a una instancia de Therefore™ guardada en "Instancias".
//
// 1) El servidor de la app obtiene un token temporal (/api/therefore-connect):
//    la contraseña no pasa por el navegador.
// 2) Si el servidor no llega a la instancia (on-premise en red interna) o la
//    ruta no existe (servidor local sin actualizar), se conecta directamente.
import axios from 'axios'
import { supabase } from '../config/supabaseClient'
import { thereforeService, describeError } from './thereforeService'

export async function connectTenant(tenantId) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const { data } = await axios.post('/api/therefore-connect', { tenantId }, {
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
    })
    return thereforeService.fromToken(data)
  } catch (err) {
    const status = err.response?.status
    const code = err.response?.data?.code
    const fallback = !err.response || status === 404 || code === 'UNREACHABLE'
    if (!fallback) throw new Error(err.response?.data?.error || err.message)
  }

  const { data: cred, error } = await supabase
    .from('tenants')
    .select('url, tenant, usuario, password, is_on_premise')
    .eq('id', tenantId)
    .single()
  if (error || !cred) throw new Error('Instancia no encontrada')
  const { headers, baseUrl } = await thereforeService.connect(
    cred.url, cred.usuario, cred.password, cred.is_on_premise ? true : (cred.tenant || '')
  )
  return { headers, baseUrl }
}

// Llamada genérica a la Web API. Lanza un error con .status para poder
// reintentar con un token nuevo cuando caduca (401).
export async function thApi(conn, operation, body = {}) {
  const resp = await fetch(`${conn.baseUrl}/${operation}`, {
    method: 'POST',
    headers: conn.headers,
    body: JSON.stringify(body)
  })
  if (!resp.ok) {
    const err = new Error(`${operation}: ${await describeError(resp)}`)
    err.status = resp.status
    throw err
  }
  return resp.json()
}

// El token ha caducado o ha sido sustituido por otro (Therefore™ responde InvalidLogin, a veces con HTTP 500)
export const isAuthError = (err) => {
  const msg = String(err?.message || err || '')
  return err?.status === 401 || /\b401\b|InvalidLogin|0xC000001B|Invalid user name or password/i.test(msg)
}

// Árbol de categorías → lista plana con la ruta de carpetas
export function flattenCategoryTree(tree) {
  const out = []
  const walk = (items, path) => {
    (items || []).forEach(node => {
      const children = node.ChildItems || node.SubCategories || node.Children || []
      const catNo = node.ItemNo ?? node.CategoryNo
      const isFolder = node.ItemType === 1 || (children.length && node.ItemType !== 2)
      if (isFolder) walk(children, [...path, node.Name])
      else if (catNo !== undefined) out.push({ catNo, name: node.Name || `Categoría ${catNo}`, path: path.join(' / ') })
    })
  }
  walk(tree, [])
  return out
}
