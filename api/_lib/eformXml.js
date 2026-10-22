/**
 * eformXml.js
 * Generador determinista de XML de eForm para Therefore™
 * Port de reference/generar_eform.py
 *
 * REGLA CRÍTICA: Partir SIEMPRE de una plantilla nativa exportada.
 * Nunca construir el XML desde cero.
 */

import { v4 as uuidv4 } from 'uuid'

// Plantilla XML por defecto (embebida)
const DEFAULT_TEMPLATE_XML = `<Configuration><Version>570425345</Version><NewImportExport>1</NewImportExport><Categories></Categories><QueryTemplates></QueryTemplates><CaseDefinitions></CaseDefinitions><Folders></Folders><Datatypes></Datatypes><KeywordDictionaries></KeywordDictionaries><Counters></Counters><Templates></Templates><WFProcesses></WFProcesses><UCProfiles></UCProfiles><TreeViews></TreeViews><CloudStorages></CloudStorages><Preprocessors></Preprocessors><Forms></Forms><FormImgs></FormImgs><ReportDefinitions></ReportDefinitions><ReportTemplates></ReportTemplates><PowerBIDataSets></PowerBIDataSets><PowerBITables></PowerBITables><EForms><EForm><FNo>-1</FNo><FVer>1</FVer><FName>Matriculacion Alumno Secundaria</FName><FDef>{
  "display": "form",
  "settings": {},
  "components": [
    {
      "label": "Datos",
      "type": "panel",
      "key": "panelDatos",
      "input": false,
      "tableView": false,
      "collapsible": false,
      "reorder": false,
      "properties": {},
      "customConditional": "",
      "logic": [],
      "attributes": {},
      "conditional": {
        "show": "",
        "when": "",
        "json": ""
      },
      "components": [
        {
          "label": "Nombre",
          "allowMultipleMasks": false,
          "showWordCount": false,
          "showCharCount": false,
          "tableView": true,
          "alwaysEnabled": false,
          "type": "textfield",
          "input": true,
          "key": "nombre",
          "inputFormat": "plain",
          "encrypted": false,
          "properties": {},
          "customConditional": "",
          "logic": [],
          "attributes": {},
          "reorder": false,
          "validate": {
            "required": true,
            "maxLength": 100,
            "customMessage": "",
            "json": ""
          },
          "conditional": {
            "show": "",
            "when": "",
            "json": ""
          }
        }
      ]
    },
    {
      "type": "button",
      "label": "Enviar",
      "key": "submit",
      "theme": "primary",
      "input": true,
      "tableView": true
    }
  ]
}</FDef><DCrea>20260331141757233</DCrea><FCreUs>4</FCreUs><FCreUsNam>JJ</FCreUsNam><Id>A3C4D5E6-F7A8-9012-CDEF-123456789012</Id><FormID>MatriculacionAlumnoSecundaria</FormID></EForm></EForms><ESignatureProviders></ESignatureProviders><Roles></Roles><RoleAssignments></RoleAssignments><CommonScripts></CommonScripts><OfficeProfiles></OfficeProfiles><IxProfiles></IxProfiles><Queries></Queries><Users></Users><CaptProfiles></CaptProfiles><References></References><CntConnSrcs></CntConnSrcs><Dashboards></Dashboards><Stamps></Stamps><RetentionPolicies></RetentionPolicies><SmartCaptureProcessors></SmartCaptureProcessors><SmartCaptureQueues></SmartCaptureQueues><DocDownloadProviders></DocDownloadProviders><Credentials></Credentials></Configuration>`

/**
 * Genera el XML de un eForm a partir de una plantilla y componentes form.io
 *
 * @param {Object} params
 * @param {string} params.formName - Nombre visible del formulario
 * @param {string} params.formId - ID del formulario (sin espacios, [A-Za-z0-9_])
 * @param {Array} params.components - Array de componentes form.io
 * @param {string} [params.templateXml] - XML de plantilla personalizada (opcional)
 * @returns {string} XML completo del eForm listo para importar
 */
