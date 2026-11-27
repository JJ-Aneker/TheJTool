// api/rfp-api.js — Consolidated RFP API endpoints
// Combina: analyze-rfp, rfp-sections, rfp-dashboard, rfp-generate-docs

import '../config/env.js'
import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { callBedrock } from './_lib/bedrockClient.js'
import multer from 'multer'
import { PDFExtract } from 'pdf.js-extract'
import mammoth from 'mammoth'
import fs from 'fs'
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType
} from 'docx'

const router = express.Router()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
)

const upload = multer({ dest: '/tmp/' })

// ============================================================================
// ANALYZE RFP (from analyze-rfp.js)
// ============================================================================

async function extractPdfText(filePath) {
  const pdfExtract = new PDFExtract()
  const data = await pdfExtract.extract(filePath)

  let text = ''
  data.pages.forEach((page, pageNum) => {
    text += `\n\n--- Página ${pageNum + 1} ---\n\n`
    page.content.forEach(item => {
      if (item.str) text += item.str + ' '
    })
  })

  return text
}

async function extractDocxText(filePath) {
  const result = await mammoth.extractRawText({ path: filePath })
  return result.value
}

async function analyzeWithBedrock(text, fileName, userId) {
  const userPrompt = `Nombre del archivo: ${fileName}

Texto del pliego:
${text.substring(0, 50000)} ${text.length > 50000 ? '...[truncado]' : ''}

Responde ÚNICAMENTE en formato JSON válido con la estructura especificada.`

  const systemPrompt = `Eres un experto en análisis de RFPs (Request for Proposal) para proyectos de TI.

Analiza el pliego de RFP y extrae:

1. **Viabilidad** (alta/media/baja): Evalúa si un producto DMS (Document Management System) como Therefore™ puede cubrir los requisitos. Considera:
   - Si la RFP pide funcionalidades específicas de DMS (archivo, búsqueda, workflow, retención) → viabilidad ALTA
   - Si la RFP pide funcionalidades que requieren desarrollo adicional (portales web, integraciones complejas) → viabilidad MEDIA
   - Si la RFP pide un producto completamente diferente (facturación electrónica, ERP, CRM) → viabilidad BAJA

2. **Razón de viabilidad**: Justificación en 2-3 frases de por qué esa viabilidad.

3. **Plazos críticos**: Extrae fechas clave del calendario (deadline de propuesta, consultas, inicio de servicio).

4. **Riesgos principales**: Lista 3-5 riesgos contractuales o técnicos (SLA exigentes, penalizaciones, requisitos de seguridad IT-STD/SIEM/SBOM, etc.).

5. **Requisitos técnicos**: Lista 5-8 requisitos técnicos clave mencionados en el pliego.

6. **Secciones de trabajo**: Divide el alcance del proyecto en 8-15 secciones y asigna cada una a UN área especializada:
   - Comercial: propuestas económicas, pricing, contratos
   - Técnica: arquitectura, integraciones, desarrollo
   - Legal: compliance, cláusulas contractuales, RGPD
   - Marketing: branding, comunicación, demos
   - Seguridad IT / GDPR: IT-STD, SIEM, cifrado, privacidad
   - Medio Ambiente: sostenibilidad, certificaciones ambientales
   - Operaciones: implementación, soporte, mantenimiento
   - Otra: cualquier área que no encaje en las anteriores

**IMPORTANTE**: Detecta si la RFP pide cosas que un DMS NO hace (ej: "facturación electrónica", "plataforma SEFE", "ERP", "CRM"). Si es así, viabilidad BAJA.

Formato de respuesta JSON:
{
  "viability": "alta" | "media" | "baja",
  "viability_reason": "...",
  "deadlines": {
    "deadline": "YYYY-MM-DD o null",
    "milestones": [{"date": "YYYY-MM-DD", "description": "..."}]
  },
  "risks": [
    {"risk": "...", "severity": "high|medium|low", "description": "..."}
  ],
  "technical_requirements": ["req1", "req2", ...],
  "sections": [
    {"section_name": "...", "area": "Comercial|Técnica|Legal|Marketing|Seguridad IT / GDPR|Medio Ambiente|Operaciones|Otra", "priority": "critical|optional"}
  ]
}`

  const response = await callBedrock({
    model: 'claude-haiku-4-5-20251001',
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    max_tokens: 4096
  }, {
    userId,
    module: 'rfp-analyzer'
  })

  const content = response.content[0].text

  try {
    return JSON.parse(content)
  } catch (e) {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch) return JSON.parse(jsonMatch[1])

    const jsonMatch2 = content.match(/\{[\s\S]*\}/)
    if (jsonMatch2) return JSON.parse(jsonMatch2[0])

    throw new Error('No se pudo extraer JSON de la respuesta de Bedrock')
  }
}

