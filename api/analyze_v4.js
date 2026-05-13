// api/analyze.js — Vercel Function
// Lee documentos del briefing + documentos de referencia desde Supabase Storage
// y extrae datos estructurados del proyecto via Claude API

import { createClient } from '@supabase/supabase-js'
import { RATIOS } from './_lib/knowledge/ratios.js'
import { TEXTOS } from './_lib/knowledge/textos_estandar.js'
import { VERTICALES, PREMISAS_COMUNES } from './_lib/knowledge/verticales.js'

export const config = { maxDuration: 120 }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Mapa vertical → fichero de referencia en Supabase Storage
const REFERENCE_DOCS = {
  notifapp:  'notifapp_referencia.docx',
  hr:        'hr_referencia.docx',
  facturas:  'facturas_referencia.docx',
  sage:      'sage_referencia.docx',
  evolutivo: 'evolutivo_referencia.docx',
  uat:       'uat_referencia.docx',
  generico:  'notifapp_referencia.docx',
}

// Extrae texto plano de un buffer .docx usando mammoth
async function extractDocxText(buffer) {
  try {
    const mammoth = await import('mammoth')
    const result  = await mammoth.extractRawText({ buffer })
    return result.value || ''
  } catch (err) {
    console.warn('mammoth extraction failed:', err.message)
    return ''
  }
}