export function buildEformXml({ formName, formId, components, templateXml = null }) {
  // 1. Usar plantilla proporcionada o la por defecto
  let template = templateXml || DEFAULT_TEMPLATE_XML

  // 2. Validar que existe el bloque <EForm>
  const eformMatch = template.match(/<EForm>.*?<\/EForm>/s)
  if (!eformMatch) {
    throw new Error('No se encontró bloque <EForm> en la plantilla')
  }

  // 3. Extraer valores originales para reemplazos quirúrgicos
  const originalFName = extractTag(template, 'FName')
  const originalFormId = extractTag(template, 'FormID')
  const originalId = extractTagInEForm(eformMatch[0], 'Id')

  if (!originalFName || !originalFormId || !originalId) {
    throw new Error('Plantilla inválida: falta FName, FormID o Id')
  }

  // 4. Construir el FDef (JSON form.io con formato Therefore)
  const fdefObject = {
    display: 'form',
    settings: {},
    components: components
  }

  // JSON indentado con \r\n (como lo genera Therefore)
  let fdefJson = JSON.stringify(fdefObject, null, 2)
  fdefJson = fdefJson.replace(/\n/g, '\r\n')

  // 5. XML-escape del FDef completo
  // Orden: & → &amp;, < → &lt;, > → &gt;
  // NO escapar comillas (van raw)
  fdefJson = fdefJson.replace(/&/g, '&amp;')
  fdefJson = fdefJson.replace(/</g, '&lt;')
  fdefJson = fdefJson.replace(/>/g, '&gt;')

  // 6. Timestamp actual (formato Therefore: YYYYMMDDHHmmss000)
  const now = new Date()
  const timestamp =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0') +
    '000'

  // 7. GUID nuevo (mayúsculas)
  const newGuid = uuidv4().toUpperCase()

  // 8. Reemplazos quirúrgicos dentro del bloque <EForm>
  let result = template

  // 8.1 Reemplazar FName
  result = result.replace(
    `<FName>${originalFName}</FName>`,
    `<FName>${formName}</FName>`
  )

  // 8.2 Reemplazar FDef (quirúrgico por índice)
  const fdefStart = result.indexOf('<FDef>') + 6
  const fdefEnd = result.indexOf('</FDef>')
  if (fdefStart === 5 || fdefEnd === -1) {
    throw new Error('No se encontró tag <FDef> en la plantilla')
  }
  result = result.substring(0, fdefStart) + fdefJson + result.substring(fdefEnd)

  // 8.3 Reemplazar DCrea
  result = result.replace(/<DCrea>\d+<\/DCrea>/, `<DCrea>${timestamp}</DCrea>`)

  // 8.4 Reemplazar Id del EForm
  result = result.replace(
    `<Id>${originalId}</Id>`,
    `<Id>${newGuid}</Id>`
  )

  // 8.5 Reemplazar FormID
  result = result.replace(
    `<FormID>${originalFormId}</FormID>`,
    `<FormID>${formId}</FormID>`
  )

  // 9. Mantener intactos: FCreUs, FCreUsNam, DefSubmNo, IxProfNo, FFold (si existen)
  // (no se tocan, quedan como están en la plantilla)

  return result
}

/**
 * Extrae el contenido de un tag XML simple
 * @param {string} xml
 * @param {string} tagName
 * @returns {string|null}
 */
function extractTag(xml, tagName) {
  const regex = new RegExp(`<${tagName}>([^<]+)<\/${tagName}>`)
  const match = xml.match(regex)
  return match ? match[1] : null
}

/**
 * Extrae el contenido de un tag dentro del bloque <EForm>
 * @param {string} eformBlock
 * @param {string} tagName
 * @returns {string|null}
 */
function extractTagInEForm(eformBlock, tagName) {
  const regex = new RegExp(`<${tagName}>([^<]+)<\/${tagName}>`)
  const match = eformBlock.match(regex)
  return match ? match[1] : null
}

/**
 * Obtiene la plantilla XML por defecto
 * @returns {string}
 */
export function getDefaultTemplate() {
  return DEFAULT_TEMPLATE_XML
}
