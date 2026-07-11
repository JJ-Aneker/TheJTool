/**
 * Banco de conocimiento para generación de respuestas de cuestionarios IT.
 * Contiene información técnica sobre Therefore™ y DOCAI para que Bedrock
 * genere respuestas precisas y contextualizadas.
 */

export const KNOWLEDGE_BASE = {
  therefore: {
    nombre: 'Therefore™ Document Management System',
    version: '2025',
    descripcion: 'Sistema de gestión documental empresarial con capacidades de workflow, captura, almacenamiento seguro e integración',

    seguridad: {
      autenticacion: {
        metodos: ['Active Directory', 'LDAP', 'Autenticación integrada de Windows', 'Usuarios locales de Therefore™'],
        mfa: 'Soporta autenticación multifactor mediante integración con proveedores SAML/OAuth',
        gestion_usuarios: 'Gestión centralizada de usuarios y grupos con permisos granulares por categoría, documento y workflow'
      },

      cifrado: {
        transito: 'TLS 1.2/1.3 para todas las comunicaciones web (Therefore™ Web Access)',
        reposo: 'Cifrado transparente de datos (TDE) en SQL Server',
        documentos: 'Almacenamiento cifrado opcional de streams de documentos'
      },

      permisos: {
        modelo: 'Control de acceso basado en roles (RBAC)',
        granularidad: 'Permisos a nivel de categoría, documento, campo, versión y workflow',
        auditoria: 'Log completo de accesos, modificaciones y descargas'
      },

      copias_seguridad: {
        bd: 'Backups automáticos de SQL Server (completo, diferencial, log)',
        documentos: 'Replicación de servidor de ficheros o almacenamiento en cloud (Azure Blob, AWS S3)',
        frecuencia: 'Configurable: diario, semanal, mensual',
        restauracion: 'Procedimientos documentados de recuperación ante desastres'
      }
    },

    infraestructura: {
      componentes: ['Therefore™ Server', 'SQL Server (base de datos)', 'Therefore™ Web Access (IIS)', 'Therefore™ Navigator (cliente Windows)'],
      alta_disponibilidad: 'Configuración en cluster de SQL Server + balanceo de carga de servidores web',
      escalabilidad: 'Arquitectura multi-tier con separación de servicios',
      almacenamiento: 'Sistema de ficheros local, SAN o almacenamiento cloud'
    },

    cumplimiento: {
      estandares: ['ISO 27001', 'RGPD/GDPR', 'SOC 2'],
      certificaciones: 'Therefore™ es certificable bajo ISO 27001 y cumple con GDPR mediante políticas de retención y derecho al olvido',
      logs: 'Auditoría completa de acciones (creación, modificación, eliminación, descarga, impresión)',
      retencion: 'Políticas configurables de retención y eliminación automática'
    },

    gestion_incidentes: {
      monitorizacion: 'Therefore™ Server incluye logs de eventos y alertas configurables',
      notificaciones: 'Email automático ante eventos críticos (errores de servidor, accesos no autorizados)',
        procedimientos: 'Documentación de respuesta ante incidentes según criticidad'
    }
  },

  docai: {
    nombre: 'DOCAI - Document Intelligence Platform',
    version: '2.0',
    descripcion: 'Plataforma de inteligencia documental con IA para clasificación automática, extracción de datos y procesamiento masivo',

    seguridad: {
      autenticacion: {
        metodos: ['OAuth 2.0', 'JWT tokens', 'API Keys'],
        mfa: 'Autenticación multifactor obligatoria para usuarios administradores',
        gestion_usuarios: 'Gestión de usuarios mediante Supabase Auth con control de roles'
      },

      cifrado: {
        transito: 'TLS 1.3 obligatorio para todas las conexiones API',
        reposo: 'Cifrado AES-256 de documentos en almacenamiento',
        claves: 'Gestión de claves mediante AWS KMS o Azure Key Vault'
      },

      procesamiento_ia: {
        modelos: 'AWS Bedrock (Claude), OpenAI GPT, modelos propios',
        datos_entrenamiento: 'No se utilizan documentos de clientes para entrenar modelos',
        privacidad: 'Procesamiento en entorno aislado, sin retención de datos sensibles'
      },

      copias_seguridad: {
        bd: 'Snapshots automáticos de Supabase (PostgreSQL)',
        documentos: 'Replicación en Supabase Storage con versionado',
        frecuencia: 'Continuo (point-in-time recovery hasta 7 días)',
        restauracion: 'Recuperación automática desde snapshots'
      }
    },

    infraestructura: {
      componentes: ['Frontend React (Vercel)', 'Backend Node.js (Render)', 'Base de datos Supabase', 'IA AWS Bedrock'],
      alta_disponibilidad: 'Desplegado en cloud con auto-scaling',
      escalabilidad: 'Serverless con escalado automático según carga',
      almacenamiento: 'Supabase Storage (S3-compatible)'
    },

    cumplimiento: {
      estandares: ['RGPD/GDPR', 'ISO 27001 (en proceso)'],
      certificaciones: 'Infraestructura cloud certificada SOC 2 y ISO 27001',
      logs: 'Auditoría completa de procesamiento IA, clasificaciones y extracciones',
      retencion: 'Eliminación automática de documentos procesados según política configurable'
    },

    capacidades_ia: {
      clasificacion: 'Clasificación automática de documentos por tipo (facturas, contratos, albaranes, etc.)',
      extraccion: 'Extracción de datos estructurados (campos clave-valor, tablas)',
      validacion: 'Validación de documentos contra reglas de negocio',
      integraciones: 'API REST para integración con Therefore™ y otros sistemas'
    }
  },

  corporativo: {
    nombre: 'Políticas Corporativas de Seguridad',

    general: {
      formacion: 'Formación anual obligatoria en ciberseguridad para todos los empleados',
      concienciacion: 'Campañas trimestrales de phishing simulado y awareness',
      politicas: 'Política de seguridad de la información actualizada anualmente y accesible en intranet',
      revisiones: 'Auditorías internas trimestrales y externas anuales'
    },

    gestion_accesos: {
      principio: 'Privilegio mínimo necesario (least privilege)',
      revision: 'Revisión trimestral de permisos de usuarios',
      revocacion: 'Revocación inmediata de accesos al finalizar contrato o cambio de rol',
      administradores: 'Doble autenticación obligatoria para cuentas privilegiadas'
    },

    red: {
      firewall: 'Firewall perimetral Fortinet con reglas restrictivas por defecto',
      segmentacion: 'Segmentación de red por VLAN (producción, desarrollo, DMZ)',
      vpn: 'Acceso remoto mediante VPN con autenticación MFA',
      ids_ips: 'Sistema de detección/prevención de intrusiones (Snort/Suricata)',
      vulnerabilidades: 'Escaneos de vulnerabilidades trimestrales con Nessus'
    },

    incidentes: {
      procedimiento: 'Procedimiento documentado de respuesta ante incidentes (SANS)',
      equipo: 'Equipo de respuesta ante incidentes (CSIRT) disponible 24/7',
      notificacion: 'Notificación obligatoria de brechas de seguridad en <72h según GDPR',
      registro: 'Registro centralizado de incidentes y acciones correctivas'
    },

    continuidad: {
      plan_dr: 'Plan de recuperación ante desastres actualizado anualmente',
      rpo_rto: 'RPO: 1 hora, RTO: 4 horas para sistemas críticos',
      pruebas: 'Pruebas de recuperación semestrales',
      backup_offsite: 'Copias de seguridad en ubicación geográfica separada'
    }
  }
};

