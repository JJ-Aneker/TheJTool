/**
 * eformAiPrompts.js
 * Prompts estructurados para la generación de eForms con IA
 * Basado en docs/eform-generator-ia/knowledge/ai-prompts.md
 */

import { EFORM_RULES, FORMIO_COMPONENTS } from './eformKnowledge.js'
import { fieldsToMarkdownTable } from './eformCategoryParser.js'

// ============================================================================
// PATRONES (bloques especiales)
// ============================================================================

const PATTERNS = {
  qr: `## [qr] Lector QR / códigos de barras

**Origen:** eForm probado en Therefore Online (tenant CES), 9 iteraciones hasta funcionar.

**Componentes:**
1. textfield destino (p. ej. key codigoQr, label "Código leído").
2. htmlelement (key qrPanel) con:
   - Botón "📷 Escanear" cuyo onclick contiene TODA la lógica (patrón init-on-first-click:
     la primera pulsación define las funciones en window y las siguientes las reutilizan).
   - Contenedor modal oculto (div con id='qrModal') con <video id='qrVideo' playsinline>,
     marco de escaneo y botón "Cerrar".

**Lógica (resumen):**
- getUserMedia({video:{facingMode:'environment'}}) con fallback {video:true} (iOS Safari)
- BarcodeDetector nativo (Chrome/Edge/Android) si existe;
- Si no, cargar jsQR desde https://cdn.jsdelivr.net/npm/jsqr/dist/jsQR.js y leer frames en canvas
- Al detectar: window.qrSetValue(key, valor); window.qrClose();

**Notas:**
- Comparaciones sin < >: codes.length !== 0, bucles con i !== n.
- Variante EAN/código de barras: resolución mayor (width:{ideal:1920}), formatos
  ['ean_13','ean_8','code_128','qr_code'], linterna (torch) si el track lo soporta.
- La cámara requiere HTTPS (Therefore Online lo es).`,

  autofill: `## [autofill] Autorrelleno con el usuario conectado

**Origen:** eForm "Solicitud Servicio Mensajería" (Naturgy, On-Premise).

- Datos del usuario del Web Client sin llamada API:
  var u = JSON.parse(localStorage.getItem('userInfo') || '{}'); → u.SMTP (email),
  u.DisplayName, u.UserName, u.UserId.
- On-Premise: en el customDefaultValue del campo email: value = (u.SMTP || '').toLowerCase();
  y, con setTimeout(..., 800), rellenar el resto de campos y ponerlos readonly
  (el.setAttribute('readonly','true') + estilo gris). No usar disabled.
- Online: si customDefaultValue no se ejecuta, ofrecer un botón "Cargar mis datos"
  en un htmlelement con la misma lógica en onclick.
- Fecha de hoy en un datetime: defaultValue vía customDefaultValue: "value = moment().format('YYYY-MM-DD');"
  (o botón en Online).`,

  lookup: `## [lookup] Buscar en una categoría maestra

**Origen:** buscador de usuarios (BuildingCenter, Online) y maestro de usuarios cat. 78 (Naturgy).

- Búsqueda por ColName con ExecuteMultiQuery (preferido frente a ExecuteSingleQuery por CORS)
- NO usar SelectedFieldsNoOrNames en ExecuteMultiQuery (HTTP 500 en Online).
- Operadores: 0 igual, 1 like (comodín *texto*). Condition = valor buscado.
- Mapear valores con qr.Columns[i].IndexDataFieldName (nunca con GetCategoryInfo).
- ExecuteSingleQuery (si se usa en On-Premise): CategoryNo como STRING,
  TimeZone: "0", Condition = valor, y aquí sí admite SelectedFieldsNoOrNames.
- Lista de resultados: renderizar una tabla en un htmlelement (contenedor con id) y
  rellenarla por JS; cada fila con onclick que copie valores a los campos del formulario.
- Placeholders de configuración claros en el código: REEMPLAZAR_CATEGORYNO, REEMPLAZAR_COLNAME.`,

  modal: `## [modal] Modal de actualización de datos

**Origen:** Naturgy — el usuario corrige sus datos de contacto en el maestro desde el eForm.

- htmlelement con botón "✏️ Actualizar mis datos", overlay y modal (display:none,
  position:fixed, z-index alto) con inputs propios (id='th-nombre'…), mensaje y botones
  Cancelar / Guardar.
- Funciones en window: thOpenModal (precarga desde window._therefore), thCloseModal,
  thSaveModal.
- thSaveModal: GetDocumentIndexData → tomar IndexData.LastChangeTime →
  SaveDocumentIndexData con { DocNo, VersionNo: 0, IndexData: { LastChangeTime, IndexDataItems: [...] } }
  y items tipados (StringIndexData, IntIndexData…). Después actualizar los campos del
  formulario principal y window._therefore, y cerrar el modal.
- Requiere el DocNo obtenido en el patrón [lookup].`,

  signature: `## [signature] Firma (canvas)

**Motivo:** el componente signature nativo de form.io no es fiable en Therefore.

- hidden (key p. ej. firmaBase64) que recibe la imagen PNG en base64.
- htmlelement con <canvas id='sigCanvas' width='500' height='180' style='border:1px solid #ccc;touch-action:none'>
  y botones "Activar firma", "Borrar" y "Confirmar firma".
- "Activar firma" (onclick, init-on-first-click) registra eventos pointerdown/pointermove/pointerup
  en el canvas y dibuja trazos con ctx.lineTo/stroke.
- "Confirmar firma": canvas.toDataURL('image/png') → escribir en el campo hidden con el mismo
  mecanismo que qrSetValue (API form.io o input + eventos).
- "Borrar": ctx.clearRect(0, 0, canvas.width, canvas.height) y vaciar el hidden.`
}

