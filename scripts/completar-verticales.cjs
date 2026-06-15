/**
 * Script para completar todas las fichas de verticales con información detallada
 * Ejecutar: node scripts/completar-verticales.js
 */

const VERTICALES_COMPLETOS = {
  evolutivo: {
    herramientas_recomendadas: [
      'Therefore™ Solution Designer',
      'Therefore™ Workflow Designer',
      'SQL Server Management Studio',
      'Therefore™ Web Access',
      'Postman (testing API)',
      'Git (control de versiones)',
      'Visual Studio Code'
    ],
    ejemplo_workflows: [
      {
        nombre: 'WF Solicitud de Cambio',
        descripcion: 'Flujo de aprobación de change requests',
        tipo: 'automatico',
        etapas: ['Recepción CR', 'Análisis técnico', 'Aprobación manager', 'Desarrollo', 'Testing UAT', 'Despliegue']
      },
      {
        nombre: 'WF Escalado por Vencimiento',
        descripcion: 'Escalado automático si no hay respuesta en plazo',
        tipo: 'automatico',
        etapas: ['Inicio', 'Espera respuesta (5 días)', 'Escalado a superior', 'Espera respuesta (3 días)', 'Escalado a dirección']
      }
    ],
    integraciones_comunes: [
      'API REST de Therefore™ para consultas externas',
      'Webhooks para notificaciones en tiempo real',
      'Integración con Active Directory (usuarios)',
      'Export/Import masivo mediante XML',
      'Reportes custom mediante SQL queries'
    ],
    procesos_clave: [
      'Análisis de impacto sobre configuración existente',
      'Backup completo antes de cambios',
      'Testing en categorías de prueba',
      'Migración de datos si aplica',
      'Documentación de cambios realizados',
      'UAT con usuarios clave'
    ],
    integraciones_usuario: [
      'Portal web personalizado para seguimiento de CRs',
      'Notificaciones por email automáticas',
      'Dashboard de métricas en tiempo real'
    ]
  },

  facturas: {
    herramientas_recomendadas: [
      'Therefore™ Smart Capture (IA extracción)',
      'Therefore™ Workflow Designer',
      'Therefore™ Solution Designer',
      'SQL Server para tablas maestras',
      'Power BI / Tableau (reporting)',
      'API ERP del cliente (SAP/SAGE/Navision)'
    ],
    integraciones_comunes: [
      'ERP (exportación facturas aprobadas vía JSON/XML)',
      'Email Gateway (recepción facturas por correo)',
      'OCR/IA Smart Capture (extracción automática)',
      'Active Directory (validación aprobadores)',
      'Sistema de firmas electrónicas (validación)'
    ],
    procesos_clave: [
      'Recepción de factura (email/scan/web)',
      'Extracción automática de datos con Smart Capture',
      'Validación contra tablas maestras (proveedor, CECO)',
      'Enrutamiento workflow según importe/sociedad',
      'Aprobación jerárquica',
      'Generación fichero para ERP',
      'Archivo digital con trazabilidad completa'
    ],
    integraciones_usuario: [
      'Portal web de consulta de facturas',
      'App móvil para aprobaciones',
      'Dashboard financiero con KPIs',
      'Alertas por email en cada transición'
    ]
  },

  generico: {
    titulo: 'Proyecto Therefore™ Genérico',
    descripcion_intro: 'Plantilla base para proyectos Therefore™ sin vertical específico. Incluye buenas prácticas, estructura básica de categorías y workflows estándar configurables según necesidades del cliente.',
    descripcion_implementacion: 'Implementación estándar de Therefore™ con configuración adaptable. Incluye categorías base, workflows básicos y estructura de tablas maestras genéricas.',
    claves: [
      'Arquitectura flexible adaptable a múltiples casos de uso',
      'Configuración base siguiendo mejores prácticas Therefore™',
      'Workflows estándar (solicitud, aprobación, archivo)',
      'Tablas maestras genéricas configurables',
      'Integración API REST estándar'
    ],
    premisas_especificas: [
      'El alcance se define en detalle durante fase de análisis',
      'Categorías y campos se ajustan según necesidades del cliente',
      'Workflows se personalizan post-implementación inicial'
    ],
    tablas_maestras: [
      'Estados de Documento',
      'Tipos de Documento',
      'Departamentos',
      'Usuarios y Roles'
    ],
    herramientas_recomendadas: [
      'Therefore™ Solution Designer',
      'Therefore™ Workflow Designer',
      'Therefore™ Navigator',
      'SQL Server Management Studio'
    ],
    ejemplo_workflows: [
      {
        nombre: 'WF Solicitud Genérica',
        descripcion: 'Flujo de solicitud-aprobación básico',
        tipo: 'automatico',
        etapas: ['Nueva solicitud', 'Revisión', 'Aprobación', 'Implementación', 'Cerrado']
      },
      {
        nombre: 'WF Archivo Simple',
        descripcion: 'Flujo de archivo documental básico',
        tipo: 'automatico',
        etapas: ['Recepción', 'Clasificación', 'Indexación', 'Archivo']
      }
    ],
    integraciones_comunes: [
      'API REST Therefore™',
      'Active Directory',
      'Email notifications',
      'Export/Import XML'
    ],
    casos_prueba_tipicos: [
      'Crear documento y asignar a usuario',
      'Transitar por workflow completo',
      'Búsqueda por campos indexados',
      'Export masivo de documentos'
    ],
    criterios_aceptacion: [
      'Categorías correctamente configuradas',
      'Workflows funcionales',
      'Búsquedas devuelven resultados',
      'Permisos por rol funcionan correctamente'
    ],
    modulos_funcionales: [
      'Gestión documental básica',
      'Workflows de tramitación',
      'Búsqueda y consulta',
      'Administración de usuarios'
    ],
    procesos_clave: [
      'Análisis de requisitos con cliente',
      'Diseño de arquitectura documental',
      'Configuración de categorías y campos',
      'Diseño de workflows',
      'Testing y UAT',
      'Formación usuarios'
    ],
    integraciones_usuario: [
      'Web Access para consulta',
      'Navigator para gestión',
      'Email notifications'
    ]
  },

  hr: {
    herramientas_recomendadas: [
      'Therefore™ Solution Designer',
      'Therefore™ Workflow Designer',
      'Therefore™ Smart Capture (IA)',
      'SQL Server Management Studio',
      'Power BI (HR analytics)',
      'API HRIS (Workday/SAP SuccessFactors)'
    ],
    integraciones_comunes: [
      'HRIS corporativo (importación empleados)',
      'Active Directory (sincronización usuarios)',
      'Portal del empleado (self-service)',
      'Email Gateway (notificaciones)',
      'Sistema de firma electrónica (contratos)',
      'Sistema de nómina (datos salariales)'
    ],
    procesos_clave: [
      'Onboarding de nuevo empleado',
      'Gestión de expediente personal',
      'Tramitación de ausencias/vacaciones',
      'Gestión de formación',
      'Evaluaciones de desempeño',
      'Proceso de baja (offboarding)',
      'Gestión documental legal (contratos, nóminas)'
    ],
    integraciones_usuario: [
      'Portal empleado (consulta expediente, solicitud vacaciones)',
      'App móvil RR.HH.',
      'Dashboard directivos con métricas HR',
      'Self-service para documentos personales'
    ]
  },

  notifapp: {
    herramientas_recomendadas: [
      'Therefore™ Solution Designer',
      'Therefore™ Workflow Designer',
      'IVNEOS Plataforma (recepción notificaciones)',
      'Therefore™ Smart Capture (extracción)',
      'SQL Server Management Studio',
      'API cl@ve / Carpeta Ciudadana',
      'Certificado digital corporativo'
    ],
    integraciones_comunes: [
      'IVNEOS (recepción automática notificaciones)',
      'Cl@ve / Carpeta Ciudadana',
      'Plataformas notificación autonómicas',
      'Sistema ERP (asociación expedientes)',
      'Email Gateway (alertas equipo)',
      'Sistema firma electrónica (alegaciones)',
      'Portal web (consulta notificaciones)'
    ],
    procesos_clave: [
      'Recepción automática notificación desde AAPP',
      'Extracción datos (órgano, fecha, plazo)',
      'Clasificación por tipo de notificación',
      'Asignación automática a responsable',
      'Workflow tramitación (alegación/aceptación)',
      'Control de plazos con alertas',
      'Archivo digital con trazabilidad completa'
    ],
    integraciones_usuario: [
      'Portal consulta notificaciones',
      'Dashboard con alertas de plazos',
      'App móvil para notificaciones urgentes',
      'Email diario resumen pendientes'
    ]
  },

  sage: {
    herramientas_recomendadas: [
      'Therefore™ Solution Designer',
      'Therefore™ Workflow Designer',
      'SAGE X3 Web Services API',
      'SQL Server Management Studio',
      'Postman (testing API)',
      'Visual Studio (desarrollo custom)',
      'Therefore™ .NET SDK'
    ],
    integraciones_comunes: [
      'SAGE X3 Web Services (bidireccional)',
      'SAGE X3 Base de datos (consultas)',
      'Therefore™ API REST',
      'Active Directory (usuarios)',
      'Email Gateway (notificaciones)',
      'SFTP (intercambio ficheros)'
    ],
    procesos_clave: [
      'Sincronización maestros (clientes, proveedores, artículos)',
      'Asociación documentos a entidades SAGE',
      'Workflow aprobación documentos con impacto contable',
      'Exportación documentos aprobados a SAGE',
      'Trazabilidad bidireccional (SAGE ↔ Therefore)',
      'Gestión documental de facturas, albaranes, pedidos'
    ],
    integraciones_usuario: [
      'Widget Therefore™ dentro de SAGE X3',
      'Consulta documentos desde SAGE',
      'Upload directo desde pantallas SAGE',
      'Dashboard unificado SAGE + Therefore'
    ]
  }
};

