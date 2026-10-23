/**
 * routes/eformAi.js
 * Rutas Express para desarrollo local (server.js)
 * Replican la funcionalidad de api/eform-ai/* para Vercel
 */

import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { callBedrock } from '../api/_lib/bedrockClient.js'
import {
  buildProposeSystemPrompt,
  buildProposeUserMessage,
  buildGenerateSystemPrompt,
  buildGenerateUserMessage,
  buildRefineUserMessage,
  buildValidationRetryMessage
} from '../api/_lib/eformAiPrompts.js'
import { parseCategoryXml, fieldsToAIContext } from '../api/_lib/eformCategoryParser.js'
import { buildEformXml } from '../api/_lib/eformXml.js'
import { validateComponents, validateFormId } from '../api/_lib/eformValidator.js'

const router = express.Router()

// Middleware para soportar tanto query params (?action=X) como rutas separadas (/X)
router.use((req, res, next) => {
  const action = req.query.action

  if (action && !req.path.includes(action)) {
    // Caso especial: ?action=get&id=xxx → ruta /:id
    if (action === 'get' && req.query.id) {
      req.url = `/${req.query.id}`
    }
    // Otros casos: ?action=propose → /propose (manteniendo otros query params)
    else {
      const otherParams = Object.keys(req.query)
        .filter(k => k !== 'action')
        .map(k => `${k}=${req.query[k]}`)
        .join('&')
      req.url = `/${action}${otherParams ? '?' + otherParams : ''}`
    }
  }
  next()
})

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

// POST /api/eform-ai/propose
router.post('/propose', async (req, res) => {
  try {
    const user = await verifyAdmin(req)

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

    let categoryFields = []
    if (categoryXml) {
      const parsed = parseCategoryXml(categoryXml)
      categoryFields = fieldsToAIContext(parsed.fields)
    }

    const systemPrompt = buildProposeSystemPrompt({
      environment, tenant, serverUrl, blocks, categoryFields
    })

    const userMessage = buildProposeUserMessage({ request, answers })
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

    const result = extractJSON(response.content[0].text)

    if (result.questions) {
      return res.json({ questions: result.questions, usage: response.usage })
    } else if (result.detailedPrompt) {
      return res.json({
        detailedPrompt: result.detailedPrompt,
        suggestedFormName: result.suggestedFormName || 'Nuevo eForm',
        suggestedFormId: result.suggestedFormId || 'NuevoEForm',
        usage: response.usage
      })
    } else {
      return res.status(500).json({ error: 'Respuesta de IA en formato inesperado', result })
    }
  } catch (err) {
    console.error('Error en /propose:', err)
    res.status(err.message.includes('admin') ? 403 : 500).json({ error: err.message })
  }
})

