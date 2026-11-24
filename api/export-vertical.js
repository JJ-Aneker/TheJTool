/**
 * API Endpoint: Export Vertical to Word
 * Genera un documento Word completo con toda la información del vertical
 */

import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, UnderlineType, BorderStyle } from 'docx';

const COLORS = {
  canonRed: 'C00000',
  darkGray: '404040',
  mediumGray: '7F7F7F',
  lightGray: 'F2F2F2'
};

const FONTS = {
  heading: 'Calibri',
  body: 'Calibri'
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════════════════════

function heading1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    font: FONTS.heading
  });
}

function heading2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    font: FONTS.heading
  });
}

function heading3(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    font: FONTS.heading
  });
}

function paragraph(text, options = {}) {
  return new Paragraph({
    text,
    spacing: { before: 100, after: 100 },
    font: FONTS.body,
    ...options
  });
}

function bulletList(items) {
  return items.map(item =>
    new Paragraph({
      text: item,
      bullet: { level: 0 },
      spacing: { before: 50, after: 50 },
      font: FONTS.body
    })
  );
}

function numberedList(items) {
  return items.map((item, index) =>
    new Paragraph({
      text: item,
      numbering: { reference: 'default-numbering', level: 0 },
      spacing: { before: 50, after: 50 },
      font: FONTS.body
    })
  );
}

