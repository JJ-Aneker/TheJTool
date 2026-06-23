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
        body: 'Los indicadores superiores muestran el número de documentos generados, eForms creados, categorías y tenants configurados. Los datos se actualizan cada vez que entras al panel.'
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
        title: 'Flujo de trabajo paso a paso',
        body: `<ol>
  <li><strong>Selecciona el tipo de documento</strong> — EFDT, Requisitos, Presupuesto, etc. Cada tipo tiene una plantilla y prompts específicos.</li>
  <li><strong>Selecciona la vertical</strong> — El tipo de proyecto (NotifApp, HR, Facturas…). Aporta contexto adicional a la IA.</li>
  <li><strong>Añade una portada</strong> — Haz clic en el botón de portada y sube un PNG A4 (794×1123 px). Las portadas se guardan y puedes reutilizarlas.</li>
  <li><strong>Sube el briefing</strong> — PDF, Word, HTML o TXT. Puedes subir varios archivos; todos se analizan juntos.</li>
  <li><strong>Haz clic en "Analizar briefing"</strong> — La IA procesa los documentos (20-60 s). Una barra de progreso indica el estado.</li>
  <li><strong>Revisa y edita</strong> — Modifica cualquier campo extraído: cliente, proyecto, tareas, estimaciones, riesgos.</li>
  <li><strong>Genera el DOCX</strong> — Haz clic en "Generar documento" para descargar el archivo Word definitivo.</li>
</ol>`
      },
      {
        id: 'docgen-types',
        title: 'Tipos de documento disponibles',
        body: `<ul>
  <li><strong>EFDT</strong> — Especificaciones Funcionales y Diseño Técnico. El más completo: incluye alcance, estructura de categorías, workflows y estimación detallada.</li>
  <li><strong>Requisitos</strong> — Lista de requisitos funcionales y no funcionales, priorizados.</li>
  <li><strong>Presupuesto</strong> — Documento comercial con tabla de tareas, días y costes.</li>
  <li><strong>Propuesta comercial</strong> — Presentación ejecutiva orientada al cliente, sin detalles técnicos.</li>
  <li><strong>Solicitud de cambio</strong> — Para gestionar cambios en proyectos en curso (change requests).</li>
</ul>`
      },
      {
        id: 'docgen-portada',
        title: 'Portadas — cómo añadir y reutilizar',
        body: `Las portadas son imágenes PNG en formato A4 exacto (<strong>794×1123 px a 96 dpi</strong>). Se guardan en la nube y puedes reutilizarlas en futuros documentos.
<br/><br/>
<strong>Añadir una nueva portada:</strong>
<ol>
  <li>Haz clic en el botón de portada del panel de configuración</li>
  <li>En el modal, arrastra tu PNG al recuadro superior izquierdo ("Nueva portada") o haz clic en él</li>
  <li>La portada se sube y aparece como miniatura</li>
  <li>Haz clic en ella para seleccionarla — el modal se cierra y aparece en el panel</li>
</ol>
<strong>Reutilizar portadas guardadas:</strong> Vuelve a abrir el modal — las portadas que ya subiste en sesiones anteriores aparecen en el grid. Haz clic en la que quieras.`
      },
      {
        id: 'docgen-briefing',
        title: 'Documentos de briefing — qué incluir',
        body: `Acepta <strong>PDF, Word (.docx), HTML, .eml y texto plano</strong>. Puedes subir varios archivos; la IA los procesa todos juntos.
<br/><br/>
<strong>Para mejores resultados incluye:</strong>
<ul>
  <li>Nombre del cliente y del proyecto</li>
  <li>Objetivos del proyecto y alcance funcional</li>
  <li>Descripción de los documentos que gestionará Therefore™</li>
  <li>Usuarios y departamentos implicados</li>
  <li>Integraciones con otros sistemas (ERP, CRM, etc.)</li>
  <li>Volumen estimado de documentos</li>
</ul>
<em>Cuanto más detallado sea el briefing, más preciso y completo será el documento generado.</em>`
      },
      {
        id: 'docgen-refine',
        title: 'Refinar el análisis con IA',
        body: `Después del análisis puedes dar instrucciones adicionales a la IA sin volver a subir documentos:
<ol>
  <li>Localiza el área de texto "Refinar análisis" en la pantalla de revisión</li>
  <li>Escribe tu instrucción, por ejemplo: <em>"Añade un riesgo de integración con SAP"</em> o <em>"El presupuesto máximo es 25.000€, ajusta las estimaciones"</em></li>
  <li>Haz clic en "Refinar con IA"</li>
</ol>
La IA actualiza solo los campos afectados, manteniendo el resto del análisis intacto.`
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
        title: 'Estructura básica de un eForm',
        body: `Un eForm se compone de <strong>paneles</strong> (agrupaciones visuales) que contienen <strong>campos</strong>. Cada campo tiene un tipo, etiqueta, clave técnica y propiedades opcionales.
<br/><br/>
<strong>Pasos para crear un eForm:</strong>
<ol>
  <li>Escribe el nombre del formulario en el campo "Nombre del formulario"</li>
  <li>Haz clic en "+ Panel" para añadir una sección (ej: "Datos del cliente")</li>
  <li>Dentro del panel, haz clic en "+ Campo" para añadir campos</li>
  <li>Configura cada campo: nombre, tipo, si es obligatorio, placeholder…</li>
  <li>Cuando estés listo, haz clic en "Exportar XML" para descargar el archivo</li>
  <li>Importa el XML en Therefore™ Solution Designer → categoría → pestaña eForms</li>
</ol>`
      },
      {
        id: 'eform-fields',
        title: 'Tipos de campo disponibles',
        body: `<ul>
  <li><strong>text</strong> — Texto libre de una línea</li>
  <li><strong>email</strong> — Email con validación de formato</li>
  <li><strong>phone</strong> — Teléfono</li>
  <li><strong>date</strong> — Fecha con selector visual</li>
  <li><strong>datetime</strong> — Fecha y hora</li>
  <li><strong>number</strong> — Número entero o decimal</li>
  <li><strong>money</strong> — Importe monetario</li>
  <li><strong>checkbox</strong> — Casilla de verificación (sí/no)</li>
  <li><strong>select</strong> — Desplegable con opciones configurables (separa las opciones con <code>|</code> en el campo Options del CSV)</li>
</ul>`
      },
      {
        id: 'eform-csv',
        title: 'Importar campos desde CSV',
        body: `El botón <strong>"📤 Importar CSV"</strong> permite crear todos los campos de golpe pegando una tabla en formato CSV o texto separado por punto y coma.
<br/><br/>
<strong>Columnas del CSV:</strong><br/>
<code>Nombre ; Key ; Tipo ; Obligatorio ; Placeholder ; Default ; MaxLength ; Seccion ; Options</code>
<br/><br/>
Solo <strong>Nombre</strong> es obligatorio. El resto son opcionales.
<br/><br/>
<strong>Ejemplo básico (copia y pega en el modal):</strong>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;overflow-x:auto;margin:8px 0">Nombre;Key;Tipo;Obligatorio;Placeholder;Default;MaxLength;Seccion;Options
Nombre completo;nombre;text;si;Introduce tu nombre completo;;100;DATOS PERSONALES
Email;email;email;si;correo@empresa.com;;;DATOS PERSONALES
Teléfono;telefono;phone;no;;;;DATOS PERSONALES
Fecha solicitud;fechaSolicitud;date;si;;;;SOLICITUD
Tipo documento;tipoDoc;select;si;;;; SOLICITUD;Factura|Contrato|Presupuesto|Otro
Importe;importe;money;no;;;;SOLICITUD
Observaciones;observaciones;text;no;Notas adicionales;;500;SOLICITUD</pre>
<strong>Opciones para campos Select:</strong> separa los valores con <code>|</code> en la columna Options. Si quieres etiqueta distinta al valor usa <code>valor=Etiqueta</code> (ej: <code>ESP=España|FRA=Francia</code>).
<br/><br/>
Después de pegar, haz clic en <strong>"Analizar →"</strong> para ver la vista previa. Luego elige <strong>"Reemplazar"</strong> (sustituye todo) o <strong>"Añadir"</strong> (añade a los paneles existentes).`
      },
      {
        id: 'eform-export',
        title: 'Exportar e importar en Therefore™',
        body: `<ol>
  <li>Haz clic en <strong>"Exportar XML"</strong> — se descarga un archivo <code>.xml</code></li>
  <li>En <strong>Therefore™ Solution Designer</strong>, abre la categoría de destino</li>
  <li>Ve a la pestaña <em>eForms</em></li>
  <li>Haz clic en <em>Import eForm</em> y selecciona el XML descargado</li>
  <li>Guarda los cambios en Solution Designer</li>
</ol>
<strong>Importante:</strong> El XML se genera una sola vez. Para modificar un eForm existente, expórtalo primero desde Therefore™, edita el <code>&lt;FDef&gt;</code> y reimportalo. No edites el XML a mano — puede corromper la estructura.`
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
        title: '¿Qué es una categoría y cómo se crea?',
        body: `Una <strong>categoría</strong> en Therefore™ define la estructura de almacenamiento de documentos: qué campos de índice tendrán, cómo se agrupan y qué tipos de datos se indexan.
<br/><br/>
<strong>Pasos para crear una categoría:</strong>
<ol>
  <li>En el editor, haz clic en <strong>"+ Categoría"</strong> para añadir una nueva</li>
  <li>Dale un nombre descriptivo (ej: "Facturas de proveedor")</li>
  <li>Añade secciones dentro de la categoría con <strong>"+ Sección"</strong></li>
  <li>Añade campos dentro de cada sección con <strong>"+ Campo"</strong></li>
  <li>Configura cada campo: nombre, tipo, longitud (para texto), si es obligatorio</li>
  <li>Opcionalmente, asigna campos a <strong>pestañas</strong> para organizar la vista</li>
  <li>Cuando termines, haz clic en <strong>"Exportar XML"</strong> y descarga el archivo</li>
  <li>Importa en Therefore™ Solution Designer → menú → Import Configuration</li>
</ol>`
      },
      {
        id: 'cat-fields',
        title: 'Tipos de campo y sus alias en CSV',
        body: `<table style="width:100%;font-size:11px;border-collapse:collapse">
  <thead><tr style="border-bottom:1px solid var(--border-default)">
    <th style="text-align:left;padding:4px 8px">Tipo</th>
    <th style="text-align:left;padding:4px 8px">Alias aceptados en CSV</th>
  </tr></thead>
  <tbody>
    <tr><td style="padding:4px 8px"><strong>String</strong></td><td style="padding:4px 8px">string, texto, text, str, varchar, email, correo, phone</td></tr>
    <tr style="background:var(--bg-canvas)"><td style="padding:4px 8px"><strong>Integer</strong></td><td style="padding:4px 8px">number, integer, int, entero, número, numeric</td></tr>
    <tr><td style="padding:4px 8px"><strong>Date</strong></td><td style="padding:4px 8px">date, fecha</td></tr>
    <tr style="background:var(--bg-canvas)"><td style="padding:4px 8px"><strong>Money</strong></td><td style="padding:4px 8px">money, importe, decimal, currency</td></tr>
    <tr><td style="padding:4px 8px"><strong>Logical</strong></td><td style="padding:4px 8px">boolean, bool, lógico, logical, checkbox</td></tr>
    <tr style="background:var(--bg-canvas)"><td style="padding:4px 8px"><strong>DateTime</strong></td><td style="padding:4px 8px">datetime, timestamp, fecha y hora</td></tr>
    <tr><td style="padding:4px 8px"><strong>Lookup</strong></td><td style="padding:4px 8px">lookup, lista, combo, desplegable</td></tr>
    <tr style="background:var(--bg-canvas)"><td style="padding:4px 8px"><strong>Table</strong></td><td style="padding:4px 8px">table, tabla, grid</td></tr>
  </tbody>
</table>
<br/>Los campos <strong>String</strong> deben tener Longitud (máximo de caracteres). Si no se indica, se usa 100 por defecto.`
      },
      {
        id: 'cat-csv',
        title: 'Importar campos desde CSV',
        body: `El botón <strong>"📤 Importar CSV"</strong> crea categorías completas desde un fichero o texto pegado.
<br/><br/>
<strong>Columnas del CSV:</strong><br/>
<code>Categoría ; Pestaña ; Sección ; Nombre ; Tipo ; Longitud ; Obligatorio ; TablaParent</code>
<br/><br/>
Solo <strong>Nombre</strong> es obligatorio. El separador puede ser <code>;</code> o <code>,</code>.
<br/><br/>
<strong>Ejemplo — categoría de facturas (copia y pega en el modal):</strong>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;overflow-x:auto;margin:8px 0">Categoría;Pestaña;Sección;Nombre;Tipo;Longitud;Obligatorio;TablaParent
Facturas;General;PROVEEDOR;Nombre proveedor;string;200;si
Facturas;General;PROVEEDOR;NIF proveedor;string;20;si
Facturas;General;PROVEEDOR;Email proveedor;string;150;no
Facturas;General;FACTURA;Número factura;string;50;si
Facturas;General;FACTURA;Fecha factura;date;;si
Facturas;General;FACTURA;Importe total;money;;si
Facturas;General;FACTURA;IVA%;number;;no
Facturas;General;FACTURA;Observaciones;string;500;no
Facturas;Líneas;LÍNEAS;Líneas factura;table;;no
Facturas;Líneas;LÍNEAS;Descripción;string;200;si;Líneas factura
Facturas;Líneas;LÍNEAS;Cantidad;number;;si;Líneas factura
Facturas;Líneas;LÍNEAS;Precio unitario;money;;si;Líneas factura
Facturas;Líneas;LÍNEAS;Subtotal;money;;no;Líneas factura</pre>
<strong>Cómo funcionan las columnas de tabla (TablaParent):</strong>
<ul>
  <li>Primero define el campo <code>Table</code> con su nombre (ej: "Líneas factura") y <code>TablaParent</code> vacío</li>
  <li>Luego añade las columnas con el mismo nombre de tabla en la columna <code>TablaParent</code></li>
  <li>Las columnas se asocian automáticamente al campo Table correspondiente</li>
</ul>
Tras pegar el CSV, haz clic en <strong>"Analizar →"</strong> para previsualizar, luego <strong>"Aplicar"</strong>.`
      },
      {
        id: 'cat-tabs',
        title: 'Pestañas — organizar campos por vistas',
        body: `Las <strong>pestañas</strong> dividen los campos en vistas separadas dentro de la categoría en Therefore™. Útil para categorías con muchos campos.
<br/><br/>
<strong>Para asignar un campo a una pestaña:</strong>
<ol>
  <li>Selecciona el campo en el editor</li>
  <li>En el desplegable "Pestaña", elige una pestaña existente o escribe el nombre de una nueva</li>
  <li>Los campos sin pestaña asignada aparecen en la vista general</li>
</ol>
En el CSV, rellena la columna <strong>Pestaña</strong> con el nombre de la pestaña (ej: "General", "Líneas", "Adjuntos").`
      },
      {
        id: 'cat-export',
        title: 'Exportar e importar en Therefore™',
        body: `<ol>
  <li>Haz clic en <strong>"Exportar XML"</strong> — se descarga el archivo de configuración</li>
  <li>En <strong>Therefore™ Solution Designer</strong>: menú <em>File → Import Configuration</em></li>
  <li>Selecciona el XML descargado y confirma la importación</li>
  <li>La nueva categoría aparecerá en el árbol de Solution Designer</li>
</ol>
<strong>Si importas sobre una categoría existente</strong> con el mismo nombre, se sobreescribirá su configuración. Haz siempre un Export previo como backup.
<br/><br/>
<strong>Tip:</strong> Puedes generar varias categorías en una sola exportación usando filas con distintos valores en la columna "Categoría" del CSV. El XML resultante contiene todas las categorías en un único archivo de importación.`
      }
    ]
  },

  thereforeReporter: {
    id: 'thereforeReporter',
    title: 'Therefore Reporter',
    icon: '🔍',
    intro: 'Consulta y visualiza documentos almacenados en Therefore™ directamente desde la aplicación. Conecta con instancias Therefore™ on-premise o en la nube sin salir del portal.',
    sections: [
      {
        id: 'reporter-connect',
        title: 'Conectar con un servidor Therefore™',
        body: `<ol>
  <li>Usa el selector <strong>"Servidor"</strong> en la parte superior para elegir el tenant configurado</li>
  <li>Haz clic en <strong>"Conectar"</strong> — la aplicación obtiene el token de sesión de la API</li>
  <li>Si la conexión es correcta, verás el árbol de categorías en el panel izquierdo</li>
  <li>Si falla, revisa las credenciales del tenant en la sección "Gestión de Tenants"</li>
</ol>`
      },
      {
        id: 'reporter-categories',
        title: 'Navegar categorías y documentos',
        body: `<ul>
  <li>Expande los nodos del árbol izquierdo para ver categorías y subcategorías</li>
  <li>Haz clic en una categoría para cargar sus documentos en la tabla principal</li>
  <li>La tabla muestra los documentos con sus campos de índice como columnas</li>
  <li>Haz clic en una fila para ver el detalle del documento</li>
</ul>`
      },
      {
        id: 'reporter-search',
        title: 'Filtrar y buscar documentos',
        body: `Los filtros encima de la tabla permiten buscar por cualquier campo de índice:
<ol>
  <li>Escribe en el campo de búsqueda correspondiente al índice que quieres filtrar</li>
  <li>Los resultados se actualizan al pulsar Enter o hacer clic en "Buscar"</li>
  <li>Para limpiar los filtros, haz clic en "Limpiar"</li>
</ol>
Los filtros utilizan la API REST de Therefore™ — las búsquedas se ejecutan en el servidor, no localmente.`
      },
      {
        id: 'reporter-tenants',
        title: 'Cambiar de servidor',
        body: `Si tienes varios tenants configurados (ej: producción y desarrollo), usa el selector de servidor para cambiar entre ellos sin cerrar la aplicación. Cada cambio vuelve a autenticarse y recarga el árbol de categorías.`
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
        id: 'users-activate',
        title: 'Activar un nuevo usuario paso a paso',
        body: `Cuando alguien se registra, la cuenta queda en estado <em>pendiente</em> hasta que un administrador la activa:
<ol>
  <li>Localiza al usuario en la tabla (normalmente aparece primero por fecha de registro)</li>
  <li>Verás el indicador <span style="color:#ff4d4f">●</span> rojo en la columna "Email" (no confirmado)</li>
  <li>Haz clic en el botón <strong>"Activar y aprobar"</strong> — esta es la acción más habitual</li>
  <li>El sistema confirma el email en Supabase Auth y marca el perfil como aprobado</li>
  <li>El usuario puede acceder inmediatamente</li>
</ol>
También puedes hacer las dos acciones por separado: <strong>"Activar email"</strong> (confirma el email) y <strong>"Aprobar"</strong> (da acceso al sistema).`
      },
      {
        id: 'users-roles',
        title: 'Roles y permisos',
        body: `<ul>
  <li><strong>Administrador</strong> — Acceso total. Gestiona usuarios, configura el sistema, accede a todos los módulos incluyendo Bedrock y Verticales.</li>
  <li><strong>Gestor</strong> — Acceso a todas las herramientas de trabajo pero sin panel de administración de usuarios ni configuración del sistema.</li>
  <li><strong>Usuario</strong> — Acceso estándar a herramientas principales (Generador, Reporter, eForms, Categorías).</li>
  <li><strong>Auditor</strong> — Solo lectura. Puede consultar datos e informes pero no generar ni modificar documentos.</li>
</ul>
Para cambiar el rol de un usuario, haz clic en el icono de edición ✏️ y selecciona el nuevo rol en el desplegable.`
      },
      {
        id: 'users-profile',
        title: 'Editar y gestionar perfiles',
        body: `<ul>
  <li>Haz clic en ✏️ para editar los datos de un usuario: nombre, apellidos, teléfono, dirección</li>
  <li>Los cambios se guardan inmediatamente en Supabase</li>
  <li>El usuario verá sus datos actualizados la próxima vez que abra su perfil</li>
  <li>Haz clic en 🗑️ para eliminar un usuario — esta acción es irreversible</li>
</ul>`
      }
    ]
  },

  verticalesManager: {
    id: 'verticalesManager',
    title: 'Gestión de Verticales',
    icon: '📦',
    intro: 'Las verticales definen los tipos de proyecto (NotifApp, HR, Facturas, etc.) y el conocimiento específico que la IA usa al generar documentos. Solo administradores.',
    sections: [
      {
        id: 'vert-concept',
        title: '¿Qué es una vertical y para qué sirve?',
        body: `Una vertical agrupa el conocimiento específico de un tipo de proyecto: cómo se estructura normalmente, qué categorías suele tener, cuáles son sus workflows típicos y cuánto esfuerzo requiere. El Generador de Documentos usa esta información como contexto adicional para la IA.
<br/><br/>
Por ejemplo, la vertical "NotifApp" sabe que los proyectos de notificaciones de la DGT suelen incluir categorías de notificaciones, expedientes y un workflow de clasificación automática.`
      },
      {
        id: 'vert-create',
        title: 'Crear o editar una vertical',
        body: `<ol>
  <li>Haz clic en <strong>"Nueva vertical"</strong> (o en el icono ✏️ para editar una existente)</li>
  <li>Rellena los campos:
    <ul>
      <li><strong>Nombre interno</strong> — Identificador técnico, sin espacios (ej: <code>notifapp</code>, <code>facturas</code>)</li>
      <li><strong>Título</strong> — Nombre legible que aparece en los desplegables (ej: "Notificaciones DGT")</li>
      <li><strong>Descripción intro</strong> — Texto que la IA usa como contexto del proyecto. Cuanto más detallado, mejor.</li>
      <li><strong>Descripción implementación</strong> — Detalles técnicos de la implementación típica</li>
      <li><strong>Orden</strong> — Posición en el desplegable del Generador (menor número = antes)</li>
    </ul>
  </li>
  <li>Haz clic en "Guardar"</li>
</ol>`
      },
      {
        id: 'vert-order',
        title: 'Orden de aparición',
        body: `Las verticales aparecen en el Generador de Documentos ordenadas por el campo <strong>Orden</strong>. Edita este valor para colocar las verticales más usadas al principio. Si dos verticales tienen el mismo orden, se ordenan alfabéticamente.`
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
        title: 'Configurar un nuevo tenant paso a paso',
        body: `<ol>
  <li>Haz clic en <strong>"Nuevo Tenant"</strong></li>
  <li>Rellena el formulario:
    <ul>
      <li><strong>Nombre</strong> — Nombre descriptivo (ej: "Canon España - PRO")</li>
      <li><strong>URL base</strong> — URL completa de la API REST de Therefore™<br/>
          <em>Cloud:</em> <code>https://empresa.thereforeonline.com/theservice/v0001/restun</code><br/>
          <em>On-premise:</em> <code>https://servidor-interno/theservice/v0001/restun</code></li>
      <li><strong>Usuario</strong> — Usuario de Therefore™ con acceso a la API</li>
      <li><strong>Contraseña</strong> — Contraseña de ese usuario</li>
      <li><strong>TenantName</strong> — Solo para instancias cloud (thereforeonline.com). Déjalo vacío en on-premise.</li>
    </ul>
  </li>
  <li>Haz clic en <strong>"Probar conexión"</strong> para verificar que todo es correcto</li>
  <li>Si el test es exitoso, guarda el tenant</li>
</ol>`
      },
      {
        id: 'tenant-test',
        title: 'Probar la conexión',
        body: `El botón <strong>"Probar conexión"</strong> llama a <code>GetConnectionToken</code> en la API de Therefore™. Si devuelve un token, las credenciales son correctas y el servidor es accesible.
<br/><br/>
<strong>Errores comunes:</strong>
<ul>
  <li><em>401 Unauthorized</em> — Usuario o contraseña incorrectos</li>
  <li><em>404 Not Found</em> — La URL base no es correcta</li>
  <li><em>Network error</em> — El servidor no es accesible desde esta red (revisa VPN o firewall)</li>
  <li><em>TenantName requerido</em> — Instancia cloud sin TenantName configurado</li>
</ul>`
      },
      {
        id: 'tenant-onpremise',
        title: 'Diferencias cloud vs on-premise',
        body: `<ul>
  <li><strong>Cloud (thereforeonline.com)</strong> — Requiere TenantName. La URL sigue el patrón <code>https://empresa.thereforeonline.com/...</code></li>
  <li><strong>On-premise</strong> — TenantName opcional o vacío. La URL apunta al servidor interno. Puede requerir VPN para acceso desde fuera de la red corporativa.</li>
</ul>`
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
        title: 'DOCAI — Clasificación y extracción automática',
        body: `DOCAI es un motor de IA para clasificar documentos y extraer metadatos automáticamente. Se integra con Therefore™ para procesar documentos entrantes sin intervención manual.
<br/><br/>
<strong>Casos de uso:</strong>
<ul>
  <li>Clasificar facturas, albaranes y presupuestos entrantes por proveedor</li>
  <li>Extraer NIF, fecha, importe y número de factura automáticamente</li>
  <li>Enrutar documentos al workflow correcto según su tipo</li>
  <li>Cualquier proyecto donde se reciban documentos a clasificar</li>
</ul>
<strong>Configuración:</strong> URL del servidor DOCAI + clave de API + mapeo de campos.`
      },
      {
        id: 'ws-ivneos',
        title: 'IVNEOS — Notificaciones de la administración',
        body: `IVNEOS gestiona las notificaciones electrónicas de la administración pública española (AEAT, Seguridad Social, DGT, etc.). Se conecta con Therefore™ para archivar las notificaciones descargadas.
<br/><br/>
<strong>Flujo:</strong>
<ol>
  <li>IVNEOS descarga periódicamente las notificaciones pendientes de los organismos configurados</li>
  <li>Las notificaciones se archivan automáticamente en la categoría Therefore™ correspondiente</li>
  <li>Se dispara un workflow de revisión para el responsable</li>
</ol>`
      },
      {
        id: 'ws-ivsign',
        title: 'IvSign — Firma digital',
        body: `IvSign permite enviar documentos a firma desde workflows de Therefore™ y recibir los documentos firmados de vuelta.
<br/><br/>
<strong>Flujo típico:</strong>
<ol>
  <li>Un documento en Therefore™ llega a un paso de firma en el workflow</li>
  <li>IvSign envía el documento al firmante por email o SMS</li>
  <li>El firmante firma electrónicamente desde cualquier dispositivo</li>
  <li>El documento firmado se archiva automáticamente en Therefore™</li>
  <li>El workflow continúa con el siguiente paso</li>
</ol>`
      }
    ]
  },

  bedrockPanel: {
    id: 'bedrockPanel',
    title: 'Panel AWS Bedrock',
    icon: '🤖',
    intro: 'Configura y monitoriza la conexión con AWS Bedrock, el motor de IA que alimenta el Generador de Documentos. Solo administradores.',
    sections: [
      {
        id: 'bedrock-setup',
        title: 'Configurar las credenciales AWS',
        body: `<ol>
  <li>Ve a <strong>AWS Console → IAM</strong> y crea un usuario con permisos <code>bedrock:InvokeModel</code> en la región configurada</li>
  <li>Genera un <strong>Access Key</strong> para ese usuario</li>
  <li>En este panel, ve a la pestaña <strong>"Credenciales"</strong></li>
  <li>Introduce el <code>AWS_ACCESS_KEY_ID</code>, <code>AWS_SECRET_ACCESS_KEY</code> y la <code>AWS_REGION</code> (ej: <code>eu-west-1</code>)</li>
  <li>Haz clic en <strong>"Guardar credenciales"</strong></li>
  <li>Usa el botón <strong>"Test"</strong> para verificar que funcionan</li>
</ol>
<strong>Región recomendada:</strong> <code>eu-west-1</code> (Irlanda) para clientes europeos — menor latencia y cumplimiento GDPR.`
      },
      {
        id: 'bedrock-model',
        title: 'Modelo de IA utilizado',
        body: `El Generador usa <strong>Claude 3 Opus</strong> (o el modelo configurado) para analizar los briefings. Es el modelo más potente de la familia Claude, con capacidad para procesar documentos largos y extraer información estructurada compleja.
<br/><br/>
<strong>Antes de usar Bedrock:</strong> asegúrate de que el modelo está habilitado en tu cuenta AWS. Ve a <em>AWS Bedrock Console → Model access</em> y solicita acceso a los modelos de Anthropic.`
      },
      {
        id: 'bedrock-usage',
        title: 'Monitorización de uso y costes',
        body: `La pestaña <strong>"Uso"</strong> muestra el número de llamadas y tokens consumidos.
<br/><br/>
<strong>Referencia de consumo aproximado:</strong>
<ul>
  <li>Briefing pequeño (1-2 páginas) → ~5.000–10.000 tokens</li>
  <li>Briefing mediano (5-10 páginas) → ~15.000–25.000 tokens</li>
  <li>Briefing grande (20+ páginas) → ~30.000–50.000 tokens</li>
</ul>
El coste exacto depende del modelo y la región. Consulta la calculadora de precios de AWS Bedrock para una estimación.`
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
        title: 'Actualizar datos personales',
        body: `<ol>
  <li>Haz clic en tu avatar en la esquina inferior izquierda del menú</li>
  <li>Selecciona <strong>"Mi perfil"</strong></li>
  <li>Edita los campos que quieras: nombre, apellidos, teléfono, dirección</li>
  <li>Haz clic en <strong>"Guardar cambios"</strong></li>
</ol>`
      },
      {
        id: 'profile-avatar',
        title: 'Cambiar foto de perfil',
        body: `<ol>
  <li>En la página de perfil, haz clic en el avatar circular</li>
  <li>Selecciona una imagen de tu equipo (JPG, PNG, WebP · máx 5 MB)</li>
  <li>La imagen se sube a Supabase Storage y se actualiza inmediatamente</li>
</ol>
La foto aparece en el menú lateral y en el directorio de usuarios para los administradores.`
      },
      {
        id: 'profile-theme',
        title: 'Modo claro / oscuro',
        body: `El modo de visualización se cambia desde el menú de usuario (avatar inferior izquierdo → icono de sol/luna). La preferencia se guarda localmente en el navegador y persiste entre sesiones.`
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