/**
 * Obtiene el contexto relevante del banco de conocimiento según el producto.
 */
export function getProductContext(productoAfectado) {
  const producto = productoAfectado?.toLowerCase() || 'therefore';

  if (producto.includes('therefore')) {
    return KNOWLEDGE_BASE.therefore;
  } else if (producto.includes('docai')) {
    return KNOWLEDGE_BASE.docai;
  } else if (producto.includes('corporativo')) {
    return KNOWLEDGE_BASE.corporativo;
  } else {
    // Mixto o desconocido: devolver resumen de ambos
    return {
      therefore: KNOWLEDGE_BASE.therefore,
      docai: KNOWLEDGE_BASE.docai,
      corporativo: KNOWLEDGE_BASE.corporativo
    };
  }
}

/**
 * Genera el prompt con contexto enriquecido del banco de conocimiento.
 */
export function buildEnrichedPrompt(pregunta, contexto) {
  const productContext = getProductContext(contexto.producto_afectado);

  // Detectar categoría de la pregunta para añadir contexto específico
  const categorias = {
    autenticacion: ['autenticación', 'autenticacion', 'login', 'contraseña', 'password', 'mfa', 'multifactor'],
    cifrado: ['cifrado', 'encriptación', 'encryption', 'tls', 'ssl', 'https'],
    permisos: ['permisos', 'acceso', 'autorización', 'autorizacion', 'roles'],
    backup: ['backup', 'copia', 'seguridad', 'restauración', 'restauracion', 'recovery'],
    red: ['firewall', 'red', 'network', 'vpn', 'segmentación', 'segmentacion'],
    incidentes: ['incidente', 'brecha', 'breach', 'vulnerabilidad', 'patch'],
    auditoria: ['auditoría', 'auditoria', 'log', 'trazabilidad', 'registro']
  };

  let contextInfo = '';
  const preguntaLower = (pregunta.texto_pregunta + ' ' + (pregunta.seccion || '')).toLowerCase();

  for (const [categoria, keywords] of Object.entries(categorias)) {
    if (keywords.some(kw => preguntaLower.includes(kw))) {
      if (typeof productContext === 'object' && productContext.seguridad?.[categoria]) {
        contextInfo = JSON.stringify(productContext.seguridad[categoria], null, 2);
      }
      break;
    }
  }

  return `Eres un experto en seguridad IT y sistemas de gestión documental.

CONTEXTO DEL PRODUCTO:
${contexto.producto_afectado || 'Therefore™ Document Management System'}

INFORMACIÓN TÉCNICA RELEVANTE:
${contextInfo || 'Sistema empresarial de gestión documental con seguridad certificable ISO 27001'}

CLIENTE: ${contexto.cliente}
FORMULARIO: ${contexto.nombre_formulario}
SECCIÓN: ${pregunta.seccion || 'General'}

PREGUNTA:
${pregunta.texto_pregunta}

INSTRUCCIONES:
- Responde de forma técnica, precisa y profesional
- Máximo 2-3 frases (150 palabras)
- Si es Sí/No, responde claramente y añade cómo se implementa
- Usa terminología específica del producto cuando sea relevante
- Si mencionas versiones, usa "2025" para Therefore™ y "2.0" para DOCAI
- Enfócate en características reales del producto según el contexto técnico proporcionado

RESPUESTA:`;
}
