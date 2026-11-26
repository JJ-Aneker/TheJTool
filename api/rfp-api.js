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

const upload = multer({ dest: 'uploads/' })

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

    // Extract text from first file
    const firstFile = files[0]
    let extractedText = ''

    const fileBuffer = fs.readFileSync(firstFile.path)
    const tempPath = `uploads/temp_${Date.now()}_${firstFile.originalname}`
    fs.writeFileSync(tempPath, fileBuffer)

    if (firstFile.mimetype === 'application/pdf') {
      extractedText = await extractPdfText(tempPath)
    } else if (firstFile.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      extractedText = await extractDocxText(tempPath)
    } else {
      fs.unlinkSync(tempPath)
      return res.status(400).json({ error: 'Formato no soportado. Solo PDF y DOCX.' })
    }

    fs.unlinkSync(tempPath)

    // Analyze with Bedrock
    const analysis = await analyzeWithBedrock(extractedText, firstFile.originalname, user.id)

    // Save to Supabase
    const { data: rfpData, error: rfpError } = await supabase
      .from('rfp_analyses')
      .insert({
        user_id: user.id,
        name,
        files_urls: uploadedFiles,
        viability: analysis.viability,
        viability_reason: analysis.viability_reason,
        deadlines: analysis.deadlines,
        risks: analysis.risks,
        technical_requirements: analysis.technical_requirements,
        status: 'analizada' // Auto-set status after analysis
      })
      .select()
      .single()

    if (rfpError) {
      console.error('Error saving RFP analysis:', rfpError)
      return res.status(500).json({ error: 'Error al guardar el análisis' })
    }

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

    sections.push(h2('Recomendación'), p('Basado en el análisis realizado:', { sb: 120 }))

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

export default router
