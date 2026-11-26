import '../config/env.js'
import express from 'express'
import { createClient } from '@supabase/supabase-js'
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageBreak
} from 'docx'

const router = express.Router()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Helpers de estilo
const C = {
  RED: 'C00000',
  DARK: '404040',
  GREY: '7F7F7F',
  LGREY: 'F2F2F2',
  WHITE: 'FFFFFF',
  GREEN: '10b981',
  YELLOW: 'f59e0b',
  ORANGE: 'ea580c'
}

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

    // Obtener RFP
    const { data: rfp, error: rfpError } = await supabase
      .from('rfp_analyses')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (rfpError || !rfp) {
      return res.status(404).json({ error: 'RFP no encontrada' })
    }

    // Generar documento
    const sections = []

    // Portada
    sections.push(
      h1('INFORME DE VIABILIDAD'),
      p(rfp.name, { size: 24, bold: true }),
      p(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, { sa: 400 }),
      new Paragraph({ children: [new PageBreak()] })
    )

    // Resumen Ejecutivo
    sections.push(
      h1('RESUMEN EJECUTIVO'),
      h2('Viabilidad Detectada'),
      p(`Nivel: ${rfp.viability?.toUpperCase() || 'N/A'}`, { bold: true }),
      p(rfp.viability_reason || 'No disponible', { sa: 240 })
    )

    // Plazos Críticos
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

    // Riesgos
    if (rfp.risks && rfp.risks.length > 0) {
      sections.push(h2('Riesgos Principales'))

      const risksByeverity = {
        high: rfp.risks.filter(r => r.severity === 'high'),
        medium: rfp.risks.filter(r => r.severity === 'medium'),
        low: rfp.risks.filter(r => r.severity === 'low')
      }

      if (risksByeverity.high.length > 0) {
        sections.push(p('⚠️ Riesgos ALTOS:', { bold: true, color: C.RED, sb: 120 }))
        risksByeverity.high.forEach(r => {
          sections.push(bullet(`${r.risk}${r.description ? ': ' + r.description : ''}`))
        })
      }

      if (risksByeverity.medium.length > 0) {
        sections.push(p('⚡ Riesgos MEDIOS:', { bold: true, color: C.ORANGE, sb: 120, sa: 160 }))
        risksByeverity.medium.forEach(r => {
          sections.push(bullet(`${r.risk}${r.description ? ': ' + r.description : ''}`))
        })
      }

      if (risksByeverity.low.length > 0) {
        sections.push(p('ℹ️ Riesgos BAJOS:', { bold: true, color: C.GREY, sb: 120, sa: 160 }))
        risksByeverity.low.forEach(r => {
          sections.push(bullet(`${r.risk}${r.description ? ': ' + r.description : ''}`))
        })
      }

      sections.push(p('', { sa: 240 }))
    }

    // Requisitos Técnicos
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

    // Recomendación
    sections.push(
      h2('Recomendación'),
      p('Basado en el análisis realizado:', { sb: 120 })
    )

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

    // Generar DOCX
    const doc = new Document({
      sections: [{
        properties: {},
        children: sections
      }]
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

    // Obtener RFP con secciones
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

    // Generar documento
    const docSections = []

    // Portada
    docSections.push(
      h1('PLAN DE REPARTO DE TAREAS'),
      p(rfp.name, { size: 24, bold: true }),
      p(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, { sa: 400 }),
      new Paragraph({ children: [new PageBreak()] })
    )

    // Agrupar por área
    const areaMap = {}
    sections.forEach(s => {
      if (!areaMap[s.area]) areaMap[s.area] = []
      areaMap[s.area].push(s)
    })

    // Tabla resumen
    docSections.push(
      h2('Resumen por Área'),
      p('', { sb: 120 })
    )

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

    // Detalle por área
    docSections.push(
      new Paragraph({ children: [new PageBreak()] }),
      h1('DETALLE DE TAREAS POR ÁREA')
    )

    Object.keys(areaMap).forEach(area => {
      docSections.push(
        h2(area),
        p('', { sb: 120 })
      )

      const tasksRows = [
        new TableRow({
          tableHeader: true,
          children: [
            new TableCell({ children: [p('Sección', { bold: true })], shading: { fill: C.LGREY }, width: { size: 60, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [p('Prioridad', { bold: true })], shading: { fill: C.LGREY }, width: { size: 20, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [p('Estado', { bold: true })], shading: { fill: C.LGREY }, width: { size: 20, type: WidthType.PERCENTAGE } })
          ]
        })
      ]

      areaMap[area].forEach(task => {
        tasksRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [p(task.section_name)] }),
              new TableCell({ children: [p(task.priority === 'critical' ? 'CRÍTICA' : 'Opcional')] }),
              new TableCell({ children: [p(task.status === 'pending' ? 'Pendiente' : task.status === 'in_progress' ? 'En curso' : 'Completado')] })
            ]
          })
        )
      })

      docSections.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tasksRows,
          borders: BDRS()
        }),
        p('', { sa: 320 })
      )
    })

    // Generar DOCX
    const doc = new Document({
      sections: [{
        properties: {},
        children: docSections
      }]
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