function emptyLine() {
  return new Paragraph({ text: '', spacing: { before: 100, after: 100 } });
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENERADOR DE SECCIONES
// ═══════════════════════════════════════════════════════════════════════════════

function buildPortada(vertical) {
  const iconMap = {
    'evolutivo': '🔄',
    'facturas': '📄',
    'hr': '👥',
    'notifapp': '📨',
    'sage': '📊',
    'legal': '⚖️',
    'generico': '📁'
  };

  const icon = iconMap[vertical.nombre?.toLowerCase()] || '📁';

  return [
    new Paragraph({ text: '', spacing: { before: 2000 } }),
    new Paragraph({
      text: `${icon} ${vertical.titulo || vertical.nombre}`,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    new Paragraph({
      text: 'Documentación Técnica del Vertical',
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      font: FONTS.body,
      size: 24
    }),
    new Paragraph({
      text: `Generado: ${new Date().toLocaleDateString('es-ES')}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
      italics: true,
      color: COLORS.mediumGray
    }),
    new Paragraph({
      text: '─'.repeat(50),
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    new Paragraph({
      text: 'Canon España Business Services',
      alignment: AlignmentType.CENTER,
      bold: true,
      color: COLORS.canonRed
    })
  ];
}

function buildInfoBasica(vertical) {
  const elements = [
    heading1('1. Información Básica'),
    heading2('Identificación'),
    paragraph(`Nombre interno: ${vertical.nombre || 'N/A'}`),
    paragraph(`Título: ${vertical.titulo || 'N/A'}`),
    paragraph(`Estado: ${vertical.activo ? '✅ Activo' : '❌ Inactivo'}`),
    emptyLine()
  ];

  if (vertical.descripcion_intro) {
    elements.push(
      heading2('Descripción'),
      paragraph(vertical.descripcion_intro),
      emptyLine()
    );
  }

  if (vertical.descripcion_implementacion) {
    elements.push(
      heading2('Implementación'),
      paragraph(vertical.descripcion_implementacion),
      emptyLine()
    );
  }

  // Datos económicos
  elements.push(
    heading2('Datos Económicos'),
    paragraph(`Tarifa diaria: ${vertical.tarifa_diaria || 800}€`),
    paragraph(`Duración típica: ${vertical.duracion_tipica_dias || 10} días`),
    paragraph(`Margen oferta: ${vertical.margen_oferta_pct || 20}%`),
    emptyLine()
  );

  return elements;
}

function buildClavesYPremisas(vertical) {
  const elements = [heading1('2. Claves y Premisas del Proyecto')];

  if (vertical.claves && vertical.claves.length > 0) {
    elements.push(
      heading2('Claves del Proyecto'),
      ...bulletList(vertical.claves),
      emptyLine()
    );
  }

  if (vertical.premisas_especificas && vertical.premisas_especificas.length > 0) {
    elements.push(
      heading2('Premisas Específicas'),
      ...bulletList(
        Array.isArray(vertical.premisas_especificas)
          ? vertical.premisas_especificas.map(p =>
              typeof p === 'string' ? p : `${p.premisa}: ${p.descripcion}${p.impacto ? ` (Impacto: ${p.impacto})` : ''}`
            )
          : []
      ),
      emptyLine()
    );
  }

  return elements;
}

function buildEstructura(vertical) {
  const elements = [heading1('3. Estructura y Arquitectura')];

  if (vertical.tablas_maestras && vertical.tablas_maestras.length > 0) {
    elements.push(
      heading2('Tablas Maestras'),
      ...bulletList(
        vertical.tablas_maestras.map(t =>
          typeof t === 'string'
            ? t
            : `${t.nombre}: ${t.descripcion || ''} ${t.campos ? `(Campos: ${t.campos.join(', ')})` : ''}`
        )
      ),
      emptyLine()
    );
  }

  if (vertical.ejemplo_workflows && vertical.ejemplo_workflows.length > 0) {
    elements.push(heading2('Workflows'));

    vertical.ejemplo_workflows.forEach((wf, idx) => {
      elements.push(
        heading3(`${idx + 1}. ${wf.nombre}`),
        paragraph(`Descripción: ${wf.descripcion || 'N/A'}`),
        paragraph(`Tipo: ${wf.tipo || 'automatico'}`)
      );

      if (wf.etapas && wf.etapas.length > 0) {
        elements.push(
          paragraph('Etapas:', { bold: true }),
          ...numberedList(wf.etapas)
        );
      }

      elements.push(emptyLine());
    });
  }

  if (vertical.herramientas_recomendadas && vertical.herramientas_recomendadas.length > 0) {
    elements.push(
      heading2('Herramientas Recomendadas'),
      ...bulletList(vertical.herramientas_recomendadas),
      emptyLine()
    );
  }

  return elements;
}

function buildIntegraciones(vertical) {
  const elements = [heading1('4. Integraciones')];

  if (vertical.integraciones_comunes && vertical.integraciones_comunes.length > 0) {
    elements.push(
      heading2('Integraciones Comunes'),
      ...bulletList(vertical.integraciones_comunes),
      emptyLine()
    );
  }

  if (vertical.integraciones_usuario && vertical.integraciones_usuario.length > 0) {
    elements.push(
      heading2('Integraciones de Usuario'),
      ...bulletList(vertical.integraciones_usuario),
      emptyLine()
    );
  }

  return elements;
}

function buildTestingYModulos(vertical) {
  const elements = [heading1('5. Testing, Módulos y Procesos')];

  if (vertical.casos_prueba_tipicos && vertical.casos_prueba_tipicos.length > 0) {
    elements.push(
      heading2('Casos de Prueba Típicos'),
      ...bulletList(
        vertical.casos_prueba_tipicos.map(c =>
          typeof c === 'string'
            ? c
            : `${c.caso}: ${c.descripcion || ''}`
        )
      ),
      emptyLine()
    );
  }

  if (vertical.criterios_aceptacion && vertical.criterios_aceptacion.length > 0) {
    elements.push(
      heading2('Criterios de Aceptación'),
      ...bulletList(vertical.criterios_aceptacion),
      emptyLine()
    );
  }

  if (vertical.modulos_funcionales && vertical.modulos_funcionales.length > 0) {
    elements.push(
      heading2('Módulos Funcionales'),
      ...bulletList(
        vertical.modulos_funcionales.map(m =>
          typeof m === 'string'
            ? m
            : `${m.nombre}: ${m.desc || m.descripcion || ''}`
        )
      ),
      emptyLine()
    );
  }

  if (vertical.procesos_clave && vertical.procesos_clave.length > 0) {
    elements.push(
      heading2('Procesos Clave'),
      ...bulletList(vertical.procesos_clave),
      emptyLine()
    );
  }

  return elements;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENTO PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

async function buildVerticalDocument(vertical) {
  const sections = [
    ...buildPortada(vertical),
    { type: 'pageBreak' },
    ...buildInfoBasica(vertical),
    ...buildClavesYPremisas(vertical),
    ...buildEstructura(vertical),
    ...buildIntegraciones(vertical),
    ...buildTestingYModulos(vertical)
  ];

  // Convertir pageBreaks en párrafos reales
  const children = sections.map(item => {
    if (item?.type === 'pageBreak') {
      return new Paragraph({ pageBreakBefore: true });
    }
    return item;
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,    // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440
          }
        }
      },
      children
    }],
    numbering: {
      config: [{
        reference: 'default-numbering',
        levels: [{
          level: 0,
          format: 'decimal',
          text: '%1.',
          alignment: AlignmentType.LEFT
        }]
      }]
    }
  });

  return await Packer.toBuffer(doc);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export default async function handler(req, res) {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (req.method === 'OPTIONS') {
    Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { vertical } = req.body;

    if (!vertical) {
      return res.status(400).json({ error: 'No vertical data provided' });
    }

    console.log('[EXPORT-VERTICAL] Generating document for:', vertical.nombre);

    const buffer = await buildVerticalDocument(vertical);

    const filename = `Vertical_${vertical.nombre || 'documento'}_${new Date().getTime()}.docx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

    return res.status(200).send(buffer);

  } catch (error) {
    console.error('[EXPORT-VERTICAL] Error:', error);
    return res.status(500).json({
      error: 'Error generando documento',
      details: error.message
    });
  }
}