/**
 * Genera el system prompt para /propose (petición → prompt detallado)
 */
export function buildProposeSystemPrompt({ environment, tenant, serverUrl, blocks = [], categoryFields = [] }) {
  const lang = 'español' // Detectar del request si hace falta

  let tenantOrUrl = ''
  if (environment === 'online' && tenant) {
    tenantOrUrl = ` (Tenant: ${tenant})`
  } else if (environment === 'onpremise' && serverUrl) {
    tenantOrUrl = ` (Servidor: ${serverUrl})`
  }

  let categoryFieldsTable = 'No se ha proporcionado categoría destino.'
  if (categoryFields.length > 0) {
    categoryFieldsTable = fieldsToMarkdownTable(categoryFields)
  }

  const blocksList = blocks.length > 0 ? blocks.join(', ') : 'Ninguno'

  // Concatenar patrones solo de los bloques seleccionados
  let patternsContent = ''
  blocks.forEach(blockKey => {
    if (PATTERNS[blockKey]) {
      patternsContent += PATTERNS[blockKey] + '\n\n'
    }
  })

  const systemPrompt = `Eres un consultor experto en Therefore™ (Canon) y en eForms basados en form.io.
Tu tarea: convertir una petición breve de un técnico en una ESPECIFICACIÓN DETALLADA de eForm,
lista para que otro paso la convierta en JSON form.io. Responde en ${lang}.

Contexto:
- Entorno destino: ${environment}${tenantOrUrl}
- Bloques solicitados: ${blocksList}
- Campos de la categoría destino (si los hay; usa estos ColName como keys exactas):
${categoryFieldsTable}

Reglas:
1. Si faltan datos ESENCIALES (propósito poco claro, o no se sabe qué campos llevar) y no se han
   enviado respuestas previas, devuelve como máximo 3 preguntas cortas, con opciones sugeridas.
   Si la petición es razonable, NO preguntes: completa con criterio profesional y márcalo como
   "(propuesto)".
2. La especificación debe tener estas secciones en Markdown:
   ## Formulario  (Nombre visible, FormID sin espacios, objetivo en una frase)
   ## Entorno
   ## Secciones y campos  (por sección: tabla Label | key | tipo form.io | obligatorio | validación/notas)
   ## Desplegables  (valores label/value)
   ## Lógica  (condicionales, autorrelleno, solo lectura)
   ## Bloques especiales  (QR, búsqueda en maestro, modal, firma… con su configuración y
       placeholders REEMPLAZAR_* para datos que no se conozcan: CategoryNo, ColName, tenant)
   ## Mapeo a categoría  (key → ColName; si no hay categoría, indicar que las keys son propuestas)
   ## Notas para el consultor  (avisos: credenciales, campos tabla, dependencias)
3. Usa solo tipos de componente admitidos y respeta las reglas técnicas del conocimiento.
4. Keys en camelCase sin acentos, o el ColName exacto si se conoce.

Devuelve SOLO este JSON (sin texto fuera):
{ "questions": [ { "question": "...", "options": ["...", "..."] } ] }
  o bien
{ "detailedPrompt": "<markdown>", "suggestedFormName": "...", "suggestedFormId": "..." }

=== CONOCIMIENTO ===
${EFORM_RULES}

${FORMIO_COMPONENTS}

${patternsContent}`

  return systemPrompt
}

