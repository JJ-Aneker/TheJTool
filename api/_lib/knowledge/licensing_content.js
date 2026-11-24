// Base de conocimiento para documentos de licenciamiento Therefore™

export const LICENSING_MODELS = {
  onpremise: {
    name: 'Therefore™ On-Premise',
    model: 'CapEx - Compra perpetua',
    infrastructure: 'Servidores propios del cliente',
    license: 'Licencia de servidor obligatoria',
    storage: 'Aportado por el cliente',
    maintenance: 'Cuota anual de mantenimiento (CSS)',
    advantages: [
      'Control total sobre infraestructura y datos',
      'Sin dependencia de conectividad continua',
      'Personalización completa del entorno',
      'Inversión capitalizable (CapEx)'
    ]
  },
  online: {
    name: 'Therefore™ Online (Cloud)',
    model: 'OpEx - SaaS cuota mensual',
    infrastructure: 'Nube Microsoft Azure gestionada por Canon',
    license: 'Licencia de servidor incluida (no se cotiza)',
    storage: 'Incluido (10 GB por usuario completo)',
    maintenance: 'Incluido en cuota mensual',
    advantages: [
      'Sin inversión inicial en infraestructura',
      'Escalado ágil mes a mes',
      'Actualizaciones automáticas',
      'Alta disponibilidad garantizada',
      'Backup automático en la nube'
    ]
  },
  suscripcion: {
    name: 'Therefore™ Subscription',
    model: 'OpEx - Cuota mensual recurrente',
    infrastructure: 'Servidores propios del cliente',
    license: 'Licencia de servidor obligatoria',
    storage: 'Aportado por el cliente',
    maintenance: 'Incluido en cuota mensual',
    advantages: [
      'Pago distribuido sin inversión inicial',
      'Control sobre infraestructura',
      'Flexibilidad de cancelación',
      'Predictibilidad en costes operativos'
    ]
  }
}

export const LICENSE_TYPES = {
  nominal: {
    name: 'Licencia Nominal (Dedicada)',
    description: 'Licencia asignada a una persona específica con acceso garantizado e ininterrumpido',
    use_case: 'Usuarios clave que necesitan acceso permanente (RRHH, Contabilidad, Dirección)',
    features: [
      'Acceso garantizado 24/7',
      'Funcionalidad completa (workflows, subida, indexación)',
      'No comparte pool con otros usuarios',
      'Máxima disponibilidad'
    ]
  },
  concurrente: {
    name: 'Licencia Concurrente (Flotante)',
    description: 'Licencia asignada a un pool compartido de acceso dinámico',
    use_case: 'Equipos con acceso rotativo o consultas esporádicas',
    features: [
      'Se libera al cerrar sesión',
      'Funcionalidad completa',
      'Compartida entre múltiples usuarios',
      'Ideal para turnos rotativos'
    ]
  },
  readonly: {
    name: 'Licencia de Solo Lectura (Read-Only)',
    description: 'Licencia de consulta para acceso básico sin modificación',
    use_case: 'Usuarios que solo necesitan consultar documentación',
    features: [
      'Buscar y descargar documentos',
      'Sin acceso a workflows',
      'Sin capacidad de subida',
      'Gestionada por grupo'
    ]
  }
}

