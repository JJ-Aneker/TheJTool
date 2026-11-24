-- ══════════════════════════════════════════════════════════════════════════════
-- SCRIPT: Completar información de verticales
-- Ejecutar en: Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- 1. VERTICAL: evolutivo (METODOLOGÍA GENÉRICA - NO DOMINIO ESPECÍFICO)
-- ────────────────────────────────────────────────────────────────────────────
-- NOTA: Los evolutivos aplican sobre CUALQUIER proyecto existente.
-- El dominio concreto (facturas, hr, etc.) se detalla en "Información Adicional"
UPDATE verticales SET
    herramientas_recomendadas = ARRAY[
        'Therefore™ Solution Designer',
        'Therefore™ Workflow Designer',
        'SQL Server Management Studio',
        'Therefore™ Web Access',
        'Therefore™ Navigator',
        'Git (control de versiones de configuración)',
        'Visual Studio Code / SQL Server Data Tools'
    ],
    ejemplo_workflows = '[
        {
            "nombre": "WF Genérico de Validación",
            "descripcion": "Flujo adaptable de validación/aprobación de cambios (el alcance concreto se define en Info Adicional)",
            "tipo": "automatico",
            "etapas": ["Registro", "Análisis técnico", "Validación funcional", "Aprobación", "Implementación", "Cierre"]
        },
        {
            "nombre": "WF Control de Cambios",
            "descripcion": "Workflow de seguimiento de change requests sobre sistema existente",
            "tipo": "automatico",
            "etapas": ["Nueva solicitud", "Análisis impacto", "Aprobación", "Planificación", "Ejecución", "Testing", "Aceptación UAT"]
        }
    ]'::jsonb,
    integraciones_comunes = ARRAY[
        'API REST de Therefore™ (consultas/modificaciones)',
        'Backup automático pre-cambios',
        'Sistema de control de versiones (Git para configs)',
        'Herramientas de testing (Postman, scripts SQL)',
        'Notificaciones email (alertas de cambios)'
    ],
    procesos_clave = ARRAY[
        'Análisis detallado del alcance del evolutivo (qué cambia exactamente)',
        'Evaluación de impacto sobre configuración y datos existentes',
        'Backup completo del entorno antes de intervenir',
        'Testing exhaustivo en entorno de pruebas (si existe)',
        'Validación con usuarios clave (UAT)',
        'Documentación técnica de cambios realizados',
        'Plan de rollback en caso de incidencias'
    ],
    integraciones_usuario = ARRAY[
        'Según el dominio del proyecto base (se define en Info Adicional)',
        'Notificaciones automáticas por cambios',
        'Acceso web/navegador a funcionalidad modificada'
    ],
    updated_at = NOW()
WHERE nombre = 'evolutivo';

-- ────────────────────────────────────────────────────────────────────────────
-- 2. VERTICAL: facturas
-- ────────────────────────────────────────────────────────────────────────────
UPDATE verticales SET
    herramientas_recomendadas = ARRAY[
        'Therefore™ Smart Capture (IA extracción)',
        'Therefore™ Workflow Designer',
        'Therefore™ Solution Designer',
        'SQL Server para tablas maestras',
        'Power BI / Tableau (reporting)',
        'API ERP del cliente (SAP/SAGE/Navision)'
    ],
    integraciones_comunes = ARRAY[
        'ERP (exportación facturas aprobadas vía JSON/XML)',
        'Email Gateway (recepción facturas por correo)',
        'OCR/IA Smart Capture (extracción automática)',
        'Active Directory (validación aprobadores)',
        'Sistema de firmas electrónicas (validación)'
    ],
    procesos_clave = ARRAY[
        'Recepción de factura (email/scan/web)',
        'Extracción automática de datos con Smart Capture',
        'Validación contra tablas maestras (proveedor, CECO)',
        'Enrutamiento workflow según importe/sociedad',
        'Aprobación jerárquica',
        'Generación fichero para ERP',
        'Archivo digital con trazabilidad completa'
    ],
    integraciones_usuario = ARRAY[
        'Portal web de consulta de facturas',
        'App móvil para aprobaciones',
        'Dashboard financiero con KPIs',
        'Alertas por email en cada transición'
    ],
    updated_at = NOW()
