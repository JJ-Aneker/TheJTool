// api/build-docx.js — Vercel Function
// Genera el documento .docx a partir de los datos estructurados del proyecto

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign, SimpleField, TableOfContents, LevelFormat, PageBreak,
  Header, Footer, TabStopType, ImageRun, convertInchesToTwip,
} from 'docx';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TEXTOS } from './_lib/knowledge/textos_estandar.js';
import { VERTICALES, PREMISAS_COMUNES } from './_lib/knowledge/verticales.js';
import { formatImporte } from './_lib/knowledge/ratios.js';

// Helper para acceso a datos de vertical (con fallback a hardcoded)
function getVerticalData(verticalKey) {
  return VERTICALES[verticalKey] || VERTICALES.generico;
}

const __dirname = dirname(fileURLToPath(import.meta.url));

// Cargar descripciones de licencias
const LICENSE_DESCRIPTIONS = JSON.parse(
  readFileSync(join(__dirname, 'license_descriptions.json'), 'utf-8')
);

export const config = { maxDuration: 120 };

// ── CONSTANTES DE ESTILO ──────────────────────────────────────────────────────
const C = {
  RED:    'C00000',
  DARK:   '404040',
  GREY:   '7F7F7F',
  LGREY:  'F2F2F2',
  WHITE:  'FFFFFF',
  YELLOW: 'FFF2CC',
};
const F = { BODY: 'Montserrat', H1: 'Tungsten Reveal EXT', H2: 'Tungsten Reveal EXT' };
const PAGE_W    = 11906;
const PAGE_H    = 16838;
const MAR_TOP   = 1800;
const MAR_BOT   = 1417;
const MAR_LAT   = 1701;
const CONTENT_W = PAGE_W - 2 * MAR_LAT;

// ── HELPERS ───────────────────────────────────────────────────────────────────
const bdr   = (color = 'CCCCCC') => ({ style: BorderStyle.SINGLE, size: 1, color });
const BDRS  = (color = 'CCCCCC') => ({ top: bdr(color), bottom: bdr(color), left: bdr(color), right: bdr(color) });
const NO_BDR  = { style: BorderStyle.NONE, size: 0, color: 'auto' };
const NO_BDRS = { top: NO_BDR, bottom: NO_BDR, left: NO_BDR, right: NO_BDR };
const CM = { top: 80, bottom: 80, left: 120, right: 120 };

// Format Tungsten titles: first letter uppercase, rest lowercase
function scTungsten(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Uppercase formatter (fallback)
function sc(str) {
  if (!str) return '';
  return str.toUpperCase();
}

function p(text, opts = {}) {
  return new Paragraph({
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.BOTH,
    spacing: { after: opts.sa || 120, before: opts.sb || 0, line: 240 },
    children: [new TextRun({
      text: text || '',
      font: opts.font || F.BODY,
      size: opts.size || 18,
      color: opts.color || C.DARK,
      bold: opts.bold || false,
      italics: opts.italic || false,
    })]
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.LEFT,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text: scTungsten(text), font: F.H1, size: 52, color: C.DARK, bold: false })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.LEFT,
    spacing: { before: 320, after: 120 },
    children: [new TextRun({ text: scTungsten(text), font: F.H2, size: 32, color: C.DARK, bold: false })]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 100 },
    children: [new TextRun({ text, font: F.BODY, size: 22, color: C.DARK, bold: true })]
  });
}

function b1(text) {
  return new Paragraph({
    numbering: { reference: 'bullet-l1', level: 0 },
    spacing: { after: 80, line: 240 },
    children: [new TextRun({ text, font: F.BODY, size: 18, color: C.DARK })]
  });
}

function gap() {
  return new Paragraph({ spacing: { after: 0 }, children: [] });
}

// ── POSICIONAL DE IMAGEN ──────────────────────────────────────────────────────
// Genera un bloque placeholder visual para <<<IMAGEN: descripción>>>
function imagePlaceholder(descripcion) {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    rows: [
      new TableRow({
        height: { value: 2400, rule: 'exact' },
        children: [
          new TableCell({
            width: { size: CONTENT_W, type: WidthType.DXA },
            shading: { fill: 'F2F2F2', type: ShadingType.CLEAR },
            borders: {
              top:    { style: BorderStyle.DASHED, size: 2, color: 'AAAAAA' },
              bottom: { style: BorderStyle.DASHED, size: 2, color: 'AAAAAA' },
              left:   { style: BorderStyle.DASHED, size: 2, color: 'AAAAAA' },
              right:  { style: BorderStyle.DASHED, size: 2, color: 'AAAAAA' },
            },
            margins: { top: 400, bottom: 400, left: 400, right: 400 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
                children: [new TextRun({ text: '[ 🖼 ]', font: F.BODY, size: 28, color: 'AAAAAA' })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0 },
                children: [new TextRun({ text: descripcion, font: F.BODY, size: 16, color: '888888', italics: true })]
              }),
            ]
          })
        ]
      })
    ]
  });
}

// Parsea un texto que puede contener <<<IMAGEN: desc>>> y devuelve array de elementos docx
function parseTextWithImages(text, pOpts = {}) {
  if (!text) return []
  const PLACEHOLDER_RE = /<<<IMAGEN:\s*([^>]+)>>>/g
  const elements = []
  let lastIndex = 0
  let match

  while ((match = PLACEHOLDER_RE.exec(text)) !== null) {
    // Texto antes del placeholder
    const before = text.slice(lastIndex, match.index).trim()
    if (before) elements.push(p(before, pOpts))

    // Placeholder de imagen
    const desc = match[1].trim()
    elements.push(gap())
    elements.push(imagePlaceholder(desc))
    // Pie de foto placeholder con estilo PiedeFoto
    elements.push(new Paragraph({
      style: 'PiedeFoto',
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: desc, font: F.BODY, size: 14, color: C.GREY, italics: true })]
    }))
    elements.push(gap())

    lastIndex = match.index + match[0].length
  }

  // Texto restante
  const after = text.slice(lastIndex).trim()
  if (after) elements.push(p(after, pOpts))

  return elements.length > 0 ? elements : [p(text, pOpts)]
}

function pageBreak() {
  return new Paragraph({ spacing: { after: 0 }, children: [new PageBreak()] });
}

function hdrCell(text, w, opts = {}) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    shading: { fill: C.RED, type: ShadingType.CLEAR },
    borders: BDRS(C.RED),
    margins: CM,
    verticalAlign: VerticalAlign.CENTER,
    columnSpan: opts.span || 1,
    children: [new Paragraph({
      alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { after: 0 },
      children: [new TextRun({ text, font: F.BODY, size: 16, color: C.WHITE, bold: true })]
    })]
  });
}

