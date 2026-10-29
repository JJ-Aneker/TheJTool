// api/analyze-licensing.js — Vercel Function
// Genera contenido narrativo para documentos de licenciamiento Therefore™
// usando Claude/Bedrock con la base de conocimiento de licencias

import { callBedrock } from './_lib/bedrockClient.js'
import { LICENSING_MODELS, LICENSE_TYPES, CONNECTORS, AI_MODULES, STORAGE_INFO, LICENSING_TEXTS } from './_lib/knowledge/licensing_content.js'
import { LICENSING_STYLE_GUIDE, LICENSING_PROMPT_TEMPLATE } from './_lib/knowledge/licensing_prompts.js'

export const config = {
  maxDuration: 120,
  api: {
    bodyParser: {
      sizeLimit: '2mb'
    }
  }
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Construye el prompt para Claude basado en la cotización
 */
function buildLicensingPrompt(quotationData) {
  const {
    edicion = 'onpremise',
    selectedItems = [],
    sfdcOpp = '',
    dealSupport = '',
    fecha = new Date().toLocaleDateString('es-ES'),
    anosContrato = 1,
    cliente = 'Cliente',
    sector = 'General',
    contexto = ''
  } = quotationData

  // Detectar licencias incluidas
  const licencias = selectedItems.filter(item =>
    item.codigo?.includes('THE.LIC') || item.descripcion?.toLowerCase().includes('licencia')
  )

  // Detectar módulos/conectores incluidos
  const modulos = selectedItems.filter(item =>
    item.codigo?.includes('THE.EA') || item.codigo?.includes('THE.IA')
  )

  // Construir detalle de licencias
  const licenciasDetalle = licencias.map(lic =>
    `- ${lic.descripcion}: ${lic.cantidad} unidad(es)`
  ).join('\n')

  // Construir detalle de módulos
  const modulosIncluidos = modulos.map(mod =>
    `- ${mod.codigo}: ${mod.descripcion}`
  ).join('\n')

  // Detectar módulos disponibles pero NO incluidos
  const codigosIncluidos = new Set(modulos.map(m => m.codigo))
  const modulosDisponibles = []

  // Revisar conectores no incluidos
  for (const [key, connector] of Object.entries(CONNECTORS)) {
    if (!codigosIncluidos.has(connector.code)) {
      modulosDisponibles.push(`${connector.code} - ${connector.name}: ${connector.tagline}`)
    }
  }

  // Revisar módulos IA no incluidos
  for (const [key, module] of Object.entries(AI_MODULES)) {
    if (!codigosIncluidos.has(module.code)) {
      modulosDisponibles.push(`${module.code} - ${module.name}: ${module.tagline}`)
    }
  }

  // Obtener información del modelo de licenciamiento
  const modeloInfo = LICENSING_MODELS[edicion] || LICENSING_MODELS.onpremise

  // Construir prompt completo
  const prompt = LICENSING_PROMPT_TEMPLATE
    .replace('{cliente}', cliente)
    .replace('{sector}', sector)
    .replace('{contexto}', contexto || 'Necesidad de mejorar la gestión documental empresarial')
    .replace('{modelo}', modeloInfo.model)
    .replace('{edicion}', modeloInfo.name)
    .replace('{licencias_detalle}', licenciasDetalle || 'No se especificaron licencias')
    .replace('{modulos_incluidos}', modulosIncluidos || 'No se incluyeron módulos adicionales')
    .replace('{anos_contrato}', `${anosContrato} año(s)`)
    .replace('{modulos_disponibles}', modulosDisponibles.length > 0
      ? `Módulos disponibles no incluidos en esta cotización:\n${modulosDisponibles.join('\n')}`
      : 'No hay módulos adicionales sugeridos en este momento'
    )

  return `${LICENSING_STYLE_GUIDE}\n\n---\n\n${prompt}`
}

/**
 * POST handler principal
 */
export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({})
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('[ANALYZE-LICENSING] Iniciando análisis...')

    const quotationData = req.body

    if (!quotationData || !quotationData.selectedItems) {
      return res.status(400).json({
        error: 'Faltan datos de la cotización',
        details: 'Se requiere selectedItems en el body'
      })
    }

    console.log('[ANALYZE-LICENSING] Generando prompt para Claude...')
    const prompt = buildLicensingPrompt(quotationData)

    console.log('[ANALYZE-LICENSING] Llamando a Claude/Bedrock...')
    const startTime = Date.now()

    const response = await callBedrock({
      prompt,
      modelId: process.env.EFORM_AI_MODEL_ID || 'anthropic.claude-sonnet-4-5-v2:0',
      maxTokens: 4000,
      temperature: 0.3, // Más conservador para contenido profesional
      systemPrompt: 'Eres un consultor senior de soluciones Therefore™ especializado en propuestas de licenciamiento. Generas contenido profesional, específico al cliente y orientado al valor de negocio.'
    })

    const duration = Date.now() - startTime
    console.log(`[ANALYZE-LICENSING] ✅ Respuesta recibida en ${duration}ms`)

    // Intentar parsear la respuesta como JSON
    let generatedContent
    try {
      // Limpiar posibles markdown wrappers
      const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      generatedContent = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error('[ANALYZE-LICENSING] Error parsing JSON:', parseError)
      console.log('[ANALYZE-LICENSING] Raw response:', response.substring(0, 500))

      // Fallback: devolver respuesta cruda
      generatedContent = {
        contexto_cliente: 'Error al parsear respuesta de Claude',
        solucion_propuesta: response.substring(0, 1000),
        componentes: {},
        beneficios: [],
        modulos_adicionales: {}
      }
    }

    // Combinar con datos originales
    const result = {
      ...quotationData,
      generatedContent,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: process.env.EFORM_AI_MODEL_ID || 'anthropic.claude-sonnet-4-5-v2:0',
        duration,
        tokensEstimated: Math.ceil(prompt.length / 4) + Math.ceil(response.length / 4)
      }
    }

    console.log('[ANALYZE-LICENSING] ✅ Análisis completado')

    return res.status(200).json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('[ANALYZE-LICENSING] ❌ Error:', error)

    return res.status(500).json({
      error: 'Error en análisis de licenciamiento',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
