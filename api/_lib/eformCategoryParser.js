/**
 * eformCategoryParser.js
 * Parser de XML de categoría exportado desde Therefore Solution Designer
 * Extrae nombre de categoría y campos para mapeo con eForms
 */

import { XMLParser } from 'fast-xml-parser'
import { THEREFORE_FIELD_TYPES } from './eformKnowledge.js'

/**
 * Parsea un XML de categoría exportado y extrae campos
 *
 * @param {string} categoryXml - XML exportado del Solution Designer
 * @returns {Object} { categoryName, fields: [{ colName, caption, typeNo, typeName, required }] }
 */
export function parseCategoryXml(categoryXml) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    parseTagValue: true,
    parseAttributeValue: true,
    trimValues: true
  })

  let parsed
  try {
    parsed = parser.parse(categoryXml)
  } catch (err) {
    throw new Error(`Error parseando XML: ${err.message}`)
  }

  // Navegar a la categoría
  // Estructura esperada: <Configuration><Categories><Category>...</Category></Categories></Configuration>
  const config = parsed.Configuration
  if (!config) {
    throw new Error('XML inválido: falta tag <Configuration>')
  }

  const categories = config.Categories
  if (!categories || !categories.Category) {
    throw new Error('XML inválido: falta tag <Categories> o <Category>')
  }

  // Tomar la primera categoría si hay varias
  const category = Array.isArray(categories.Category)
    ? categories.Category[0]
    : categories.Category

  // Extraer nombre de categoría
  const categoryName = category.Name || category.Title || 'Sin nombre'

  // Extraer campos
  const fields = []

  // Los campos pueden estar en category.Fields.Field
  const fieldsContainer = category.Fields
  if (!fieldsContainer || !fieldsContainer.Field) {
    // Categoría sin campos
    return { categoryName, fields: [] }
  }

  const fieldList = Array.isArray(fieldsContainer.Field)
    ? fieldsContainer.Field
    : [fieldsContainer.Field]

  fieldList.forEach(field => {
    const colName = field.ColName || field.Name

    // Extraer caption del formato multiidioma TStr
    let caption = colName
    if (field.Caption) {
      if (typeof field.Caption === 'string') {
        caption = field.Caption
      } else if (field.Caption.TStr) {
        // Formato: <Caption><TStr><T><L>1034</L><S>Texto</S></T></TStr></Caption>
        const tstr = field.Caption.TStr
        if (tstr.T) {
          const translations = Array.isArray(tstr.T) ? tstr.T : [tstr.T]
          // Preferir español (1034), luego inglés (1033), luego el primero
          const es = translations.find(t => t.L === 1034 || t.L === '1034')
          const en = translations.find(t => t.L === 1033 || t.L === '1033')
          const text = es?.S || en?.S || translations[0]?.S
          if (text) caption = text
        }
      }
    }

    const typeNo = field.TypeNo || 1
    const typeName = THEREFORE_FIELD_TYPES[typeNo] || `Type${typeNo}`
    const length = field.Length || 0

    // Detectar si es obligatorio (puede estar en field.Required o field.Mandatory)
    const required = field.Required === true ||
                    field.Required === 'true' ||
                    field.Required === 1 ||
                    field.Mandatory === true ||
                    field.Mandatory === 'true' ||
                    field.Mandatory === 1

    // Excluir campos que no son de datos reales:
    // - TypeNo 4 (Label/static text)
    // - TypeNo 12 (Image field)
    // - TypeNo 8 (Table) - se manejan por separado
    // - Campos sin ColName
    if (!colName || typeNo === 4 || typeNo === 12 || typeNo === 8) {
      return
    }

    fields.push({
      colName,
      caption,
      typeNo,
      typeName,
      length,
      required
    })
  })

  return {
    categoryName,
    fields
  }
}

/**
 * Convierte los campos parseados a formato tabla para la UI
 * @param {Array} fields
 * @returns {string} Markdown table
 */
export function fieldsToMarkdownTable(fields) {
  if (fields.length === 0) {
    return 'Sin campos'
  }

  let table = '| ColName | Caption | Tipo | Longitud | Obligatorio |\n'
  table += '|---------|---------|------|----------|-------------|\n'

  fields.forEach(f => {
    const req = f.required ? 'Sí' : 'No'
    const len = f.length > 0 ? f.length : '-'
    table += `| ${f.colName} | ${f.caption} | ${f.typeName} | ${len} | ${req} |\n`
  })

  return table
}

/**
 * Convierte los campos a formato JSON para enviar a la IA
 * @param {Array} fields
 * @returns {Array}
 */
export function fieldsToAIContext(fields) {
  return fields.map(f => ({
    key: f.colName,
    label: f.caption,
    type: f.typeName,
    typeNo: f.typeNo,
    length: f.length,
    required: f.required
  }))
}

/**
 * Genera tabla markdown de campos para incluir en el prompt de IA
 * @param {Array} fields
 * @returns {string}
 */
export function generateFieldsTableForPrompt(fields) {
  if (!fields || fields.length === 0) {
    return '| Label | key | Tipo form.io | Obligatorio | Validación/Notas |\n' +
           '|-------|-----|--------------|-------------|------------------|\n' +
           '| (sin campos) | - | - | - | - |'
  }

  let table = '| Label | key | Tipo form.io | Obligatorio | Validación/Notas |\n'
  table += '|-------|-----|--------------|-------------|------------------|\n'

  fields.forEach(field => {
    const component = getFormioComponentType(field.typeNo, field.length)
    const mandatory = field.required ? '**Sí**' : 'No'
    const validation = field.length > 0 ? `maxLength: ${field.length}` : '-'

    table += `| ${field.caption} | ${field.colName} | ${component} | ${mandatory} | ${validation} |\n`
  })

  return table
}

/**
 * Mapeo de TypeNo a componente form.io recomendado
 */
function getFormioComponentType(typeNo, length) {
  switch (typeNo) {
    case 1: // String
      return length > 100 ? 'textarea' : 'textfield'
    case 2: // Integer
      return 'number'
    case 3: // Date
    case 99: // Date (on-premise)
      return 'datetime'
    case 5: // DateTime
      return 'datetime'
    case 6: // Money
      return 'currency'
    case 7: // Logical
      return 'checkbox'
    case 8: // Table
      return 'datagrid'
    case 9: // SingleKeyword
      return 'select'
    case 10: // MultipleKeyword
      return 'selectboxes'
    default:
      return 'textfield'
  }
}