/**
 * Genera el mensaje de usuario para /propose
 */
export function buildProposeUserMessage({ request, answers = [] }) {
  let message = request

  if (answers && answers.length > 0) {
    message += '\n\nRespuestas a tus preguntas:\n'
    answers.forEach((a, i) => {
      message += `${i + 1}. ${a}\n`
    })
  }

  return message
}

/**
 * Genera el system prompt para /generate (prompt detallado → JSON form.io)
 */
export function buildGenerateSystemPrompt({ environment, tenant, serverUrl, blocks = [], categoryFields = [] }) {
  let tenantOrUrl = ''
  if (environment === 'online' && tenant) {
    tenantOrUrl = ` (Tenant: ${tenant})`
  } else if (environment === 'onpremise' && serverUrl) {
    tenantOrUrl = ` (Servidor: ${serverUrl})`
  }

  let categoryFieldsTable = 'No se ha proporcionado categoría destino.'
  if (categoryFields.length > 0) {
    categoryFieldsTable = fieldsToMarkdownTable(categoryFields)
  }

  // Concatenar patrones solo de los bloques seleccionados
  let patternsContent = ''
  blocks.forEach(blockKey => {
    if (PATTERNS[blockKey]) {
      patternsContent += PATTERNS[blockKey] + '\n\n'
    }
  })

  const systemPrompt = `Eres un generador de eForms para Therefore™. Conviertes una especificación en el array
components de un formulario form.io que se importará en Therefore.

Entorno destino: ${environment}${tenantOrUrl}
Campos de la categoría destino: ${categoryFieldsTable}

Requisitos obligatorios:
- Devuelve SOLO JSON válido con la forma { "components": [ ... ] }. Nada más.
- Sigue al pie de la letra las reglas técnicas del conocimiento (comillas, caracteres
  prohibidos en onclick/customDefaultValue, sin <script>, sin signature nativo, sin
  textfield disabled, keys únicas, botón submit final).
- Incluye en cada componente las propiedades base que usa Therefore (ver plantillas).
- HTML de htmlelement en claro (no escapes &lt;).
- Lógica JS adaptada al entorno: en Therefore Online, lógica en onclick de botones
  (patrón init-on-first-click); en On-Premise se permite customDefaultValue.
- Nunca credenciales reales: placeholders REEMPLAZAR_*.

=== CONOCIMIENTO ===
${EFORM_RULES}

${FORMIO_COMPONENTS}

${patternsContent}`

  return systemPrompt
}

/**
 * Genera el mensaje de usuario para /generate
 */
export function buildGenerateUserMessage({ detailedPrompt, formName, formId }) {
  return `Nombre del formulario: ${formName}
FormID: ${formId}

${detailedPrompt}`
}

/**
 * Genera el mensaje de reintento por errores de validación
 */
export function buildValidationRetryMessage(errors) {
  return `El JSON tiene estos errores de validación. Corrígelos y devuelve de nuevo SOLO el JSON completo:

${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}`
}

/**
 * Genera el prompt para /refine
 */
export function buildRefineUserMessage({ components, instruction }) {
  return `Este es el JSON actual del eForm:
${JSON.stringify({ components }, null, 2)}

Aplica este cambio manteniendo todo lo demás igual (keys existentes incluidas):
${instruction}

Devuelve SOLO el JSON completo { "components": [...] }.`
}