function cell(text, w, opts = {}) {
  const fill = opts.pending ? C.YELLOW : (opts.alt ? C.LGREY : C.WHITE);
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    borders: BDRS(),
    margins: CM,
    verticalAlign: VerticalAlign.CENTER,
    columnSpan: opts.span || 1,
    children: [new Paragraph({
      alignment: opts.center ? AlignmentType.CENTER : AlignmentType.BOTH,
      spacing: { after: 0 },
      children: [new TextRun({
        text: text || '',
        font: F.BODY, size: 16, color: C.DARK,
        bold: opts.bold || false,
        italics: opts.italic || false,
      })]
    })]
  });
}

function totalCell(text, w, opts = {}) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    shading: { fill: C.DARK, type: ShadingType.CLEAR },
    borders: BDRS(C.DARK),
    margins: CM,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { after: 0 },
      children: [new TextRun({ text: text || '', font: F.BODY, size: 16, color: C.WHITE, bold: true })]
    })]
  });
}

function hline() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: C.RED } },
    spacing: { after: 320, before: 0 },
    children: []
  });
}

const PAGE_PROPS = {
  page: {
    size: { width: PAGE_W, height: PAGE_H },
    margin: { top: MAR_TOP, bottom: MAR_BOT, left: MAR_LAT, right: MAR_LAT, header: 708, footer: 708 }
  }
};

// ── SECCIONES DEL DOCUMENTO ───────────────────────────────────────────────────

// Construye portada con imagen PNG como fondo (documento-level anchor)
function buildPortadaWithImage(imgBase64, d) {
  try {
    // Limpiar base64 si viene con prefijo data:
    const cleanBase64 = imgBase64.includes('base64,') ? imgBase64.split('base64,')[1] : imgBase64;
    const imgBuffer = Buffer.from(cleanBase64, 'base64');

    const titulo = d.proyecto?.titulo || 'Therefore';
    const cliente = d.cliente?.razonSocial || d.cliente?.nombre || 'Cliente';
    const tipoDoc = d.tipoDoc || 'efdt';
    const tipoDocLabel = tipoDoc === 'efdt' ? 'Aproximación económica' : tipoDoc === 'requirements' ? 'Análisis de requerimientos' : 'Documento técnico';
    const docId = d.proyecto?.id || 'XXX';
    const version = d.proyecto?.version || 'v1.0';
    const fecha = d.proyecto?.fecha || '';

    // CRÍTICO: Usar dimensiones de página completa (A4 en TWIPs, no pixels)
    // PAGE_W y PAGE_H ya están definidos arriba en TWIPs
    const imageWidthEMU = Math.round(PAGE_W * 635); // Convertir TWIPs a EMUs
    const imageHeightEMU = Math.round(PAGE_H * 635);

    // Imagen anclada detrás del documento ocupando página completa
    const imageRunWithFloating = new ImageRun({
      data: imgBuffer,
      transformation: {
        width: Math.round(imageWidthEMU / 9525), // EMUs a pixels (1 pixel = 9525 EMUs)
        height: Math.round(imageHeightEMU / 9525)
      },
      floating: {
        horizontalPosition: { offset: 0, relative: 'page' },
        verticalPosition: { offset: 0, relative: 'page' },
        allowOverlap: true,
        behindDocument: true,
        layoutInCell: true,
        wrappingStyle: 'none',
      },
    });

    return [
      // Párrafo con imagen anclada
      new Paragraph({
        children: [imageRunWithFloating],
      }),
      // Espacios para alinear PROYECTO al medio-superior
      ...Array.from({ length: 10 }, gap),
      // Texto blanco - PROYECTO (muy grande)
      new Paragraph({
        indent: { left: MAR_LAT },
        alignment: AlignmentType.LEFT,
        spacing: { after: 200 },
        children: [new TextRun({
          text: scTungsten(titulo),
          font: F.H1,
          size: 160, // 80pt
          color: C.WHITE,
          bold: false,
        })]
      }),
      // Texto blanco - TIPO DE DOCUMENTO (línea 1)
      new Paragraph({
        indent: { left: MAR_LAT },
        alignment: AlignmentType.LEFT,
        spacing: { after: 80 },
        children: [new TextRun({
          text: tipoDocLabel.toUpperCase(),
          font: F.BODY,
          size: 48, // 24pt
          color: C.WHITE,
          bold: false,
        })]
      }),
      // Texto blanco - CLIENTE - ID (línea 2)
      new Paragraph({
        indent: { left: MAR_LAT },
        alignment: AlignmentType.LEFT,
        spacing: { after: 240 },
        children: [new TextRun({
          text: `${cliente} - ${docId}`,
          font: F.BODY,
          size: 48, // 24pt
          color: C.WHITE,
          bold: false,
        })]
      }),
      // Espacios para bajar a la parte inferior
      ...Array.from({ length: 16 }, gap),
      // Metadata (versión y fecha en la parte inferior)
      new Paragraph({
        indent: { left: MAR_LAT },
        alignment: AlignmentType.LEFT,
        spacing: { after: MAR_BOT },
        children: [new TextRun({
          text: `${version} · ${fecha}`,
          font: F.BODY,
          size: 32, // 16pt
          color: C.WHITE,
          bold: false,
        })]
      }),
    ];
  } catch (err) {
    console.warn('Error inserting portada image:', err.message);
    // Fallback a portada sin imagen
    return buildPortada(d, true);
  }
}

function buildPortada(d, forceNoImage = false) {
  // DEBUG
  console.log('[BUILD-DOCX] buildPortada() - tiene portada?', !!d.portada?.imgBase64);
  console.log('[BUILD-DOCX] buildPortada() - forceNoImage?', forceNoImage);

  // Si hay portada PNG disponible y no se fuerza, usarla
  if (d.portada?.imgBase64 && !forceNoImage) {
    console.log('[BUILD-DOCX] ✅ Usando portada con imagen');
    return buildPortadaWithImage(d.portada.imgBase64, d);
  }

  // Fallback: portada simple (si no hay PNG)
  console.log('[BUILD-DOCX] ⚠️ Usando portada SIN imagen (fallback)');
  const cliente = d.cliente?.razonSocial || d.cliente?.nombre || '<<CLIENTE>>';
  const tipoDoc = d.tipoDoc || 'efdt';
  const tipoDocLabel = tipoDoc === 'efdt' ? 'Aproximación económica' : tipoDoc === 'requirements' ? 'Análisis de requerimientos' : 'Documento técnico';
  const docId = d.proyecto?.id || 'XXX';

  return [
    ...Array.from({ length: 12 }, gap),
    p(scTungsten(d.proyecto?.titulo || 'Therefore'), { font: F.H1, size: 96, color: C.DARK, sa: 0 }),
    ...Array.from({ length: 4 }, gap),
    p(`${cliente} - ${tipoDocLabel} - ${docId}`, { font: F.BODY, size: 56, color: C.DARK, sb: 80, sa: 400 }),
    hline(),
    p(`${d.proyecto?.version || 'v1.0'}  ·  ${d.proyecto?.fecha || ''}`, { size: 18, color: C.GREY, sa: 0 }),
  ];
}

