// Configuración de tipos de documentos soportados

export const DOCUMENT_TYPES = {
  efdt: {
    id: 'efdt',
    label: 'EFDT — Especificaciones Funcionales y Diseño Técnico',
    description: 'Documento técnico detallado con estructura, estimación y riesgos',
    icon: '📋',
    sections: ['cliente', 'proyecto', 'alcance', 'estructura', 'estimacion', 'riesgos'],
    styleGuide: 'EFDT_ESTILOS.md',
    generationGuide: 'EFDT_GENERACION.md',
    maxTokens: 6000,
  },
  requirements: {
    id: 'requirements',
    label: 'Análisis de Requerimientos',
    description: 'Captura funcional y técnica de requisitos del proyecto',
    icon: '📝',
    sections: ['cliente', 'proyecto', 'requerimientos', 'restricciones', 'criterios-aceptacion'],
    styleGuide: 'ESTILOS_GENERICOS.md',
    generationGuide: 'GENERACION_GENERICA.md',
    maxTokens: 5000,
  },
  budget: {
    id: 'budget',
    label: 'Aproximación Económica',
    description: 'Presupuesto y desglose de costes del proyecto',
    icon: '💰',
    sections: ['cliente', 'proyecto', 'desglose-costes', 'supuestos', 'total'],
    styleGuide: 'ESTILOS_GENERICOS.md',
    generationGuide: 'GENERACION_GENERICA.md',
    maxTokens: 4000,
  },
  commercial: {
    id: 'commercial',
    label: 'Oferta Comercial',
    description: 'Propuesta comercial y términos de negocio',
    icon: '🤝',
    sections: ['cliente', 'proyecto', 'propuesta', 'condiciones', 'plazos'],
    styleGuide: 'ESTILOS_GENERICOS.md',
    generationGuide: 'GENERACION_GENERICA.md',
    maxTokens: 5000,
  },
  quotation: {
    id: 'quotation',
    label: 'Cotización de Acciones',
    description: 'Análisis y cotización de líneas de trabajo',
    icon: '📊',
    sections: ['cliente', 'lineas', 'valoracion', 'condiciones'],
    styleGuide: 'ESTILOS_GENERICOS.md',
    generationGuide: 'GENERACION_GENERICA.md',
    maxTokens: 4000,
  },
}

export default DOCUMENT_TYPES
