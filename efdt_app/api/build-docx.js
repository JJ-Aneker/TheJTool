// api/build-docx.js — Vercel Function
// Genera el documento .docx a partir de los datos estructurados del proyecto

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign, SimpleField, TableOfContents, LevelFormat, PageBreak,
  Header, Footer, TabStopType,
} from 'docx';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TEXTOS } from './_lib/knowledge/textos_estandar.js';
import { VERTICALES, PREMISAS_COMUNES } from './_lib/knowledge/verticales.js';
import { formatImporte } from './_lib/knowledge/ratios.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
const BDRS  = (color = 'CCCCCC') => ({ top: bdr(color), bottom: bdr(color), left: bdr(color), right: bdr(color), insideH: bdr(color), insideV: bdr(color) });
const NO_BDR  = { style: BorderStyle.NONE, size: 0, color: 'auto' };
const NO_BDRS = { top: NO_BDR, bottom: NO_BDR, left: NO_BDR, right: NO_BDR };
const CM = { top: 80, bottom: 80, left: 120, right: 120 };

function sc(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
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
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text: sc(text), font: F.H1, size: 52, color: C.DARK, bold: false })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 120 },
    children: [new TextRun({ text: sc(text), font: F.H2, size: 32, color: C.DARK, bold: false })]
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

function buildPortada(d) {
  return [
    ...Array.from({ length: 12 }, gap),
    p(d.proyecto?.titulo || 'Therefore', { font: F.H1, size: 96, color: C.DARK, sa: 0 }),
    p(d.proyecto?.subtitulo || 'Digital', { font: F.H1, size: 56, color: C.DARK, sb: 80, sa: 400 }),
    hline(),
    p(d.proyecto?.descripcion || 'Especificaciones funcionales y diseño técnico', { size: 22, bold: true, sa: 80 }),
    p(d.proyecto?.titulo ? d.alcance?.descripcionGeneral?.substring(0, 80) || '' : '', { size: 20, color: C.GREY, sa: 80 }),
    p(`${d.cliente?.nombre || '<<CLIENTE>>'}  ·  ${d.proyecto?.version || 'v1.0'}  ·  ${d.proyecto?.fecha || ''}`, { size: 18, color: C.GREY, sa: 0 }),
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
  const fichaRows = [
    ['Título de documento',         d.proyecto?.descripcion || ''],
    ['Fecha del documento',         d.proyecto?.fecha || ''],
    ['Proyecto',                    d.proyecto?.titulo || ''],
    ['Autor/es del documento',      'Jose-Juan Jiménez-Requena'],
    ['Cliente',                     d.cliente?.razonSocial || d.cliente?.nombre || '<<CLIENTE>>'],
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
  const vertData = VERTICALES[d.proyecto?.vertical] || VERTICALES.generico;
  return [
    h1('Introducción'),
    h2('Objetivos'),
    p(TEXTOS.introduccion_generica),
    h2('Claves del proyecto'),
    p(vertData.descripcion_intro || d.alcance?.descripcionGeneral || ''),
    ...(d.alcance?.clavesProyecto || vertData.claves || []).map(c => b1(c)),
  ];
}

function buildDefinicion(d) {
  const elements = [h1('Definición del proyecto')];

  // Categorías principales
  if (d.estructura?.categoriasPrincipales?.length > 0) {
    elements.push(h2('Estructura documental'));
    for (const cat of d.estructura.categoriasPrincipales) {
      elements.push(h3(cat.nombre));
      if (cat.descripcion) elements.push(p(cat.descripcion));

      // Tabla de campos si hay
      if (cat.campos?.length > 0) {
        const c1 = Math.round(CONTENT_W * 0.35);
        const c2 = Math.round(CONTENT_W * 0.20);
        const c3 = CONTENT_W - c1 - c2;
        elements.push(new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [c1, c2, c3],
          rows: [
            new TableRow({ children: [hdrCell('Campo', c1), hdrCell('Tipo', c2), hdrCell('Descripción', c3)] }),
            ...cat.campos.map((campo, i) => {
              const nombre = typeof campo === 'string' ? campo : campo.campo || campo.nombre || '';
              const tipo = typeof campo === 'object' ? campo.tipo || '' : '';
              const desc = typeof campo === 'object' ? campo.desc || campo.descripcion || '' : '';
              return new TableRow({ children: [
                cell(nombre, c1, { alt: i % 2 === 1, bold: true }),
                cell(tipo,   c2, { alt: i % 2 === 1, center: true }),
                cell(desc,   c3, { alt: i % 2 === 1 }),
              ]});
            })
          ]
        }));
        elements.push(gap());
      }
    }
  }

  // Tablas maestras
  if (d.estructura?.tablasMaestras?.length > 0) {
    elements.push(h2('Tablas maestras (master data)'));
    const vertData = VERTICALES[d.proyecto?.vertical];
    if (vertData?.tablas_maestras?.length > 0 || vertData?.tablasMaestras?.length > 0) {
      elements.push(p('El servicio se fundamenta en el acceso a tablas maestras actualizadas, lo que simplifica la configuración y automatización de los procesos. Su correcta actualización es esencial para el funcionamiento del servicio en su totalidad.'));
    }
    for (const tabla of d.estructura.tablasMaestras) {
      elements.push(h3(tabla.nombre));
      if (tabla.descripcion) elements.push(p(tabla.descripcion));
      if (tabla.campos?.length > 0) {
        elements.push(p(`Campos: ${tabla.campos.join(', ')}.`, { italic: true, size: 16, color: C.GREY }));
      }
    }
    elements.push(gap());
  }

  // Workflows
  if (d.estructura?.workflows?.length > 0) {
    elements.push(h2('Flujos de trabajo'));
    elements.push(p('Los flujos de trabajo constituyen un elemento clave dentro del sistema, permitiendo automatizar los procesos asociados al ciclo de vida documental, garantizando la coherencia, trazabilidad y cumplimiento de los procedimientos internos.'));
    elements.push(gap());
    for (const wf of d.estructura.workflows) {
      elements.push(h3(wf.nombre));
      elements.push(p(wf.descripcion || ''));
      if (wf.etapas?.length > 0) {
        for (const etapa of wf.etapas) elements.push(b1(etapa));
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

  const vertData = VERTICALES[d.proyecto?.vertical];
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
  const cabecera = d.proyecto?.cabecera || d.proyecto?.titulo || 'Therefore™';

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
          ...buildDefinicion(d),
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
    const { projectData } = req.body;
    if (!projectData) return res.status(400).json({ error: 'projectData requerido' });

    const buffer = await buildDocument(projectData);
    const base64 = buffer.toString('base64');

    const cliente = projectData.cliente?.nombre || 'Cliente';
    const fecha = (projectData.proyecto?.fecha || '').replace(/\./g, '');
    const version = (projectData.proyecto?.version || 'v1_0').replace(/\./g, '_');
    const filename = `${cliente.replace(/\s+/g, '_')}_EFDT_${version}.docx`;

    Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(200).json({ success: true, docxBase64: base64, filename });

  } catch (err) {
    Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(500).json({ error: err.message, stack: err.stack?.substring(0, 500) });
  }
}
