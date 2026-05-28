// api/_lib/knowledge/document_ejemplos.js
// Ejemplos reales por tipo de documento para inyectar en prompts

export const DOCUMENT_EJEMPLOS = {
  efdt: {
    descripcion: 'Especificaciones Funcionales y Diseño Técnico',
    ejemplo1: {
      titulo: 'Caso: Sistema Notificaciones (NotifAPP)',
      tamanio: 'Pequeño-Mediano',
      estructura: {
        expediente: 'Expediente Principal (18 campos)',
        categorias: '2 categorías dependientes',
        workflows: '2 workflows principales',
        tablas: '3 tablas maestras'
      },
      estimacion: {
        total_dias: 4.19,
        total_euros: 3350,
        desglose: 'Análisis 1d, Categorías 0.5d, Workflows 1.5d, Tablas 1d, Testing 1.2d'
      }
    },
    ejemplo2: {
      titulo: 'Caso: Sistema HR Completo',
      tamanio: 'Mediano-Grande',
      estructura: {
        expediente: 'Expediente de empleado (22 campos)',
        categorias: '12 categorías (Formación, Evaluación, Nómina, etc.)',
        workflows: '5 workflows principales',
        tablas: '11 tablas maestras'
      },
      estimacion: {
        total_dias: 11.78,
        total_euros: 9424,
        desglose: 'Análisis 1.5d, Expediente 0.25d, 12 Categorías 2.3d, Workflows 2.5d, Integraciones 2d, Testing 2.5d, Formación 0.75d'
      }
    },
    patron_qualidade: [
      'Descripciones funcionales detalladas (2-3 párrafos por sección)',
      'Tablas maestras con campos específicos y ejemplos',
      'Workflows describiendo cada etapa y transiciones',
      'Estimación desglosada por tarea con ratios validados',
      'Riesgos y supuestos críticos identificados'
    ]
  },

  requirements: {
    descripcion: 'Análisis de Requerimientos Funcionales y Técnicos',
    ejemplo1: {
      titulo: 'Caso: Portal Autoservicio (Mediano)',
      contexto: 'Portal para empleados acceder a documentos personales',
      usuarios: '~500 empleados',
      requerimientos_funcionales: [
        'RF-001: Autenticación con 2FA opcional',
        'RF-002: Acceso a documentos personales (nómina, certificados)',
        'RF-003: Solicitud de cambios en datos personales',
        'RF-004: Reportería personal (absentismos, vacaciones)'
      ],
      requerimientos_tecnicos: [
        'RT-001: Integración con Therefore',
        'RT-002: Integradores externos (nómina, firma digital)',
        'RT-003: Escalabilidad 500 usuarios concurrentes'
      ]
    },
    ejemplo2: {
      titulo: 'Caso: Sistema Gestión Incidencias (Grande)',
      contexto: 'Sistema ticketing interno con integración Jira, Slack, Azure',
      usuarios: '80 técnicos, 500+ solicitantes',
      volumen: '2,000 incidencias/mes',
      requerimientos_principales: [
        'Creación automática de ticket con asignación por categoría',
        'Escalado automático si > 4h sin actualización',
        'Seguimiento de SLA (crítica 2h, alta 4h, media 24h, baja 5d)',
        'Cierre con encuesta de satisfacción'
      ]
    },
    patron_qualidade: [
      'Contexto claro del cliente y necesidad',
      'Requerimientos funcionales numerados (RF-xxx)',
      'Requerimientos técnicos numerados (RT-xxx)',
      'Métricas y criterios de aceptación testables',
      'Supuestos y riesgos identificados'
    ]
  },

  budget: {
    descripcion: 'Aproximación Económica / Presupuesto',
    ejemplo1: {
      titulo: 'Caso: Sistema Notificaciones (Pequeño)',
      presupuesto_disponible: '8,000€',
      timeline: '6 semanas máximo',
      usuarios: '8 concurrentes',
      desglose: [
        'Planificación: 2.0 días / 1,600€',
        'Configuración Therefore: 1.29 días / 1,030€',
        'Integración: 1.0 día / 800€',
        'Pruebas: 2.0 días / 1,600€',
        'Formación: 1.25 días / 1,000€'
      ],
      total: '7.54 días = 7,296€ (con IVA)',
      margen_contingencia: '8.8%'
    },
    ejemplo2: {
      titulo: 'Caso: Sistema HR Completo (Grande)',
      presupuesto_disponible: '30,000€',
      timeline: '10 semanas',
      usuarios: '50 RRHH + 500 empleados',
      desglose_fases: [
        'Análisis: 24h / 1,920€',
        '12 Categorías: 72h / 5,760€',
        'Workflows: 40h / 3,200€',
        'Integraciones SAP/Azure: 48h / 3,840€',
        'Testing: 40h / 3,200€',
        'Formación: 12h / 960€',
        'Soporte post-go-live: 16h / 1,280€',
        'Contingencia (10%): 2,560€'
      ],
      total: '256h = 27,918€ (con IVA)',
      riesgo: 'MEDIO (margen ajustado 6.9%)'
    },
    ratios_validados: {
      tarifa_base: '800€/día (100€/hora)',
      analisis: '1 día + tiempo con cliente',
      expediente_principal: '0.25 días (18-20 campos)',
      categoria_dependiente: '0.19 días por categoría',
      workflow: '0.5 días (4-5 etapas)',
      tabla_maestra: '0.1 día',
      integracion_simple: '1 día',
      integracion_compleja_sap: '2-3 días',
      pruebas: '15-25% del tiempo de desarrollo',
      contingencia_pequeno: '8-10% (<5 días)',
      contingencia_mediano: '10-15% (5-15 días)',
      contingencia_grande: '15-20% (>15 días)'
    },
    patron_qualidade: [
      'Desglose por fases claras',
      'Uso de ratios validados para estimación',
      'Margen de contingencia apropiado',
      'Viabilidad vs presupuesto cliente',
      'Riesgos identificados con probabilidad/impacto'
    ]
  },

  commercial: {
    descripcion: 'Oferta Comercial Formal',
    ejemplo1: {
      titulo: 'Caso: Sistema Notificaciones (Pequeño)',
      referencia: 'OC-2026-001',
      vigencia: '30 días',
      servicio: 'Implementación de Sistema de Gestión de Notificaciones',
      alcance: [
        'Configuración de plataforma Therefore',
        'Workflows de tramitación, revisión, aprobación',
        'Integración con email corporativo',
        'Formación y documentación'
      ],
      usuarios: '8 usuarios concurrentes, 500+ nominativos',
      timeline_semanas: '6-8 desde aprobación',
      coste_total: '8,131€ (con IVA)',
      terminos_pago: '50% anticipo, 50% al completar',
      plazo_pago: '30 días a partir de firma'
    },
    ejemplo2: {
      titulo: 'Caso: Sistema HR (Grande)',
      coste_total: '24,781€ (con IVA)',
      timeline_semanas: '12-14',
      terminos_pago: '30% firma, 40% fin implementación, 30% go-live',
      hitos: [
        'Hito 1 (Análisis): Semana 2',
        'Hito 2 (Configuración): Semana 6',
        'Hito 3 (Workflows): Semana 10',
        'Hito 4 (Testing/go-live): Semana 14'
      ]
    },
    seccion_incluido: [
      '✓ Configuración completa en Therefore',
      '✓ Licencia Therefore (período)',
      '✓ Workflows automatizados',
      '✓ Documentación técnica y usuario',
      '✓ Formación (1 sesión)',
      '✓ Soporte técnico 30 días'
    ],
    seccion_no_incluido: [
      '✗ Cambios fuera del alcance',
      '✗ Integraciones adicionales',
      '✗ Alojamiento web',
      '✗ Certificados SSL',
      '✗ Soporte post-30 días'
    ],
    patron_qualidade: [
      'Descripción clara del servicio',
      'Desglose de costes por fases',
      'Términos de pago explícitos',
      'Incluido vs NO Incluido (crítico)',
      'Supuestos críticos (S1, S2, S3...)',
      'Riesgos y plan de mitigación',
      'Términos de aceptación con vigencia'
    ]
  },

  'change-requests': {
    descripcion: 'Change Request / Evolutivo',
    ejemplo1: {
      titulo: 'CR Simple: Agregar Campo a Formulario',
      tipo: 'Change Request',
      duracion: '2.1 días',
      coste: '1,680€',
      cambios: [
        'Nuevo campo: "Popup de Bienvenida" (Boolean) - 0.25 días',
        'Modificar workflow: agregar validación - 0.5 días',
        'Actualizar plantilla Word - 0.1 días',
        'Testing y regresión - 1 día'
      ],
      riesgo: 'Bajo',
      patrones: 'Patrón A: Agregar Campo/Tabla'
    },
    ejemplo2: {
      titulo: 'Evolutivo: Expansión a 2 Nuevas Verticales',
      tipo: 'Evolutivo',
      duracion: '12.95 días',
      coste: '12,536€ (con IVA)',
      vertical1: {
        nombre: 'Gestión de Incidencias',
        similitud: '60% con sistema existente',
        nuevas_categorias: 3,
        nuevos_workflows: 2,
        duracion_dias: 3.5
      },
      vertical2: {
        nombre: 'Gestión de Cambios (CAB)',
        similitud: '40% con sistema existente',
        nuevas_categorias: 2,
        nuevos_workflows: 3,
        duracion_dias: 4.5
      },
      desglose: [
        'Análisis ampliado: 1.5 días',
        'Nuevas categorías (5): 0.95 días',
        'Nuevos workflows (5): 2.5 días',
        'Cambios infraestructura: 1.0 día',
        'Modificación workflows base: 1.5 días',
        'Integración externa: 2.0 días',
        'Testing funcionales + regresión: 2.0 días',
        'Formación: 1.0 día'
      ],
      riesgos: [
        'R1: Cambios en workflows base pueden afectar producción',
        'R2: Integración con sistema externo puede tener delays'
      ]
    },
    patron_qualidade: [
      'Distinción clara CR vs Evolutivo',
      'Desglose detallado de cambios',
      'Estimación por componente',
      'Análisis de impacto en producción',
      'Testing de regresión explícito',
      'Riesgos identificados con mitigación'
    ]
  }
}

// Función helper para obtener ejemplos por tipo
export function getEjemplosPorTipo(tipoDoc) {
  return DOCUMENT_EJEMPLOS[tipoDoc] || DOCUMENT_EJEMPLOS.efdt
}

// Función helper para formatear ejemplos para el system prompt
export function formatearEjemplosParaPrompt(tipoDoc) {
  const ejemplos = getEjemplosPorTipo(tipoDoc)
  return `
## EJEMPLOS REALES — ${ejemplos.descripcion.toUpperCase()}

### Patrones de Calidad Esperados
${ejemplos.patron_qualidade.map(p => `- ${p}`).join('\n')}

### Caso de Ejemplo 1: ${ejemplos.ejemplo1.titulo}
${JSON.stringify(ejemplos.ejemplo1, null, 2)}

### Caso de Ejemplo 2: ${ejemplos.ejemplo2.titulo}
${JSON.stringify(ejemplos.ejemplo2, null, 2)}
`.trim()
}
