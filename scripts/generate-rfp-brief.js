import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, UnderlineType, convertInchesToTwip } from 'docx'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Crear documento
const doc = new Document({
  sections: [{
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(1),
          right: convertInchesToTwip(1),
          bottom: convertInchesToTwip(1),
          left: convertInchesToTwip(1)
        }
      }
    },
    children: [
      // Título principal
      new Paragraph({
        text: 'RFP Analyzer',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),
      new Paragraph({
        text: 'Brief de Diseño y Plan de Implementación',
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 }
      }),
      new Paragraph({
        text: 'Versión: 1.0',
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: `Fecha: ${new Date().toLocaleDateString('es-ES')}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 }
      }),

      // 1. RESUMEN EJECUTIVO
      new Paragraph({
        text: '1. RESUMEN EJECUTIVO',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        text: 'RFP Analyzer es un nuevo módulo de TheJay que permite analizar documentos de Request for Proposal (RFP) mediante inteligencia artificial para:',
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: '• Evaluar automáticamente la viabilidad técnica y administrativa',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Repartir secciones a áreas especializadas (Comercial, Técnica, Legal, Seguridad IT/GDPR, etc.)',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Detectar plazos, requisitos críticos y riesgos',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Gestionar asignación de responsables y seguimiento de tareas',
        bullet: { level: 0 },
        spacing: { after: 400 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: 'Objetivo: ', bold: true }),
          new TextRun({ text: 'Reducir tiempo de análisis inicial de 2-3 horas (manual) a 5-10 minutos (con IA).' })
        ],
        spacing: { after: 400 }
      }),

      // 2. AUDIENCIA Y CONTEXTO
      new Paragraph({
        text: '2. AUDIENCIA Y CONTEXTO DE USO',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        text: 'Usuarios',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        text: 'Equipo mixto de consultoría TheJay: comerciales + técnicos con expertise variada.',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: 'Contexto de Uso',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        text: 'Usuario recibe RFP de cliente potencial (1-5 documentos PDF/DOCX, 20-100 páginas). Necesita entender rápidamente:',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• ¿Vale la pena responder?',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• ¿Quién debe trabajar en qué partes?',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• ¿Cuáles son los plazos y requisitos críticos?',
        bullet: { level: 0 },
        spacing: { after: 400 }
      }),

      // 3. FUNCIONALIDADES CORE
      new Paragraph({
        text: '3. FUNCIONALIDADES CORE',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        text: '3.1. Upload Multi-Documento',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        text: '• Drag & drop zone prominente',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Soporte para PDF y DOCX',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Preview de archivos subidos',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Límite: 25MB por archivo',
        bullet: { level: 0 },
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: '3.2. Análisis Automático con IA',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        text: 'Usando AWS Bedrock (Claude Sonnet), el sistema analiza y detecta:',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Viabilidad global (alta/media/baja con justificación)',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Plazos y fechas clave (deadline, hitos intermedios)',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Requisitos técnicos críticos',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Riesgos y alertas (cláusulas problemáticas, requisitos incumplibles)',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Reparto automático de secciones a áreas especializadas',
        bullet: { level: 0 },
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: '3.3. Áreas Especializadas',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        text: 'Áreas predefinidas para asignación:',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Comercial',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Técnica',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Legal',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Marketing',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Seguridad IT / GDPR',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Medio Ambiente',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Operaciones',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Otra (editable)',
        bullet: { level: 0 },
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: '3.4. Gestión de Secciones',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        text: 'Tabla editable con:',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Reasignación de secciones a otras áreas (dropdown)',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Edición/creación manual de secciones',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Marcado de prioridad (crítica/opcional)',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Asignación de responsables (usuarios)',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Seguimiento de estado (Pendiente/En curso/Completado)',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Drag-to-reorder secciones',
        bullet: { level: 0 },
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: '3.5. Guardado y Consulta',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        text: '• Auto-save de cambios en secciones',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Listado de RFPs analizadas (tabla con nombre, fecha, estado)',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Reapertura de análisis anteriores',
        bullet: { level: 0 },
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Export a DOCX del análisis completo',
        bullet: { level: 0 },
        spacing: { after: 400 }
      }),

      // 4. ARQUITECTURA TÉCNICA
      new Paragraph({
        text: '4. ARQUITECTURA TÉCNICA',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        text: '4.1. Stack Tecnológico',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Frontend: ', bold: true }),
          new TextRun({ text: 'React 18 + Vite + Ant Design (Upload, Table, Card, Badge, Tag, Dropdown)' })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Backend: ', bold: true }),
          new TextRun({ text: 'Express endpoints (/api/analyze-rfp, /api/rfp-sections)' })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'IA: ', bold: true }),
          new TextRun({ text: 'AWS Bedrock (Claude Sonnet para análisis)' })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Storage: ', bold: true }),
          new TextRun({ text: 'Supabase Storage para PDFs/DOCX' })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Database: ', bold: true }),
          new TextRun({ text: 'Supabase PostgreSQL' })
        ],
        spacing: { after: 300 }
      }),

      new Paragraph({
        text: '4.2. Esquema de Base de Datos',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Tabla: rfp_analyses', bold: true })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• id (uuid)',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• user_id (uuid, FK a auth.users)',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• name (text) - Nombre de la RFP',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• files_urls (jsonb) - URLs de archivos en Storage',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• viability (text) - alta/media/baja',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• viability_reason (text) - Justificación',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• deadlines (jsonb) - {deadline, milestones[]}',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• risks (jsonb) - [{risk, severity, description}]',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• technical_requirements (jsonb) - [requirement]',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• created_at, updated_at (timestamptz)',
        bullet: { level: 0 },
        spacing: { after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: 'Tabla: rfp_sections', bold: true })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• id (uuid)',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• rfp_id (uuid, FK a rfp_analyses)',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• section_name (text) - Nombre de la sección',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• area (text) - Área asignada',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• responsible_user_id (uuid, nullable, FK a auth.users)',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• priority (text) - critical/optional',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• status (text) - pending/in_progress/completed',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• order_index (integer) - Orden de visualización',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• created_at, updated_at (timestamptz)',
        bullet: { level: 0 },
        spacing: { after: 300 }
      }),

      new Paragraph({
        text: '4.3. Estructura de Archivos',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        text: 'src/views/RFPAnalyzer.jsx - Vista principal',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: 'src/components/rfp/UploadZone.jsx - Zona de upload',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: 'src/components/rfp/ViabilityCard.jsx - Card de viabilidad',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: 'src/components/rfp/SectionTable.jsx - Tabla editable de secciones',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: 'api/analyze-rfp.js - Endpoint de análisis',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: 'api/rfp-sections.js - CRUD de secciones',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: 'api/extract-rfp-text.js - Extracción de texto de PDFs/DOCX',
        bullet: { level: 0 },
        spacing: { after: 400 }
      }),

      // 5. FLUJO DE USUARIO
      new Paragraph({
        text: '5. FLUJO DE USUARIO',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        text: 'Paso 1: Upload',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        text: '1. Usuario hace click en "Analizar RFP" en sidebar',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '2. Drag & drop de 1-5 PDFs/DOCX o selección manual',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '3. Preview de archivos subidos',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '4. Click "Analizar con IA"',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: 'Paso 2: Análisis Automático',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        text: '1. Upload de archivos a Supabase Storage',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '2. Extracción de texto (PDF.js / mammoth)',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '3. Envío a AWS Bedrock con prompt estructurado',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '4. Spinner + "Analizando X páginas..." (~30-60 segundos)',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '5. Guardado de resultado en rfp_analyses + rfp_sections',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: 'Paso 3: Revisión de Resultados',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        text: '1. Card de Viabilidad (verde/amber/rojo + justificación)',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '2. Card de Plazos (deadline principal + hitos)',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '3. Card de Riesgos (alertas con severidad)',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '4. Tabla de Secciones detectadas automáticamente',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: 'Paso 4: Ajuste Manual',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        text: '1. Reasignar secciones a otras áreas (dropdown inline)',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '2. Marcar prioridad (crítica/opcional)',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '3. Asignar responsables específicos',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '4. Agregar/editar secciones manualmente',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '5. Reordenar secciones (drag-to-reorder)',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '6. Auto-save continuo ("✓ Guardado")',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: 'Paso 5: Seguimiento',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        text: '1. Responsables ven sus tareas asignadas',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '2. Actualizan estado (Pendiente → En curso → Completado)',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '3. Vista consolidada de progreso global',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '4. Export a DOCX cuando esté listo',
        spacing: { after: 400 }
      }),

      // 6. DECISIONES TÉCNICAS ABIERTAS
      new Paragraph({
        text: '6. DECISIONES TÉCNICAS A RESOLVER',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: 'Timeout análisis Bedrock: ', bold: true }),
          new TextRun({ text: 'Propuesta 60 segundos, cancelable por usuario' })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Tamaño máximo archivo: ', bold: true }),
          new TextRun({ text: 'Propuesta 25MB por PDF (límite Supabase Storage)' })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Formato JSON deadlines: ', bold: true }),
          new TextRun({ text: '{deadline: "YYYY-MM-DD", milestones: [{date, description}]}' })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Formato JSON risks: ', bold: true }),
          new TextRun({ text: '[{risk: "text", severity: "high|medium|low", description: "text"}]' })
        ],
        spacing: { after: 400 }
      }),

      // 7. FASES DE IMPLEMENTACIÓN
      new Paragraph({
        text: '7. PLAN DE IMPLEMENTACIÓN',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        text: 'Fase 1: Backend Core (2-3 días)',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        text: '✓ Crear tablas Supabase (rfp_analyses, rfp_sections)',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '✓ Endpoint /api/analyze-rfp (upload + extracción + Bedrock)',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '✓ Endpoint /api/rfp-sections (CRUD secciones)',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '✓ Script extract-rfp-text.js (PDF.js + mammoth)',
        bullet: { level: 0 },
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: 'Fase 2: Frontend Base (2-3 días)',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        text: '✓ RFPAnalyzer.jsx (vista principal)',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '✓ UploadZone component (drag & drop)',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '✓ ViabilityCard component',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '✓ Cards de Plazos y Riesgos',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '✓ Integrar en menú sidebar',
        bullet: { level: 0 },
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: 'Fase 3: Gestión de Secciones (3-4 días)',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        text: '✓ SectionTable component (editable)',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '✓ Dropdowns de área y responsable',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '✓ Toggle prioridad y estado',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '✓ Drag-to-reorder (react-beautiful-dnd)',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '✓ Auto-save logic',
        bullet: { level: 0 },
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: 'Fase 4: Listado y Seguimiento (2 días)',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        text: '✓ Tabla de RFPs analizadas',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '✓ Filtros y búsqueda',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '✓ Reabrir análisis anteriores',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '✓ Vista de tareas asignadas (mis secciones)',
        bullet: { level: 0 },
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: 'Fase 5: Export y Pulido (1-2 días)',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        text: '✓ Export a DOCX con análisis completo',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '✓ Estados empty/loading/error',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '✓ Testing con RFP real',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '✓ Ajustes de UX',
        bullet: { level: 0 },
        spacing: { after: 400 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: 'TOTAL ESTIMADO: 10-14 días de desarrollo', bold: true })
        ],
        spacing: { after: 600 }
      }),

      // 8. EXPANSIÓN FUTURA
      new Paragraph({
        text: '8. EXPANSIÓN FUTURA (Post-MVP)',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        text: 'Base de Conocimiento RAG',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        text: 'Cuando se necesite ampliar más allá de Therefore™:',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Supabase pgvector para embeddings',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• Documentación de productos como chunks embeddeados',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• Búsqueda semántica de conocimiento relevante',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• Inclusión dinámica en contexto Bedrock',
        bullet: { level: 0 },
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: 'Productos a cubrir:',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: '• Therefore™ DMS (ya cubierto)',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• Multifunciones (Ricoh, Canon)',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• Servidores de impresión',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• MPS (Managed Print Services)',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• Servicios gestionados',
        bullet: { level: 0 },
        spacing: { after: 400 }
      }),

      new Paragraph({
        text: 'Workflow Avanzado',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        text: '• Notificaciones push cuando se asignan tareas',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• Comentarios y discusión por sección',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• Timeline de la RFP con eventos clave',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• Integración con calendario (Google Calendar)',
        bullet: { level: 0 },
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• Dashboard ejecutivo de RFPs activas',
        bullet: { level: 0 },
        spacing: { after: 600 }
      }),

      // Footer
      new Paragraph({
        text: '_______________',
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        text: 'Documento generado automáticamente para TheJay - RFP Analyzer',
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'Versión 1.0',
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
      })
    ]
  }]
})

// Generar archivo
const outputPath = path.join(__dirname, '..', 'RFP_Analyzer_Brief.docx')

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer)
  console.log(`✓ Documento creado: ${outputPath}`)
})
