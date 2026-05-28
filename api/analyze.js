// api/analyze.js — Vercel Function
// Lee documentos del briefing + documentos de referencia desde Supabase Storage
// y extrae datos estructurados del proyecto via Claude API

import { createClient } from '@supabase/supabase-js'
import { callAnthropic } from './anthropicClient.js'
import { RATIOS } from './_lib/knowledge/ratios.js'
import { TEXTOS } from './_lib/knowledge/textos_estandar.js'
import { VERTICALES, PREMISAS_COMUNES } from './_lib/knowledge/verticales.js'
import { DOCUMENT_TYPES } from './_lib/knowledge/document-types.js'
import { EFDT_EJEMPLOS } from './_lib/knowledge/efdt_ejemplos.js'
import { EFDT_STYLE_GUIDE, QUALITY_CHECKLIST, PROMPTS_ENHANCEMENT } from './_lib/knowledge/efdt_prompts.js'
import { DOCUMENT_EJEMPLOS, formatearEjemplosParaPrompt } from './_lib/knowledge/document_ejemplos.js'

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

// Construye el system prompt dinámico basado en tipoDoc
function buildSystemPrompt(tipoDoc, verticalKey, verticalData) {
  const docType = DOCUMENT_TYPES[tipoDoc] || DOCUMENT_TYPES.efdt
  const ejemplosInyectados = formatearEjemplosParaPrompt(tipoDoc)

  // Base del prompt adaptada según tipo
  let basePrompt = ''

  if (tipoDoc === 'requirements') {
    basePrompt = `Eres un asistente especializado en la elaboración de Análisis de Requerimientos Funcionales y Técnicos para proyectos Therefore™.

Tu tarea es analizar los documentos de briefing del cliente y extraer de forma estructurada QUÉ necesita (requisitos funcionales, técnicos, de datos, usabilidad).

## INSTRUCCIÓN PRINCIPAL

El Análisis de Requerimientos captura los REQUERIMIENTOS del cliente ANTES de escribir la EFDT (que describe CÓMO se hace).

Estructura esperada:
- Contexto: Cliente, escala, timeline, usuarios
- Requerimientos Funcionales (RF-xxx): Qué debe hacer el sistema
- Requerimientos Técnicos (RT-xxx): Integraciones, performance, disponibilidad
- Requerimientos de Datos: Volúmenes, origen, frecuencia
- Criterios de Aceptación: Escenarios testables
- Supuestos y Riesgos: Qué asumimos, qué puede salir mal`
  } else if (tipoDoc === 'budget') {
    basePrompt = `Eres un especialista en estimación de costes para proyectos Therefore™.

Tu tarea es analizar los documentos de briefing y generar una APROXIMACIÓN ECONÓMICA detallada con desglose de costes por fases.

## INSTRUCCIÓN PRINCIPAL

La Aproximación Económica proporciona un desglose de costes ANTES de comprometer en una EFDT.

Estructura esperada:
- Desglose por fases (Análisis, Implementación, Testing, Formación)
- Tareas detalladas con horas y coste (800€/día = 100€/hora)
- Ratios validados: 0.25d expediente, 0.19d por categoría, 0.5d workflow
- Margen de contingencia apropiado (8-20% según tamaño)
- Análisis de viabilidad vs presupuesto cliente`
  } else if (tipoDoc === 'commercial') {
    basePrompt = `Eres un especialista en propuestas comerciales para proyectos Therefore™.

Tu tarea es generar una OFERTA COMERCIAL formal con términos, condiciones, plazos y precio.

## INSTRUCCIÓN PRINCIPAL

La Oferta Comercial es la propuesta formal que presenta cuando el cliente está listo para comprometerse.

Estructura esperada:
- Descripción del servicio: Qué se entrega exactamente
- Desglose de costes por fases: Análisis, Implementación, Testing, Formación
- Condiciones comerciales: Plazo de pago, timeline, hitos
- Incluido vs NO Incluido: Crítico para evitar discrepancias
- Supuestos críticos y riesgos con mitigación
- Términos de aceptación y vigencia`
  } else if (tipoDoc === 'change-requests') {
    basePrompt = `Eres un especialista en Change Requests y Evolutivos para proyectos Therefore™.

Tu tarea es documentar cambios/ampliaciones en sistemas existentes.

## INSTRUCCIÓN PRINCIPAL

Distinguir:
- **Change Request (CR)**: Cambio pequeño/medio (1-5 días, bajo riesgo)
- **Evolutivo**: Expansión de alcance (5-20 días, riesgo medio-alto)

Estructura esperada:
- Tipo: CR o Evolutivo
- Cambios solicitados: Descripción clara de qué cambia
- Impacto: Qué afecta en el sistema existente
- Estimación detallada: Análisis, desarrollo, testing, regresión
- Testing de regresión: Explícito y obligatorio
- Riesgos: Identificar qué puede fallar en producción`
  } else {
    // EFDT por defecto
    basePrompt = `Eres un asistente especializado en la generación de EFDT (Especificaciones Funcionales y Diseño Técnico) para proyectos Therefore™.

Tu tarea es analizar los documentos de briefing del cliente y extraer toda la información necesaria para generar un documento profesional de alta calidad.

## INSTRUCCIÓN PRINCIPAL

La EFDT describe CÓMO se implementa exactamente la solución Therefore™.

Estructura esperada:
- Cliente y proyecto: Contexto, verticales, timing
- Alcance: Qué se incluye, qué no
- Estructura: Categorías, campos, tablas maestras, workflows
- Estimación: Desglose por tarea, ratios validados
- Riesgos y supuestos: Qué asumimos, qué puede salir mal`
  }

  // Sistema base común a todos los tipos
  const systemPrompt = `${basePrompt}

## CONOCIMIENTO BASE THEREFORE™

### RATIOS DE ESTIMACIÓN — REGLAS ESTRICTAS

TARIFA: 800 €/día · 8 horas/día

Ratios validados:
- Análisis funcional: 1 día
- Expediente principal (15-20 campos): 0.25 días
- Categoría dependiente: 0.19 días
- Workflow simple (4-5 etapas): 0.5 días
- Tabla maestra: 0.1 día
- Integración simple: 1 día
- Integración compleja (SAP): 2-3 días
- Pruebas: 15-25% del desarrollo
- Contingencia pequeño (<5d): 8-10%, mediano (5-15d): 10-15%, grande (>15d): 15-20%

REGLA CRÍTICA: Si el total supera 20 días, revisa a la baja. Los proyectos de preventa son estimaciones conservadoras.

### ESTRUCTURA DE LA VERTICAL: ${verticalKey}
${JSON.stringify(verticalData, null, 2)}

### PREMISAS COMUNES A TODOS LOS PROYECTOS
${JSON.stringify(PREMISAS_COMUNES, null, 2)}

### MODELO DE LICENCIAS Therefore™
- Cases y Workflow Designer: INCLUIDOS en licencia base
- Tipos de usuario: Concurrente, Nominativa, Read-Only Concurrente
- Módulos adicionales: Content Connector, Universal Connector, Smart Capture, Portal

### SEGURIDAD ESTÁNDAR
4 roles asignados a grupos: Administrador, Power User, Escritor, Lector.
Configurable a nivel de expediente, categoría, WF y campo individual.

### NOTAS CRÍTICAS
- Therefore™ NUNCA contabiliza ni opera en ERP. Genera JSON/XML para consumo externo.
- IVA: 21%
- Partidas sin información → pendiente: true
- Los importes se calculan: (horas / 8) * 800

## ESTILOS Y FORMATO

### Tipografía y Sentence Case (CRÍTICO)
Todos los títulos en SENTENCE CASE (primer carácter mayúscula, resto minúsculas):
- Correcto: "Estructura documental", "Flujo de trabajo"
- Incorrecto: "ESTRUCTURA DOCUMENTAL", "Estructura Documental"

### Tablas — Especificación Exacta
- Ancho: 8504 DXA
- Texto: Montserrat 7pt (#404040)
- Cabecera: Fondo #C00000, texto #FFFFFF, Montserrat 7pt bold
- Filas alternas: #FFFFFF / #F2F2F2
- Márgenes celda: 80,80,120,120 (top,bottom,left,right)

### Colores Corporativos
- Rojo Canon: #C00000
- Texto oscuro: #404040
- Gris: #7F7F7F, #F2F2F2

## EJEMPLOS REALES Y PATRONES

${ejemplosInyectados}

## LISTA DE VERIFICACIÓN — CALIDAD DE CONTENIDO

Antes de generar, valida que cumple TODOS estos puntos:
${QUALITY_CHECKLIST.map(item => `- ${item}`).join('\n')}

## FORMATO DE RESPUESTA

Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta. Sin markdown, sin explicaciones adicionales.

El JSON debe incluir SIEMPRE estas secciones:
${JSON.stringify(
  {
    cliente: { nombre: '', razonSocial: '', sector: '', interlocutor: '', cif: '' },
    proyecto: { titulo: '', subtitulo: '', descripcion: '', vertical: verticalKey, tipoDoc, fecha: '', version: 'v1.0' },
    alcance: { descripcionGeneral: '', clavesProyecto: [], exclusiones: [] },
    estructura: { categoriasPrincipales: [], tablasMaestras: [], workflows: [] },
    licencias: { servidor: 1, concurrentes: 0, nominativas: 0, readOnly: 0, modulosAdicionales: [] },
    estimacion: { tareas: [], totalDias: 0, totalHoras: 0, totalImporte: 0, totalConIva: 0, iva: 21 },
    riesgos: [],
    meta: { datosIncompletos: [], advertencias: [], confianza: '' }
  },
  null, 2)}`

  return systemPrompt
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

    // ── SYSTEM PROMPT — DINÁMICO SEGÚN TIPO DE DOCUMENTO ──────────────────
    const systemPrompt = buildSystemPrompt(tipoDoc, verticalKey, verticalData)

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
        // Limpiar prefijo data URL si viene incluido (data:...;base64,XXXX)
        const cleanBase64 = (b64) => b64 ? b64.replace(/^data:[^;]+;base64,/, '') : b64

        // Detectar tipo por nombre además del mime type
        const isPdf  = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')
        const isDocx = file.type?.includes('word') || file.type?.includes('document') ||
                       file.name?.toLowerCase().endsWith('.docx') || file.name?.toLowerCase().endsWith('.doc')
        const isImg  = file.type?.startsWith('image/')

        const b64 = cleanBase64(file.base64)

        if (isPdf && b64) {
          userContent.push({
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: b64 }
          })
        } else if (isDocx && b64) {
          try {
            const buf  = Buffer.from(b64, 'base64')
            const text = await extractDocxText(buf)
            if (text) {
              userContent.push({
                type: 'text',
                text: `[DOCUMENTO WORD: ${file.name}]\n${text}\n`
              })
            }
          } catch (e) {
            userContent.push({
              type: 'text',
              text: `[DOCUMENTO: ${file.name}]\n${file.textContent || '(no se pudo extraer el contenido)'}\n`
            })
          }
        } else if (isImg && b64) {
          userContent.push({
            type: 'image',
            source: { type: 'base64', media_type: file.type, data: b64 }
          })
        } else {
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
    const userId = req.headers['x-user-id'] || null

    const data = await callAnthropic({
      model: 'claude-opus-4-7',
      max_tokens: 16000,  // Increased to handle complex project briefs with detailed analysis
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    }, {
      userId,
      module: 'efdt'
    })

    const rawText = data.content[0].text
    let projectData
    try {
      // Intentar parsear directamente primero
      let clean = rawText.trim()

      // Remover backticks de markdown si existen
      clean = clean.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

      // Si sigue habiendo markdown, extraer solo el JSON
      if (!clean.startsWith('{')) {
        const jsonMatch = clean.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          clean = jsonMatch[0]
        }
      }

      // Intentar parsear
      try {
        projectData = JSON.parse(clean)
      } catch (parseError) {
        // Si falla, intentar limpiar caracteres problemáticos
        // Remover caracteres de control y comillas desordenadas
        clean = clean
          .replace(/[\x00-\x1F\x7F]/g, ' ')  // Control characters
          .replace(/(\r\n|\r|\n)/g, ' ')      // Newlines
          .replace(/"/g, '"')                  // Normalize quotes
          .replace(/"/g, '"')
          .replace(/'/g, "'")
          .replace(/—/g, '-')                  // Em-dash to dash

        projectData = JSON.parse(clean)
      }
    } catch (e) {
      console.error('Parse error:', e.message)
      console.error('Raw response:', rawText.substring(0, 1000))

      // Como último recurso, intentar extraer datos manuales del JSON parcial
      try {
        // Encontrar el último } válido y corttar ahí
        let lastBrace = clean.lastIndexOf('}')
        if (lastBrace > 0) {
          let trimmed = clean.substring(0, lastBrace + 1)
          projectData = JSON.parse(trimmed)
        } else {
          throw e
        }
      } catch (fallbackError) {
        return res.status(500).json({
          error: 'Error al parsear respuesta de Claude: ' + e.message,
          raw: rawText.substring(0, 500),
        })
      }
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