// POST /api/analyze-rfp
router.post('/analyze-rfp', upload.array('files', 5), async (req, res) => {
  try {
    const { name } = req.body
    const files = req.files

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No se subieron archivos' })
    }

    if (!name) {
      return res.status(400).json({ error: 'Falta el nombre de la RFP' })
    }

    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    // Upload files to Supabase Storage
    const uploadedFiles = []

    for (const file of files) {
      const fileName = `${user.id}/${Date.now()}_${file.originalname}`
      const fileBuffer = fs.readFileSync(file.path)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('rfp-documents')
        .upload(fileName, fileBuffer, {
          contentType: file.mimetype,
          upsert: false
        })

      if (uploadError) {
        console.error('Error uploading to Supabase:', uploadError)
        files.forEach(f => fs.unlinkSync(f.path))
        return res.status(500).json({ error: 'Error al subir archivos a Storage' })
      }

      const { data: { publicUrl } } = supabase.storage
        .from('rfp-documents')
        .getPublicUrl(fileName)

      uploadedFiles.push({
        name: file.originalname,
        url: publicUrl,
        path: fileName
      })
    }

    // Create RFP immediately with status "nueva" (before analysis)
    const { data: rfpData, error: rfpError } = await supabase
      .from('rfp_analyses')
      .insert({
        user_id: user.id,
        name,
        files_urls: uploadedFiles,
        status: 'nueva' // Will update to "analizada" after processing
      })
      .select()
      .single()

    if (rfpError) {
      console.error('Error saving RFP:', rfpError)
      return res.status(500).json({ error: 'Error al guardar RFP' })
    }

    // Clean up temp files
    files.forEach(f => fs.unlinkSync(f.path))

    // RESPOND IMMEDIATELY (avoids 60s timeout)
    res.json(rfpData)

    // Continue processing in background (after response sent)
    const processAnalysis = async () => {
      try {
        const firstFile = files[0]
        let extractedText = ''

        // Download from storage for processing
        const { data: fileData } = await supabase.storage
          .from('rfp-documents')
          .download(uploadedFiles[0].path)

        const buffer = Buffer.from(await fileData.arrayBuffer())
        const tempPath = `/tmp/temp_${Date.now()}_${firstFile.originalname}`
        fs.writeFileSync(tempPath, buffer)

        if (firstFile.mimetype === 'application/pdf') {
          extractedText = await extractPdfText(tempPath)
        } else if (firstFile.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          extractedText = await extractDocxText(tempPath)
        }

        fs.unlinkSync(tempPath)

        // Analyze with Bedrock
        const analysis = await analyzeWithBedrock(extractedText, firstFile.originalname, user.id)

        // Update RFP with analysis results
        await supabase
          .from('rfp_analyses')
          .update({
            viability: analysis.viability,
            viability_reason: analysis.viability_reason,
            deadlines: analysis.deadlines,
            risks: analysis.risks,
            technical_requirements: analysis.technical_requirements,
            status: 'analizada'
          })
          .eq('id', rfpData.id)

      } catch (error) {
        console.error('Background analysis error:', error)
        // Update status to show error
        await supabase
          .from('rfp_analyses')
          .update({ status: 'error_analisis' })
          .eq('id', rfpData.id)
      }
    }

    // Start background processing (don't await)
    processAnalysis().catch(err => console.error('Process error:', err))

    // Save sections
    const sectionsToInsert = analysis.sections.map((section, index) => ({
      rfp_id: rfpData.id,
      section_name: section.section_name,
      area: section.area,
      priority: section.priority || 'optional',
      status: 'pending',
      order_index: index
    }))

    const { error: sectionsError } = await supabase
      .from('rfp_sections')
      .insert(sectionsToInsert)

    if (sectionsError) {
      console.error('Error saving sections:', sectionsError)
      return res.status(500).json({ error: 'Error al guardar las secciones' })
    }

    // Cleanup temp files
    files.forEach(file => {
      try {
        fs.unlinkSync(file.path)
      } catch (e) {
        // Ignore
      }
    })

    res.json({
      success: true,
      rfp_id: rfpData.id,
      analysis: {
        viability: rfpData.viability,
        viability_reason: rfpData.viability_reason,
        deadlines: rfpData.deadlines,
        risks: rfpData.risks,
        technical_requirements: rfpData.technical_requirements
      }
    })

  } catch (error) {
    console.error('Error analyzing RFP:', error)

    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path)
        } catch (e) {
          // Ignore
        }
      })
    }

    res.status(500).json({ error: error.message || 'Error al analizar la RFP' })
  }
})

