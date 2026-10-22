/**
 * api/eform-ai/propose.js
 * Endpoint: POST /api/eform-ai/propose
 *
 * Convierte una petición general en un prompt detallado (con preguntas aclaratorias opcionales)
 */

import { createClient } from '@supabase/supabase-js'
import { callBedrock } from '../_lib/bedrockClient.js'
import { buildProposeSystemPrompt, buildProposeUserMessage } from '../_lib/eformAiPrompts.js'
import { parseCategoryXml, fieldsToAIContext } from '../_lib/eformCategoryParser.js'

function getSupabaseClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )
}

/**
 * Verifica que el usuario sea admin
 */
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

  // Verificar rol admin en profiles
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

/**
 * Extrae el primer bloque JSON válido de una respuesta de IA
 */
function extractJSON(text) {
  // Buscar { ... } o [ ... ]
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (!jsonMatch) {
    throw new Error('No se encontró JSON en la respuesta')
  }

  try {
    return JSON.parse(jsonMatch[1])
  } catch (err) {
    throw new Error(`JSON inválido: ${err.message}`)
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    // Verificar que sea admin
    const user = await verifyAdmin(req)

    // Extraer parámetros
    const {
      request,
      environment,
      tenant,
      serverUrl,
      blocks = [],
      categoryXml,
      answers = []
    } = req.body

    if (!request || !environment) {
      return res.status(400).json({ error: 'Faltan parámetros: request, environment' })
    }

    if (environment !== 'online' && environment !== 'onpremise') {
      return res.status(400).json({ error: 'environment debe ser "online" o "onpremise"' })
    }

    // Parsear categoría si se proporcionó
    let categoryFields = []
    if (categoryXml) {
      try {
        const parsed = parseCategoryXml(categoryXml)
        categoryFields = fieldsToAIContext(parsed.fields)
      } catch (err) {
        return res.status(400).json({ error: `Error parseando categoría: ${err.message}` })
      }
    }

    // Construir prompts
    const systemPrompt = buildProposeSystemPrompt({
      environment,
      tenant,
      serverUrl,
      blocks,
      categoryFields
    })

    const userMessage = buildProposeUserMessage({ request, answers })

    // Llamar a Bedrock
    const modelId = process.env.EFORM_AI_MODEL_ID || 'claude-sonnet-4-5'

    const response = await callBedrock({
      model: modelId,
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    }, {
      userId: user.id,
      module: 'eform-ai-propose'
    })

    const outputText = response.content[0].text

    // Parsear respuesta (tolerante)
    let result
    try {
      result = extractJSON(outputText)
    } catch (err) {
      console.error('Error parseando JSON de IA:', err.message)
      console.error('Respuesta completa:', outputText)
      return res.status(500).json({
        error: 'La IA no devolvió JSON válido',
        details: outputText.substring(0, 500)
      })
    }

    // Validar estructura
    if (result.questions) {
      // Devolvió preguntas
      return res.json({
        questions: result.questions,
        usage: response.usage
      })
    } else if (result.detailedPrompt) {
      // Devolvió prompt detallado
      return res.json({
        detailedPrompt: result.detailedPrompt,
        suggestedFormName: result.suggestedFormName || 'Nuevo eForm',
        suggestedFormId: result.suggestedFormId || 'NuevoEForm',
        usage: response.usage
      })
    } else {
      return res.status(500).json({
        error: 'Respuesta de IA en formato inesperado',
        result
      })
    }
  } catch (err) {
    console.error('Error en /propose:', err)
    res.status(err.message.includes('admin') ? 403 : 500).json({
      error: err.message
    })
  }
}