// Descarga el doc de referencia desde Supabase y extrae su texto
async function fetchReferenceDoc(vertical) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  const filename    = REFERENCE_DOCS[vertical] || REFERENCE_DOCS.generico

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase config missing — skipping reference doc')
    return null
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase.storage
      .from('efdt-references')
      .download(filename)

    if (error) {
      console.warn(`Error downloading ${filename}:`, error.message)
      return null
    }

    const arrayBuffer = await data.arrayBuffer()
    const text = await extractDocxText(Buffer.from(arrayBuffer))
    if (!text) return null

    return { filename, text }

  } catch (err) {
    console.warn('fetchReferenceDoc error:', err.message)
    return null
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
    return res.status(200).end()
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada' })

  try {
    const { vertical, tipoDoc, extraInstructions, files } = req.body
    const verticalKey  = vertical || 'generico'
    const verticalData = VERTICALES[verticalKey] || VERTICALES.generico

    // ── DESCARGAR DOCUMENTO DE REFERENCIA ──────────────────────────────────
    const refDoc = await fetchReferenceDoc(verticalKey)

    // ── SYSTEM PROMPT ───────────────────────────────────────────────────────
    const systemPrompt = `Eres un asistente especializado en la generación de documentos EFDT (Especificaciones Funcionales y Diseño Técnico) para Canon España, S.A.U., partner especializado en implementaciones de Therefore™.

Tu tarea es analizar los documentos de briefing del cliente y el documento de referencia proporcionado, y extraer toda la información necesaria para generar un documento profesional de alta calidad.

## INSTRUCCIÓN PRINCIPAL

El documento de referencia adjunto es un EFDT real y aprobado para la vertical ${verticalKey}. Úsalo como modelo exacto de:
- Nivel de detalle de las descripciones funcionales
- Estructura de secciones y subsecciones
- Redacción y tono profesional de los textos
- Completitud de las tablas maestras y campos
- Descripción de los workflows paso a paso

El documento final debe tener la misma calidad y profundidad que el documento de referencia.

## CONOCIMIENTO BASE THEREFORE™

### RATIOS DE ESTIMACIÓN — REGLAS ESTRICTAS

TARIFA: 800 €/día · 8 horas/día

Ratios validados y aprobados — NO superar estos valores salvo causa justificada:
- Análisis funcional y toma de requisitos: 1 día (8h) — MÁXIMO 2 días si el proyecto es muy complejo
- Case/Expediente principal (15-20 campos): 0,25 días (2h)
- Categoría dependiente por categoría: 0,19 días (1,5h)
- Workflow simple (inicio→revisión→escalado→email): 0,5 días (4h)
- Plantilla Word/Excel adaptada: 0,25 días (2h)
- Configuración Content Connector: 1 día (8h) — máximo 1,5 días (12h) si es complejo
- Pruebas funcionales y ajustes: 1 día (8h)
- Formación usuarios (1 sesión 4h): 0,5 días (4h)
- Tablas maestras (conjunto completo): 1-2 días según número de tablas

EJEMPLOS REALES VALIDADOS para calibrar la estimación:
- NotifAPP genérico (2 WF + tablas maestras + Content Connector): 9,5 días / 7.600€
- HR Expedientes completo (expediente + 12 categorías + 5 WF): ~15 días / 12.000€
- Evolutivo simple (1-2 cambios): 1-3 días / 800-2.400€
- Change Request medio (nueva categoría + WF): 3-5 días / 2.400-4.000€

REGLA CRÍTICA: Si el total calculado supera 20 días para un proyecto estándar, revisa a la baja.
Los proyectos de preventa SIEMPRE son estimaciones conservadoras. El análisis funcional ajustará.

### ESTRUCTURA DE LA VERTICAL: ${verticalKey}
${JSON.stringify(verticalData, null, 2)}

### PREMISAS COMUNES A TODOS LOS PROYECTOS
${JSON.stringify(PREMISAS_COMUNES, null, 2)}

### MODELO DE LICENCIAS
- Cases y Workflow Designer: INCLUIDOS en licencia base del servidor — NO son módulos separados
- Tipos de usuario: Concurrente (pool compartido), Nominativa (usuario asignado), Read-Only Concurrente
- Módulos adicionales (licencia separada): Content Connector, Universal Connector, Smart Capture, Portal

### SEGURIDAD ESTÁNDAR
4 roles asignados a grupos de usuarios: Administrador, Power User, Escritor, Lector.
Configurable a nivel de expediente, categoría, WF y campo individual, con condiciones sobre valores de campos.

### POSICIONALES DE IMAGEN
Cuando el documento de referencia incluya capturas de pantalla, diagramas o figuras, 
indica su posición en los campos de descripción usando este formato exacto:
<<<IMAGEN: descripción de lo que debería mostrar la imagen>>>

Ejemplos:
- <<<IMAGEN: Diagrama de flujo del WF de tramitación de notificaciones>>>
- <<<IMAGEN: Captura de la categoría principal con los campos de indexación>>>
- <<<IMAGEN: Tabla maestra de organismos emisores>>>

### NOTAS CRÍTICAS
- Therefore™ NUNCA contabiliza ni opera directamente en ERP. Genera JSON/XML para consumo externo.
- Tarifa: 800 €/día. IVA: 21%.
- Partidas sin información suficiente → pendiente: true (fondo amarillo en el documento).
- El disclaimer de estimación se aplica globalmente, no por proceso.
- Los importes se calculan como: (horas / 8) * 800. Ejemplo: 4h = 0,5 días = 400€.

## FORMATO DE RESPUESTA

Devuelve ÚNICAMENTE un JSON válido con esta estructura. Sin markdown, sin explicaciones:

{
  "cliente": {
    "nombre": "",
    "razonSocial": "",
    "sector": "",
    "interlocutor": "",
    "cif": ""
  },
  "proyecto": {
    "titulo": "",
    "subtitulo": "",
    "descripcion": "",
    "vertical": "${verticalKey}",
    "tipoDoc": "${tipoDoc || 'efdt'}",
    "fecha": "",
    "version": "v1.0",
    "cabecera": ""
  },
  "alcance": {
    "descripcionGeneral": "",
    "clavesProyecto": [],
    "exclusiones": []
  },
  "estructura": {
    "categoriasPrincipales": [
      { "nombre": "", "descripcion": "", "numCampos": 0, "campos": [] }
    ],
    "tablasMaestras": [
      { "nombre": "", "descripcion": "", "campos": [] }
    ],
    "workflows": [
      { "nombre": "", "descripcion": "", "tipo": "", "etapas": [] }
    ]
  },
  "licencias": {
    "servidor": 1,
    "concurrentes": 0,
    "nominativas": 0,
    "readOnly": 0,
    "modulosAdicionales": []
  },
  "estimacion": {
    "tareas": [
      { "descripcion": "", "dias": 0, "horas": 0, "importe": 0, "pendiente": false }
    ],
    "totalDias": 0,
    "totalHoras": 0,
    "totalImporte": 0,
    "totalConIva": 0,
    "iva": 21
  },
  "riesgos": [
    { "premisa": "", "descripcion": "", "impacto": "" }
  ],
  "meta": {
    "datosIncompletos": [],
    "advertencias": [],
    "confianza": "alta|media|baja"
  }
}`

    // ── CONSTRUIR MENSAJE ───────────────────────────────────────────────────
    const userContent = []

    // 1. Documento de referencia desde Supabase (como texto extraído)
    if (refDoc) {
      userContent.push({
        type: 'text',
        text: `=== DOCUMENTO DE REFERENCIA: ${refDoc.filename} ===
Este es el contenido de un EFDT real y aprobado para la vertical ${verticalKey}.
Úsalo como modelo exacto de calidad, estructura, nivel de detalle y redacción.

${refDoc.text}

=== FIN DOCUMENTO DE REFERENCIA ===`
      })
    }

    // 2. Documentos del briefing del usuario
    if (files && files.length > 0) {
      userContent.push({
        type: 'text',
        text: `--- DOCUMENTOS DEL BRIEFING DEL CLIENTE ---`
      })
      for (const file of files) {
        // Normalizar media_type — el navegador a veces devuelve tipos incorrectos o vacíos
        const isPdf  = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')
        const isDocx = file.type?.includes('word') || file.type?.includes('document') ||
                       file.name?.toLowerCase().endsWith('.docx') || file.name?.toLowerCase().endsWith('.doc')
        const isImg  = file.type?.startsWith('image/')

        if (isPdf && file.base64) {
          // PDF — Claude lo acepta nativamente
          userContent.push({
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: file.base64 }
          })
        } else if (isDocx && file.base64) {
          // Word — extraer texto con mammoth
          try {
            const buf  = Buffer.from(file.base64, 'base64')
            const text = await extractDocxText(buf)
            if (text) {
              userContent.push({
                type: 'text',
                text: `[DOCUMENTO WORD: ${file.name}]\n${text}\n`
              })
            }
          } catch (e) {
            // fallback: enviar como texto si hay textContent
            userContent.push({
              type: 'text',
              text: `[DOCUMENTO: ${file.name}]\n${file.textContent || '(no se pudo extraer el contenido)'}\n`
            })
          }
        } else if (isImg && file.base64) {
          userContent.push({
            type: 'image',
            source: { type: 'base64', media_type: file.type, data: file.base64 }
          })
        } else {
          // HTML, TXT, email u otro — enviar como texto
          userContent.push({
            type: 'text',
            text: `[DOCUMENTO: ${file.name}]\n${file.textContent || '(contenido no disponible como texto)'}\n`
          })
        }
      }
    }

    // 3. Instrucción final
    const today = new Date().toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).replace(/\//g, '.')

    userContent.push({
      type: 'text',
      text: `Vertical: ${verticalKey}
Tipo de documento: ${tipoDoc || 'efdt'}
Fecha de hoy: ${today}
Documento de referencia cargado: ${refDoc ? `SÍ (${refDoc.filename})` : 'NO — usa el conocimiento base'}
${extraInstructions ? `\nInstrucciones adicionales:\n${extraInstructions}` : ''}

Analiza toda la información y genera el JSON estructurado.
Las descripciones funcionales deben tener el mismo nivel de detalle que el documento de referencia.
Solo JSON puro, sin texto adicional.`
    })

    // ── LLAMADA A CLAUDE API ────────────────────────────────────────────────
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 6000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'Error en la API de Anthropic',
      })
    }

    const rawText = data.content[0].text
    let projectData
    try {
      const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      projectData = JSON.parse(clean)
    } catch (e) {
      return res.status(500).json({
        error: 'Error al parsear respuesta de Claude',
        raw: rawText.substring(0, 500),
      })
    }

    projectData.meta = projectData.meta || {}
    projectData.meta.referenciaUsada = refDoc ? refDoc.filename : null

    Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
    return res.status(200).json({ success: true, data: projectData })

  } catch (err) {
    Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
    return res.status(500).json({ error: err.message })
  }
}
