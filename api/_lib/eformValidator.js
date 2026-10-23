/**
 * eformValidator.js
 * Validador de componentes form.io para eForms de Therefore™
 *
 * Retorna { errors: [], warnings: [] }
 * - errors: bloquean la descarga del XML
 * - warnings: alertan pero no bloquean
 */

import { ALLOWED_COMPONENT_TYPES } from './eformKnowledge.js'

/**
 * Valida un array de componentes form.io
 *
 * @param {Array} components - Array de componentes form.io
 * @param {Object} options
 * @param {string} options.environment - 'online' | 'onpremise'
 * @param {Array} [options.categoryFields] - Campos de la categoría destino { colName, caption, typeNo }
 * @returns {{ errors: Array, warnings: Array }}
 */
export function validateComponents(components, options = {}) {
  const { environment = 'online', categoryFields = [] } = options
  const errors = []
  const warnings = []
  const seenKeys = new Set()

  // Validar que sea un array
  if (!Array.isArray(components)) {
    errors.push('Los componentes deben ser un array')
    return { errors, warnings }
  }

  // Validar cada componente recursivamente
  let hasSubmitButton = false

  function validateComponent(comp, path = 'root') {
    // Validar type y key obligatorios
    if (!comp.type) {
      errors.push(`${path}: falta propiedad 'type'`)
      return
    }

    if (comp.input !== false && !comp.key) {
      errors.push(`${path}: falta propiedad 'key' en componente con input`)
      return
    }

    const { type, key } = comp

    // Validar que el type esté permitido
    if (!ALLOWED_COMPONENT_TYPES.includes(type)) {
      errors.push(`${path}: tipo '${type}' no está permitido`)
    }

    // Validar key única y formato
    if (key) {
      // Key duplicada
      if (seenKeys.has(key)) {
        errors.push(`${path}: key '${key}' duplicada`)
      }
      seenKeys.add(key)

      // Key con caracteres inválidos
      if (!/^[A-Za-z0-9_]+$/.test(key)) {
        errors.push(`${path}: key '${key}' contiene caracteres inválidos (solo [A-Za-z0-9_])`)
      }

      // Key con espacios
      if (key.includes(' ')) {
        errors.push(`${path}: key '${key}' contiene espacios`)
      }
    }

    // Detectar botón submit
    if (type === 'button' && key === 'submit') {
      hasSubmitButton = true
    }

    // Validaciones específicas por tipo
    switch (type) {
      case 'signature':
        warnings.push(`${path}: componente 'signature' es poco fiable en Therefore. Usar patrón firma canvas.`)
        break

      case 'textfield':
        if (comp.disabled === true) {
          warnings.push(`${path}: textfield con disabled:true provoca bucles en form.io. Usar htmlelement o readonly vía JS.`)
        }
        break

      case 'htmlelement':
        if (comp.content) {
          // Detectar <script>
          if (comp.content.includes('<script')) {
            errors.push(`${path}: htmlelement contiene <script>, que Angular elimina. Prohibido.`)
          }

          // Detectar onclick con caracteres prohibidos
          const onclickMatches = comp.content.match(/onclick="([^"]*)"/g)
          if (onclickMatches) {
            onclickMatches.forEach(attr => {
              const jsCode = attr.match(/onclick="([^"]*)"/)[1]

              // Comillas dobles dentro del JS
              if (jsCode.includes('"')) {
                errors.push(`${path}: onclick contiene comillas dobles dentro del JS. Solo usar comillas simples.`)
              }

              // < o > (warning en lugar de error)
              if (jsCode.includes('<') || jsCode.includes('>')) {
                warnings.push(`${path}: onclick contiene < o >. Puede causar problemas de parseo XML.`)
              }
            })
          }

          // Detectar credenciales
          if (
            comp.content.includes('btoa(') ||
            comp.content.includes('password') ||
            comp.content.includes('SVC_PASS') ||
            comp.content.includes('Authorization: Basic')
          ) {
            warnings.push(`${path}: posibles credenciales detectadas en htmlelement. Visible para cualquier usuario.`)
          }
        }
        break

      case 'hidden':
        // Validar customDefaultValue y calculateValue
        ;['customDefaultValue', 'calculateValue'].forEach(prop => {
          if (comp[prop]) {
            const code = comp[prop]

            // Saltos de línea reales
            if (code.includes('\n')) {
              errors.push(`${path}: ${prop} contiene saltos de línea reales. Debe ir en una sola línea.`)
            }

            // < o > (solo warning, Therefore los soporta)
            if (code.includes('<') || code.includes('>')) {
              warnings.push(`${path}: ${prop} contiene comparaciones < o >. Verifica que funcionen en Therefore.`)
            }

            // && (solo warning, Therefore lo soporta)
            if (code.includes('&&')) {
              warnings.push(`${path}: ${prop} contiene &&. Verifica que funcione en Therefore.`)
            }
          }
        })
        break
    }

    // Validar componentes hijos
    if (comp.components && Array.isArray(comp.components)) {
      comp.components.forEach((child, i) => {
        validateComponent(child, `${path}.components[${i}]`)
      })
    }

    // Validar columns
    if (comp.columns && Array.isArray(comp.columns)) {
      comp.columns.forEach((col, i) => {
        validateComponent(col, `${path}.columns[${i}]`)
      })
    }
  }

  // Validar todos los componentes
  components.forEach((comp, i) => {
    validateComponent(comp, `components[${i}]`)
  })

  // Validar que existe botón submit
  if (!hasSubmitButton) {
    errors.push('Falta botón submit (type: "button", key: "submit")')
  }

  // Validaciones específicas de entorno
  if (environment === 'onpremise') {
    components.forEach((comp, i) => {
      const compStr = JSON.stringify(comp)
      if (compStr.includes('GetConnectionToken')) {
        warnings.push(`components[${i}]: GetConnectionToken devuelve HTTP 500 en On-Premise. Usar Basic Auth.`)
      }
    })
  }

  // Validar ExecuteSingleQuery (bloqueado por CORS en algunos servidores)
  const allCompStr = JSON.stringify(components)
  if (allCompStr.includes('ExecuteSingleQuery')) {
    warnings.push('ExecuteSingleQuery puede estar bloqueado por CORS. Preferir ExecuteMultiQuery.')
  }

  // Validar mapeo a categoría
  if (categoryFields.length > 0) {
    const categoryColNames = categoryFields.map(f => f.colName)
    const categoryRequired = categoryFields.filter(f => f.required).map(f => f.colName)
    const inputKeys = Array.from(seenKeys).filter(k => k !== 'submit')

    // Keys que no coinciden con ningún ColName
    const unmappedKeys = inputKeys.filter(k => !categoryColNames.includes(k))
    if (unmappedKeys.length > 0) {
      warnings.push(`Keys sin mapeo a categoría: ${unmappedKeys.join(', ')}`)
    }

    // ColNames obligatorios no cubiertos
    const missingRequired = categoryRequired.filter(col => !inputKeys.includes(col))
    if (missingRequired.length > 0) {
      warnings.push(`Campos obligatorios de categoría sin cubrir: ${missingRequired.join(', ')}`)
    }
  }

  // Validar email/phoneNumber
  const emailPhoneFields = []
  function findEmailPhone(comp) {
    if (comp.type === 'email' || comp.type === 'phoneNumber') {
      emailPhoneFields.push(comp.key)
    }
    if (comp.components) comp.components.forEach(findEmailPhone)
    if (comp.columns) comp.columns.forEach(findEmailPhone)
  }
  components.forEach(findEmailPhone)

  if (emailPhoneFields.length > 0) {
    warnings.push(`Campos email/phoneNumber se mapean a String en Therefore: ${emailPhoneFields.join(', ')}`)
  }

  return { errors, warnings }
}

/**
 * Valida el FormID
 * @param {string} formId
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFormId(formId) {
  if (!formId) {
    return { valid: false, error: 'FormID es obligatorio' }
  }

  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(formId)) {
    return {
      valid: false,
      error: 'FormID debe empezar con letra y contener solo [A-Za-z0-9_], sin espacios ni acentos'
    }
  }

  return { valid: true }
}
