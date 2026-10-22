/**
 * api/eform-ai/refine.js
 * Endpoint: POST /api/eform-ai/refine
 *
 * Refina una generación existente con una instrucción
 */

import { createClient } from '@supabase/supabase-js'
import { callBedrock } from '../_lib/bedrockClient.js'
import { buildGenerateSystemPrompt, buildRefineUserMessage, buildValidationRetryMessage } from '../_lib/eformAiPrompts.js'
import { buildEformXml } from '../_lib/eformXml.js'
import { validateComponents } from '../_lib/eformValidator.js'

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
    const user = await verifyAdmin(req)
    const supabase = getSupabaseClient()

    const { generationId, instruction } = req.body

    if (!generationId || !instruction) {
      return res.status(400).json({ error: 'Faltan parámetros: generationId, instruction' })
    }

    // Obtener la generación original
    const { data: original, error: fetchError } = await supabase
      .from('eform_generations')
      .select('*')
      .eq('id', generationId)
      .eq('user_id', user.id) // Solo sus propias generaciones
      .single()

    if (fetchError || !original) {
      return res.status(404).json({ error: 'Generación no encontrada' })
    }

    // Construir prompts
    const systemPrompt = buildGenerateSystemPrompt({
      environment: original.environment,
      tenant: original.tenant,
      serverUrl: original.server_url,
      blocks: original.blocks || [],
      categoryFields: original.category_fields || []
    })

    const userMessage = buildRefineUserMessage({
      components: original.components,
      instruction
    })

    const modelId = process.env.EFORM_AI_MODEL_ID || 'claude-sonnet-4-5'

    // Llamar a IA
    let response = await callBedrock({
      model: modelId,
      max_tokens: 16000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    }, {
      userId: user.id,
      module: 'eform-ai-refine'
    })

    let outputText = response.content[0].text
    let components

    // Parseo tolerante
    try {
      const parsed = extractJSON(outputText)
      components = parsed.components || parsed
    } catch (err) {
      // Reintento
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
        module: 'eform-ai-refine-retry'
      })

      outputText = response.content[0].text
      const parsed = extractJSON(outputText)
      components = parsed.components || parsed
    }

    // Validar
    const validation = validateComponents(components, {
      environment: original.environment,
      categoryFields: original.category_fields || []
    })

    // Generar XML
    let xml
    try {
      xml = buildEformXml({
        formName: original.form_name,
        formId: original.form_id,
        components,
        templateXml: original.used_custom_template ? null : undefined // TODO: almacenar template custom
      })
    } catch (err) {
      return res.status(500).json({
        error: `Error generando XML: ${err.message}`,
        components,
        validation
      })
    }

    // Guardar nueva versión (con parent_id)
    const { data: newGeneration, error: dbError } = await supabase
      .from('eform_generations')
      .insert({
        user_id: user.id,
        parent_id: generationId,
        version: (original.version || 1) + 1,
        request_text: original.request_text,
        environment: original.environment,
        tenant: original.tenant,
        server_url: original.server_url,
        blocks: original.blocks,
        category_fields: original.category_fields,
        used_custom_template: original.used_custom_template,
        detailed_prompt: original.detailed_prompt,
        refine_instruction: instruction,
        form_name: original.form_name,
        form_id: original.form_id,
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
      console.error('Error guardando refinamiento:', dbError)
    }

    return res.json({
      generationId: newGeneration?.id,
      components,
      xml,
      validation,
      usage: response.usage
    })
  } catch (err) {
    console.error('Error en /refine:', err)
    res.status(err.message.includes('admin') ? 403 : 500).json({
      error: err.message
    })
  }
}
