// api/_lib/knowledge/verticales.js
// Estructuras específicas por vertical Therefore™

export const VERTICALES = {

  // ── NOTIFAPP — GESTIÓN DE NOTIFICACIONES AAPP ────────────────────────────
  notifapp: {
    nombre: 'Gestión de Notificaciones de Administraciones Públicas',
    subtitulo: 'Digital notificaciones',
    descripcion_intro: `El proyecto tiene como objetivo implementar un sistema centralizado de recepción, clasificación y tramitación de notificaciones procedentes de organismos públicos, sustituyendo el proceso actual basado en acceso manual a plataformas de la Administración.`,
    claves: [
      'Recepción automatizada mediante Content Connector conectado a la plataforma de notificaciones electrónicas.',
      'Clasificación automática por organismo emisor y tipo de notificación (Dispatching Room).',
      'Flujo de trabajo de tramitación con asignación de equipos, plazos y escalado automático.',
      'Trazabilidad completa del estado de cada notificación (recibida, en tramitación, resuelta, caducada).',
      'Panel de control con alertas de vencimiento y consultas de categoría cruzada.',
    ],
    estructura: {
      tipo: 'tripartita',
      bloques: [
        {
          nombre: 'Documentación del Servicio',
          descripcion: 'Manuales, procedimientos y comunicaciones clave para la ejecución del servicio, disponibles para operadores y responsables.',
          categorias: ['Documentación del Servicio', 'Auditorías WF'],
        },
        {
          nombre: 'Máster Data (Tablas Maestras)',
          descripcion: 'Tablas de referencia que parametrizan el sistema. Su correcta actualización es esencial para el funcionamiento del servicio.',
          tablas: [
            { nombre: 'Estados de Notificación', campos: ['Estado_ID', 'Descripción Estado'] },
            { nombre: 'Tipos de Notificación',   campos: ['TipoNotificacion_ID', 'Descripción'] },
            { nombre: 'Usuarios del Servicio',    campos: ['Usuario_ID', 'Nombre', 'Email', 'Zona'] },
            { nombre: 'Equipos de Tramitación',   campos: ['Zona_ID', 'Zona_Descripcion', 'Zona_Responsable', 'Email_Responsable'] },
            { nombre: 'Sociedades',               campos: ['CIF', 'Nombre Sociedad', 'url_logo'] },
            { nombre: 'Organismos Emisores',      campos: ['Org_ID', 'Org_nombre', 'Org_Tipo', 'Org_URL'] },
          ],
        },
        {
          nombre: 'Registros de Operación',
          descripcion: 'Categorías documentales donde se registran y tramitan las notificaciones recibidas.',
          categorias: ['Notificaciones (Dispatching Room)', 'Categorías Destino por Zona/Equipo'],
        },
      ],
      campos_notificacion: [
        { campo: 'ID Notificación',        tipo: 'Texto',  desc: 'Identificador único en la plataforma AAPP' },
        { campo: 'Organismo Emisor',       tipo: 'Lista',  desc: 'Referencia a tabla maestra de organismos' },
        { campo: 'Tipo de Notificación',   tipo: 'Lista',  desc: 'Clasificación del acto administrativo' },
        { campo: 'Fecha de Recepción',     tipo: 'Fecha',  desc: 'Fecha y hora de entrada en el sistema' },
        { campo: 'Fecha Límite',           tipo: 'Fecha',  desc: 'Plazo máximo de respuesta o acuse' },
        { campo: 'Fecha de Aviso Previo',  tipo: 'Fecha',  desc: 'Alerta configurable antes del vencimiento' },
        { campo: 'Estado',                 tipo: 'Lista',  desc: 'Recibida / En tramitación / Resuelta / Caducada' },
        { campo: 'Equipo de Tramitación',  tipo: 'Lista',  desc: 'Referencia a tabla maestra de equipos' },
        { campo: 'CIF Sociedad',           tipo: 'Texto',  desc: 'Entidad destinataria de la notificación' },
        { campo: 'Asunto',                 tipo: 'Texto',  desc: 'Descripción del asunto' },
        { campo: 'Número de Expediente',   tipo: 'Texto',  desc: 'Referencia interna vinculada al expediente' },
        { campo: 'Comentarios',            tipo: 'Texto',  desc: 'Observaciones del tramitador' },
      ],
    },
    workflows: [
      {
        nombre: 'WF Asignación de Equipo de Tramitación',
        descripcion: 'Flujo automático activado en recepción. Analiza organismo y tipo de notificación para asignar automáticamente el equipo responsable y notificar por email al responsable de zona.',
        tipo: 'automatico',
        etapas: ['Recepción notificación', 'Análisis organismo y tipo', 'Asignación equipo', 'Notificación email responsable', 'Traslado a categoría destino'],
      },
      {
        nombre: 'WF Tramitación (Dispatching Room)',
        descripcion: 'Flujo principal de gestión. Incluye clasificación, asignación a tramitador, acción, escalado automático por vencimiento y cierre con registro.',
        tipo: 'manual_automatico',
        etapas: ['Recepción y validación', 'Asignación tramitador', 'Revisión y acción', 'Escalado automático (80% plazo)', 'Cierre y archivo'],
      },
    ],
    premisas_especificas: [
      { premisa: 'Acceso API AAPP',  descripcion: 'El cliente facilita acceso y documentación de la API de notificaciones electrónicas.', impacto: 'Alto' },
      { premisa: 'Datos maestros',   descripcion: 'El cliente proporcionará listados de organismos y tipos en formato Excel.', impacto: 'Medio' },
      { premisa: 'Un único CIF',     descripcion: 'La solución se configurará para una única entidad jurídica inicialmente.', impacto: 'Medio' },
    ],
  },

  // ── HR — GESTIÓN DE EXPEDIENTES DE EMPLEADOS ──────────────────────────────
  hr: {
    nombre: 'Gestión de Expedientes de Empleados',
    subtitulo: 'Digital HR',
    descripcion_intro: `El proyecto tiene como objetivo digitalizar y centralizar el expediente documental de cada empleado en Therefore™, eliminando el archivo físico y los repositorios dispersos, garantizando el control de acceso por perfil y la trazabilidad de cada documento a lo largo del ciclo de vida del empleado.`,
    claves: [
      'Expediente digital centralizado por empleado, desde la incorporación hasta la desvinculación.',
      'Estructura modular de 12 categorías documentales temáticas heredadas del expediente.',
      'Automatización de procesos: onboarding, generación de contratos, firma digital y publicación al empleado.',
      'Tablas maestras corporativas: áreas, departamentos, HRBP, managers, centros de coste.',
      'Control de vencimientos automático para documentos con fecha de caducidad.',
    ],
    tablas_maestras: [
      { nombre: 'Empresas/Sociedades',     campos: ['CIF', 'Razón Social', 'url_logo'] },
      { nombre: 'Áreas',                   campos: ['Área ID', 'Área Alias', 'Descripción', 'Director', 'Controller', 'HRBP'] },
      { nombre: 'Departamentos',           campos: ['ID Departamento', 'Descripción', 'ID Área', 'Director', 'Controller', 'HRBP'] },
      { nombre: 'Directores',              campos: ['ID Empleado', 'Nombre', 'eMail'] },
      { nombre: 'HRBP',                    campos: ['ID Empleado', 'Nombre', 'eMail'] },
      { nombre: 'Controllers Financieros', campos: ['ID Empleado', 'Nombre', 'eMail'] },
      { nombre: 'Managers',                campos: ['ID Empleado', 'Nombre', 'eMail'] },
      { nombre: 'Centros de Coste (CECO)', campos: ['Centro de Coste', 'Descripción CECO', 'Área', 'Controller', 'Director', 'HRBP'] },
      { nombre: 'Centros de Trabajo',      campos: ['ID Centro', 'Código', 'Descripción', 'Dirección', 'Localidad', 'CP', 'Provincia'] },
      { nombre: 'Convenios',               campos: ['Convenio ID', 'Convenio_Desc', 'Afecta a'] },
      { nombre: 'Grupos de Cotización',    campos: ['ID Grupo', 'Grupo Cotización', 'Categoría Profesional'] },
      { nombre: 'Motivos de Contratación', campos: ['Motivo_ID', 'Motivo_Título', 'Descripción'] },
      { nombre: 'Puestos de Trabajo',      campos: ['ID Familia', 'Familia Puesto', 'Puesto de Trabajo', 'Código PRL', 'Descripción Tarea'] },
      { nombre: 'Tipos de Contrato',       campos: ['Código', 'Tipo Jornada', 'Tipo Contrato', 'Descripción'] },
      { nombre: 'Tipos de Empleado',       campos: ['Tipo de Empleado'] },
      { nombre: 'Tipos de Notificación',   campos: ['Código', 'Notification_YN', 'Descripción', 'Tratamiento'] },
      { nombre: 'Tipos de Documento',      campos: ['ID Tipo Documento', 'Activo', 'Categoría', 'Descripción (ES)', 'Criticidad', 'Requiere Publicación'] },
      { nombre: 'Textos para Comunicaciones', campos: ['ID', 'Título', 'Descripción', 'URL', 'Texto Publicación'] },
      { nombre: 'Formación / Titulaciones',campos: ['ID', 'Activo', 'Descripción'] },
    ],
    expediente_pestanas: [
      { nombre: 'Datos Personales',   desc: 'Información básica, documentación legal, dirección y contacto del empleado.' },
      { nombre: 'Organización',       desc: 'Empresa, área, departamento, manager, director, HRBP y centros de coste.' },
      { nombre: 'Contratación',       desc: 'Tipo de empleado, fechas, tipo de contrato, jornada, grupo de cotización y convenio.' },
      { nombre: 'Puesto de Trabajo',  desc: 'Puesto, familia profesional, código PRL y centro de trabajo físico.' },
      { nombre: 'Facilities',         desc: 'Suministros IT, beneficios HR y servicios generales asignados.' },
      { nombre: 'PRL',                desc: 'Autoevaluación teletrabajo, perfil preventivo y limitaciones funcionales.' },
      { nombre: 'Educación',          desc: 'Formación académica, certificaciones y acciones formativas.' },
      { nombre: 'Historial',          desc: 'Registro automático de eventos: timestamp, tipo de acción y usuario.' },
    ],
    categorias_documentales: [
      'Candidatura y Selección', 'Datos Personales', 'Vida Laboral',
      'Formación y Desarrollo', 'Datos Económicos', 'Seguridad Social e Impuestos',
      'Documentación Contractual', 'Documentación PRL', 'Documentación RGPD',
      'Documentación Normativa Empresa', 'Desvinculación Laboral / Jubilación', 'Notificaciones',
    ],
    workflows: [
      {
        nombre: 'WF On-Boarding Automático',
        descripcion: 'Proceso 100% automático activado al crear un nuevo expediente. Gestiona comunicaciones de bienvenida y seguimiento a 7, 21, 90 y 180 días desde la fecha de alta.',
        tipo: 'automatico',
        etapas: ['Alta empleado → activación', 'Mensaje bienvenida', 'Espera 7 días → recordatorio', 'Espera 21 días → evaluación primeras semanas', 'Espera 150 días → valoración primer periodo', 'Cierre automático'],
      },
      {
        nombre: 'WF Generación Automática de Documentos',
        descripcion: 'Genera documentos corporativos (contratos, formularios, certificados) combinando plantillas Word/Excel con los datos del expediente del empleado, sin intervención manual.',
        tipo: 'automatico',
        etapas: ['Inicio manual o desde otro WF', 'Carga datos expediente', 'Generación documento desde plantilla', 'Almacenamiento en categoría correspondiente', 'Cierre instancia'],
      },
      {
        nombre: 'WF Control de Vencimientos',
        descripcion: 'Verifica documentos con fecha de caducidad (DNI, permisos, certificados médicos). Genera tareas de renovación ordinaria o crítica según la configuración del documento.',
        tipo: 'automatico',
        etapas: ['Verificación fecha de validez', 'Espera hasta vencimiento', 'Evaluación criticidad', 'Solicitud renovación (ordinaria o crítica)', 'Registro en historial'],
      },
      {
        nombre: 'WF Firma Digital',
        descripcion: 'Gestiona el proceso de firma electrónica para documentos que lo requieran. Convierte a PDF, actualiza firmantes y envía al circuito de firma (Sinatura, DocuSign, Adobe Sign).',
        tipo: 'automatico',
        etapas: ['Verificación campo "Requiere Firma"', 'Conversión a PDF', 'Actualización metadatos firmantes', 'Envío a plataforma de firma', 'Cierre instancia'],
      },
      {
        nombre: 'WF Publicación al Empleado',
        descripcion: 'Automatiza la difusión de documentos al empleado cuando el tipo documental tiene activada la opción "Requiere Publicación" o el documento concreto tiene habilitado "Publicar al empleado".',
        tipo: 'automatico',
        etapas: ['Verificación condiciones de publicación', 'Generación código/contraseña temporal', 'Publicación documento', 'Registro en historial', 'Cierre instancia'],
      },
    ],
    premisas_especificas: [
      { premisa: 'Estructura documental',   descripcion: 'El cliente valida la estructura de categorías antes del inicio de la configuración.', impacto: 'Alto' },
      { premisa: 'Carga inicial histórico', descripcion: 'La migración de documentos históricos está fuera del alcance confirmado.', impacto: 'Medio' },
      { premisa: 'Integración HRIS',        descripcion: 'La integración con el sistema de RRHH (SAP, Workday, etc.) requiere análisis específico.', impacto: 'Pendiente' },
    ],
  },

  // ── FACTURAS — GESTIÓN DE FACTURAS DE PROVEEDORES ─────────────────────────
  facturas: {
    nombre: 'Gestión de Facturas de Proveedores',
    subtitulo: 'Digital facturas',
    descripcion_intro: `El proyecto tiene como objetivo automatizar la recepción, validación y archivo de facturas de proveedores mediante Therefore™, con extracción de datos por IA (Smart Capture) y flujo de aprobación jerárquico configurable.`,
    claves: [
      'Captura automática de datos de facturas mediante Smart Capture (IA) sin necesidad de plantillas.',
      'Flujo de aprobación jerárquico configurable por importe, sociedad y centro de coste.',
      'Tablas maestras de sociedades, tipos de factura, estados y jerarquía de aprobadores.',
      'Trazabilidad completa: pestaña de trazabilidad con timestamp por acción y usuario.',
      'Integración con ERP mediante fichero de intercambio JSON/XML (Therefore™ no contabiliza directamente).',
    ],
    tablas_maestras: [
      { nombre: 'Sociedades',                  campos: ['CIF', 'Nombre Sociedad', 'url_logo'] },
      { nombre: 'Tipos de Factura',            campos: ['ID Tipo', 'Descripción', 'Requiere Aprobación'] },
      { nombre: 'Estados de Factura',          campos: ['ID Estado', 'Descripción Estado'] },
      { nombre: 'Jerarquía de Aprobadores',    campos: ['ID', 'Nombre', 'eMail', 'Importe máximo', 'Sociedad', 'CECO'] },
      { nombre: 'Centros de Coste',            campos: ['CECO', 'Descripción', 'Área', 'Controller'] },
      { nombre: 'Tipos de Pago',               campos: ['ID Tipo Pago', 'Descripción'] },
    ],
    categoria_factura_pestanas: [
      { nombre: 'Cabecera',          desc: 'Datos principales: proveedor, número factura, fecha, sociedad, importe, tipo.' },
      { nombre: 'Importes',          desc: 'Desglose de base imponible, IVA, retenciones e importe total.' },
      { nombre: 'Registros ERP',     desc: 'Estado de integración con ERP y referencia del registro generado.' },
      { nombre: 'Trazabilidad',      desc: 'Historial de acciones: timestamp, tipo de acción, usuario.' },
      { nombre: 'Reglas de Aprobación', desc: 'Jerarquía de aprobadores asignada según importe y sociedad.' },
    ],
    workflows: [
      {
        nombre: 'WF Smart Capture — Extracción de Datos',
        descripcion: 'Proceso automático activado al archivar una factura en la categoría de entrada. La IA extrae datos de cabecera y líneas. Según el nivel de confianza, pasa automáticamente a gestión o requiere validación manual por un operador.',
        tipo: 'automatico_manual',
        etapas: ['Archivo factura en categoría entrada', 'Extracción datos via IA Smart Capture', 'Evaluación nivel de confianza', 'Validación operador (si confianza baja)', 'Traslado a categoría gestión con datos indexados'],
      },
      {
        nombre: 'WF Revisión y Aprobación de Facturas',
        descripcion: 'Flujo de aprobación jerárquico. Asigna tareas a los aprobadores según las reglas configuradas (importe, sociedad, CECO). Incluye escalado por vencimiento y notificación automática en cada transición.',
        tipo: 'manual_automatico',
        etapas: ['Recepción factura validada', 'Asignación aprobador según jerarquía', 'Revisión y decisión (aprobar/rechazar)', 'Escalado automático si no hay respuesta', 'Generación fichero ERP', 'Archivo definitivo'],
      },
    ],
    nota_erp: `Therefore™ genera el fichero de intercambio (JSON/XML) con los datos de la factura aprobada para su consumo por el ERP externo. Therefore™ no realiza ningún tratamiento contable ni operación directamente en el ERP.`,
    premisas_especificas: [
      { premisa: 'Formato fichero ERP',      descripcion: 'El cliente confirma el formato del fichero de intercambio con el ERP antes del inicio.', impacto: 'Alto' },
      { premisa: 'Proveedores homologados',  descripcion: 'El listado de proveedores para validación lo proporciona el cliente en Excel.', impacto: 'Medio' },
      { premisa: 'Firma electrónica',        descripcion: 'La validación de firma electrónica de facturas está fuera del alcance confirmado.', impacto: 'Pendiente' },
    ],
  },

  // ── SAGE — INTEGRACIÓN THEREFORE™ + SAGE X3 ──────────────────────────────
  sage: {
    nombre: 'Integración Therefore™ + SAGE X3',
    subtitulo: 'Digital integración',
    descripcion_intro: `El proyecto tiene como objetivo garantizar una integración sólida entre el gestor documental Therefore™ y el ERP Sage X3, aprovechando las capacidades avanzadas de ambas plataformas para optimizar la gestión documental y el flujo de datos. Therefore™ genera ficheros JSON enviados via REST al ERP — no realiza operaciones contables directamente.`,
    claves: [
      'Repositorio documental centralizado en Therefore™ vinculado a las operaciones de Sage X3.',
      'Captura automática de facturas de compra mediante Smart Capture con IA.',
      'Envío automático de datos a X3 via servicios web REST (Build JSON → Send Data).',
      'Sincronización de tablas maestras (clientes, proveedores) desde X3 via WebServices.',
      'Estructura de cuatro bloques: Master Data, Smart Capture, Compras y Ventas.',
    ],
    estructura_bloques: [
      { bloque: 'Máster Data',    desc: 'Tablas maestras de configuración y relación con X3.' },
      { bloque: 'Smart Capture',  desc: 'Entrada y extracción de facturas de compra por IA.' },
      { bloque: 'Compras',        desc: 'Facturas recibidas y documentación de proveedores.' },
      { bloque: 'Ventas',         desc: 'Facturas emitidas y documentación de clientes.' },
    ],
    tablas_maestras: [
      { nombre: 'Información de Categoría',     desc: 'Control dinámico de información técnica de las categorías documentales del proyecto.' },
      { nombre: 'Tipos Documentales Adicionales', desc: 'Catálogo de tipos documentales (JUR, DOM, ESC, CTO, etc.).' },
      { nombre: 'Sociedades',                   desc: 'CIF, Razón Social, url_logo. Clave para enrutamiento de documentos.' },
      { nombre: 'Tipos de Documento SAGE X3',   desc: 'Relación entre tipos de documento X3 y categorías Therefore™. Incluye endpoint de entrega.' },
      { nombre: 'X3 Category Relation',         desc: 'Mapeo campo a campo entre Therefore™ y X3. Núcleo de la integración.' },
      { nombre: 'Tipos Impositivos',            desc: 'IVA e IGIC: códigos, descripciones y porcentajes.' },
    ],
    workflows: [
      { nombre: 'WF Smart Capture Facturas Recibidas', desc: 'Extracción IA de datos de facturas → validación → traslado a categoría gestión.' },
      { nombre: 'WF X3 Get Mapped Fields',             desc: 'Obtiene el mapeo de campos desde X3 via REST y genera JSON estructurado.' },
      { nombre: 'WF X3 GetCategoryInfo',               desc: 'Documenta y actualiza la información técnica de todas las categorías del sistema.' },
      { nombre: 'WF Send Customer Documentation',      desc: 'Transforma datos de doc. cliente en JSON y los envía a ficha de cliente en X3.' },
      { nombre: 'WF Send Vendor Documentation',        desc: 'Transforma datos de doc. proveedor en JSON y los envía a ficha de proveedor en X3.' },
    ],
  },

  // ── EVOLUTIVO — CHANGE REQUEST ────────────────────────────────────────────
  evolutivo: {
    nombre: 'Evolutivo / Change Request',
    subtitulo: 'Digital evolutivo',
    descripcion_intro: `Este documento recoge la especificación técnica y estimación de esfuerzo para la implementación de un evolutivo sobre la solución Therefore™ existente. El alcance se limita estrictamente a los elementos descritos; cualquier modificación adicional requerirá un nuevo proceso de análisis y presupuestación.`,
    claves: [
      'Evolución sobre implementación Therefore™ existente en producción.',
      'Alcance acotado y perfectamente definido antes del inicio de los trabajos.',
      'Sin impacto sobre la configuración o datos existentes fuera del alcance descrito.',
      'Entrega mediante acta de aceptación (UAT) al finalizar los trabajos.',
    ],
    premisas_especificas: [
      { premisa: 'Entorno de producción', descripcion: 'Los trabajos se realizan directamente en el entorno productivo al no estar disponible entorno de test.', impacto: 'Medio' },
      { premisa: 'Datos existentes',      descripcion: 'Los cambios no deben afectar a la operativa ni a los datos existentes fuera del alcance definido.', impacto: 'Alto' },
      { premisa: 'Alcance cerrado',       descripcion: 'Cualquier requerimiento adicional detectado durante la implementación generará un nuevo CR.', impacto: 'Medio' },
    ],
  },

  // ── GENÉRICO ──────────────────────────────────────────────────────────────
  generico: {
    nombre: 'Proyecto Therefore™',
    subtitulo: 'Digital gestión documental',
    descripcion_intro: `El objetivo de este documento es facilitar una descripción funcional aproximada de la solución Therefore™ propuesta, que servirá como base del proyecto a desarrollar. Los desarrollos tienen como base la plataforma Therefore™ Online (SaaS), considerada adecuada, sólida y escalable para garantizar la calidad de servicio requerida.`,
    claves: [
      'Implementación de repositorio documental centralizado en Therefore™ Online (SaaS).',
      'Configuración de categorías documentales adaptadas a los procesos del cliente.',
      'Automatización de flujos de trabajo para gestión, aprobación y notificación.',
      'Formación a usuarios clave y administradores del sistema.',
    ],
  },
};

// Premisas comunes a todos los proyectos
export const PREMISAS_COMUNES = [
  { premisa: 'Plataforma SaaS',       descripcion: 'Se utilizará Therefore™ Online. No se contempla instalación on-premise.', impacto: 'Bajo' },
  { premisa: 'Acceso al entorno',     descripcion: 'El cliente facilita acceso al entorno Therefore™ durante la implementación.', impacto: 'Alto' },
  { premisa: 'Interlocutor técnico',  descripcion: 'El cliente designa un interlocutor técnico disponible durante el proyecto.', impacto: 'Medio' },
  { premisa: 'Formación',             descripcion: 'Se contempla una única sesión de formación de hasta 4 horas.', impacto: 'Bajo' },
];