// GET /api/analyze-rfp - List user's RFPs
router.get('/analyze-rfp', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    const { data, error } = await supabase
      .from('rfp_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json(data)
  } catch (error) {
    console.error('Error fetching RFPs:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/analyze-rfp/:id - Get specific RFP with sections
router.get('/analyze-rfp/:id', async (req, res) => {
  try {
    const { id } = req.params

    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    const { data: rfp, error: rfpError } = await supabase
      .from('rfp_analyses')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (rfpError || !rfp) {
      return res.status(404).json({ error: 'RFP no encontrada' })
    }

    const { data: sections, error: sectionsError } = await supabase
      .from('rfp_sections')
      .select('*')
      .eq('rfp_id', id)
      .order('order_index', { ascending: true })

    if (sectionsError) {
      return res.status(500).json({ error: sectionsError.message })
    }

    res.json({
      ...rfp,
      sections
    })
  } catch (error) {
    console.error('Error fetching RFP:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================================================
// RFP SECTIONS (from rfp-sections.js)
// ============================================================================

// PUT /api/rfp-sections/:id
router.put('/rfp-sections/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { area, responsible_user_id, priority, status, order_index } = req.body

    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    const { data: section, error: sectionError } = await supabase
      .from('rfp_sections')
      .select('rfp_id')
      .eq('id', id)
      .single()

    if (sectionError || !section) {
      return res.status(404).json({ error: 'Sección no encontrada' })
    }

    const { data: rfp, error: rfpError } = await supabase
      .from('rfp_analyses')
      .select('user_id')
      .eq('id', section.rfp_id)
      .single()

    if (rfpError || !rfp || rfp.user_id !== user.id) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta sección' })
    }

    const updateData = {}
    if (area !== undefined) updateData.area = area
    if (responsible_user_id !== undefined) updateData.responsible_user_id = responsible_user_id
    if (priority !== undefined) updateData.priority = priority
    if (status !== undefined) updateData.status = status
    if (order_index !== undefined) updateData.order_index = order_index

    const { data, error } = await supabase
      .from('rfp_sections')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json(data)
  } catch (error) {
    console.error('Error updating section:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================================================
// RFP DASHBOARD (from rfp-dashboard.js)
// ============================================================================

// GET /api/rfp-dashboard
router.get('/rfp-dashboard', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    const { data: stats, error: statsError } = await supabase
      .from('rfp_dashboard_stats')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (statsError && statsError.code !== 'PGRST116') {
      console.error('Error obteniendo stats:', statsError)
      return res.status(500).json({ error: statsError.message })
    }

    const defaultStats = {
      total_rfps: 0,
      viability_alta: 0,
      viability_media: 0,
      viability_baja: 0,
      status_nueva: 0,
      status_analizada: 0,
      status_revisada: 0,
      status_en_decision: 0,
      status_archivada: 0,
      decision_go: 0,
      decision_no_go: 0
    }

    const { data: upcomingDeadlines, error: deadlinesError } = await supabase
      .from('rfp_analyses')
      .select('id, name, deadlines, viability, status')
      .eq('user_id', user.id)
      .not('deadlines', 'is', null)
      .order('created_at', { ascending: false })

    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const upcoming = (upcomingDeadlines || [])
      .filter(rfp => {
        const deadline = rfp.deadlines?.deadline
        if (!deadline) return false
        const deadlineDate = new Date(deadline)
        return deadlineDate >= now && deadlineDate <= thirtyDaysFromNow
      })
      .map(rfp => ({
        id: rfp.id,
        name: rfp.name,
        deadline: rfp.deadlines.deadline,
        viability: rfp.viability,
        status: rfp.status,
        daysUntil: Math.ceil((new Date(rfp.deadlines.deadline) - now) / (1000 * 60 * 60 * 24))
      }))
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 5)

    res.json({
      stats: stats || defaultStats,
      upcomingDeadlines: upcoming
    })

  } catch (error) {
    console.error('Error en rfp-dashboard:', error)
    res.status(500).json({ error: error.message })
  }
})

// PATCH /api/rfp-status/:id
router.patch('/rfp-status/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { status, decision, decision_reason } = req.body

    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    const { data: rfp, error: rfpError } = await supabase
      .from('rfp_analyses')
      .select('user_id')
      .eq('id', id)
      .single()

    if (rfpError || !rfp || rfp.user_id !== user.id) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta RFP' })
    }

    const updateData = {}
    if (status) updateData.status = status
    if (decision) {
      updateData.decision = decision
      updateData.decision_date = new Date().toISOString()
    }
    if (decision_reason) updateData.decision_reason = decision_reason

    const { data, error } = await supabase
      .from('rfp_analyses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json(data)
  } catch (error) {
    console.error('Error actualizando estado:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================================================
// GENERATE DOCS (from rfp-generate-docs.js - simplified)
// ============================================================================

const C = { RED: 'C00000', DARK: '404040', GREY: '7F7F7F', LGREY: 'F2F2F2', GREEN: '10b981', ORANGE: 'ea580c' }
const bdr = (color = 'CCCCCC') => ({ style: BorderStyle.SINGLE, size: 1, color })
const BDRS = (color = 'CCCCCC') => ({ top: bdr(color), bottom: bdr(color), left: bdr(color), right: bdr(color) })

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, size: 32, bold: true, color: C.DARK })]
  })
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 120 },
    children: [new TextRun({ text, size: 26, bold: true, color: C.DARK })]
  })
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.sa || 120, before: opts.sb || 0 },
    children: [new TextRun({
      text: text || '',
      size: opts.size || 20,
      color: opts.color || C.DARK,
      bold: opts.bold || false
    })]
  })
}

function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 20, color: C.DARK })]
  })
}

