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
    const caption = field.Caption || field.Label || colName
    const typeNo = field.TypeNo || 1
    const typeName = THEREFORE_FIELD_TYPES[typeNo] || `Type${typeNo}`

    // Detectar si es obligatorio (puede estar en field.Required o field.Mandatory)
    const required = field.Required === true ||
                    field.Required === 'true' ||
                    field.Required === 1 ||
                    field.Mandatory === true ||
                    field.Mandatory === 'true' ||
                    field.Mandatory === 1

    // Excluir campos tabla (TypeNo 8) de las keys sugeridas
    if (typeNo === 8) {
      return
    }

    fields.push({
      colName,
      caption,
      typeNo,
      typeName,
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

  let table = '| ColName | Caption | Tipo | Obligatorio |\n'
  table += '|---------|---------|------|-------------|\n'

  fields.forEach(f => {
    const req = f.required ? 'Sí' : 'No'
    table += `| ${f.colName} | ${f.caption} | ${f.typeName} | ${req} |\n`
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
    required: f.required
  }))
}
