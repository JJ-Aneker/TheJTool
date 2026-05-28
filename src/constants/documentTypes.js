// src/constants/documentTypes.js
// Document type definitions for frontend (mirrors backend DOCUMENT_TYPES)

export const DOCUMENT_TYPES = {
  efdt: {
    id: 'efdt',
    label: 'EFDT — Especificaciones Funcionales y Diseño Técnico',
    description: 'Descripción técnica COMPLETA y detallada de la solución a implementar',
    icon: '📋',
    sections: ['cliente', 'proyecto', 'alcance', 'estructura', 'estimacion', 'riesgos'],
    tipoDuracion: '5-15 días',
    color: '#C00000'
  },

  requirements: {
    id: 'requirements',
    label: 'Análisis de Requerimientos',
    description: 'Captura QUÉ necesita el cliente, ANTES de planificar CÓMO hacerlo',
    icon: '📝',
    sections: ['contexto', 'requerimientos_funcionales', 'requerimientos_tecnicos', 'criterios_aceptacion'],
    tipoDuracion: '2-4 días',
    color: '#1677FF'
  },

  budget: {
    id: 'budget',
    label: 'Aproximación Económica / Presupuesto',
    description: 'Desglose de costes estimados para validar viabilidad financiera',
    icon: '💰',
    sections: ['resumen_ejecutivo', 'desglose_fases', 'contingencia', 'viabilidad'],
    tipoDuracion: '3-5 días',
    color: '#52C41A'
  },

  commercial: {
    id: 'commercial',
    label: 'Oferta Comercial',
    description: 'Propuesta formal con términos, condiciones, plazos y firma',
    icon: '🤝',
    sections: ['descripcion_servicio', 'desglose_costes', 'condiciones_comerciales', 'terminos_aceptacion'],
    tipoDuracion: '2-3 días',
    color: '#FA8C16'
  },

  'change-requests': {
    id: 'change-requests',
    label: 'Change Request / Evolutivo',
    description: 'Documentación de cambios/ampliaciones en sistemas existentes',
    icon: '🔄',
    sections: ['cambios_solicitados', 'impacto', 'estimacion', 'riesgos'],
    tipoDuracion: '1-20 días (CR: 1-5, Evolutivo: 5-20)',
    color: '#722ED1'
  }
}

export const DOCUMENT_TYPES_ARRAY = Object.values(DOCUMENT_TYPES)

// Helper to get document type by ID
export function getDocumentType(id) {
  return DOCUMENT_TYPES[id] || DOCUMENT_TYPES.efdt
}

// Helper to get options for Select component
export function getDocumentTypeOptions() {
  return DOCUMENT_TYPES_ARRAY.map(type => ({
    value: type.id,
    label: `${type.icon} ${type.label}`,
    description: type.description,
    tipoDuracion: type.tipoDuracion
  }))
}
