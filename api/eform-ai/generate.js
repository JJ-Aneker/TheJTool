/**
 * api/eform-ai/generate.js
 * Endpoint: POST /api/eform-ai/generate
 *
 * Genera JSON form.io + XML desde un prompt detallado
 */

import { createClient } from '@supabase/supabase-js'
import { callBedrock } from '../_lib/bedrockClient.js'
import { buildGenerateSystemPrompt, buildGenerateUserMessage, buildValidationRetryMessage } from '../_lib/eformAiPrompts.js'
import { parseCategoryXml, fieldsToAIContext } from '../_lib/eformCategoryParser.js'
import { buildEformXml } from '../_lib/eformXml.js'
import { validateComponents, validateFormId } from '../_lib/eformValidator.js'

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
 * Extrae el primer bloque JSON válido
 */
function extractJSON(text) {
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (!jsonMatch) {
    throw new Error('No se encontró JSON en la respuesta')
  }

  return JSON.parse(jsonMatch[1])
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
      detailedPrompt,
      formName,
      formId,
      environment,
      tenant,
      serverUrl,
      blocks = [],
      categoryXml,
      templateXml,
      requestText // Para guardar en historial
    } = req.body

    if (!detailedPrompt || !formName || !formId || !environment) {
      return res.status(400).json({
        error: 'Faltan parámetros: detailedPrompt, formName, formId, environment'
      })
    }

    // Validar FormID
    const formIdValidation = validateFormId(formId)
    if (!formIdValidation.valid) {
      return res.status(400).json({ error: formIdValidation.error })
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
    const systemPrompt = buildGenerateSystemPrompt({
      environment,
      tenant,
      serverUrl,
      blocks,
      categoryFields
    })

    const userMessage = buildGenerateUserMessage({ detailedPrompt, formName, formId })

    const modelId = process.env.EFORM_AI_MODEL_ID || 'claude-sonnet-4-5'

    // Primera llamada a IA
    let response = await callBedrock({
      model: modelId,
      max_tokens: 16000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    }, {
      userId: user.id,
      module: 'eform-ai-generate'
    })

    let outputText = response.content[0].text
    let components
    let retryCount = 0
    const MAX_RETRIES = 2

    // Parseo tolerante con reintentos
    while (retryCount < MAX_RETRIES) {
      try {
        const parsed = extractJSON(outputText)

        // Validar estructura
        if (parsed.components && Array.isArray(parsed.components)) {
          components = parsed.components
          break
        } else if (Array.isArray(parsed)) {
          // La IA devolvió directamente el array
          components = parsed
          break
        } else {
          throw new Error('JSON no tiene estructura { components: [...] }')
        }
      } catch (err) {
        retryCount++
        console.warn(`Intento ${retryCount} de parseo JSON falló:`, err.message)

        if (retryCount >= MAX_RETRIES) {
          return res.status(500).json({
            error: 'La IA no devolvió JSON válido después de varios intentos',
            details: outputText.substring(0, 500)
          })
        }

        // Reintento con el error
        const messages = [
          { role: 'user', content: userMessage },
          { role: 'assistant', content: outputText },
          { role: 'user', content: `Error parseando JSON: ${err.message}. Devuelve SOLO el JSON válido { "components": [...] }` }
        ]

        response = await callBedrock({
          model: modelId,
          max_tokens: 16000,
          system: systemPrompt,
          messages
        }, {
          userId: user.id,
          module: 'eform-ai-generate-retry'
        })

        outputText = response.content[0].text
      }
    }

    // Validar componentes
    const validation = validateComponents(components, {
      environment,
      categoryFields
    })

    // Si hay errores de validación, reintento 1 vez
    if (validation.errors.length > 0 && retryCount < MAX_RETRIES) {
      console.warn('Errores de validación, reintentando con feedback...')

      const messages = [
        { role: 'user', content: userMessage },
        { role: 'assistant', content: JSON.stringify({ components }, null, 2) },
        { role: 'user', content: buildValidationRetryMessage(validation.errors) }
      ]

      response = await callBedrock({
        model: modelId,
        max_tokens: 16000,
        system: systemPrompt,
        messages
      }, {
        userId: user.id,
        module: 'eform-ai-generate-validation-retry'
      })

      outputText = response.content[0].text

      try {
        const parsed = extractJSON(outputText)
        components = parsed.components || parsed

        // Re-validar
        const newValidation = validateComponents(components, {
          environment,
          categoryFields
        })

        if (newValidation.errors.length < validation.errors.length) {
          // Mejoró, usar la nueva versión
          validation.errors = newValidation.errors
          validation.warnings = newValidation.warnings
        }
      } catch (err) {
        console.warn('Retry de validación falló al parsear:', err.message)
        // Mantener componentes originales
      }
    }

    // Generar XML (aunque haya errores, para debug)
    let xml
    try {
      xml = buildEformXml({
        formName,
        formId,
        components,
        templateXml
      })
    } catch (err) {
      return res.status(500).json({
        error: `Error generando XML: ${err.message}`,
        components,
        validation
      })
    }

    // Guardar en Supabase (tabla eform_generations)
    const supabase = getSupabaseClient()
    const { data: generation, error: dbError } = await supabase
      .from('eform_generations')
      .insert({
        user_id: user.id,
        request_text: requestText || detailedPrompt.substring(0, 500),
        environment,
        tenant,
        server_url: serverUrl,
        blocks,
        category_fields: categoryFields.length > 0 ? categoryFields : null,
        used_custom_template: !!templateXml,
        detailed_prompt: detailedPrompt,
        form_name: formName,
        form_id: formId,
        components,
        xml,
        validation,
        status: validation.errors.length === 0 ? 'generated' : 'invalid',
        model_id: modelId,
        usage: response.usage
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error guardando en Supabase:', dbError)
      // No bloqueamos la respuesta, solo advertimos
    }

    // Respuesta exitosa
    return res.json({
      generationId: generation?.id,
      components,
      xml,
      validation,
      usage: response.usage
    })
  } catch (err) {
    console.error('Error en /generate:', err)
    res.status(err.message.includes('admin') ? 403 : 500).json({
      error: err.message
    })
  }
}
