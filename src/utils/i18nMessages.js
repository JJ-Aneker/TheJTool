/**
 * i18n Messages Helper
 * Wrapper para usar traducciones i18n con la estructura de MESSAGES existente
 */

import i18n from '../i18n'

export const useMessages = () => {
  const t = i18n.t.bind(i18n)

  return {
    SUCCESS: {
      LOAD: (resource) => t('success.load', { resource }),
      SAVE: (resource) => t('success.save', { resource }),
      UPDATE: (resource) => t('success.update', { resource }),
      DELETE: (resource) => t('success.delete', { resource }),
      CREATE: (resource) => t('success.create', { resource }),
      UPLOAD: (resource) => t('success.upload', { resource }),
      CONNECT: t('success.connect'),
      COPY: t('success.copy'),
      EXPORT: t('success.export'),
      GENERATE: (item) => t('success.generate', { item }),
    },

    ERROR: {
      LOAD: (resource) => t('error.load', { resource }),
      SAVE: (resource) => t('error.save', { resource }),
      UPDATE: (resource) => t('error.update', { resource }),
      DELETE: (resource) => t('error.delete', { resource }),
      CREATE: (resource) => t('error.create', { resource }),
      UPLOAD: (resource) => t('error.upload', { resource }),
      CONNECT: t('error.connect'),
      INVALID_DATA: t('error.invalidData'),
      REQUIRED_FIELDS: t('error.requiredFields'),
      GENERIC: t('error.generic'),
    },

    WARNING: {
      UNSAVED_CHANGES: t('warning.unsavedChanges'),
      NO_DATA: t('warning.noData'),
      CONFIRM_DELETE: (resource) => t('warning.confirmDelete', { resource }),
      CONFIRM_ACTION: t('warning.confirmAction'),
    },

    INFO: {
      IN_DEVELOPMENT: t('info.inDevelopment'),
      NO_RESULTS: t('info.noResults'),
      LOADING: t('info.loading'),
      PROCESSING: t('info.processing'),
    },

    AUTH: {
      LOGIN_SUCCESS: t('auth.loginSuccess'),
      LOGIN_ERROR: t('auth.loginError'),
      LOGOUT_SUCCESS: t('auth.logoutSuccess'),
      REGISTER_SUCCESS: t('auth.registerSuccess'),
      REGISTER_ERROR: t('auth.registerError'),
      PASSWORD_MISMATCH: t('auth.passwordMismatch'),
      PASSWORD_UPDATED: t('auth.passwordUpdated'),
      RESET_LINK_SENT: t('auth.resetLinkSent'),
      UNAUTHORIZED: t('auth.unauthorized'),
    },

    VALIDATION: {
      REQUIRED: (field) => t('validation.required', { field }),
      INVALID_FORMAT: (field) => t('validation.invalidFormat', { field }),
      MIN_LENGTH: (field, length) => t('validation.minLength', { field, length }),
      MAX_LENGTH: (field, length) => t('validation.maxLength', { field, length }),
      INVALID_EMAIL: t('validation.invalidEmail'),
      INVALID_URL: t('validation.invalidUrl'),
    },

    CATEGORY: {
      NAME_REQUIRED: t('category.nameRequired'),
      XML_GENERATED: (count) => t('category.xmlGenerated', { count }),
      LOADED: t('category.loaded'),
    },

    EFORM: {
      SAVED: t('eform.saved'),
      UPDATED: t('eform.updated'),
      DUPLICATED: t('eform.duplicated'),
      LOADED: t('eform.loaded'),
      SHARED: (isShared) => isShared ? t('eform.shared') : t('eform.notShared'),
    },

    TENANT: {
      TEST_SUCCESS: t('tenant.testSuccess'),
      COMPLETE_FIELDS: t('tenant.completeFields'),
      NOT_FOUND: t('tenant.notFound'),
    },

    DOCUMENT: {
      FILE_TYPE_ERROR: (expected) => t('document.fileTypeError', { expected }),
      DIMENSIONS_WARNING: (actual, expected) => t('document.dimensionsWarning', { actual, expected }),
      NO_DATA: t('document.noData'),
    },

    GANTT: {
      SUCCESS: t('gantt.success'),
      NO_DATA: t('gantt.noData'),
    },

    BEDROCK: {
      TEST_SUCCESS: t('bedrock.testSuccess'),
      TEST_FAILED: t('bedrock.testFailed'),
      CREDENTIALS_UPDATED: t('bedrock.credentialsUpdated'),
    },

    REPORTER: {
      COMPLETE_FIELDS: t('reporter.completeFields'),
      COMPLETE_DATE_RANGE: t('reporter.completeDateRange'),
      NO_DATA_TO_EXPORT: t('reporter.noDataToExport'),
      CSV_EXPORTED: t('reporter.csvExported'),
      CONNECTED: t('reporter.connected'),
    },
  }
}

// Helper para obtener mensaje de éxito genérico
export const getSuccessMessage = (action, resource) => {
  const messages = useMessages()
  const actionKey = action.toUpperCase()
  if (messages.SUCCESS[actionKey]) {
    return typeof messages.SUCCESS[actionKey] === 'function'
      ? messages.SUCCESS[actionKey](resource)
      : messages.SUCCESS[actionKey]
  }
  return `${action} ${resource}`
}

// Helper para obtener mensaje de error genérico
export const getErrorMessage = (action, resource) => {
  const messages = useMessages()
  const actionKey = action.toUpperCase()
  if (messages.ERROR[actionKey]) {
    return typeof messages.ERROR[actionKey] === 'function'
      ? messages.ERROR[actionKey](resource)
      : messages.ERROR[actionKey]
  }
  return `Error: ${action} ${resource}`
}