function buildContraportada() {
  return [
    ...Array.from({ length: 20 }, gap),
    hline(),
    p(TEXTOS.contraportada.empresa,   { size: 18, bold: true, sa: 80 }),
    p(TEXTOS.contraportada.direccion, { size: 16, color: C.GREY, sa: 60 }),
    p(TEXTOS.contraportada.web,       { size: 16, color: C.GREY, sa: 160 }),
    p(`© Canon España S.A.U. ${new Date().getFullYear()}`, { size: 14, color: C.GREY, italic: true, sa: 0 }),
  ];
}

function buildFicha(d) {
  const c1 = Math.round(CONTENT_W * 0.32);
  const c2 = CONTENT_W - c1;
  const cliente = d.cliente?.razonSocial || d.cliente?.nombre || '<<CLIENTE>>';
  const tipoDoc = d.tipoDoc || 'efdt';
  const tipoDocLabel = tipoDoc === 'efdt' ? 'Aproximación económica' : tipoDoc === 'requirements' ? 'Análisis de requerimientos' : 'Documento técnico';
  const docId = d.proyecto?.id || 'XXX';
  const fichaRows = [
    ['Título de documento',         `${cliente} - ${tipoDocLabel} - ${docId}`],
    ['Fecha del documento',         d.proyecto?.fecha || ''],
    ['Autor/es del documento',      'Jose-Juan Jiménez-Requena'],
    ['Cliente',                     cliente],
    ['Interlocutor/es del cliente', d.cliente?.interlocutor || '<<INTERLOCUTOR>>'],
    ['Documentos relacionados',     '—'],
  ];
  const cV = Math.round(CONTENT_W * 0.08);
  const cF = Math.round(CONTENT_W * 0.14);
  const cC = Math.round(CONTENT_W * 0.52);
  const cA = CONTENT_W - cV - cF - cC;

  return [
    h1('Ficha de documento'),
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [c1, c2],
      rows: fichaRows.map(([k, v], i) => new TableRow({ children: [
        cell(k, c1, { bold: true, alt: i % 2 === 1 }),
        cell(v, c2, { alt: i % 2 === 1 }),
      ]}))
    }),
    gap(),
    h2('Historial de documento'),
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [cV, cF, cC, cA],
      rows: [
        new TableRow({ children: [
          hdrCell('Versión', cV, { center: true }),
          hdrCell('Fecha', cF),
          hdrCell('Comentarios', cC),
          hdrCell('Modificado por', cA),
        ]}),
        new TableRow({ children: [
          cell(d.proyecto?.version || '1.0', cV, { center: true }),
          cell(d.proyecto?.fecha || '', cF),
          cell('Documento original (Draft 1)', cC),
          cell('JJ Jiménez Requena', cA),
        ]}),
        new TableRow({ children: [cell('', cV), cell('', cF), cell('', cC), cell('', cA)] }),
      ]
    }),
  ];
}

function buildConfidencialidad(d) {
  const cliente = d.cliente?.razonSocial || d.cliente?.nombre || '<<CLIENTE>>';
  return [
    h1('Confidencialidad'),
    p(TEXTOS.confidencialidad.parrafo1(cliente)),
    p(TEXTOS.confidencialidad.parrafo2(cliente)),
    h2('Cláusulas adicionales'),
    p(TEXTOS.confidencialidad.clausulas_adicionales_1),
    p(TEXTOS.confidencialidad.clausulas_adicionales_2(cliente)),
    p(`Copyright © Canon España S.A.U.  ${new Date().getFullYear()}`, { italic: true, color: C.GREY }),
  ];
}

function buildIntroduccion(d) {
  const vertData = getVerticalData(d.proyecto?.vertical);
  return [
    h1('Introducción'),
    h2('Objetivos'),
    p(TEXTOS.introduccion_generica),
    h2('Claves del proyecto'),
    p(vertData.descripcion_intro || d.alcance?.descripcionGeneral || ''),
    ...(d.alcance?.clavesProyecto || vertData.claves || []).map(c => b1(c)),
  ];
}