export const CONNECTORS = {
  content_connector: {
    code: 'THE.EA.CC',
    name: 'Therefore™ Content Connector',
    tagline: 'La Navaja Suiza de la Ingesta',
    description: 'Módulo indispensable para automatizar la captura de información desde múltiples fuentes',
    capabilities: [
      'Monitorización de emails y carpetas de red',
      'OCR Zonal, códigos de barras y extracción TXT',
      'Integración con plataformas de firma digital',
      'Importación desatendida 24/7'
    ],
    value: 'Elimina la captura manual de documentos, reduciendo errores y liberando tiempo del personal'
  },
  universal_connector: {
    code: 'THE.EA.UC',
    name: 'Therefore™ Universal Connector',
    tagline: 'Integración sin Código con Cualquier Aplicación',
    description: 'Aplicación cliente ligera que mapea visualmente campos de cualquier aplicación mediante Hotkey',
    capabilities: [
      'Búsqueda instantánea desde cualquier pantalla',
      'Archivado directo con auto-indexación',
      'Sin desarrollo ni modificación de software existente',
      'Compatible con aplicaciones Windows y web'
    ],
    value: 'Integración flexible con sistemas propios sin costes de desarrollo ni consultoría'
  },
  sap_connector: {
    code: 'THE.EA.SAP',
    name: 'Conector SAP ERP & S/4HANA',
    tagline: 'Integración Certificada ArchivLink',
    description: 'Integración bidireccional certificada con SAP mediante protocolo ArchivLink estándar',
    capabilities: [
      'Archivo automático desde transacciones SAP',
      'Consulta de documentos sin salir del ERP',
      'Cumplimiento normativo de archivado fiscal',
      'Compatible con SAP ECC y S/4HANA'
    ],
    value: 'Integración nativa probada con SAP sin desarrollo a medida'
  },
  dynamics_connector: {
    code: 'THE.EA.DYN',
    name: 'Conector Microsoft Dynamics 365 / Business Central',
    tagline: 'Unificación con el ERP Microsoft',
    description: 'Integración certificada con plataformas Microsoft Dynamics',
    capabilities: [
      'Sincronización automática de documentos y metadatos',
      'Acceso desde el ERP a documentos archivados',
      'Workflows coordinados entre sistemas',
      'Trazabilidad completa de procesos'
    ],
    value: 'Unifica gestión documental con procesos de negocio en Dynamics'
  },
  sharepoint_connector: {
    code: 'THE.EA.SP',
    name: 'Conector Microsoft SharePoint',
    tagline: 'Evolución Natural desde SharePoint',
    description: 'Migración y sincronización de contenidos desde SharePoint',
    capabilities: [
      'Migración de bibliotecas de documentos',
      'Sincronización bidireccional de metadatos',
      'Preservación de permisos y estructura',
      'Workflows avanzados no disponibles en SharePoint'
    ],
    value: 'Camino de evolución desde SharePoint a gestión documental profesional'
  },
  factura_electronica: {
    code: 'THE.EA.FE',
    name: 'Conector Factura Electrónica',
    tagline: 'Cumplimiento Normativo Automático',
    description: 'Procesamiento especializado de normativas fiscales vigentes',
    capabilities: [
      'Importación y validación automática XML/UBL',
      'Cumplimiento Facturae y estándares europeos',
      'Extracción de metadatos sin OCR',
      'Archivo con validez legal'
    ],
    value: 'Garantiza cumplimiento normativo en facturación electrónica sin intervención manual'
  },
  portal_web: {
    code: 'THE.EA.WP',
    name: 'Portal Web',
    tagline: 'Acceso Ilimitado para Usuarios Externos',
    description: 'Portal seguro para clientes, proveedores y socios externos',
    capabilities: [
      'Usuarios externos ilimitados (licenciamiento por conector)',
      'Seguridad granular definida por administrador',
      'Acceso mediante navegador web',
      'Reducción drástica del TCO'
    ],
    value: 'Permite colaboración externa sin coste por usuario adicional'
  }
}

export const AI_MODULES = {
  smart_capture: {
    code: 'THE.EA.SC',
    name: 'Therefore™ Smart Capture',
    tagline: 'Extracción Inteligente sin Plantillas',
    description: 'Motor de IA para captura automatizada que aprende del feedback del usuario',
    capabilities: [
      'Extracción automática sin configuración de plantillas',
      'Aprendizaje continuo con feedback',
      'Soporte facturas, pedidos y albaranes',
      'Rollover mensual o acumulación anual'
    ],
    packages: ['100 páginas', '1.000 páginas', '10.000 páginas', '100.000 páginas'],
    pricing: 'Páginas en exceso: 0,50€/imagen',
    value: 'Elimina el mantenimiento de plantillas OCR y se adapta automáticamente a nuevos formatos'
  },
  document_intelligence: {
    code: 'THE.EA.DI',
    name: 'Document Intelligence (IA)',
    tagline: 'Clasificación y Enrutamiento Inteligente',
    description: 'Clasificación automática y enrutamiento basado en Azure AI Document Intelligence',
    capabilities: [
      'Clasificación por tipo de documento',
      'Enrutamiento automático a workflows',
      'Aprendizaje automático continuo',
      'Integración con Azure AI'
    ],
    packages: ['100 imágenes', '1.000 imágenes', '10.000 imágenes', '100.000 imágenes'],
    requirements: 'Requiere Conector Document Intelligence + Bolsa de imágenes',
    value: 'Automatiza el triaje de documentos sin intervención humana'
  },
  copilot_connector: {
    code: 'THE.EA.CP',
    name: 'Conector Microsoft Copilot',
    tagline: 'Base de Conocimiento en M365',
    description: 'Integración de Therefore™ en el ecosistema Microsoft 365 Copilot',
    capabilities: [
      'Indexación segura vía Microsoft Graph',
      'Respeto estricto de permisos de Therefore',
      'Consultas en lenguaje natural',
      'Respuestas contextuales desde Teams/Office'
    ],
    value: 'Acceso conversacional a documentos empresariales desde Microsoft 365',
    example: 'Preguntar en Teams: "últimas facturas del proveedor X" y obtener respuesta directa'
  }
}

