/**
 * Error Handler Utility
 * Manejo unificado de errores en la aplicación
 */

import { message } from 'antd'

/**
 * Maneja errores de manera consistente mostrando mensaje al usuario
 * @param {Error} error - Error capturado
 * @param {string} context - Contexto de la operación (ej: "cargar usuarios")
 * @param {boolean} showToast - Si debe mostrar mensaje toast (default: true)
 */
export const handleError = (error, context = 'realizar la operación', showToast = true) => {
  const errorMessage = error?.message || error?.error || error || 'Error desconocido'
  const fullMessage = `Error al ${context}: ${errorMessage}`

  // Log para debugging (solo en desarrollo)
  if (import.meta.env.DEV) {
    console.error(`[ErrorHandler] ${fullMessage}`, error)
  }

  // Mostrar al usuario
  if (showToast) {
    message.error(fullMessage)
  }

  return fullMessage
}

/**
 * Maneja errores de carga de datos
 * @param {Error} error - Error capturado
 * @param {string} resource - Recurso que se estaba cargando (ej: "usuarios")
 */
export const handleLoadError = (error, resource) => {
  return handleError(error, `cargar ${resource}`)
}

/**
 * Maneja errores de guardado
 * @param {Error} error - Error capturado
 * @param {string} resource - Recurso que se estaba guardando
 */
export const handleSaveError = (error, resource) => {
  return handleError(error, `guardar ${resource}`)
}

/**
 * Maneja errores de eliminación
 * @param {Error} error - Error capturado
 * @param {string} resource - Recurso que se estaba eliminando
 */
export const handleDeleteError = (error, resource) => {
  return handleError(error, `eliminar ${resource}`)
}

/**
 * Maneja errores de actualización
 * @param {Error} error - Error capturado
 * @param {string} resource - Recurso que se estaba actualizando
 */
export const handleUpdateError = (error, resource) => {
  return handleError(error, `actualizar ${resource}`)
}

/**
 * Registra errores silenciosamente (sin mostrar al usuario)
 * Útil para errores que no afectan la experiencia del usuario
 * @param {Error} error - Error a registrar
 * @param {string} context - Contexto del error
 */
export const logError = (error, context) => {
  if (import.meta.env.DEV) {
    console.error(`[Silent Error] ${context}:`, error)
  }
}