// Configurar Supabase
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ljuklgqimsugfyvnnxej.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqdWtsZ3FpbXN1Z2Z5dm5ueGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyMzY1NTcsImV4cCI6MjA0ODgxMjU1N30.UGOjHDHwUToCGnMqLrSLcFPDKHrBqIwQ-_PGVFK3TLk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function completarVerticales() {
  console.log('🚀 Iniciando actualización de verticales...\n');

  for (const [nombre, datos] of Object.entries(VERTICALES_COMPLETOS)) {
    try {
      console.log(`📝 Actualizando vertical: ${nombre}`);

      // Buscar el vertical por nombre
      const { data: existente, error: errorBusqueda } = await supabase
        .from('verticales')
        .select('*')
        .eq('nombre', nombre)
        .single();

      if (errorBusqueda) {
        console.log(`   ⚠️  No encontrado: ${nombre} - ${errorBusqueda.message}`);
        continue;
      }

      // Preparar datos para actualizar (merge con existentes)
      const datosActualizados = {
        ...datos,
        // Mantener datos existentes si no están en el update
        titulo: datos.titulo || existente.titulo,
        descripcion_intro: datos.descripcion_intro || existente.descripcion_intro,
        descripcion_implementacion: datos.descripcion_implementacion || existente.descripcion_implementacion,
        claves: datos.claves || existente.claves || [],
        premisas_especificas: datos.premisas_especificas || existente.premisas_especificas || [],
        tablas_maestras: datos.tablas_maestras || existente.tablas_maestras || [],
        // Actualizar campos vacíos
        herramientas_recomendadas: datos.herramientas_recomendadas || existente.herramientas_recomendadas || [],
        ejemplo_workflows: datos.ejemplo_workflows || existente.ejemplo_workflows || [],
        integraciones_comunes: datos.integraciones_comunes || existente.integraciones_comunes || [],
        casos_prueba_tipicos: datos.casos_prueba_tipicos || existente.casos_prueba_tipicos || [],
        criterios_aceptacion: datos.criterios_aceptacion || existente.criterios_aceptacion || [],
        modulos_funcionales: datos.modulos_funcionales || existente.modulos_funcionales || [],
        procesos_clave: datos.procesos_clave || existente.procesos_clave || [],
        integraciones_usuario: datos.integraciones_usuario || existente.integraciones_usuario || [],
        updated_at: new Date().toISOString()
      };

      // Actualizar
      const { error: errorUpdate } = await supabase
        .from('verticales')
        .update(datosActualizados)
        .eq('id', existente.id);

      if (errorUpdate) {
        console.log(`   ❌ Error: ${errorUpdate.message}`);
      } else {
        console.log(`   ✅ Actualizado correctamente`);
        console.log(`      - Workflows: ${datosActualizados.ejemplo_workflows?.length || 0}`);
        console.log(`      - Herramientas: ${datosActualizados.herramientas_recomendadas?.length || 0}`);
        console.log(`      - Integraciones: ${datosActualizados.integraciones_comunes?.length || 0}`);
        console.log(`      - Procesos: ${datosActualizados.procesos_clave?.length || 0}`);
      }

    } catch (error) {
      console.log(`   ❌ Error inesperado: ${error.message}`);
    }

    console.log('');
  }

  console.log('✅ Proceso completado!');
}

// Ejecutar
completarVerticales()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });
