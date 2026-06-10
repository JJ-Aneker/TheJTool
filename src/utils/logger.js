/**
 * Logger Utility
 * Sistema de logging unificado con niveles y control por entorno
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
}

// Nivel actual basado en entorno
const currentLevel = import.meta.env.DEV ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR

/**
 * Logger class para logging consistente
 */
class Logger {
  /**
   * Registra error crítico
   * @param {string} message - Mensaje de error
   * @param {any} data - Datos adicionales opcionales
   */
  error(message, data = null) {
    if (currentLevel >= LOG_LEVELS.ERROR) {
      console.error(`❌ [ERROR] ${message}`, data || '')
    }
  }

  /**
   * Registra advertencia
   * @param {string} message - Mensaje de advertencia
   * @param {any} data - Datos adicionales opcionales
   */
  warn(message, data = null) {
    if (currentLevel >= LOG_LEVELS.WARN) {
      console.warn(`⚠️ [WARN] ${message}`, data || '')
    }
  }

  /**
   * Registra información general
   * @param {string} message - Mensaje informativo
   * @param {any} data - Datos adicionales opcionales
   */
  info(message, data = null) {
    if (currentLevel >= LOG_LEVELS.INFO) {
      console.log(`ℹ️ [INFO] ${message}`, data || '')
    }
  }

  /**
   * Registra información de debugging (solo en desarrollo)
   * @param {string} message - Mensaje de debug
   * @param {any} data - Datos adicionales opcionales
   */
  debug(message, data = null) {
    if (currentLevel >= LOG_LEVELS.DEBUG) {
      console.log(`🔍 [DEBUG] ${message}`, data || '')
    }
  }

  /**
   * Grupo de logs relacionados
   * @param {string} groupName - Nombre del grupo
   * @param {Function} callback - Función que contiene los logs del grupo
   */
  group(groupName, callback) {
    if (currentLevel >= LOG_LEVELS.DEBUG) {
      console.group(groupName)
      callback()
      console.groupEnd()
    }
  }

  /**
   * Log de tabla (útil para arrays de objetos)
   * @param {Array} data - Datos a mostrar en tabla
   */
  table(data) {
    if (currentLevel >= LOG_LEVELS.DEBUG) {
      console.table(data)
    }
  }

  /**
   * Log condicional de conexión/autenticación
   * @param {string} message - Mensaje
   * @param {any} data - Datos sensibles (se ocultan parcialmente)
   */
  auth(message, data = null) {
    if (currentLevel >= LOG_LEVELS.DEBUG) {
      console.log(`🔐 [AUTH] ${message}`, this._sanitize(data))
    }
  }

  /**
   * Log de operación HTTP
   * @param {string} method - Método HTTP
   * @param {string} url - URL
   * @param {any} data - Datos opcionales
   */
  http(method, url, data = null) {
    if (currentLevel >= LOG_LEVELS.DEBUG) {
      console.log(`🌐 [HTTP] ${method} ${url}`, data || '')
    }
  }

  /**
   * Sanitiza datos sensibles antes de loguear
   * @private
   */
  _sanitize(data) {
    if (!data) return data
    if (typeof data === 'string') {
      // Ocultar contraseñas y tokens
      return data.substring(0, 3) + '***'
    }
    if (typeof data === 'object') {
      const sanitized = { ...data }
      // Campos sensibles comunes
      const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization']
      sensitiveFields.forEach(field => {
        if (sanitized[field]) {
          sanitized[field] = '***'
        }
      })
      return sanitized
    }
    return data
  }
}

// Export singleton instance
export const logger = new Logger()

/**
 * Helper para timing de operaciones
 */
export class Timer {
  constructor(label) {
    this.label = label
    this.start = performance.now()
  }

  end() {
    const duration = (performance.now() - this.start).toFixed(2)
    logger.debug(`⏱️ ${this.label}: ${duration}ms`)
    return duration
  }
}

/**
 * Decorador para timing automático de funciones async
 * @param {Function} fn - Función a cronometrar
 * @param {string} label - Label para el log
 */
export const timed = (fn, label) => {
  return async (...args) => {
    const timer = new Timer(label || fn.name)
    try {
      const result = await fn(...args)
      timer.end()
      return result
    } catch (error) {
      timer.end()
      throw error
    }
  }
}

export default logger
