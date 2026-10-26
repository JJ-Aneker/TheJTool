/**
 * categoryXmlParser.js
 * Parser de XML de categorías de Therefore™
 *
 * Extrae los campos reales (con ColName) de un XML de configuración
 * exportado desde Therefore Solution Designer.
 */

/**
 * Parsea XML de categoría de Therefore y extrae campos
 * @param {string} xmlContent - Contenido del XML de categoría
 * @returns {Object} { categoryNo, categoryName, ctgryID, fields: [] }
 */
export function parseCategoryXml(xmlContent) {
  try {
    // Parsear XML (básico, sin dependencias)
    const categoryNo = extractValue(xmlContent, '<CtgryNo>', '</CtgryNo>')
    const ctgryID = extractValue(xmlContent, '<CtgryID>', '</CtgryID>')

    // Extraer nombres de categoría (multiidioma)
    const categoryNameEN = extractMultilangValue(xmlContent, 'Name', 1033) // Inglés
    const categoryNameES = extractMultilangValue(xmlContent, 'Name', 1034) // Español
    const categoryName = categoryNameES || categoryNameEN || 'Sin nombre'

    // Extraer campos
    const fields = extractFields(xmlContent)

    return {
      categoryNo,
      categoryName,
      ctgryID,
      fields,
      totalFields: fields.length
    }
  } catch (error) {
    throw new Error(`Error parseando XML de categoría: ${error.message}`)
  }
}

/**
 * Extrae campos reales de datos del XML
 * @param {string} xmlContent
 * @returns {Array} Array de objetos { fieldNo, colName, caption, typeNo, length, mandatory }
 */
function extractFields(xmlContent) {
  const fields = []

  // Buscar todos los bloques <Field>...</Field>
  const fieldRegex = /<Field>([\s\S]*?)<\/Field>/g
  let match

  while ((match = fieldRegex.exec(xmlContent)) !== null) {
    const fieldBlock = match[1]

    // Solo procesar campos que tienen ColName (campos de datos reales)
    const colName = extractValue(fieldBlock, '<ColName>', '</ColName>')
    if (!colName) continue

    const fieldNo = extractValue(fieldBlock, '<FieldNo>', '</FieldNo>')
    const typeNo = parseInt(extractValue(fieldBlock, '<TypeNo>', '</TypeNo>') || '0')

    // Saltar labels y campos de visualización (TypeNo 4, 12, etc.)
    if (typeNo === 4 || typeNo === 12) continue

    const captionEN = extractMultilangValue(fieldBlock, 'Caption', 1033)
    const captionES = extractMultilangValue(fieldBlock, 'Caption', 1034)
    const caption = captionES || captionEN || colName

    const length = parseInt(extractValue(fieldBlock, '<Length>', '</Length>') || '0')
    const mandatory = extractValue(fieldBlock, '<Mandatory>', '</Mandatory>') === '1'

    fields.push({
      fieldNo,
      colName,
      caption,
      typeNo,
      typeDesc: getTypeDescription(typeNo),
      length,
      mandatory
    })
  }

  return fields
}

/**
 * Extrae valor entre tags
 */
function extractValue(content, startTag, endTag) {
  const startIdx = content.indexOf(startTag)
  if (startIdx === -1) return null

  const valueStart = startIdx + startTag.length
  const endIdx = content.indexOf(endTag, valueStart)
  if (endIdx === -1) return null

  return content.substring(valueStart, endIdx).trim()
}

/**
 * Extrae valor multiidioma del formato TStr
 */
function extractMultilangValue(content, tagName, langCode) {
  const tstrRegex = new RegExp(`<${tagName}[^>]*>\\s*<TStr>([\\s\\S]*?)</TStr>`, 'i')
  const tstrMatch = content.match(tstrRegex)
  if (!tstrMatch) return null

  const tstrContent = tstrMatch[1]
  const langRegex = new RegExp(`<L>${langCode}</L>\\s*<S>([^<]*)</S>`, 'i')
  const langMatch = tstrContent.match(langRegex)

  return langMatch ? langMatch[1].trim() : null
}

/**
 * Mapeo de TypeNo a descripción
 */
function getTypeDescription(typeNo) {
  const typeMap = {
    1: 'String',
    2: 'Integer',
    3: 'Date',
    5: 'DateTime',
    6: 'Money',
    7: 'Logical',
    8: 'Table',
    9: 'SingleKeyword',
    10: 'MultipleKeyword',
    99: 'Date' // Variante on-premise
  }
  return typeMap[typeNo] || `Unknown(${typeNo})`
}

/**
 * Mapeo de TypeNo a componente form.io recomendado
 */
export function getFormioComponentType(typeNo, length) {
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

/**
 * Genera tabla markdown de campos para el prompt
 */
export function generateFieldsTable(fields) {
  if (!fields || fields.length === 0) {
    return '| Label | key | Tipo form.io | Obligatorio | Validación/Notas |\n' +
           '|-------|-----|--------------|-------------|------------------|\n' +
           '| (sin campos) | - | - | - | - |'
  }

  let table = '| Label | key | Tipo form.io | Obligatorio | Validación/Notas |\n'
  table += '|-------|-----|--------------|-------------|------------------|\n'

  fields.forEach(field => {
    const component = getFormioComponentType(field.typeNo, field.length)
    const mandatory = field.mandatory ? '**Sí**' : 'No'
    const validation = field.length > 0 ? `maxLength: ${field.length}` : '-'

    table += `| ${field.caption} | ${field.colName} | ${component} | ${mandatory} | ${validation} |\n`
  })

  return table
}

/**
 * Genera tabla de mapeo para el prompt
 */
export function generateMappingTable(fields) {
  if (!fields || fields.length === 0) {
    return '| key (eForm) | ColName (Therefore) | TypeNo | Longitud | Obligatorio |\n' +
           '|-------------|---------------------|--------|----------|-------------|\n' +
           '| - | - | - | - | - |'
  }

  let table = '| key (eForm) | ColName (Therefore) | TypeNo | Longitud | Obligatorio |\n'
  table += '|-------------|---------------------|--------|----------|-------------|\n'

  fields.forEach(field => {
    const mandatory = field.mandatory ? '✅ Sí' : 'No'
    const typeDesc = `${field.typeNo} (${field.typeDesc})`
    const length = field.length > 0 ? field.length : '-'

    table += `| ${field.colName} | ${field.colName} | ${typeDesc} | ${length} | ${mandatory} |\n`
  })

  return table
}
