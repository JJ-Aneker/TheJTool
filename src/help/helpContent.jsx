// Help content for all views — used by HelpDrawer and Manual page

export const HELP_SECTIONS = {

  home: {
    id: 'home',
    title: 'Panel de inicio',
    icon: '🏠',
    intro: 'El panel de inicio muestra una visión global del sistema: estadísticas de uso, actividad reciente y accesos rápidos a las herramientas principales.',
    sections: [
      {
        id: 'home-stats',
        title: 'Estadísticas',
        body: 'Los cuatro indicadores superiores muestran el número de documentos generados, eForms creados, categorías y tenants configurados. Los datos se actualizan cada vez que entras al panel.'
      },
      {
        id: 'home-activity',
        title: 'Actividad reciente',
        body: 'La tabla inferior lista las últimas acciones realizadas en el sistema: generación de documentos, accesos, cambios de configuración, etc. Útil para auditoría rápida.'
      },
      {
        id: 'home-navigation',
        title: 'Navegación rápida',
        body: 'Las tarjetas del panel central son accesos directos a todas las herramientas. Haz clic en cualquiera para ir directamente a esa funcionalidad sin usar el menú lateral.'
      }
    ]
  },

  documentGenerator: {
    id: 'documentGenerator',
    title: 'Generador de Documentación',
    icon: '⚡',
    intro: 'Genera documentos técnicos completos (EFDT, Requisitos, Presupuesto, etc.) a partir de un briefing. La IA analiza los documentos de entrada y produce un JSON estructurado que se convierte en un DOCX profesional.',
    sections: [
      {
        id: 'docgen-workflow',
        title: 'Flujo de trabajo',
        body: `El proceso tiene tres pasos:
<ol>
  <li><strong>Configuración</strong> — Selecciona el tipo de documento, vertical, portada y sube los documentos de briefing.</li>
  <li><strong>Análisis</strong> — La IA (AWS Bedrock / Claude) analiza el briefing y extrae información del proyecto. Tarda entre 20 y 60 segundos.</li>
  <li><strong>Revisión y descarga</strong> — Revisa los datos extraídos, edítalos si es necesario y genera el DOCX final.</li>
</ol>`
      },
      {
        id: 'docgen-types',
        title: 'Tipos de documento',
        body: `<ul>
  <li><strong>EFDT</strong> — Especificaciones Funcionales y Diseño Técnico. El más completo: incluye alcance, estructura de categorías, workflows y estimación.</li>
  <li><strong>Requisitos</strong> — Lista de requisitos funcionales y no funcionales.</li>
  <li><strong>Presupuesto</strong> — Documento comercial con tabla de tareas y costes.</li>
  <li><strong>Propuesta comercial</strong> — Presentación ejecutiva orientada al cliente.</li>
  <li><strong>Solicitud de cambio</strong> — Para gestionar cambios en proyectos en curso.</li>
</ul>`
      },
      {
        id: 'docgen-portada',
        title: 'Portadas',
        body: `La portada es una imagen PNG en formato A4 (794×1123 px a 96 dpi). Se guarda en Supabase Storage y puedes reutilizarla en futuros documentos.
<br/><br/>
Para añadir una portada: haz clic en el botón de portada → se abre el modal → arrastra un PNG o selecciona uno guardado. La portada seleccionada aparece como miniatura en el panel de configuración.`
      },
      {
        id: 'docgen-briefing',
        title: 'Documentos de briefing',
        body: `Acepta PDF, Word (.docx), HTML (.eml/.html) y texto plano. Puedes subir varios archivos; la IA los procesa todos juntos.
<br/><br/>
<strong>Consejo:</strong> Cuanto más detallado sea el briefing, mejor será el análisis. Incluye información sobre el cliente, objetivos, alcance y requisitos técnicos.`
      },
      {
        id: 'docgen-edit',
        title: 'Edición del análisis',
        body: `Después del análisis puedes editar todos los campos extraídos: nombre del cliente, proyecto, estimaciones de tareas, riesgos, etc. Los cambios se reflejan en el DOCX generado.
<br/><br/>
El botón <strong>Refinar con IA</strong> te permite dar instrucciones adicionales (p.ej. "añade riesgo de integración con SAP") para que la IA ajuste el contenido.`
      }
    ]
  },

  eformBuilder: {
    id: 'eformBuilder',
    title: 'Therefore™ eForms Builder',
    icon: '📋',
    intro: 'Crea y exporta eForms para Therefore™ Solution Designer. Genera el XML de importación con la estructura form.io correcta sin necesidad de editar XML manualmente.',
    sections: [
      {
        id: 'eform-structure',
        title: 'Estructura de un eForm',
        body: `Un eForm se compone de <strong>paneles</strong> que contienen <strong>campos</strong>. Cada campo tiene un tipo (texto, número, fecha, desplegable, etc.) y propiedades de validación.
<br/><br/>
La estructura se mapea directamente a los campos de índice de una categoría Therefore™.`
      },
      {
        id: 'eform-fields',
        title: 'Tipos de campo soportados',
        body: `<ul>
  <li><strong>TextField</strong> — Texto libre, una o varias líneas</li>
  <li><strong>NumberField</strong> — Número entero o decimal</li>
  <li><strong>DateField</strong> — Fecha con selector visual</li>
  <li><strong>SelectField</strong> — Desplegable con opciones configurables</li>
  <li><strong>CheckboxField</strong> — Casilla de verificación</li>
  <li><strong>EmailField</strong> — Email con validación de formato</li>
  <li><strong>PhoneNumberField</strong> — Teléfono</li>
  <li><strong>Table</strong> — Tabla dinámica con filas añadibles</li>
</ul>`
      },
      {
        id: 'eform-export',
        title: 'Exportar e importar en Therefore™',
        body: `Pulsa <strong>Exportar XML</strong> para descargar el archivo de configuración. Luego en Therefore™ Solution Designer:
<ol>
  <li>Abre la categoría de destino</li>
  <li>Ve a la pestaña <em>eForms</em></li>
  <li>Usa <em>Import eForm</em> y selecciona el XML descargado</li>
</ol>
<strong>Importante:</strong> No edites el XML manualmente — usa siempre el builder para modificarlo.`
      },
      {
        id: 'eform-data-loading',
        title: 'Carga de datos desde Therefore™',
        body: `Los eForms pueden configurarse para cargar datos desde queries de Therefore™ (p.ej. cargar un listado de clientes en un desplegable). Esto se configura en la propiedad <code>data.url</code> del campo usando la API REST de Therefore™.`
      }
    ]
  },

  categoryBuilder: {
    id: 'categoryBuilder',
    title: 'Generador de Categorías',
    icon: '🏗️',
    intro: 'Crea configuraciones XML de categorías Therefore™ basadas en una plantilla maestra. Permite definir campos, pestañas, tablas y generar el XML listo para importar en Solution Designer.',
    sections: [
      {
        id: 'cat-concept',
        title: '¿Qué es una categoría?',
        body: `Una <strong>categoría</strong> en Therefore™ es la estructura de almacenamiento de documentos. Define los campos de índice (metadatos) que tendrán los documentos, cómo se agrupan en pestañas y si hay campos de tipo tabla.`
      },
      {
        id: 'cat-fields',
        title: 'Tipos de campo',
        body: `<ul>
  <li><strong>StringField (1)</strong> — Texto. Requiere atributo <code>Length</code>.</li>
  <li><strong>IntField (2)</strong> — Número entero</li>
  <li><strong>DateField (3)</strong> — Fecha</li>
  <li><strong>FloatField (4)</strong> — Número decimal</li>
  <li><strong>DateTimeField (5)</strong> — Fecha y hora</li>
  <li><strong>KeywordField (6)</strong> — Keyword de lista controlada</li>
  <li><strong>MoneyField (9)</strong> — Valor monetario</li>
</ul>`
      },
      {
        id: 'cat-tabs',
        title: 'Pestañas y organización',
        body: `Los campos se pueden agrupar en <strong>pestañas</strong> para organizar mejor la interfaz de usuario. Los campos sin pestaña asignada aparecen en la vista general. Puedes crear pestañas personalizadas y arrastrar campos a ellas.`
      },
      {
        id: 'cat-export',
        title: 'Exportar e importar',
        body: `Genera el XML y descárgalo. En Therefore™ Solution Designer usa <em>Import Configuration</em> para importar la categoría.
<br/><br/>
<strong>Advertencia:</strong> Importar sobre una categoría existente sobreescribe su configuración. Haz siempre un export previo como backup.`
      }
    ]
  },

  thereforeReporter: {
    id: 'thereforeReporter',
    title: 'Therefore Reporter',
    icon: '⚡',
    intro: 'Consulta y visualiza documentos almacenados en Therefore™ directamente desde la aplicación. Conecta con instancias Therefore™ on-premise o en la nube sin salir del portal.',
    sections: [
      {
        id: 'reporter-tenants',
        title: 'Selección de servidor',
        body: `Usa el selector de <strong>Tenant</strong> para elegir la instancia Therefore™ con la que quieres trabajar. Los tenants se configuran en la sección <em>Gestión de Tenants</em> del menú.`
      },
      {
        id: 'reporter-categories',
        title: 'Navegar categorías',
        body: `Una vez conectado, verás el árbol de categorías disponibles. Expande los nodos para ver las subcategorías. Haz clic en una categoría para ver sus documentos.`
      },
      {
        id: 'reporter-documents',
        title: 'Visualizar documentos',
        body: `La tabla muestra los documentos de la categoría seleccionada con sus campos de índice. Haz clic en un documento para ver su detalle. Si el servidor tiene acceso público, puedes descargar los archivos directamente.`
      },
      {
        id: 'reporter-queries',
        title: 'Búsqueda y filtrado',
        body: `Usa los campos de filtro encima de la tabla para buscar por cualquier campo de índice. Los filtros se aplican en tiempo real contra la API de Therefore™.`
      }
    ]
  },

  userManager: {
    id: 'userManager',
    title: 'Gestión de Usuarios',
    icon: '👥',
    intro: 'Administra los usuarios de la plataforma: activación de cuentas, asignación de roles, aprobación de nuevos registros y gestión de perfiles. Solo accesible para administradores.',
    sections: [
      {
        id: 'users-roles',
        title: 'Roles disponibles',
        body: `<ul>
  <li><strong>Administrador</strong> — Acceso total. Puede gestionar usuarios, configurar el sistema y acceder a todos los módulos.</li>
  <li><strong>Gestor</strong> — Acceso a todas las herramientas pero sin panel de administración.</li>
  <li><strong>Usuario</strong> — Acceso estándar a herramientas principales.</li>
  <li><strong>Auditor</strong> — Solo lectura. Puede consultar datos pero no modificar.</li>
</ul>`
      },
      {
        id: 'users-activation',
        title: 'Activar nuevos usuarios',
        body: `Cuando alguien se registra, la cuenta queda en estado <em>pendiente</em>. Para activarla:
<ol>
  <li>Localiza el usuario en la tabla</li>
  <li>Haz clic en <strong>Activar y aprobar</strong></li>
  <li>El usuario recibirá acceso inmediatamente</li>
</ol>
También puedes activar el email y aprobar por separado si necesitas un flujo en dos pasos.`
      },
      {
        id: 'users-profile',
        title: 'Editar perfil',
        body: `Haz clic en el icono de edición de cualquier usuario para modificar sus datos: nombre, apellidos, teléfono, dirección y rol. Los cambios son inmediatos.`
      }
    ]
  },

  verticalesManager: {
    id: 'verticalesManager',
    title: 'Gestión de Verticales',
    icon: '📦',
    intro: 'Las verticales definen los tipos de proyecto (NotifApp, HR, Facturas, etc.) y sus plantillas de conocimiento para el generador de documentos. Solo administradores.',
    sections: [
      {
        id: 'vert-concept',
        title: '¿Qué es una vertical?',
        body: `Una vertical agrupa el conocimiento específico de un tipo de proyecto: textos de introducción, estructura típica de categorías, workflows habituales y estimaciones base. El Generador de Documentos usa esta información para contextualizar el análisis de IA.`
      },
      {
        id: 'vert-fields',
        title: 'Campos de una vertical',
        body: `<ul>
  <li><strong>Nombre interno</strong> — Identificador técnico (sin espacios, ej: <code>notifapp</code>)</li>
  <li><strong>Título</strong> — Nombre legible que aparece en los desplegables</li>
  <li><strong>Descripción intro</strong> — Texto que la IA usa como contexto de proyecto</li>
  <li><strong>Descripción implementación</strong> — Detalles técnicos de cómo se implementa</li>
  <li><strong>Ratios</strong> — Estimaciones de esfuerzo base para esta vertical</li>
</ul>`
      },
      {
        id: 'vert-order',
        title: 'Orden de aparición',
        body: `Las verticales aparecen en el generador de documentos en el orden definido por el campo <strong>Orden</strong>. Edita este valor para reordenarlas según su frecuencia de uso.`
      }
    ]
  },

  tenantManager: {
    id: 'tenantManager',
    title: 'Gestión de Tenants',
    icon: '☁️',
    intro: 'Configura las conexiones a instancias Therefore™. Cada tenant representa un servidor Therefore™ (on-premise o cloud) con su propia URL y credenciales.',
    sections: [
      {
        id: 'tenant-create',
        title: 'Crear un tenant',
        body: `Pulsa <strong>Nuevo Tenant</strong> y rellena:
<ul>
  <li><strong>Nombre</strong> — Identificador descriptivo (ej: "Canon España - Producción")</li>
  <li><strong>URL base</strong> — URL del servidor Therefore™ (ej: <code>https://empresa.thereforeonline.com/theservice/v0001/restun</code>)</li>
  <li><strong>Usuario / Contraseña</strong> — Credenciales de acceso a la API</li>
  <li><strong>TenantName</strong> — Nombre del tenant en instancias cloud (opcional en on-premise)</li>
</ul>`
      },
      {
        id: 'tenant-test',
        title: 'Probar la conexión',
        body: `Usa el botón <strong>Probar conexión</strong> para verificar que las credenciales son correctas y el servidor es accesible. El resultado muestra el estado de la conexión y la versión de Therefore™ detectada.`
      },
      {
        id: 'tenant-onpremise',
        title: 'Instancias on-premise',
        body: `Para instancias on-premise, el campo <strong>TenantName</strong> es opcional. Si la URL es correcta y las credenciales válidas, la conexión funcionará sin él. Las instancias cloud (thereforeonline.com) sí lo requieren.`
      }
    ]
  },

  webServices: {
    id: 'webServices',
    title: 'Web Services',
    icon: '🔌',
    intro: 'Gestiona las integraciones con servicios externos: DOCAI para clasificación de documentos, IVNEOS para notificaciones gubernamentales e IvSign para firma digital.',
    sections: [
      {
        id: 'ws-docai',
        title: 'DOCAI',
        body: `DOCAI es un motor de clasificación y extracción de datos de documentos basado en IA. Se integra con Therefore™ para clasificar automáticamente los documentos entrantes y extraer sus metadatos (NIF, fecha, importe, etc.) sin intervención manual.`
      },
      {
        id: 'ws-ivneos',
        title: 'IVNEOS',
        body: `IVNEOS gestiona las notificaciones electrónicas de la administración pública española (AEAT, Seguridad Social, etc.). Se conecta con Therefore™ para archivar las notificaciones descargadas automáticamente.`
      },
      {
        id: 'ws-ivsign',
        title: 'IvSign',
        body: `IvSign es la plataforma de firma digital. Permite enviar documentos a firma desde workflows de Therefore™ y recibir los documentos firmados de vuelta, archivándolos automáticamente.`
      }
    ]
  },

  bedrockPanel: {
    id: 'bedrockPanel',
    title: 'Panel AWS Bedrock',
    icon: '☁️',
    intro: 'Configura y monitoriza la conexión con AWS Bedrock, el motor de IA que alimenta el Generador de Documentos. Solo administradores.',
    sections: [
      {
        id: 'bedrock-credentials',
        title: 'Credenciales AWS',
        body: `Configura las claves de acceso AWS (<code>AWS_ACCESS_KEY_ID</code> y <code>AWS_SECRET_ACCESS_KEY</code>) y la región (<code>AWS_REGION</code>). Estas credenciales deben tener permisos <code>bedrock:InvokeModel</code> en la región configurada.`
      },
      {
        id: 'bedrock-model',
        title: 'Modelo utilizado',
        body: `El generador usa <strong>Claude 3 Opus</strong> (o el modelo configurado) para analizar los briefings. Es el modelo más capaz de la familia Claude, optimizado para tareas de comprensión y extracción de información compleja.`
      },
      {
        id: 'bedrock-test',
        title: 'Probar la conexión',
        body: `Usa el botón <strong>Test</strong> para verificar que las credenciales funcionan y el modelo está disponible en la región seleccionada. Si el test falla, revisa los permisos IAM y que el modelo esté habilitado en AWS Bedrock Console.`
      },
      {
        id: 'bedrock-usage',
        title: 'Monitorización de uso',
        body: `La pestaña <strong>Uso</strong> muestra el número de llamadas realizadas y los tokens consumidos. Ten en cuenta que AWS Bedrock factura por tokens de entrada y salida — cada análisis de briefing consume entre 5.000 y 30.000 tokens dependiendo del tamaño del documento.`
      }
    ]
  },

  userProfile: {
    id: 'userProfile',
    title: 'Perfil de Usuario',
    icon: '👤',
    intro: 'Gestiona tu información personal, foto de perfil y preferencias de la cuenta.',
    sections: [
      {
        id: 'profile-data',
        title: 'Datos personales',
        body: `Puedes actualizar tu nombre, apellidos, teléfono y dirección. Estos datos son visibles para los administradores del sistema y aparecen en el directorio de usuarios.`
      },
      {
        id: 'profile-avatar',
        title: 'Foto de perfil',
        body: `Haz clic en el avatar para subir una nueva foto. Se aceptan imágenes JPG, PNG y WebP de hasta 5 MB. La imagen se redimensiona automáticamente.`
      },
      {
        id: 'profile-password',
        title: 'Cambio de contraseña',
        body: `Para cambiar la contraseña, usa la opción de <em>Recuperar contraseña</em> en la pantalla de login. Recibirás un email con el enlace de restablecimiento.`
      }
    ]
  }
}

export const MANUAL_TOC = [
  { key: 'home',                label: 'Panel de inicio',           icon: '🏠' },
  { key: 'documentGenerator',  label: 'Generador de Documentación', icon: '⚡' },
  { key: 'eformBuilder',       label: 'eForms Builder',             icon: '📋' },
  { key: 'categoryBuilder',    label: 'Generador de Categorías',    icon: '🏗️' },
  { key: 'thereforeReporter',  label: 'Therefore Reporter',         icon: '🔍' },
  { key: 'tenantManager',      label: 'Gestión de Tenants',         icon: '☁️' },
  { key: 'webServices',        label: 'Web Services',               icon: '🔌' },
  { key: 'userManager',        label: 'Gestión de Usuarios',        icon: '👥' },
  { key: 'verticalesManager',  label: 'Gestión de Verticales',      icon: '📦' },
  { key: 'bedrockPanel',       label: 'Panel AWS Bedrock',          icon: '🤖' },
  { key: 'userProfile',        label: 'Perfil de Usuario',          icon: '👤' },
]
