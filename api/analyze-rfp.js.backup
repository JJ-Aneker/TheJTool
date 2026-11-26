import '../config/env.js' // Cargar variables de entorno PRIMERO
import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { callBedrock } from './_lib/bedrockClient.js'
import multer from 'multer'
import { PDFExtract } from 'pdf.js-extract'
import mammoth from 'mammoth'
import fs from 'fs'

const router = express.Router()

// Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Multer config para upload temporal
const upload = multer({ dest: 'uploads/' })

// Función para extraer texto de PDF
async function extractPdfText(filePath) {
  const pdfExtract = new PDFExtract()
  const data = await pdfExtract.extract(filePath)

  let text = ''
  data.pages.forEach((page, pageNum) => {
    text += `\n\n--- Página ${pageNum + 1} ---\n\n`
    page.content.forEach(item => {
      if (item.str) {
        text += item.str + ' '
      }
    })
  })

  return text
}

// Función para extraer texto de DOCX
async function extractDocxText(filePath) {
  const result = await mammoth.extractRawText({ path: filePath })
  return result.value
}

// Función para analizar con Bedrock usando el cliente compartido
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

  // Usar callBedrock del cliente compartido
  const response = await callBedrock({
    model: 'claude-haiku-4-5-20251001', // Modelo rápido y económico para análisis
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt
      }
    ],
    max_tokens: 4096
  }, {
    userId,
    module: 'rfp-analyzer'
  })

  // Extraer JSON del content
  const content = response.content[0].text

  // Intentar parsear directamente
  try {
    return JSON.parse(content)
  } catch (e) {
    // Si falla, buscar JSON entre ```json y ```
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1])
    }
    // Si falla, buscar JSON entre { y }
    const jsonMatch2 = content.match(/\{[\s\S]*\}/)
    if (jsonMatch2) {
      return JSON.parse(jsonMatch2[0])
    }
    throw new Error('No se pudo extraer JSON de la respuesta de Bedrock')
  }
}

// POST /api/analyze-rfp
router.post('/analyze-rfp', upload.array('files', 5), async (req, res) => {
  try {
    const { name } = req.body
    const files = req.files

    console.log('=== DEBUG UPLOAD ===')
    console.log('req.files:', files)
    console.log('req.files length:', files?.length)
    if (files && files.length > 0) {
      console.log('First file:', files[0])
      console.log('First file path:', files[0].path)
    }
    console.log('===================')

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No se subieron archivos' })
    }

    if (!name) {
      return res.status(400).json({ error: 'Falta el nombre de la RFP' })
    }

    // Obtener user_id del token
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    // 1. Subir archivos a Supabase Storage
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
        // Limpiar archivos temporales
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

    // 2. Extraer texto del primer archivo (el principal)
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

    // 3. Analizar con Bedrock
    const analysis = await analyzeWithBedrock(extractedText, firstFile.originalname, user.id)

    // 4. Guardar en Supabase
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
        technical_requirements: analysis.technical_requirements
      })
      .select()
      .single()

    if (rfpError) {
      console.error('Error saving RFP analysis:', rfpError)
      return res.status(500).json({ error: 'Error al guardar el análisis' })
    }

    // 5. Guardar secciones
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

    // Limpiar archivos temporales después de procesamiento exitoso
    files.forEach(file => {
      try {
        fs.unlinkSync(file.path)
      } catch (e) {
        // Ignorar errores de limpieza
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

    // Limpiar archivos temporales en caso de error
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path)
        } catch (e) {
          // Ignorar errores de limpieza
        }
      })
    }

    res.status(500).json({ error: error.message || 'Error al analizar la RFP' })
  }
})

// GET /api/analyze-rfp (listar RFPs del usuario)
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

// GET /api/analyze-rfp/:id (obtener una RFP específica con sus secciones)
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

    // Obtener secciones
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

export default router