// POST /api/eform-ai/generate
router.post('/generate', async (req, res) => {
  try {
    const user = await verifyAdmin(req)

    const {
      detailedPrompt, formName, formId, environment,
      tenant, serverUrl, blocks = [], categoryXml, templateXml, requestText
    } = req.body

    if (!detailedPrompt || !formName || !formId || !environment) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos' })
    }

    const formIdValidation = validateFormId(formId)
    if (!formIdValidation.valid) {
      return res.status(400).json({ error: formIdValidation.error })
    }

    let categoryFields = []
    if (categoryXml) {
      const parsed = parseCategoryXml(categoryXml)
      categoryFields = fieldsToAIContext(parsed.fields)
    }

    const systemPrompt = buildGenerateSystemPrompt({
      environment, tenant, serverUrl, blocks, categoryFields
    })

    const userMessage = buildGenerateUserMessage({ detailedPrompt, formName, formId })
    const modelId = process.env.EFORM_AI_MODEL_ID || 'claude-sonnet-4-5'

    let response = await callBedrock({
      model: modelId,
      max_tokens: 16000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    }, { userId: user.id, module: 'eform-ai-generate' })

    let components
    try {
      const parsed = extractJSON(response.content[0].text)
      components = parsed.components || parsed
    } catch (err) {
      return res.status(500).json({ error: 'JSON inválido de IA' })
    }

    const validation = validateComponents(components, { environment, categoryFields })

    const xml = buildEformXml({ formName, formId, components, templateXml })

    const supabase = getSupabaseClient()
    const { data: generation } = await supabase
      .from('eform_generations')
      .insert({
        user_id: user.id,
        request_text: requestText || detailedPrompt.substring(0, 500),
        environment, tenant, server_url: serverUrl, blocks,
        category_fields: categoryFields.length > 0 ? categoryFields : null,
        used_custom_template: !!templateXml,
        detailed_prompt: detailedPrompt,
        form_name: formName, form_id: formId,
        components, xml, validation,
        status: validation.errors.length === 0 ? 'generated' : 'invalid',
        model_id: modelId, usage: response.usage
      })
      .select()
      .single()

    return res.json({
      generationId: generation?.id,
      components, xml, validation,
      usage: response.usage
    })
  } catch (err) {
    console.error('Error en /generate:', err)
    res.status(err.message.includes('admin') ? 403 : 500).json({ error: err.message })
  }
})

// POST /api/eform-ai/refine
router.post('/refine', async (req, res) => {
  try {
    const user = await verifyAdmin(req)
    const supabase = getSupabaseClient()

    const { generationId, instruction } = req.body
    if (!generationId || !instruction) {
      return res.status(400).json({ error: 'Faltan parámetros' })
    }

    const { data: original } = await supabase
      .from('eform_generations')
      .select('*')
      .eq('id', generationId)
      .eq('user_id', user.id)
      .single()

    if (!original) {
      return res.status(404).json({ error: 'Generación no encontrada' })
    }

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

    const response = await callBedrock({
      model: modelId,
      max_tokens: 16000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    }, { userId: user.id, module: 'eform-ai-refine' })

    const parsed = extractJSON(response.content[0].text)
    const components = parsed.components || parsed

    const validation = validateComponents(components, {
      environment: original.environment,
      categoryFields: original.category_fields || []
    })

    const xml = buildEformXml({
      formName: original.form_name,
      formId: original.form_id,
      components
    })

    const { data: newGeneration } = await supabase
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
        components, xml, validation,
        status: validation.errors.length === 0 ? 'generated' : 'invalid',
        model_id: modelId,
        usage: response.usage
      })
      .select()
      .single()

    return res.json({
      generationId: newGeneration?.id,
      components, xml, validation,
      usage: response.usage
    })
  } catch (err) {
    console.error('Error en /refine:', err)
    res.status(err.message.includes('admin') ? 403 : 500).json({ error: err.message })
  }
})

// POST /api/eform-ai/parse-category
router.post('/parse-category', async (req, res) => {
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
    res.status(err.message.includes('admin') ? 403 : 500).json({ error: err.message })
  }
})

// GET /api/eform-ai/history
router.get('/history', async (req, res) => {
  try {
    const user = await verifyAdmin(req)
    const supabase = getSupabaseClient()

    const { data: generations } = await supabase
      .from('eform_generations')
      .select('id, created_at, form_name, form_id, environment, status, version, parent_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    return res.json({ generations: generations || [] })
  } catch (err) {
    console.error('Error en /history:', err)
    res.status(err.message.includes('admin') ? 403 : 500).json({ error: err.message })
  }
})

// GET /api/eform-ai/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await verifyAdmin(req)
    const supabase = getSupabaseClient()

    const { id } = req.params

    const { data: generation } = await supabase
      .from('eform_generations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!generation) {
      return res.status(404).json({ error: 'Generación no encontrada' })
    }

    return res.json({ generation })
  } catch (err) {
    console.error('Error en /[id]:', err)
    res.status(err.message.includes('admin') ? 403 : 500).json({ error: err.message })
  }
})

export default router