WHERE nombre = 'facturas';

-- ────────────────────────────────────────────────────────────────────────────
-- 3. VERTICAL: generico
-- ────────────────────────────────────────────────────────────────────────────
UPDATE verticales SET
    titulo = 'Proyecto Therefore™ Genérico',
    descripcion_intro = 'Plantilla base para proyectos Therefore™ sin vertical específico. Incluye buenas prácticas, estructura básica de categorías y workflows estándar configurables según necesidades del cliente.',
    descripcion_implementacion = 'Implementación estándar de Therefore™ con configuración adaptable. Incluye categorías base, workflows básicos y estructura de tablas maestras genéricas.',
    claves = ARRAY[
        'Arquitectura flexible adaptable a múltiples casos de uso',
        'Configuración base siguiendo mejores prácticas Therefore™',
        'Workflows estándar (solicitud, aprobación, archivo)',
        'Tablas maestras genéricas configurables',
        'Integración API REST estándar'
    ],
    premisas_especificas = ARRAY[
        'El alcance se define en detalle durante fase de análisis',
        'Categorías y campos se ajustan según necesidades del cliente',
        'Workflows se personalizan post-implementación inicial'
    ],
    tablas_maestras = ARRAY[
        'Estados de Documento',
        'Tipos de Documento',
        'Departamentos',
        'Usuarios y Roles'
    ],
    herramientas_recomendadas = ARRAY[
        'Therefore™ Solution Designer',
        'Therefore™ Workflow Designer',
        'Therefore™ Navigator',
        'SQL Server Management Studio'
    ],
    ejemplo_workflows = '[
        {
            "nombre": "WF Solicitud Genérica",
            "descripcion": "Flujo de solicitud-aprobación básico",
            "tipo": "automatico",
            "etapas": ["Nueva solicitud", "Revisión", "Aprobación", "Implementación", "Cerrado"]
        },
        {
            "nombre": "WF Archivo Simple",
            "descripcion": "Flujo de archivo documental básico",
            "tipo": "automatico",
            "etapas": ["Recepción", "Clasificación", "Indexación", "Archivo"]
        }
    ]'::jsonb,
    integraciones_comunes = ARRAY[
        'API REST Therefore™',
        'Active Directory',
        'Email notifications',
        'Export/Import XML'
    ],
    casos_prueba_tipicos = ARRAY[
        'Crear documento y asignar a usuario',
        'Transitar por workflow completo',
        'Búsqueda por campos indexados',
        'Export masivo de documentos'
    ],
    criterios_aceptacion = ARRAY[
        'Categorías correctamente configuradas',
        'Workflows funcionales',
        'Búsquedas devuelven resultados',
        'Permisos por rol funcionan correctamente'
    ],
    modulos_funcionales = ARRAY[
        'Gestión documental básica',
        'Workflows de tramitación',
        'Búsqueda y consulta',
        'Administración de usuarios'
    ],
    procesos_clave = ARRAY[
        'Análisis de requisitos con cliente',
        'Diseño de arquitectura documental',
        'Configuración de categorías y campos',
        'Diseño de workflows',
        'Testing y UAT',
        'Formación usuarios'
    ],
    integraciones_usuario = ARRAY[
        'Web Access para consulta',
        'Navigator para gestión',
        'Email notifications'
    ],
    updated_at = NOW()
WHERE nombre = 'generico';

-- ────────────────────────────────────────────────────────────────────────────
-- 4. VERTICAL: hr
-- ────────────────────────────────────────────────────────────────────────────
UPDATE verticales SET
    herramientas_recomendadas = ARRAY[
        'Therefore™ Solution Designer',
        'Therefore™ Workflow Designer',
        'Therefore™ Smart Capture (IA)',
        'SQL Server Management Studio',
        'Power BI (HR analytics)',
        'API HRIS (Workday/SAP SuccessFactors)'
    ],
    integraciones_comunes = ARRAY[
        'HRIS corporativo (importación empleados)',
        'Active Directory (sincronización usuarios)',
        'Portal del empleado (self-service)',
        'Email Gateway (notificaciones)',
        'Sistema de firma electrónica (contratos)',
        'Sistema de nómina (datos salariales)'
    ],
    procesos_clave = ARRAY[
        'Onboarding de nuevo empleado',
        'Gestión de expediente personal',
        'Tramitación de ausencias/vacaciones',
        'Gestión de formación',
        'Evaluaciones de desempeño',
        'Proceso de baja (offboarding)',
        'Gestión documental legal (contratos, nóminas)'
    ],
    integraciones_usuario = ARRAY[
        'Portal empleado (consulta expediente, solicitud vacaciones)',
        'App móvil RR.HH.',
        'Dashboard directivos con métricas HR',
        'Self-service para documentos personales'
    ],
    updated_at = NOW()