function buildDefinicion(d, tipoDoc = 'efdt') {
  const elements = [h1('Definición del proyecto')];
  const isEFDT = tipoDoc === 'efdt';

  // Alcance del proyecto
  if (d.alcance) {
    elements.push(h2('Alcance del proyecto'));
    if (d.alcance.descripcionGeneral) {
      elements.push(p(d.alcance.descripcionGeneral));
    }
    if (d.proyecto?.descripcion) {
      elements.push(h3('Descripción técnica'));
      elements.push(p(d.proyecto.descripcion));
    }
    if (d.alcance.clavesProyecto?.length > 0) {
      elements.push(h3('Claves del proyecto'));
      elements.push(...d.alcance.clavesProyecto.map(c => b1(c)));
    }
    if (d.alcance.exclusiones?.length > 0) {
      elements.push(h3('Exclusiones'));
      elements.push(...d.alcance.exclusiones.map(e => b1(e)));
    }
    elements.push(gap());
  }

  // Categorías principales
  if (d.estructura?.categoriasPrincipales?.length > 0) {
    elements.push(h2('Estructura documental'));
    for (const cat of d.estructura.categoriasPrincipales) {
      elements.push(h3(cat.nombre));
      if (cat.descripcion) elements.push(...parseTextWithImages(cat.descripcion));

      // Campos con explicación breve (NO tabla) - SOLO para EFDT
      if (isEFDT && cat.campos?.length > 0) {
        elements.push(h3('Campos principales'));
        for (const campo of cat.campos) {
          const nombre = typeof campo === 'string' ? campo : campo.campo || campo.nombre || '';
          const tipo = typeof campo === 'object' ? campo.tipo || '' : '';
          const desc = typeof campo === 'object' ? campo.desc || campo.descripcion || '' : '';

          // Formato: Campo (tipo): descripción
          let fieldText = nombre;
          if (tipo) fieldText += ` (${tipo})`;
          if (desc) fieldText += `: ${desc}`;

          elements.push(new Paragraph({
            numbering: { reference: 'bullet-l1', level: 0 },
            spacing: { after: 80, line: 240 },
            children: [new TextRun({ text: fieldText, font: F.BODY, size: 18, color: C.DARK })]
          }));
        }
        elements.push(gap());
      }
    }
  }

  // Tablas maestras - SOLO para EFDT
  if (isEFDT && d.estructura?.tablasMaestras?.length > 0) {
    elements.push(h2('Tablas maestras (master data)'));
    const vertData = getVerticalData(d.proyecto?.vertical);
    if (vertData?.tablas_maestras?.length > 0 || vertData?.tablasMaestras?.length > 0) {
      elements.push(p('El servicio se fundamenta en el acceso a tablas maestras actualizadas, lo que simplifica la configuración y automatización de los procesos. Su correcta actualización es esencial para el funcionamiento del servicio en su totalidad.'));
    }
    for (const tabla of d.estructura.tablasMaestras) {
      elements.push(h3(tabla.nombre));
      if (tabla.descripcion) elements.push(...parseTextWithImages(tabla.descripcion));
      if (tabla.campos?.length > 0) {
        elements.push(p(`Campos: ${tabla.campos.join(', ')}.`, { italic: true, size: 16, color: C.GREY }));
      }
    }
    elements.push(gap());
  }

  // Workflows - SOLO para EFDT
  if (isEFDT && d.estructura?.workflows?.length > 0) {
    elements.push(h2('Flujos de trabajo'));
    elements.push(p('Los flujos de trabajo constituyen un elemento clave dentro del sistema, permitiendo automatizar los procesos asociados al ciclo de vida documental, garantizando la coherencia, trazabilidad y cumplimiento de los procedimientos internos.'));
    elements.push(gap());
    for (const wf of d.estructura.workflows) {
      elements.push(h3(wf.nombre));
      elements.push(...parseTextWithImages(wf.descripcion || ''));
      if (wf.etapas?.length > 0) {
        for (const etapa of wf.etapas) elements.push(b1(etapa));
      }
      elements.push(gap());
    }
  }

  // Herramientas externas - SOLO para EFDT
  if (isEFDT && d.estructura?.herramientasExternas?.length > 0) {
    elements.push(h2('Herramientas externas e integraciones'));
    for (const herr of d.estructura.herramientasExternas) {
      elements.push(h3(herr.nombre));
      if (herr.descripcion) elements.push(...parseTextWithImages(herr.descripcion));
      if (herr.funcionalidades?.length > 0) {
        elements.push(p('Funcionalidades principales:'));
        for (const func of herr.funcionalidades) {
          elements.push(b1(func));
        }
      }
      elements.push(gap());
    }
  }

  return elements;
}

function buildLicencias(d) {
  const c1 = Math.round(CONTENT_W * 0.42);
  const c2 = Math.round(CONTENT_W * 0.36);
  const c3 = CONTENT_W - c1 - c2;

  const licRows = [
    ['Therefore™ Online Server', 'Licencia base (incluye Cases y Workflow Designer)', String(d.licencias?.servidor || 1)],
  ];
  if (d.licencias?.nominativas > 0)
    licRows.push(['Therefore™ Client (nominativa)', 'Licencia de usuario nominativo', String(d.licencias.nominativas)]);
  if (d.licencias?.concurrentes > 0)
    licRows.push(['Therefore™ Client (concurrente)', 'Licencia de usuario concurrente', String(d.licencias.concurrentes)]);
  if (d.licencias?.readOnly > 0)
    licRows.push(['Therefore™ Client (read-only concurrente)', 'Licencia de solo lectura compartida', String(d.licencias.readOnly)]);
  for (const mod of (d.licencias?.modulosAdicionales || []))
    licRows.push([`Therefore™ ${mod}`, 'Módulo adicional', '1']);

  return [
    h1('Licencias software'),
    p(TEXTOS.licencias_intro),
    gap(),
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [c1, c2, c3],
      rows: [
        new TableRow({ children: [hdrCell('Componente', c1), hdrCell('Tipo de licencia', c2), hdrCell('Cantidad', c3, { center: true })] }),
        ...licRows.map(([comp, tipo, cant], i) => new TableRow({ children: [
          cell(comp, c1, { alt: i % 2 === 1 }),
          cell(tipo, c2, { alt: i % 2 === 1 }),
          cell(cant, c3, { alt: i % 2 === 1, center: true }),
        ]}))
      ]
    }),
  ];
}