export const STORAGE_INFO = {
  online: {
    included: '10 GB por usuario completo (Nominal o Concurrente)',
    readonly: 'Usuarios de solo lectura no aportan almacenamiento',
    example: '5 nominales (50GB) + 2 concurrentes (20GB) = 70GB totales',
    expansion: 'Packs: 10GB, 100GB, 1TB',
    monitoring: 'Canon monitoriza uso mensual y añade capacidad automáticamente si es necesario, asignando siempre la franja más económica'
  },
  onpremise: {
    model: 'Almacenamiento aportado por el cliente',
    responsibility: 'Cliente gestiona capacidad, backup y disponibilidad'
  },
  suscripcion: {
    model: 'Almacenamiento aportado por el cliente',
    responsibility: 'Cliente gestiona capacidad, backup y disponibilidad'
  }
}

export const LICENSING_RULES = {
  online: {
    minimum: 'Mínimo 2 usuarios completos (2 Nominales, 2 Concurrentes o 1+1)',
    tier: 'Tramo comercial unificado 0-99 usuarios',
    scalability: 'Escalado ágil mes a mes'
  },
  onpremise: {
    tiers: [
      { range: '1-9 usuarios', name: 'Tramo 1' },
      { range: '10-24 usuarios', name: 'Tramo 2' },
      { range: '25-49 usuarios', name: 'Tramo 3' },
      { range: '50-99 usuarios', name: 'Tramo 4' },
      { range: '100+ usuarios', name: 'Tramo 5+' }
    ]
  },
  suscripcion: {
    tiers: [
      { range: '1-9 usuarios', name: 'Tramo 1' },
      { range: '10-24 usuarios', name: 'Tramo 2' },
      { range: '25-49 usuarios', name: 'Tramo 3' },
      { range: '50-99 usuarios', name: 'Tramo 4' },
      { range: '100+ usuarios', name: 'Tramo 5+' }
    ]
  }
}

// Textos estándar para secciones del documento
export const LICENSING_TEXTS = {
  intro: {
    title: 'Introducción',
    purpose: 'Este documento presenta la propuesta de licenciamiento Therefore™ diseñada específicamente para {cliente}, con el objetivo de proporcionar una solución de gestión documental que se adapte a sus necesidades operativas y estratégicas.'
  },

  approach: {
    title: 'Enfoque de la Solución',
    methodology: 'La propuesta ha sido elaborada considerando los requisitos específicos del cliente, el volumen de usuarios, los flujos de trabajo documentales y las integraciones necesarias con los sistemas existentes.'
  },

  benefits: {
    title: 'Beneficios Esperados',
    business_value: [
      'Reducción de tiempos de búsqueda y recuperación documental',
      'Automatización de procesos de captura e indexación',
      'Mejora en cumplimiento normativo y trazabilidad',
      'Reducción de costes de almacenamiento físico',
      'Mejora en colaboración y acceso a información'
    ]
  },

  next_steps: {
    title: 'Próximos Pasos',
    actions: [
      'Validación de la propuesta con los stakeholders clave',
      'Definición de plan de implantación y cronograma',
      'Configuración del entorno y migración de datos',
      'Formación de usuarios y administradores',
      'Puesta en producción y soporte continuado'
    ]
  }
}
