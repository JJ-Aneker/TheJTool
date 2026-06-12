/**
 * Messages Constants
 * Centraliza todos los mensajes de la aplicación
 */

export const MESSAGES = {
  // Success messages
  SUCCESS: {
    LOAD: (resource) => `${resource} cargado correctamente`,
    SAVE: (resource) => `${resource} guardado correctamente`,
    UPDATE: (resource) => `${resource} actualizado correctamente`,
    DELETE: (resource) => `${resource} eliminado correctamente`,
    CREATE: (resource) => `${resource} creado correctamente`,
    UPLOAD: (resource) => `${resource} cargado exitosamente`,
    CONNECT: 'Conexión exitosa',
    COPY: 'Copiado al portapapeles',
    EXPORT: 'Exportado correctamente',
    GENERATE: (item) => `${item} generado correctamente`,
  },

  // Error messages
  ERROR: {
    LOAD: (resource) => `Error al cargar ${resource}`,
    SAVE: (resource) => `Error al guardar ${resource}`,
    UPDATE: (resource) => `Error al actualizar ${resource}`,
    DELETE: (resource) => `Error al eliminar ${resource}`,
    CREATE: (resource) => `Error al crear ${resource}`,
    UPLOAD: (resource) => `Error al cargar ${resource}`,
    CONNECT: 'Error de conexión',
    INVALID_DATA: 'Datos inválidos',
    REQUIRED_FIELDS: 'Por favor completa todos los campos requeridos',
    GENERIC: 'Ha ocurrido un error',
  },

  // Warning messages
  WARNING: {
    UNSAVED_CHANGES: 'Tienes cambios sin guardar',
    NO_DATA: 'No hay datos disponibles',
    CONFIRM_DELETE: (resource) => `¿Estás seguro de eliminar ${resource}?`,
    CONFIRM_ACTION: '¿Estás seguro de realizar esta acción?',
  },

  // Info messages
  INFO: {
    IN_DEVELOPMENT: 'Función en desarrollo',
    NO_RESULTS: 'No se encontraron resultados',
    LOADING: 'Cargando...',
    PROCESSING: 'Procesando...',
  },

  // Auth messages
  AUTH: {
    LOGIN_SUCCESS: 'Inicio de sesión exitoso',
    LOGIN_ERROR: 'Error en el inicio de sesión. Verifica email y contraseña.',
    LOGOUT_SUCCESS: 'Sesión cerrada',
    REGISTER_SUCCESS: 'Usuario creado exitosamente. Por favor inicia sesión.',
    REGISTER_ERROR: 'Error al crear usuario',
    PASSWORD_MISMATCH: 'Las contraseñas no coinciden',
    PASSWORD_UPDATED: 'Contraseña actualizada exitosamente',
    RESET_LINK_SENT: 'Enlace enviado a tu correo electrónico',
    UNAUTHORIZED: 'No tienes permisos para realizar esta acción',
  },

  // Validation messages
  VALIDATION: {
    REQUIRED: (field) => `${field} es obligatorio`,
    INVALID_FORMAT: (field) => `Formato de ${field} inválido`,
    MIN_LENGTH: (field, length) => `${field} debe tener al menos ${length} caracteres`,
    MAX_LENGTH: (field, length) => `${field} no puede exceder ${length} caracteres`,
    INVALID_EMAIL: 'Email inválido',
    INVALID_URL: 'URL inválida',
  },

  // Resource-specific messages
  CATEGORY: {
    NAME_REQUIRED: 'El nombre de la categoría es obligatorio',
    XML_GENERATED: (count) => `✅ XML generado con ${count} categoría(s)`,
    LOADED: 'Categoría cargada',
  },

  EFORM: {
    SAVED: 'Formulario guardado',
    UPDATED: 'Formulario actualizado',
    DUPLICATED: 'Formulario duplicado',
    LOADED: 'Formulario cargado',
    SHARED: (isShared) => isShared ? 'Compartido' : 'No compartido',
  },

  TENANT: {
    TEST_SUCCESS: 'Conexión al tenant exitosa',
    COMPLETE_FIELDS: 'Completa nombre y servidor',
    NOT_FOUND: 'Servidor no encontrado',
  },

  DOCUMENT: {
    FILE_TYPE_ERROR: (expected) => `Solo se aceptan archivos ${expected}`,
    DIMENSIONS_WARNING: (actual, expected) =>
      `Dimensiones detectadas: ${actual}. Recomendado: ${expected}`,
    NO_DATA: 'No hay datos del proyecto para generar el documento',
  },

  GANTT: {
    SUCCESS: 'Diagrama Gantt generado y descargado exitosamente',
    NO_DATA: 'No hay datos del proyecto para generar Gantt',
  },

  BEDROCK: {
    TEST_SUCCESS: 'Prueba de conexión Bedrock exitosa',
    TEST_FAILED: 'Prueba de Bedrock fallida',
    CREDENTIALS_UPDATED: 'Credenciales AWS Bedrock actualizadas correctamente',
  },

  REPORTER: {
    COMPLETE_FIELDS: 'Completa todos los campos',
    COMPLETE_DATE_RANGE: 'Completa rango de fechas',
    NO_DATA_TO_EXPORT: 'No hay datos para exportar',
    CSV_EXPORTED: 'CSV exportado',
    CONNECTED: '✓ Conectado',
  },
}

/**
 * Helper para obtener mensaje de éxito genérico
 * @param {string} action - Acción realizada (load, save, update, delete, create)
 * @param {string} resource - Recurso afectado
 * @returns {string} Mensaje formateado
 */
export const getSuccessMessage = (action, resource) => {
  const actionKey = action.toUpperCase()
  if (MESSAGES.SUCCESS[actionKey]) {
    return typeof MESSAGES.SUCCESS[actionKey] === 'function'
      ? MESSAGES.SUCCESS[actionKey](resource)
      : MESSAGES.SUCCESS[actionKey]
  }
  return `Operación completada: ${action} ${resource}`
}

/**
 * Helper para obtener mensaje de error genérico
 * @param {string} action - Acción que falló
 * @param {string} resource - Recurso afectado
 * @returns {string} Mensaje formateado
 */
export const getErrorMessage = (action, resource) => {
  const actionKey = action.toUpperCase()
  if (MESSAGES.ERROR[actionKey]) {
    return typeof MESSAGES.ERROR[actionKey] === 'function'
      ? MESSAGES.ERROR[actionKey](resource)
      : MESSAGES.ERROR[actionKey]
  }
  return `Error: ${action} ${resource}`
}