function buildEstimacion(d) {
  const tareas = d.estimacion?.tareas || [];
  const cols = [
    Math.round(CONTENT_W * 0.44),
    Math.round(CONTENT_W * 0.11),
    Math.round(CONTENT_W * 0.11),
    Math.round(CONTENT_W * 0.20),
    CONTENT_W - Math.round(CONTENT_W * 0.44) - Math.round(CONTENT_W * 0.11) - Math.round(CONTENT_W * 0.11) - Math.round(CONTENT_W * 0.20),
  ];

  const hasPending = tareas.some(t => t.pendiente);

  const totalDias    = d.estimacion?.totalDias || 0;
  const totalHoras   = d.estimacion?.totalHoras || 0;
  const totalImporte = d.estimacion?.totalImporte || 0;
  const totalConIva  = d.estimacion?.totalConIva || Math.round(totalImporte * 1.21);

  return [
    h1('Estimación de esfuerzo'),
    p(TEXTOS.disclaimer_estimacion),
    gap(),
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: cols,
      rows: [
        new TableRow({ children: [
          hdrCell('Actividad', cols[0]),
          hdrCell('Días', cols[1], { center: true }),
          hdrCell('Horas', cols[2], { center: true }),
          hdrCell('Importe', cols[3], { center: true }),
          hdrCell('Estado', cols[4], { center: true }),
        ]}),
        ...tareas.map((t, i) => new TableRow({ children: [
          cell(t.descripcion, cols[0], { alt: i % 2 === 1, pending: t.pendiente }),
          cell(t.pendiente ? 'P' : `${t.dias}`, cols[1], { alt: i % 2 === 1, center: true, pending: t.pendiente }),
          cell(t.pendiente ? 'P' : `${t.horas}h`, cols[2], { alt: i % 2 === 1, center: true, pending: t.pendiente }),
          cell(t.pendiente ? 'P' : formatImporte(t.importe || 0), cols[3], { alt: i % 2 === 1, center: true, pending: t.pendiente, bold: !t.pendiente }),
          cell(t.pendiente ? 'Pendiente' : 'Incluido', cols[4], { alt: i % 2 === 1, center: true, pending: t.pendiente }),
        ]})),
        new TableRow({ children: [
          totalCell('TOTAL (sin pendientes)', cols[0]),
          totalCell(`${totalDias} días`, cols[1], { center: true }),
          totalCell(`${totalHoras} h`, cols[2], { center: true }),
          totalCell(formatImporte(totalImporte), cols[3], { center: true }),
          totalCell('', cols[4]),
        ]}),
      ]
    }),
    gap(),
    ...(hasPending ? [p(TEXTOS.disclaimer_pendiente, { italic: true, color: C.GREY, size: 16 }), gap()] : []),

    // Resumen económico
    h2('Resumen económico'),
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [Math.round(CONTENT_W * 0.55), Math.round(CONTENT_W * 0.45)],
      rows: [
        new TableRow({ children: [
          hdrCell('Concepto', Math.round(CONTENT_W * 0.55)),
          hdrCell('Valor', Math.round(CONTENT_W * 0.45), { center: true }),
        ]}),
        ...[
          ['Tarifa día (800 €/día)',     '800,00 €/día'],
          ['Esfuerzo total confirmado',  `${totalDias} días · ${totalHoras} h`],
          ['Importe total (sin IVA)',     formatImporte(totalImporte)],
          ['IVA (21%)',                   formatImporte(totalImporte * 0.21)],
          ['TOTAL con IVA',              formatImporte(totalConIva)],
        ].map(([k, v], i) => new TableRow({ children: [
          cell(k, Math.round(CONTENT_W * 0.55), { alt: i % 2 === 1, bold: i === 4 }),
          cell(v, Math.round(CONTENT_W * 0.45), { alt: i % 2 === 1, center: true, bold: i === 4 }),
        ]}))
      ]
    }),
  ];
}

function buildSeguridad() {
  const c1 = Math.round(CONTENT_W * 0.22);
  const c2 = CONTENT_W - c1;
  return [
    h1('Seguridad'),
    p(TEXTOS.seguridad_intro),
    gap(),
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [c1, c2],
      rows: [
        new TableRow({ children: [hdrCell('Rol', c1), hdrCell('Descripción', c2)] }),
        ...TEXTOS.roles_seguridad.map((r, i) => new TableRow({ children: [
          cell(r.rol,         c1, { alt: i % 2 === 1, bold: true }),
          cell(r.descripcion, c2, { alt: i % 2 === 1 }),
        ]}))
      ]
    }),
  ];
}

function buildRiesgos(d) {
  const c1 = Math.round(CONTENT_W * 0.26);
  const c2 = Math.round(CONTENT_W * 0.52);
  const c3 = CONTENT_W - c1 - c2;

  const vertData = getVerticalData(d.proyecto?.vertical);
  const premisasEspecificas = vertData?.premisas_especificas || [];
  const todasPremisas = [...PREMISAS_COMUNES, ...premisasEspecificas, ...(d.riesgos || [])];

  // Deduplicate by premisa name
  const seen = new Set();
  const premisas = todasPremisas.filter(p => {
    if (seen.has(p.premisa)) return false;
    seen.add(p.premisa);
    return true;
  });

  return [
    h1('Riesgos y premisas'),
    p('Las siguientes premisas se asumen como válidas para el alcance estimado. Cualquier desviación sobre las mismas puede implicar una revisión del esfuerzo:'),
    gap(),
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [c1, c2, c3],
      rows: [
        new TableRow({ children: [hdrCell('Premisa', c1), hdrCell('Descripción', c2), hdrCell('Impacto', c3, { center: true })] }),
        ...premisas.map((pr, i) => new TableRow({ children: [
          cell(pr.premisa,     c1, { alt: i % 2 === 1, bold: true }),
          cell(pr.descripcion, c2, { alt: i % 2 === 1 }),
          cell(pr.impacto,     c3, { alt: i % 2 === 1, center: true, pending: pr.impacto === 'Pendiente' }),
        ]}))
      ]
    }),
  ];
}

function buildFirmas(d) {
  const half = Math.round(CONTENT_W / 2);
  const cliente = d.cliente?.razonSocial || d.cliente?.nombre || '<<CLIENTE>>';

  const makeFirmaCell = (titulo, nombre, cargo) => new TableCell({
    width: { size: half, type: WidthType.DXA },
    borders: NO_BDRS,
    margins: CM,
    children: [
      p(titulo,  { bold: true, sa: 0 }),
      p(nombre,  { sa: 0 }),
      p(cargo,   { color: C.GREY, sa: 0 }),
      gap(), gap(), gap(),
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.DARK } },
        spacing: { after: 80 }, children: []
      }),
      p('Firma y fecha', { size: 16, color: C.GREY, italic: true, sa: 0 }),
    ]
  });

  return [
    h1('Firmas de aceptación'),
    p(TEXTOS.firmas_intro),
    gap(), gap(),
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [half, half],
      rows: [new TableRow({ children: [
        makeFirmaCell('Por Canon España, S.A.U.', 'Jose-Juan Jiménez-Requena', 'Solutions Architect'),
        makeFirmaCell(`Por ${cliente}`, '<<NOMBRE Y APELLIDOS>>', '<<CARGO>>'),
      ]})]
    }),
  ];
}

function buildHeader(projectName) {
  return new Header({
    children: [new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.RED } },
      spacing: { after: 80 },
      tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
      children: [
        new TextRun({ text: 'Canon España · Therefore™', font: F.BODY, size: 14, color: C.GREY }),
        new TextRun({ text: '\t' }),
        new TextRun({ text: projectName || '', font: F.BODY, size: 14, color: C.GREY }),
      ]
    })]
  });
}

function buildFooter() {
  return new Footer({
    children: [new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.RED } },
      spacing: { before: 80 },
      tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
      children: [
        new TextRun({ text: 'Confidencial · Canon España, S.A.U.', font: F.BODY, size: 14, color: C.GREY }),
        new TextRun({ text: '\t' }),
        new TextRun({ text: 'Página ', font: F.BODY, size: 14, color: C.GREY }),
        new SimpleField('PAGE', { font: F.BODY, size: 14, color: C.GREY }),
      ]
    })]
  });
}

function emptyHeader() {
  return new Header({ children: [new Paragraph({ spacing: { after: 0 }, children: [] })] });
}
function emptyFooter() {
  return new Footer({ children: [new Paragraph({ spacing: { after: 0 }, children: [] })] });
}

