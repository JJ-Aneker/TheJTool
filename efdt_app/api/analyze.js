// api/analyze.js — Vercel Function
// Lee documentos del briefing y extrae datos estructurados del proyecto via Claude API

import { RATIOS } from './_lib/knowledge/ratios.js';
import { TEXTOS } from './_lib/knowledge/textos_estandar.js';
import { VERTICALES, PREMISAS_COMUNES } from './_lib/knowledge/verticales.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeaders(CORS).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada en variables de entorno' });
  }

  try {
    const { vertical, tipoDoc, extraInstructions, files } = req.body;

    const verticalData = VERTICALES[vertical] || VERTICALES.generico;

    // ── SYSTEM PROMPT ────────────────────────────────────────────────────────
    const systemPrompt = `Eres un asistente especializado en la generación de documentos EFDT (Especificaciones Funcionales y Diseño Técnico) para Canon España, S.A.U., partner especializado en implementaciones de Therefore™.

Tu tarea es analizar los documentos y briefing proporcionados y extraer toda la información necesaria para generar un documento profesional.

## CONOCIMIENTO BASE THEREFORE™

### RATIOS DE ESTIMACIÓN VALIDADOS
${JSON.stringify(RATIOS, null, 2)}

### VERTICAL DEL PROYECTO: ${vertical || 'generico'}
${JSON.stringify(verticalData, null, 2)}

### PREMISAS COMUNES A TODOS LOS PROYECTOS
${JSON.stringify(PREMISAS_COMUNES, null, 2)}

### MODELO DE LICENCIAS
- Cases y Workflow Designer: INCLUIDOS en licencia base del servidor. NO son módulos separados.
- Tipos de usuario: Concurrente (pool compartido), Nominativa (usuario asignado), Read-Only Concurrente
- Módulos adicionales (licencia separada): Content Connector, Universal Connector, Smart Capture, Portal

### SEGURIDAD ESTÁNDAR
4 roles asignados a grupos de usuarios: Administrador, Power User, Escritor, Lector.
La seguridad es configurable a nivel de expediente, categoría, WF y campo individual, con condiciones sobre valores de campos.

### NOTAS IMPORTANTES
- Therefore™ NUNCA contabiliza ni realiza operaciones en ERP directamente. Genera ficheros JSON/XML para consumo externo.
- Las estimaciones son aproximaciones de preventa. Siempre incluir el disclaimer estándar.
- Tarifa: 800 €/día. IVA: 21%.
- Partidas sin información suficiente → marcar como pendiente (pendiente: true).

## INSTRUCCIÓN

Analiza toda la información proporcionada y extrae los datos del proyecto.
Devuelve ÚNICAMENTE un JSON válido con la estructura exacta siguiente. Sin markdown, sin explicaciones, solo JSON puro.

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
    "vertical": "${vertical || 'generico'}",
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
}`;

    // ── BUILD USER MESSAGE ────────────────────────────────────────────────────
    const userContent = [];

    // Add uploaded files
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.type === 'application/pdf') {
          userContent.push({
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: file.base64 }
          });
        } else if (file.type && file.type.startsWith('image/')) {
          userContent.push({
            type: 'image',
            source: { type: 'base64', media_type: file.type, data: file.base64 }
          });
        } else {
          // Text, HTML, Word (as text) etc.
          userContent.push({
            type: 'text',
            text: `[DOCUMENTO ADJUNTO: ${file.name}]\n${file.textContent || '(contenido binario no disponible como texto)'}\n`
          });
        }
      }
    }

    const today = new Date().toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).replace(/\//g, '.');

    userContent.push({
      type: 'text',
      text: `Vertical seleccionada: ${vertical || 'generico'}
Tipo de documento: ${tipoDoc || 'efdt'}
Fecha de hoy: ${today}
${extraInstructions ? `\nInstrucciones adicionales del usuario:\n${extraInstructions}` : ''}

Por favor, analiza toda la información y devuelve el JSON estructurado con los datos del proyecto extraídos.
Recuerda: solo JSON, sin texto adicional.`
    });

    // ── CALL CLAUDE API ───────────────────────────────────────────────────────
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'Error en la API de Anthropic',
        detail: data,
      });
    }

    // Parse JSON from response
    const rawText = data.content[0].text;
    let projectData;
    try {
      const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      projectData = JSON.parse(clean);
    } catch (e) {
      return res.status(500).json({
        error: 'Error al parsear la respuesta de Claude',
        raw: rawText.substring(0, 500),
      });
    }

    // Set CORS headers and respond
    Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(200).json({ success: true, data: projectData });

  } catch (err) {
    Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(500).json({ error: err.message });
  }
}