WHERE nombre = 'hr';

-- ────────────────────────────────────────────────────────────────────────────
-- 5. VERTICAL: notifapp
-- ────────────────────────────────────────────────────────────────────────────
UPDATE verticales SET
    herramientas_recomendadas = ARRAY[
        'Therefore™ Solution Designer',
        'Therefore™ Workflow Designer',
        'IVNEOS Plataforma (recepción notificaciones)',
        'Therefore™ Smart Capture (extracción)',
        'SQL Server Management Studio',
        'API cl@ve / Carpeta Ciudadana',
        'Certificado digital corporativo'
    ],
    integraciones_comunes = ARRAY[
        'IVNEOS (recepción automática notificaciones)',
        'Cl@ve / Carpeta Ciudadana',
        'Plataformas notificación autonómicas',
        'Sistema ERP (asociación expedientes)',
        'Email Gateway (alertas equipo)',
        'Sistema firma electrónica (alegaciones)',
        'Portal web (consulta notificaciones)'
    ],
    procesos_clave = ARRAY[
        'Recepción automática notificación desde AAPP',
        'Extracción datos (órgano, fecha, plazo)',
        'Clasificación por tipo de notificación',
        'Asignación automática a responsable',
        'Workflow tramitación (alegación/aceptación)',
        'Control de plazos con alertas',
        'Archivo digital con trazabilidad completa'
    ],
    integraciones_usuario = ARRAY[
        'Portal consulta notificaciones',
        'Dashboard con alertas de plazos',
        'App móvil para notificaciones urgentes',
        'Email diario resumen pendientes'
    ],
    updated_at = NOW()
WHERE nombre = 'notifapp';

-- ────────────────────────────────────────────────────────────────────────────
-- 6. VERTICAL: sage
-- ────────────────────────────────────────────────────────────────────────────
UPDATE verticales SET
    herramientas_recomendadas = ARRAY[
        'Therefore™ Solution Designer',
        'Therefore™ Workflow Designer',
        'SAGE X3 Web Services API',
        'SQL Server Management Studio',
        'Postman (testing API)',
        'Visual Studio (desarrollo custom)',
        'Therefore™ .NET SDK'
    ],
    integraciones_comunes = ARRAY[
        'SAGE X3 Web Services (bidireccional)',
        'SAGE X3 Base de datos (consultas)',
        'Therefore™ API REST',
        'Active Directory (usuarios)',
        'Email Gateway (notificaciones)',
        'SFTP (intercambio ficheros)'
    ],
    procesos_clave = ARRAY[
        'Sincronización maestros (clientes, proveedores, artículos)',
        'Asociación documentos a entidades SAGE',
        'Workflow aprobación documentos con impacto contable',
        'Exportación documentos aprobados a SAGE',
        'Trazabilidad bidireccional (SAGE ↔ Therefore)',
        'Gestión documental de facturas, albaranes, pedidos'
    ],
    integraciones_usuario = ARRAY[
        'Widget Therefore™ dentro de SAGE X3',
        'Consulta documentos desde SAGE',
        'Upload directo desde pantallas SAGE',
        'Dashboard unificado SAGE + Therefore'
    ],
    updated_at = NOW()
WHERE nombre = 'sage';

-- ══════════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN
-- ══════════════════════════════════════════════════════════════════════════════
SELECT
    nombre,
    titulo,
    array_length(herramientas_recomendadas, 1) as num_herramientas,
    jsonb_array_length(ejemplo_workflows) as num_workflows,
    array_length(integraciones_comunes, 1) as num_integraciones,
    array_length(procesos_clave, 1) as num_procesos
FROM verticales
ORDER BY nombre;