// ── DOCUMENT BUILDER ──────────────────────────────────────────────────────────
async function buildDocument(projectData) {
  const d = projectData;
  const tipoDoc = d.tipoDoc || 'efdt';
  const cabecera = d.proyecto?.cabecera || d.proyecto?.titulo || 'Therefore™';

  // DEBUG: Log estructura data
  console.log('[BUILD-DOCX] tipoDoc:', tipoDoc);
  console.log('[BUILD-DOCX] estructura.categoriasPrincipales:', d.estructura?.categoriasPrincipales?.length || 0);
  console.log('[BUILD-DOCX] estructura.tablasMaestras:', d.estructura?.tablasMaestras?.length || 0);
  console.log('[BUILD-DOCX] estructura.workflows:', d.estructura?.workflows?.length || 0);

  const doc = new Document({
    styles: {
      default: { document: { run: { font: F.BODY, size: 18, color: C.DARK } } },
      paragraphStyles: [
        {
          id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: F.H1, size: 52, bold: false, color: C.DARK },
          paragraph: {
            spacing: { before: 400, after: 200 }, outlineLevel: 0,
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.RED, space: 4 } }
          }
        },
        {
          id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: F.H2, size: 32, bold: false, color: C.DARK },
          paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 1 }
        },
        {
          id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: F.BODY, size: 22, bold: true, color: C.DARK },
          paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 2 }
        },
      ]
    },
    numbering: {
      config: [{
        reference: 'bullet-l1',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '\u25CF',
          alignment: AlignmentType.LEFT,
          style: {
            run: { font: 'Arial', color: C.RED, size: 18 },
            paragraph: { indent: { left: 720, hanging: 360 }, spacing: { after: 80 } }
          }
        }]
      }]
    },
    sections: [
      // Portada
      {
        properties: { ...PAGE_PROPS },
        headers: { default: emptyHeader() },
        footers: { default: emptyFooter() },
        children: buildPortada(d),
      },
      // Contenido principal
      {
        properties: { ...PAGE_PROPS },
        headers: { default: buildHeader(cabecera) },
        footers: { default: buildFooter() },
        children: [
          ...buildFicha(d),
          pageBreak(),
          h1('Contenido'),
          new TableOfContents('Contenido', { hyperlink: true, headingStyleRange: '1-3' }),
          pageBreak(),
          ...buildConfidencialidad(d),
          pageBreak(),
          ...buildIntroduccion(d),
          pageBreak(),
          ...buildDefinicion(d, tipoDoc),
          pageBreak(),
          ...buildLicencias(d),
          pageBreak(),
          ...buildEstimacion(d),
          pageBreak(),
          ...buildSeguridad(),
          pageBreak(),
          ...buildRiesgos(d),
          pageBreak(),
          ...buildFirmas(d),
        ],
      },
      // Contraportada
      {
        properties: { ...PAGE_PROPS },
        headers: { default: emptyHeader() },
        footers: { default: emptyFooter() },
        children: buildContraportada(),
      },
    ],
  });

  return Packer.toBuffer(doc);
}

// ═════════════════════════════════════════════════════════════════════════════
// GENERADOR DE DOCUMENTOS DE COTIZACIÓN DE LICENCIAS
// ═════════════════════════════════════════════════════════════════════════════

// Funciones auxiliares para detectar módulos
function detectModulosIncluidos(items) {
  const codigos = items.map(i => i.codigo || '').map(c => c.toUpperCase());
  const incluidos = [];
  const conectores = LICENSE_DESCRIPTIONS.conectores;
  const iaModules = LICENSE_DESCRIPTIONS.ia_modules;

  // Detectar conectores
  Object.entries(conectores).forEach(([key, conector]) => {
    if (conector.codigo && codigos.some(c => c.includes(conector.codigo.toUpperCase()))) {
      incluidos.push({ ...conector, tipo: 'conector', key });
    }
  });

  // Detectar módulos de IA
  Object.entries(iaModules).forEach(([key, modulo]) => {
    if (modulo.codigo && codigos.some(c => c.includes(modulo.codigo.toUpperCase()))) {
      incluidos.push({ ...modulo, tipo: 'ia', key });
    }
  });

  return incluidos;
}

function detectModulosOpcionales(items) {
  const incluidos = detectModulosIncluidos(items);
  const keysIncluidos = incluidos.map(m => m.key);
  const opcionales = [];

  const conectores = LICENSE_DESCRIPTIONS.conectores;
  const iaModules = LICENSE_DESCRIPTIONS.ia_modules;

  // Conectores no incluidos
  Object.entries(conectores).forEach(([key, conector]) => {
    if (!keysIncluidos.includes(key)) {
      opcionales.push({ ...conector, tipo: 'conector', key });
    }
  });

  // Módulos IA no incluidos
  Object.entries(iaModules).forEach(([key, modulo]) => {
    if (!keysIncluidos.includes(key)) {
      opcionales.push({ ...modulo, tipo: 'ia', key });
    }
  });

  return opcionales;
}

function generarSeccionesEducativas(edicion, items) {
  const sections = [];
  const modeloInfo = LICENSE_DESCRIPTIONS.modelos[edicion];

  // Sección 1: Modelo de Licenciamiento
  sections.push(
    h1('Su Modelo de Licenciamiento'),
    h2(modeloInfo.titulo),
    p(modeloInfo.descripcion, { size: 18 })
  );

  // Sección 2: Módulos Incluidos en su Propuesta
  const modulosIncluidos = detectModulosIncluidos(items);

  if (modulosIncluidos.length > 0) {
    sections.push(
      new Paragraph({ children: [new PageBreak()] }),
      h1('Módulos Incluidos en su Propuesta')
    );

    modulosIncluidos.forEach(modulo => {
      sections.push(
        h2(modulo.titulo),
        modulo.subtitulo ? p(modulo.subtitulo, { italic: true, size: 16, color: C.GREY }) : null,
        p(modulo.descripcion, { size: 18 })
      ).filter(Boolean);

      if (modulo.caracteristicas && modulo.caracteristicas.length > 0) {
        modulo.caracteristicas.forEach(caract => {
          sections.push(
            new Paragraph({
              bullet: { level: 0 },
              children: [new TextRun({
                text: caract,
                font: F.BODY,
                size: 18,
                color: C.DARK
              })]
            })
          );
        });
      }

      if (modulo.valor) {
        sections.push(
          p(`💡 Valor: ${modulo.valor}`, { size: 18, bold: true, color: C.RED })
        );
      }

      if (modulo.ejemplo) {
        sections.push(
          p(`Ejemplo: ${modulo.ejemplo}`, { size: 16, italic: true })
        );
      }
    });
  }

  // Sección 3: Módulos Opcionales Disponibles
  const modulosOpcionales = detectModulosOpcionales(items);

  if (modulosOpcionales.length > 0) {
    sections.push(
      new Paragraph({ children: [new PageBreak()] }),
      h1('Módulos Opcionales Disponibles'),
      p('Los siguientes módulos no están incluidos en esta propuesta, pero están disponibles para ampliar las capacidades de Therefore™:', { size: 18, italic: true })
    );

    modulosOpcionales.forEach(modulo => {
      sections.push(
        h3(modulo.titulo),
        p(modulo.descripcion, { size: 16 })
      );

      if (modulo.valor) {
        sections.push(
          p(`💡 ${modulo.valor}`, { size: 16, color: C.GREY })
        );
      }
    });
  }

  sections.push(new Paragraph({ children: [new PageBreak()] }));

  return sections.filter(Boolean);
}