// POST /api/rfp-generate-viability/:id
router.post('/rfp-generate-viability/:id', async (req, res) => {
  try {
    const { id } = req.params

    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    const { data: rfp, error: rfpError } = await supabase
      .from('rfp_analyses')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (rfpError || !rfp) {
      return res.status(404).json({ error: 'RFP no encontrada' })
    }

    // Cargar datos avanzados
    const { data: scoring } = await supabase
      .from('rfp_scoring')
      .select('*')
      .eq('rfp_id', id)
      .single()

    const { data: requirements } = await supabase
      .from('rfp_requirements')
      .select('*')
      .eq('rfp_id', id)
      .order('priority', { ascending: false })

    const { data: riskClauses } = await supabase
      .from('rfp_risk_clauses')
      .select('*')
      .eq('rfp_id', id)
      .order('risk_level', { ascending: true })

    const sections = []

    sections.push(
      h1('INFORME DE VIABILIDAD'),
      p(rfp.name, { size: 24, bold: true }),
      p(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, { sa: 400 })
    )

    sections.push(
      h1('RESUMEN EJECUTIVO'),
      h2('Viabilidad Detectada'),
      p(`Nivel: ${rfp.viability?.toUpperCase() || 'N/A'}`, { bold: true }),
      p(rfp.viability_reason || 'No disponible', { sa: 240 })
    )

    if (rfp.deadlines) {
      sections.push(
        h2('Plazos Críticos'),
        p(`Deadline principal: ${rfp.deadlines.deadline || 'No especificado'}`, { bold: true })
      )

      if (rfp.deadlines.milestones && rfp.deadlines.milestones.length > 0) {
        sections.push(p('Hitos importantes:', { bold: true, sb: 120 }))
        rfp.deadlines.milestones.forEach(m => {
          sections.push(bullet(`${m.date}: ${m.description}`))
        })
      }
      sections.push(p('', { sa: 240 }))
    }

    if (rfp.risks && rfp.risks.length > 0) {
      sections.push(h2('Riesgos Principales'))

      const risksBySeverity = {
        high: rfp.risks.filter(r => r.severity === 'high'),
        medium: rfp.risks.filter(r => r.severity === 'medium'),
        low: rfp.risks.filter(r => r.severity === 'low')
      }

      if (risksBySeverity.high.length > 0) {
        sections.push(p('⚠️ Riesgos ALTOS:', { bold: true, color: C.RED, sb: 120 }))
        risksBySeverity.high.forEach(r => {
          sections.push(bullet(`${r.risk}${r.description ? ': ' + r.description : ''}`))
        })
      }

      if (risksBySeverity.medium.length > 0) {
        sections.push(p('⚡ Riesgos MEDIOS:', { bold: true, color: C.ORANGE, sb: 120, sa: 160 }))
        risksBySeverity.medium.forEach(r => {
          sections.push(bullet(`${r.risk}${r.description ? ': ' + r.description : ''}`))
        })
      }

      sections.push(p('', { sa: 240 }))
    }

    if (rfp.technical_requirements && rfp.technical_requirements.length > 0) {
      sections.push(
        h2('Requisitos Técnicos Clave'),
        p('Los siguientes requisitos técnicos han sido identificados:', { sb: 120 })
      )
      rfp.technical_requirements.forEach(req => {
        sections.push(bullet(req))
      })
      sections.push(p('', { sa: 240 }))
    }

    // SCORING DE DECISIÓN
    if (scoring) {
      sections.push(
        h1('SCORING DE DECISIÓN'),
        p('Análisis cuantitativo de viabilidad:', { sb: 160 })
      )

      const scoreComponents = [
        { label: 'Viabilidad Técnica (30%)', value: scoring.viabilidad_tecnica },
        { label: 'Margen Esperado (25%)', value: scoring.margen_esperado },
        { label: 'Expertise Equipo (20%)', value: scoring.expertise_equipo },
        { label: 'Riesgo Contractual (15%)', value: scoring.riesgo_contractual },
        { label: 'Timeline Factible (10%)', value: scoring.timeline_factible }
      ]

      scoreComponents.forEach(comp => {
        sections.push(p(`${comp.label}: ${comp.value}/100`, { sb: 80 }))
      })

      sections.push(
        p(`PUNTUACIÓN TOTAL: ${scoring.score_total}/100`, { bold: true, size: 14, sa: 160, sb: 160 })
      )

      const recommendationText = {
        go: '✅ GO - Se recomienda presentar oferta',
        review: '⚠️ REVIEW - Evaluación adicional necesaria',
        no_go: '❌ NO-GO - No se recomienda presentar oferta'
      }

      const recommendationColor = {
        go: C.GREEN,
        review: C.ORANGE,
        no_go: C.RED
      }

      sections.push(
        p(recommendationText[scoring.recommendation] || 'N/A', {
          bold: true,
          color: recommendationColor[scoring.recommendation] || C.BLACK,
          sa: 160
        })
      )

      if (scoring.notes) {
        sections.push(
          p('Notas del análisis:', { bold: true, sb: 120 }),
          p(scoring.notes, { sa: 240 })
        )
      }
    }

    // REQUISITOS DETALLADOS
    if (requirements && requirements.length > 0) {
      sections.push(
        h1('ANÁLISIS DETALLADO DE REQUISITOS'),
        p(`Total de requisitos identificados: ${requirements.length}`, { sb: 160 })
      )

      const coverageStats = {
        nativo: requirements.filter(r => r.therefore_coverage === 'nativo').length,
        desarrollo: requirements.filter(r => r.therefore_coverage === 'desarrollo').length,
        integracion: requirements.filter(r => r.therefore_coverage === 'integracion').length,
        no_aplica: requirements.filter(r => r.therefore_coverage === 'no_aplica').length
      }

      sections.push(
        p('Cobertura Therefore™:', { bold: true, sb: 120 }),
        bullet(`Requisitos nativos: ${coverageStats.nativo} (${Math.round(coverageStats.nativo/requirements.length*100)}%)`),
        bullet(`Requiere desarrollo: ${coverageStats.desarrollo} (${Math.round(coverageStats.desarrollo/requirements.length*100)}%)`),
        bullet(`Requiere integración: ${coverageStats.integracion} (${Math.round(coverageStats.integracion/requirements.length*100)}%)`),
        p('', { sa: 240 })
      )

      const highPriority = requirements.filter(r => r.priority >= 8)
      if (highPriority.length > 0) {
        sections.push(
          p('Requisitos de Alta Prioridad (≥8):', { bold: true, sb: 120 })
        )
        highPriority.slice(0, 10).forEach(req => {
          const coverageLabel = {
            nativo: '✓ Nativo',
            desarrollo: '⚒ Desarrollo',
            integracion: '🔗 Integración',
            no_aplica: '— N/A'
          }
          sections.push(
            bullet(`[P${req.priority}] ${req.requirement_text.substring(0, 100)}${req.requirement_text.length > 100 ? '...' : ''}`),
            p(`   Cobertura: ${coverageLabel[req.therefore_coverage] || 'N/A'} | Esfuerzo: ${req.effort_level || 'N/A'}`, { sb: 80 })
          )
        })
        sections.push(p('', { sa: 240 }))
      }
    }

    // ANÁLISIS DE RIESGO DETALLADO
    if (riskClauses && riskClauses.length > 0) {
      sections.push(
        h1('ANÁLISIS DE CLÁUSULAS DE RIESGO'),
        p(`Total de cláusulas identificadas: ${riskClauses.length}`, { sb: 160 })
      )

      const highRisk = riskClauses.filter(c => c.risk_level === 'alto')
      if (highRisk.length > 0) {
        sections.push(
          p(`⚠️ CLÁUSULAS DE ALTO RIESGO: ${highRisk.length}`, { bold: true, color: C.RED, sb: 120 })
        )
        highRisk.forEach(clause => {
          const typeLabel = {
            penalizacion: '💰 Penalización',
            garantia: '📋 Garantía',
            exclusividad: '🔒 Exclusividad',
            restrictivo: '⚠️ Restrictivo',
            oportunidad: '✨ Oportunidad'
          }
          sections.push(
            p(`${typeLabel[clause.clause_type] || clause.clause_type}:`, { bold: true, sb: 80 }),
            p(`"${clause.clause_text.substring(0, 200)}${clause.clause_text.length > 200 ? '...' : ''}"`, { italic: true, sb: 80 })
          )
          if (clause.recommendation) {
            sections.push(
              p(`Recomendación: ${clause.recommendation}`, { sb: 160 })
            )
          }
        })
        sections.push(p('', { sa: 240 }))
      }

      const mediumRisk = riskClauses.filter(c => c.risk_level === 'medio')
      if (mediumRisk.length > 0) {
        sections.push(
          p(`⚡ Cláusulas de Riesgo Medio: ${mediumRisk.length}`, { bold: true, color: C.ORANGE, sb: 120 })
        )
        mediumRisk.slice(0, 5).forEach(clause => {
          sections.push(
            bullet(`${clause.clause_text.substring(0, 150)}${clause.clause_text.length > 150 ? '...' : ''}`)
          )
        })
        sections.push(p('', { sa: 240 }))
      }
    }

    sections.push(h1('RECOMENDACIÓN FINAL'), p('Basado en el análisis realizado:', { sb: 120 }))

    if (rfp.viability === 'alta') {
      sections.push(
        p('✅ SE RECOMIENDA PRESENTAR OFERTA', { bold: true, color: C.GREEN, sa: 160 }),
        p('Therefore™ DMS puede cubrir los requisitos principales del pliego. Se recomienda proceder con la elaboración de una EFDT detallada y propuesta comercial.')
      )
    } else if (rfp.viability === 'media') {
      sections.push(
        p('⚠️ EVALUACIÓN ADICIONAL NECESARIA', { bold: true, color: C.ORANGE, sa: 160 }),
        p('Therefore™ DMS puede cubrir parte de los requisitos, pero se requiere desarrollo adicional. Se recomienda realizar un análisis de requerimientos detallado antes de comprometer.')
      )
    } else {
      sections.push(
        p('❌ NO SE RECOMIENDA PRESENTAR OFERTA', { bold: true, color: C.RED, sa: 160 }),
        p('Los requisitos del pliego no se alinean con las capacidades de Therefore™ DMS. Se recomienda declinar la participación.')
      )
    }

    const doc = new Document({
      sections: [{ properties: {}, children: sections }]
    })

    const buffer = await Packer.toBuffer(doc)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', `attachment; filename="Informe_Viabilidad_${rfp.name.replace(/[^a-zA-Z0-9]/g, '_')}.docx"`)
    res.send(buffer)

  } catch (error) {
    console.error('Error generando informe:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/rfp-generate-tasks/:id
router.post('/rfp-generate-tasks/:id', async (req, res) => {
  try {
    const { id } = req.params

    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    const { data: rfp, error: rfpError } = await supabase
      .from('rfp_analyses')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (rfpError || !rfp) {
      return res.status(404).json({ error: 'RFP no encontrada' })
    }

    const { data: sections, error: sectionsError } = await supabase
      .from('rfp_sections')
      .select('*')
      .eq('rfp_id', id)
      .order('order_index', { ascending: true })

    if (sectionsError) {
      return res.status(500).json({ error: sectionsError.message })
    }

    const docSections = []

    docSections.push(
      h1('PLAN DE REPARTO DE TAREAS'),
      p(rfp.name, { size: 24, bold: true }),
      p(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, { sa: 400 })
    )

    const areaMap = {}
    sections.forEach(s => {
      if (!areaMap[s.area]) areaMap[s.area] = []
      areaMap[s.area].push(s)
    })

    docSections.push(h2('Resumen por Área'), p('', { sb: 120 }))

    const summaryRows = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ children: [p('Área', { bold: true })], shading: { fill: C.LGREY } }),
          new TableCell({ children: [p('Nº Tareas', { bold: true })], shading: { fill: C.LGREY } }),
          new TableCell({ children: [p('Críticas', { bold: true })], shading: { fill: C.LGREY } }),
          new TableCell({ children: [p('Opcionales', { bold: true })], shading: { fill: C.LGREY } })
        ]
      })
    ]

    Object.keys(areaMap).forEach(area => {
      const tasks = areaMap[area]
      const critical = tasks.filter(t => t.priority === 'critical').length
      const optional = tasks.filter(t => t.priority === 'optional').length

      summaryRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [p(area)] }),
            new TableCell({ children: [p(tasks.length.toString())] }),
            new TableCell({ children: [p(critical.toString())] }),
            new TableCell({ children: [p(optional.toString())] })
          ]
        })
      )
    })

    docSections.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: summaryRows,
        borders: BDRS()
      }),
      p('', { sa: 400 })
    )

    const doc = new Document({
      sections: [{ properties: {}, children: docSections }]
    })

    const buffer = await Packer.toBuffer(doc)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', `attachment; filename="Plan_Reparto_Tareas_${rfp.name.replace(/[^a-zA-Z0-9]/g, '_')}.docx"`)
    res.send(buffer)

  } catch (error) {
    console.error('Error generando plan de tareas:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================================================
// TAGS - Gestión de etiquetas personalizadas
// ============================================================================

// GET /api/rfp-tags - Listar todos los tags
router.get('/rfp-tags', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rfp_tags')
      .select('*')
      .order('name')

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Error fetching tags:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/rfp-tags - Crear nuevo tag
router.post('/rfp-tags', async (req, res) => {
  try {
    const { name, color, description } = req.body
    const authHeader = req.headers.authorization
    const token = authHeader?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    const { data, error } = await supabase
      .from('rfp_tags')
      .insert({ name, color, description, created_by: user.id })
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Error creating tag:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/rfp-tags/assign - Asignar tag a RFP
router.post('/rfp-tags/assign', async (req, res) => {
  try {
    const { rfp_id, tag_id } = req.body
    const authHeader = req.headers.authorization
    const token = authHeader?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    const { data, error } = await supabase
      .from('rfp_tag_assignments')
      .insert({ rfp_id, tag_id, assigned_by: user.id })
      .select()

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Error assigning tag:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/rfp-tags/assign - Desasignar tag de RFP
router.delete('/rfp-tags/assign', async (req, res) => {
  try {
    const { rfp_id, tag_id } = req.body

    const { error } = await supabase
      .from('rfp_tag_assignments')
      .delete()
      .eq('rfp_id', rfp_id)
      .eq('tag_id', tag_id)

    if (error) throw error
    res.json({ success: true })
  } catch (error) {
    console.error('Error unassigning tag:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================================================
// REQUISITOS - Extracción y gestión de requisitos
// ============================================================================

// GET /api/rfp-requirements/:rfpId - Obtener requisitos de una RFP
router.get('/rfp-requirements/:rfpId', async (req, res) => {
  try {
    const { rfpId } = req.params

    const { data, error } = await supabase
      .from('rfp_requirements')
      .select('*')
      .eq('rfp_id', rfpId)
      .order('priority', { ascending: false })
      .order('created_at')

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Error fetching requirements:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/rfp-requirements/extract/:rfpId - Extraer requisitos con IA
router.post('/rfp-requirements/extract/:rfpId', async (req, res) => {
  try {
    const { rfpId } = req.params
    const authHeader = req.headers.authorization
    const token = authHeader?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    // Obtener RFP
    const { data: rfp, error: rfpError } = await supabase
      .from('rfp_analyses')
      .select('*')
      .eq('id', rfpId)
      .single()

    if (rfpError) throw rfpError

    // Extraer texto del análisis previo (simplificado - idealmente releer PDF)
    const textToAnalyze = `RFP: ${rfp.name}\nViabilidad: ${rfp.viability}\nRazón: ${rfp.viability_reason}`

    const systemPrompt = `Eres un experto en análisis de RFPs para sistemas DMS como Therefore™.

Extrae TODOS los requisitos técnicos del pliego y clasifícalos según:

1. **Categoría**: Core DMS, Autenticación, Web/Portal, Integración, Workflow, Seguridad, Búsqueda, Reporting, etc.

2. **Cobertura Therefore™**:
   - "nativo": Therefore™ lo incluye sin desarrollo
   - "desarrollo": Requiere customización/desarrollo
   - "integracion": Requiere integrar con terceros
   - "no_aplica": No es un requisito DMS

3. **Esfuerzo**:
   - "bajo": < 2 días
   - "medio": 2-5 días
   - "alto": 5-10 días
   - "muy_alto": > 10 días

4. **Prioridad**: 1-10 (10 = crítico)

Responde SOLO en JSON válido con este formato:
{
  "requirements": [
    {
      "requirement_text": "...",
      "category": "...",
      "therefore_coverage": "...",
      "effort_level": "...",
      "priority": 1-10,
      "notes": "..."
    }
  ]
}`

    const response = await callBedrock({
      model: 'claude-haiku-4-5-20251001',
      system: systemPrompt,
      messages: [{ role: 'user', content: `Extrae los requisitos de este RFP:\n\n${textToAnalyze}` }],
      max_tokens: 4096
    }, {
      userId: user.id,
      module: 'rfp-requirements-extraction'
    })

    const content = response.content[0].text
    let parsed

    try {
      parsed = JSON.parse(content)
    } catch (e) {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1])
      } else {
        const jsonMatch2 = content.match(/\{[\s\S]*\}/)
        if (jsonMatch2) {
          parsed = JSON.parse(jsonMatch2[0])
        } else {
          throw new Error('No se pudo extraer JSON de la respuesta')
        }
      }
    }

    // Insertar requisitos
    const requirements = parsed.requirements.map(req => ({
      rfp_id: rfpId,
      ...req
    }))

    const { data: inserted, error: insertError } = await supabase
      .from('rfp_requirements')
      .insert(requirements)
      .select()

    if (insertError) throw insertError

    res.json({ success: true, requirements: inserted, count: inserted.length })
  } catch (error) {
    console.error('Error extracting requirements:', error)
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/rfp-requirements/:id - Actualizar requisito
router.put('/rfp-requirements/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const { data, error } = await supabase
      .from('rfp_requirements')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Error updating requirement:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================================================
// SCORING - Sistema de puntuación automática
// ============================================================================

// GET /api/rfp-scoring/:rfpId - Obtener scoring de una RFP
router.get('/rfp-scoring/:rfpId', async (req, res) => {
  try {
    const { rfpId } = req.params

    const { data, error } = await supabase
      .from('rfp_scoring')
      .select('*')
      .eq('rfp_id', rfpId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    res.json(data || null)
  } catch (error) {
    console.error('Error fetching scoring:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/rfp-scoring - Crear/Actualizar scoring
router.post('/rfp-scoring', async (req, res) => {
  try {
    const { rfp_id, viabilidad_tecnica, margen_esperado, expertise_equipo, riesgo_contractual, timeline_factible, notes } = req.body

    const { data, error } = await supabase
      .from('rfp_scoring')
      .upsert({
        rfp_id,
        viabilidad_tecnica,
        margen_esperado,
        expertise_equipo,
        riesgo_contractual,
        timeline_factible,
        notes
      }, { onConflict: 'rfp_id' })
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Error saving scoring:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/rfp-scoring-ranking - Ranking de RFPs por score
router.get('/rfp-scoring-ranking', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rfp_scoring')
      .select(`
        *,
        rfps:rfp_id (
          id,
          name,
          viability,
          status,
          deadline
        )
      `)
      .order('score_total', { ascending: false })
      .limit(20)

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Error fetching ranking:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================================================
// BIBLIOTECA DE RESPUESTAS
// ============================================================================

// GET /api/answer-library - Listar respuestas de biblioteca
router.get('/answer-library', async (req, res) => {
  try {
    const { category, search } = req.query
    let query = supabase
      .from('rfp_answer_library')
      .select('*')
      .order('usage_count', { ascending: false })
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('question_category', category)
    }

    if (search) {
      query = query.or(`question_text.ilike.%${search}%,keywords.cs.{${search}}`)
    }

    const { data, error } = await query

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Error fetching answer library:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/answer-library - Crear respuesta en biblioteca
router.post('/answer-library', async (req, res) => {
  try {
    const { question_text, question_category, answer_template, keywords } = req.body
    const authHeader = req.headers.authorization
    const token = authHeader?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    const { data, error } = await supabase
      .from('rfp_answer_library')
      .insert({
        question_text,
        question_category,
        answer_template,
        keywords,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Error creating answer:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================================================
// CLÁUSULAS DE RIESGO - Análisis con IA
// ============================================================================

// GET /api/rfp-risk-clauses/:rfpId - Obtener cláusulas de riesgo
router.get('/rfp-risk-clauses/:rfpId', async (req, res) => {
  try {
    const { rfpId } = req.params

    const { data, error } = await supabase
      .from('rfp_risk_clauses')
      .select('*')
      .eq('rfp_id', rfpId)
      .order('risk_level', { ascending: false })
      .order('created_at')

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Error fetching risk clauses:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/rfp-risk-clauses/analyze/:rfpId - Analizar cláusulas con IA
router.post('/rfp-risk-clauses/analyze/:rfpId', async (req, res) => {
  try {
    const { rfpId } = req.params
    const authHeader = req.headers.authorization
    const token = authHeader?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    // Obtener RFP
    const { data: rfp, error: rfpError } = await supabase
      .from('rfp_analyses')
      .select('*')
      .eq('id', rfpId)
      .single()

    if (rfpError) throw rfpError

    const systemPrompt = `Eres un experto legal en análisis de RFPs y contratos públicos.

Analiza el pliego y detecta cláusulas de riesgo clasificadas en:

1. **Tipo**:
   - "penalizacion": Multas, penalizaciones económicas
   - "garantia": Garantías ilimitadas, responsabilidades excesivas
   - "exclusividad": Cláusulas de exclusividad sin compensación
   - "restrictivo": Lenguaje muy restrictivo ("obligatorio bajo pena de exclusión")
   - "oportunidad": Cláusulas positivas ("se valorará positivamente")

2. **Nivel de riesgo**:
   - "alto": Riesgo financiero o legal significativo
   - "medio": Requiere atención pero manejable
   - "bajo": Menor relevancia
   - "positivo": Oportunidad (para tipo "oportunidad")

Responde SOLO en JSON:
{
  "clauses": [
    {
      "clause_text": "...",
      "clause_type": "...",
      "risk_level": "...",
      "section_reference": "...",
      "recommendation": "..."
    }
  ]
}`

    const response = await callBedrock({
      model: 'claude-haiku-4-5-20251001',
      system: systemPrompt,
      messages: [{ role: 'user', content: `Analiza las cláusulas de riesgo de este RFP:\n\nNombre: ${rfp.name}\n\nViabilidad: ${rfp.viability}\nRazón: ${rfp.viability_reason}\n\nRiesgos identificados:\n${JSON.stringify(rfp.risks || [])}` }],
      max_tokens: 4096
    }, {
      userId: user.id,
      module: 'rfp-risk-analysis'
    })

    const content = response.content[0].text
    let parsed

    try {
      parsed = JSON.parse(content)
    } catch (e) {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) parsed = JSON.parse(jsonMatch[1])
      else throw new Error('No se pudo extraer JSON')
    }

    // Insertar cláusulas
    const clauses = parsed.clauses.map(clause => ({
      rfp_id: rfpId,
      ...clause
    }))

    const { data: inserted, error: insertError } = await supabase
      .from('rfp_risk_clauses')
      .insert(clauses)
      .select()

    if (insertError) throw insertError

    res.json({ success: true, clauses: inserted, count: inserted.length })
  } catch (error) {
    console.error('Error analyzing risk clauses:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================================================
// COMPARACIONES
// ============================================================================

// POST /api/rfp-compare - Comparar RFPs
router.post('/rfp-compare', async (req, res) => {
  try {
    const { rfp_ids, name } = req.body
    const authHeader = req.headers.authorization
    const token = authHeader?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    // Obtener RFPs con scoring
    const { data: rfps, error: rfpsError } = await supabase
      .from('rfp_analyses')
      .select(`
        *,
        scoring:rfp_scoring(*)
      `)
      .in('id', rfp_ids)

    if (rfpsError) throw rfpsError

    // Calcular datos de comparación
    const comparison_data = {
      rfps: rfps.map(r => ({
        id: r.id,
        name: r.name,
        viability: r.viability,
        status: r.status,
        deadline: r.deadline,
        score: r.scoring?.[0]?.score_total || 0,
        recommendation: r.scoring?.[0]?.recommendation || 'pending'
      })),
      generated_at: new Date().toISOString()
    }

    // Guardar comparación
    const { data, error } = await supabase
      .from('rfp_comparisons')
      .insert({
        name: name || `Comparación ${new Date().toLocaleDateString()}`,
        rfp_ids,
        comparison_data,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Error comparing RFPs:', error)
    res.status(500).json({ error: error.message })
  }
})

// Vercel serverless function handler
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization')

  // Handle OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // Use the router as middleware
  return new Promise((resolve, reject) => {
    router(req, res, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
