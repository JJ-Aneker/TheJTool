// api/parse-licensing-request.js — Vercel Function
// Parsea solicitudes en lenguaje natural para el configurador de licencias
// usando Claude para extraer productos, cantidades y servicios

import { callBedrock } from './_lib/bedrockClient.js'

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  }
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const PARSING_PROMPT = `
Eres un asistente especializado en parsear solicitudes de cotización de licencias Therefore™.

Tu tarea es analizar el texto de la solicitud y extraer la información estructurada.

## REGLAS DE INTERPRETACIÓN

### Ediciones (modelo de licenciamiento)
- "onpremise", "on-premise", "perpetua", "capex" → edicion: "onpremise"
- "online", "cloud", "saas", "nube" → edicion: "online"
- "suscripción", "subscription", "suscripcion" → edicion: "suscripcion"

### Tipos de Licencia
- "licencias concurrentes", "flotantes", "compartidas", "concurrentes" → tipo: "concurrente"
- "licencias nominales", "nominativas", "dedicadas", "nominales" → tipo: "nominal"
- "licencias readonly", "solo lectura", "read-only", "lectura" → tipo: "readonly"

### Productos y Servicios Comunes
- "consultoría", "consultoria", "jornadas de consultoría" → buscar productos con "consultoría"
- "implementación", "implementacion", "despliegue" → buscar productos con "implementación"
- "formación", "formacion", "training" → buscar productos con "formación"
- "content connector", "conector de contenido" → THE.EA.CC
- "universal connector" → THE.EA.UC
- "smart capture" → THE.EA.SC
- "document intelligence" → THE.EA.DI
- "sap connector" → THE.EA.SAP
- "dynamics connector" → THE.EA.DYN
- "sharepoint connector" → THE.EA.SP

### Servicios Personalizados
- Cuando se mencione "servicio de X (cantidad)" o "X por valor de Y"
- Formato: nombre del servicio + importe (si se especifica)

### Información del Cliente
- Sector, industria, número de empleados, necesidades específicas

## FORMATO DE SALIDA

Devuelve SOLO un objeto JSON con esta estructura exacta:

{
  "edicion": "onpremise" | "online" | "suscripcion",
  "licencias": [
    {
      "tipo": "concurrente" | "nominal" | "readonly",
      "cantidad": number,
      "descripcion_original": "texto donde se detectó"
    }
  ],
  "productos": [
    {
      "descripcion": "descripción del producto buscado",
      "cantidad": number,
      "codigo_sugerido": "código si se puede identificar" | null
    }
  ],
  "servicios_personalizados": [
    {
      "descripcion": "nombre del servicio",
      "importe": number | null,
      "notas": "información adicional"
    }
  ],
  "cliente": {
    "sector": "sector identificado" | null,
    "empleados": number | null,
    "contexto": "necesidades o características mencionadas"
  },
  "anos_contrato": number | 1,
  "notas_adicionales": "cualquier información relevante no estructurada"
}

## IMPORTANTE
- Si NO detectas algún campo, usa null o array vacío []
- Las cantidades deben ser números, no strings
- Sé permisivo con variaciones ortográficas
- Si hay ambigüedad, indica en notas_adicionales
- Devuelve SOLO el JSON, sin markdown ni explicaciones

---

SOLICITUD A PARSEAR:

{solicitud}
`

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({})
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('[PARSE-LICENSING] Iniciando parsing...')

    const { solicitud } = req.body

    if (!solicitud || typeof solicitud !== 'string') {
      return res.status(400).json({
        error: 'Falta el campo solicitud',
        details: 'Se requiere un string con la solicitud en lenguaje natural'
      })
    }

    if (solicitud.trim().length < 10) {
      return res.status(400).json({
        error: 'Solicitud demasiado corta',
        details: 'La solicitud debe tener al menos 10 caracteres'
      })
    }

    console.log('[PARSE-LICENSING] Solicitud:', solicitud.substring(0, 200))

    const prompt = PARSING_PROMPT.replace('{solicitud}', solicitud)

    console.log('[PARSE-LICENSING] Llamando a Claude...')
    const startTime = Date.now()

    const response = await callBedrock({
      prompt,
      modelId: process.env.EFORM_AI_MODEL_ID || 'anthropic.claude-sonnet-4-5-v2:0',
      maxTokens: 2000,
      temperature: 0.1, // Muy conservador para parsing preciso
      systemPrompt: 'Eres un parser especializado en extraer información estructurada de solicitudes de cotización. Devuelves SOLO JSON válido, sin markdown ni explicaciones.'
    })

    const duration = Date.now() - startTime
    console.log(`[PARSE-LICENSING] ✅ Respuesta en ${duration}ms`)

    // Limpiar y parsear JSON
    let parsedData
    try {
      const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      parsedData = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error('[PARSE-LICENSING] Error parsing JSON:', parseError)
      console.log('[PARSE-LICENSING] Raw response:', response.substring(0, 500))

      return res.status(500).json({
        error: 'Error al parsear respuesta de Claude',
        details: parseError.message,
        rawResponse: response.substring(0, 500)
      })
    }

    // Validar estructura básica
    if (!parsedData.edicion && !parsedData.licencias && !parsedData.productos) {
      console.warn('[PARSE-LICENSING] Respuesta sin datos útiles')
    }

    console.log('[PARSE-LICENSING] ✅ Parsing completado')
    console.log('[PARSE-LICENSING] Detectado:', {
      edicion: parsedData.edicion,
      licencias: parsedData.licencias?.length || 0,
      productos: parsedData.productos?.length || 0,
      servicios: parsedData.servicios_personalizados?.length || 0
    })

    return res.status(200).json({
      success: true,
      data: parsedData,
      metadata: {
        parsedAt: new Date().toISOString(),
        duration,
        solicitudLength: solicitud.length
      }
    })

  } catch (error) {
    console.error('[PARSE-LICENSING] ❌ Error:', error)

    return res.status(500).json({
      error: 'Error en parsing de solicitud',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