async function buildQuotationDocument(quotationData) {
  const {
    cliente = 'Cliente',
    sfdcOpp = '',
    dealSupport = '',
    accountManager = '',
    fecha = new Date().toISOString().split('T')[0],
    edicion = 'onpremise',
    items = [],
    servicios = [],
    techPartners = [],
    totalLicencias = 0,
    totalCSS = 0,
    totalServicios = 0,
    totalTechPartners = 0,
    totalGeneral = 0,
    cuotaAnual = 0,
    anosContrato = 1,
    soporteLocal = 0
  } = quotationData;

  const edicionLabel = edicion === 'onpremise' ? 'On-Premise' :
                       edicion === 'online' ? 'Online' : 'Suscripción';

  const sections = [];

  // Portada
  sections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 3000, after: 400 },
      children: [new TextRun({
        text: 'COTIZACIÓN DE LICENCIAS',
        font: F.H1,
        size: 64,
        color: C.RED,
        bold: true
      })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({
        text: `Therefore™ ${edicionLabel}`,
        font: F.BODY,
        size: 32,
        color: C.DARK
      })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 2000 },
      children: [new TextRun({
        text: cliente,
        font: F.BODY,
        size: 28,
        color: C.DARK,
        bold: true
      })]
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // Datos Generales
  sections.push(
    h1('Datos Generales'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: BDRS(),
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [p('SFDC OPP', { bold: true })], ...CM }),
            new TableCell({ children: [p(sfdcOpp)], ...CM })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [p('Deal Support', { bold: true })], ...CM }),
            new TableCell({ children: [p(dealSupport)], ...CM })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [p('Account Manager', { bold: true })], ...CM }),
            new TableCell({ children: [p(accountManager)], ...CM })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [p('Fecha', { bold: true })], ...CM }),
            new TableCell({ children: [p(fecha)], ...CM })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [p('Edición', { bold: true })], ...CM }),
            new TableCell({ children: [p(edicionLabel)], ...CM })
          ]
        })
      ]
    })
  );

  // Secciones Educativas
  const seccionesEducativas = generarSeccionesEducativas(edicion, items);
  sections.push(...seccionesEducativas);

  // Licencias
  if (items.length > 0) {
    const isRecurring = edicion === 'online' || edicion === 'suscripcion'
    const multiplicadorTiempo = isRecurring ? (12 * anosContrato) : 1

    // Nota sobre precios recurrentes
    if (isRecurring) {
      sections.push(
        p(`Nota: Los precios mostrados son mensuales. El total refleja ${anosContrato} año${anosContrato > 1 ? 's' : ''} de contrato (12 meses × ${anosContrato}).`,
          { size: 16, italic: true, color: C.GREY })
      );
    }

    sections.push(
      h1('Licencias y Productos'),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: BDRS(),
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [p('Código', { bold: true })], shading: { fill: C.LGREY }, ...CM }),
              new TableCell({ children: [p('Descripción', { bold: true })], shading: { fill: C.LGREY }, ...CM }),
              new TableCell({ children: [p('Cantidad', { bold: true })], shading: { fill: C.LGREY }, ...CM }),
              new TableCell({ children: [p(isRecurring ? 'PVP/mes' : 'PVP', { bold: true })], shading: { fill: C.LGREY }, ...CM }),
              new TableCell({ children: [p(isRecurring ? `Total (${anosContrato} año${anosContrato > 1 ? 's' : ''})` : 'Total', { bold: true })], shading: { fill: C.LGREY }, ...CM }),
              new TableCell({ children: [p('CSS/año', { bold: true })], shading: { fill: C.LGREY }, ...CM }),
              new TableCell({ children: [p(isRecurring ? `CSS Total (${anosContrato} año${anosContrato > 1 ? 's' : ''})` : 'CSS Total', { bold: true })], shading: { fill: C.LGREY }, ...CM })
            ]
          }),
          ...items.map(item => {
            const totalLicencia = (item.pvp || 0) * (item.cantidad || 1) * multiplicadorTiempo
            const cssAnual = (item.css_pvp || 0)
            const totalCSS = cssAnual * (item.cantidad || 1) * (isRecurring ? anosContrato : 1)

            return new TableRow({
              children: [
                new TableCell({ children: [p(item.codigo || '', { size: 16 })], ...CM }),
                new TableCell({ children: [p(item.descripcion || '', { size: 16 })], ...CM }),
                new TableCell({ children: [p(String(item.cantidad || 1), { size: 16 })], ...CM }),
                new TableCell({ children: [p(`${(item.pvp || 0).toFixed(2)} €`, { size: 16 })], ...CM }),
                new TableCell({ children: [p(`${totalLicencia.toFixed(2)} €`, { size: 16, bold: true })], ...CM }),
                new TableCell({ children: [p(`${cssAnual.toFixed(2)} €`, { size: 16 })], ...CM }),
                new TableCell({ children: [p(`${totalCSS.toFixed(2)} €`, { size: 16, bold: true })], ...CM })
              ]
            })
          })
        ]
      })
    );
  }

  // Servicios
  if (servicios.length > 0) {
    sections.push(
      h1('Servicios Profesionales'),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: BDRS(),
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [p('Servicio', { bold: true })], shading: { fill: C.LGREY }, ...CM }),
              new TableCell({ children: [p('Unidades', { bold: true })], shading: { fill: C.LGREY }, ...CM }),
              new TableCell({ children: [p('PVP/Unidad', { bold: true })], shading: { fill: C.LGREY }, ...CM }),
              new TableCell({ children: [p('Total', { bold: true })], shading: { fill: C.LGREY }, ...CM })
            ]
          }),
          ...servicios.map(serv => new TableRow({
            children: [
              new TableCell({ children: [p(serv.descripcion || '', { size: 16 })], ...CM }),
              new TableCell({ children: [p(String(serv.unidades || 1), { size: 16 })], ...CM }),
              new TableCell({ children: [p(`${(serv.pvp_jornada || 0).toFixed(2)} €`, { size: 16 })], ...CM }),
              new TableCell({ children: [p(`${((serv.pvp_jornada || 0) * (serv.unidades || 1)).toFixed(2)} €`, { size: 16, bold: true })], ...CM })
            ]
          }))
        ]
      })
    );
  }

  // Tech Partners
  const activeTechPartners = techPartners.filter(tp => tp.importe > 0);
  if (activeTechPartners.length > 0) {
    sections.push(
      h1('Tech Partners'),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: BDRS(),
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [p('Partner', { bold: true })], shading: { fill: C.LGREY }, ...CM }),
              new TableCell({ children: [p('Importe', { bold: true })], shading: { fill: C.LGREY }, ...CM })
            ]
          }),
          ...activeTechPartners.map(tp => new TableRow({
            children: [
              new TableCell({ children: [p(tp.nombre || '', { size: 16 })], ...CM }),
              new TableCell({ children: [p(`${(tp.importe || 0).toFixed(2)} €`, { size: 16, bold: true })], ...CM })
            ]
          }))
        ]
      })
    );
  }

  // Resumen
  sections.push(
    h1('Resumen Económico'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: BDRS(),
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [p('Total Licencias', { bold: true })], ...CM }),
            new TableCell({ children: [p(`${totalLicencias.toFixed(2)} €`, { size: 18, bold: true })], ...CM })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [p('Total CSS', { bold: true })], ...CM }),
            new TableCell({ children: [p(`${totalCSS.toFixed(2)} €`, { size: 18, bold: true })], ...CM })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [p('Total Servicios', { bold: true })], ...CM }),
            new TableCell({ children: [p(`${totalServicios.toFixed(2)} €`, { size: 18, bold: true })], ...CM })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [p('Tech Partners', { bold: true })], ...CM }),
            new TableCell({ children: [p(`${totalTechPartners.toFixed(2)} €`, { size: 18, bold: true })], ...CM })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [p('TOTAL GENERAL', { bold: true, size: 22, color: C.RED })],
              shading: { fill: C.YELLOW },
              ...CM
            }),
            new TableCell({
              children: [p(`${totalGeneral.toFixed(2)} €`, { size: 22, bold: true, color: C.RED })],
              shading: { fill: C.YELLOW },
              ...CM
            })
          ]
        })
      ]
    })
  );

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: MAR_TOP, right: MAR_LAT, bottom: MAR_BOT, left: MAR_LAT }
        }
      },
      children: sections
    }]
  });

  return await Packer.toBuffer(doc);
}

// ── HANDLER ───────────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).setHeaders(CORS).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { projectData, tipoDoc, portada, useDefaultPortada } = req.body;
    if (!projectData) return res.status(400).json({ error: 'projectData requerido' });

    console.log('[BUILD-DOCX] ═══════════════════════════════════════════════════')
    console.log('[BUILD-DOCX] Handler recibió:')
    console.log('[BUILD-DOCX] - portada?.storageUrl:', portada?.storageUrl)
    console.log('[BUILD-DOCX] - portada?.base64:', portada?.base64 ? `${portada.base64.substring(0, 50)}...` : null)
    console.log('[BUILD-DOCX] - useDefaultPortada:', useDefaultPortada)

    // Agregar portada a projectData si existe
    if (portada?.storageUrl) {
      // Descargar desde Storage
      console.log('[BUILD-DOCX] 🔄 Descargando portada desde Storage:', portada.storageUrl)
      try {
        const response = await fetch(portada.storageUrl)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const arrayBuffer = await response.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        projectData.portada = {
          imgBase64: base64,
          width: portada.width,
          height: portada.height,
        }
        console.log('[BUILD-DOCX] ✅ Portada descargada:', base64.length, 'bytes')
        console.log('[BUILD-DOCX] ✅ projectData.portada seteado correctamente')
      } catch (err) {
        console.error('[BUILD-DOCX] ❌ Error descargando portada:', err)
      }
    } else if (portada?.base64) {
      // Fallback: base64 directo
      console.log('[BUILD-DOCX] 🔄 Usando base64 directo')
      projectData.portada = {
        imgBase64: portada.base64,
        width: portada.width,
        height: portada.height,
      }
      console.log('[BUILD-DOCX] ✅ projectData.portada seteado desde base64')
    } else {
      console.log('[BUILD-DOCX] ⚠️ NO HAY PORTADA - ni storageUrl ni base64')
    }

    if (useDefaultPortada) {
      projectData.useDefaultPortada = true;
      console.log('[BUILD-DOCX] ✅ useDefaultPortada activado')
    }
    if (tipoDoc) {
      projectData.tipoDoc = tipoDoc;
    }

    console.log('[BUILD-DOCX] Llamando a build función...')
    console.log('[BUILD-DOCX] tipoDoc:', tipoDoc)
    console.log('[BUILD-DOCX] ═══════════════════════════════════════════════════')

    let buffer, filename;

    if (tipoDoc === 'quotation') {
      // Generar documento de cotización
      buffer = await buildQuotationDocument(projectData);
      const cliente = projectData.cliente || 'Cliente';
      const fecha = projectData.fecha || new Date().toISOString().split('T')[0];
      filename = `Cotización_Therefore_${cliente.replace(/\s+/g, '_')}_${fecha.replace(/-/g, '')}.docx`;
    } else {
      // Generar documento estándar (EFDT, requirements, etc.)
      buffer = await buildDocument(projectData);
      const cliente = projectData.cliente?.nombre || 'Cliente';
      const fecha = (projectData.proyecto?.fecha || '').replace(/\./g, '');
      const version = (projectData.proyecto?.version || 'v1_0').replace(/\./g, '_');
      filename = `${cliente.replace(/\s+/g, '_')}_EFDT_${version}.docx`;
    }

    const base64 = buffer.toString('base64');

    Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(200).json({ success: true, docxBase64: base64, filename });

  } catch (err) {
    Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(500).json({ error: err.message, stack: err.stack?.substring(0, 500) });
  }
}
