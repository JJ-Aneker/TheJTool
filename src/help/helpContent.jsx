// Help content for all views — bilingual ES/EN
// Usage: getHelpSections('es') or getHelpSections('en')

const content = {
  es: {
    home: {
      id: 'home',
      title: 'Panel de inicio',
      icon: '🏠',
      intro: 'El Panel de inicio es lo primero que ves al entrar. Desde aquí puedes acceder a cualquier módulo y ver un resumen rápido del estado del sistema.',
      sections: [
        {
          id: 'home-cards',
          title: 'Tarjetas de acceso rápido',
          body: `Las tarjetas del centro son atajos directos a cada módulo. Haz clic en cualquiera para ir inmediatamente a esa funcionalidad, sin necesidad de usar el menú lateral izquierdo.`
        },
        {
          id: 'home-menu',
          title: 'Cómo usar el menú lateral',
          body: `El menú de la izquierda siempre está visible. Haz clic en cualquier elemento para navegar a ese módulo.
<br/><br/>
Si el menú ocupa demasiado espacio, puedes <strong>colapsarlo</strong>: haz clic en la flecha (←) que hay en la cabecera del menú. El menú se comprimirá mostrando solo los iconos. Para volver a expandirlo, haz clic en el logo de la esquina superior izquierda.`
        },
        {
          id: 'home-user',
          title: 'Tu cuenta y preferencias',
          body: `En la parte <strong>inferior izquierda</strong> del menú verás tu avatar (inicial de tu email). Haz clic ahí para abrir el menú de usuario, donde puedes:
<ul>
  <li>Ir a tu <strong>Perfil</strong> para cambiar tus datos</li>
  <li>Cambiar el <strong>idioma</strong> entre Español e Inglés</li>
  <li>Elegir la <strong>Apariencia</strong>: Oscuro, Claro o Informe ejecutivo</li>
  <li>Cerrar sesión</li>
</ul>`
        },
        {
          id: 'home-help',
          title: 'Cómo usar la ayuda',
          body: `En cada pantalla verás un botón <strong>?</strong> en la esquina superior derecha de la cabecera. Al hacer clic se abre un panel lateral con ayuda específica de ese módulo. Desde ese panel también puedes acceder al manual completo.`
        }
      ]
    },

    documentGenerator: {
      id: 'documentGenerator',
      title: 'Generador de documentos',
      icon: '',
      intro: 'Convierte un briefing en un documento Word (EFDT, requisitos, presupuesto, oferta…) en tres pasos: Briefing, Revisión y Documento. Los pasos están arriba y la acción principal de cada uno, en la esquina superior derecha.',
      sections: [
        {
          id: 'dg-step1',
          title: '1. Briefing',
          body: `<ul>
  <li><strong>Qué documento</strong>: elige el tipo, la vertical (si la dejas vacía se detecta sola) y, si quieres, escribe instrucciones para la IA: CIFs, integraciones, presupuesto máximo, licencias…</li>
  <li><strong>Material de partida</strong>: sube el briefing y los documentos del cliente (PDF, Word, TXT, HTML o correos .eml). Puedes subir varios a la vez.</li>
  <li><strong>Portada</strong>: sin portada, la de por defecto o una personalizada (PNG A4, 794 × 1123 px). Las portadas que subas quedan guardadas para otros documentos.</li>
</ul>
Pulsa <strong>Analizar briefing</strong>. Tarda entre 20 y 60 segundos. Tras el análisis, los documentos subidos se borran del almacenamiento.`
        },
        {
          id: 'dg-review',
          title: '2. Revisión',
          body: `<ul>
  <li>A la izquierda tienes el <strong>índice</strong> para saltar a cada sección: cliente, alcance, licencias, estimación, estructura, avisos y planificación.</li>
  <li>A la derecha, el <strong>resumen</strong> con esfuerzo, tarifa, importe, IVA y total. La tarifa sale de la vertical y puedes cambiarla: los importes se recalculan.</li>
  <li>En la <strong>estimación</strong> puedes editar días u horas, añadir o quitar tareas y marcar una tarea como <em>Pendiente</em>: aparece en el documento sin importe y no suma.</li>
  <li><strong>Pedir cambios a la IA</strong> (arriba a la derecha): describe el cambio, por ejemplo «Reduce la estimación a 8 días». Si no te convence, pulsa <strong>Deshacer</strong>.</li>
  <li>En <strong>Avisos</strong> verás los datos que faltan; <em>Completar con la IA</em> te prepara la instrucción.</li>
  <li>La <strong>planificación</strong> se actualiza sola al cambiar la estimación. Elige la fecha de inicio y descarga el Gantt en Excel.</li>
</ul>
Cuando esté listo, pulsa <strong>Generar documento</strong>.`
        },
        {
          id: 'dg-done',
          title: '3. Documento',
          body: `Descarga el Word desde <strong>Descargar Word</strong>. También puedes descargar el Gantt, volver a la revisión para cambiar algo o empezar un documento nuevo.
<br/><strong>Antes de enviarlo:</strong> abre el documento en Word, pulsa Ctrl+A y F9 para actualizar el índice y sustituye los marcadores como &lt;&lt;EMPRESA CLIENT&gt;&gt;.`
        }
      ]
    },

    eformBuilder: {
      id: 'eformBuilder',
      title: 'Therefore™ eForms Builder',
      icon: '📋',
      intro: 'El constructor de eForms te permite crear formularios electrónicos para Therefore™ sin tocar XML ni código. Diseña el formulario aquí y exporta el archivo XML listo para importar en Solution Designer.',
      sections: [
        {
          id: 'ef-concept',
          title: '¿Qué es un eForm y para qué sirve?',
          body: `Un <strong>eForm</strong> (formulario electrónico) es la interfaz que los usuarios ven en Therefore™ para rellenar datos al crear o procesar un documento. Por ejemplo: un formulario de solicitud de vacaciones, una ficha de proveedor, o un formulario de aprobación de facturas.
<br/><br/>
Los eForms se componen de <strong>paneles</strong> (agrupaciones de campos) y dentro de cada panel hay <strong>campos</strong> de distintos tipos (texto, fecha, desplegable, etc.).`
        },
        {
          id: 'ef-create',
          title: 'Crear un eForm desde cero',
          body: `<ol>
  <li>Escribe el <strong>nombre del formulario</strong> en el campo de la parte superior (ej: "Solicitud de material")</li>
  <li>Haz clic en <strong>"+ Panel"</strong> para crear la primera sección</li>
  <li>Dale un nombre al panel (ej: "Datos del solicitante")</li>
  <li>Dentro del panel, haz clic en <strong>"+ Campo"</strong> para añadir un campo</li>
  <li>Configura el campo:
    <ul>
      <li><strong>Nombre</strong>: la etiqueta que verá el usuario (ej: "Nombre completo")</li>
      <li><strong>Key</strong>: identificador técnico, se genera automáticamente pero puedes cambiarlo</li>
      <li><strong>Tipo</strong>: text, email, fecha, número, desplegable, etc.</li>
      <li><strong>Obligatorio</strong>: activa si el campo es requerido para enviar el formulario</li>
      <li><strong>Placeholder</strong>: texto de ayuda dentro del campo (ej: "Ej: Juan García")</li>
    </ul>
  </li>
  <li>Repite los pasos 4-5 para cada campo del panel</li>
  <li>Añade más paneles si necesitas organizar los campos en secciones distintas</li>
</ol>`
        },
        {
          id: 'ef-types',
          title: 'Tipos de campo disponibles',
          body: `<table style="width:100%;font-size:11px;border-collapse:collapse">
  <thead><tr style="border-bottom:1px solid var(--border-default)">
    <th style="text-align:left;padding:6px 8px">Tipo</th>
    <th style="text-align:left;padding:6px 8px">Cuándo usarlo</th>
  </tr></thead>
  <tbody>
    <tr><td style="padding:5px 8px"><strong>text</strong></td><td style="padding:5px 8px">Cualquier texto libre de una línea</td></tr>
    <tr style="background:var(--bg-canvas)"><td style="padding:5px 8px"><strong>email</strong></td><td style="padding:5px 8px">Dirección de correo electrónico (valida el formato)</td></tr>
    <tr><td style="padding:5px 8px"><strong>phone</strong></td><td style="padding:5px 8px">Número de teléfono</td></tr>
    <tr style="background:var(--bg-canvas)"><td style="padding:5px 8px"><strong>date</strong></td><td style="padding:5px 8px">Fecha (muestra un calendario al hacer clic)</td></tr>
    <tr><td style="padding:5px 8px"><strong>datetime</strong></td><td style="padding:5px 8px">Fecha y hora combinadas</td></tr>
    <tr style="background:var(--bg-canvas)"><td style="padding:5px 8px"><strong>number</strong></td><td style="padding:5px 8px">Número entero o decimal</td></tr>
    <tr><td style="padding:5px 8px"><strong>money</strong></td><td style="padding:5px 8px">Importe monetario (con formato de moneda)</td></tr>
    <tr style="background:var(--bg-canvas)"><td style="padding:5px 8px"><strong>checkbox</strong></td><td style="padding:5px 8px">Casilla de verificación Sí / No</td></tr>
    <tr><td style="padding:5px 8px"><strong>select</strong></td><td style="padding:5px 8px">Lista desplegable con opciones predefinidas</td></tr>
  </tbody>
</table>`
        },
        {
          id: 'ef-csv',
          title: 'Importar todos los campos desde CSV (más rápido)',
          body: `Si ya tienes los campos definidos en Excel o en un documento, puedes crearlos todos de golpe con el importador CSV. Es mucho más rápido que añadirlos uno a uno.
<br/><br/>
<strong>Cómo hacerlo:</strong>
<ol>
  <li>Haz clic en el botón <strong>"📤 Importar CSV"</strong> (en la barra de herramientas superior)</li>
  <li>Prepara tu tabla con estas columnas (separadas por punto y coma <code>;</code>):<br/>
      <code>Nombre ; Key ; Tipo ; Obligatorio ; Placeholder ; Default ; MaxLength ; Seccion ; Options</code></li>
  <li>Pega el texto en el área del modal</li>
  <li>Haz clic en <strong>"Analizar →"</strong> para ver una vista previa de los campos</li>
  <li>Si todo está bien, haz clic en:
    <ul>
      <li><strong>"Reemplazar"</strong> — borra todo lo que hay y crea los nuevos campos</li>
      <li><strong>"Añadir"</strong> — añade los nuevos campos a los paneles existentes</li>
    </ul>
  </li>
</ol>
<strong>Ejemplo completo — copia este texto y pégalo en el modal:</strong>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;overflow-x:auto;margin:8px 0;white-space:pre">Nombre;Key;Tipo;Obligatorio;Placeholder;Default;MaxLength;Seccion;Options
Nombre completo;nombre;text;si;Ej: María García;;100;DATOS PERSONALES
Email;email;email;si;correo@empresa.com;;;DATOS PERSONALES
Teléfono;telefono;phone;no;+34 600 000 000;;;DATOS PERSONALES
Departamento;departamento;select;si;;;;DATOS PERSONALES;Contabilidad|Recursos Humanos|Ventas|IT|Dirección
Fecha de solicitud;fechaSolicitud;date;si;;;;SOLICITUD
Tipo de solicitud;tipoSolicitud;select;si;;;;SOLICITUD;Vacaciones|Permiso|Teletrabajo
Días solicitados;diasSolicitados;number;si;;;;SOLICITUD
Motivo;motivo;text;no;Descripción breve del motivo;;300;SOLICITUD</pre>
<strong>Reglas importantes:</strong>
<ul>
  <li>Solo <strong>Nombre</strong> es obligatorio — el resto de columnas son opcionales</li>
  <li>Para campos <strong>select</strong>: pon las opciones en la columna <em>Options</em> separadas por <code>|</code></li>
  <li>Para dar etiqueta diferente al valor: usa <code>valor=Etiqueta</code>, ej: <code>ESP=España|FRA=Francia</code></li>
  <li>La columna <em>Seccion</em> define el nombre del panel. Campos con la misma sección van al mismo panel.</li>
</ul>`
        },
        {
          id: 'ef-export',
          title: 'Exportar e importar en Therefore™',
          body: `<ol>
  <li>Cuando el formulario esté listo, haz clic en <strong>"Exportar XML"</strong></li>
  <li>Se descarga un archivo <code>.xml</code> en tu carpeta de descargas</li>
  <li>Abre <strong>Therefore™ Solution Designer</strong></li>
  <li>Selecciona la categoría donde quieres añadir el eForm</li>
  <li>Ve a la pestaña <em>eForms</em></li>
  <li>Haz clic en <strong>Import eForm</strong> y selecciona el archivo XML descargado</li>
  <li>Guarda los cambios en Solution Designer</li>
</ol>
<strong>⚠️ Importante:</strong> Si quieres <em>modificar</em> un eForm ya existente en Therefore™, primero expórtalo desde Solution Designer, luego haz los cambios y vuelve a importarlo. No intentes editar el XML a mano.`
        }
      ]
    },

    eformGeneratorAI: {
      id: 'eformGeneratorAI',
      title: 'Generador de eForms IA',
      icon: '⚡',
      intro: 'Crea eForms de Therefore™ usando lenguaje natural. Describe el formulario que necesitas y la IA lo genera automáticamente con todas las funcionalidades avanzadas: QR, lookups, modales, firmas, validaciones JavaScript y más.',
      sections: [
        {
          id: 'eform-ai-how',
          title: 'Cómo funciona — Flujo en 3 pasos',
          body: `<ol>
  <li><strong>Describe tu eForm</strong> en lenguaje natural (ej: "Formulario de alta de cliente con NIF, nombre, email y teléfono")</li>
  <li><strong>Mejorar Prompt</strong> — La IA analiza tu descripción y genera un prompt detallado (editable)</li>
  <li><strong>Generar eForm</strong> — La IA crea el JSON de form.io y el XML de Therefore™ listo para importar</li>
</ol>
<strong>Todo en una pantalla</strong> — no necesitas navegar entre pasos. El prompt se muestra en el mismo cuadro de texto para que puedas editarlo antes de generar.`
        },
        {
          id: 'eform-ai-basic',
          title: 'Ejemplos básicos — Copia y pega',
          body: `<strong>Alta de cliente simple:</strong>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;margin:8px 0">Crear eForm para dar de alta clientes. Campos: NIF (obligatorio), nombre completo, email, teléfono, dirección fiscal.</pre>

<strong>Solicitud de vacaciones:</strong>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;margin:8px 0">Formulario de solicitud de vacaciones. Campos: empleado (nombre), departamento (desplegable: RRHH, Ventas, IT, Dirección), fecha inicio, fecha fin, días solicitados (número), motivo.</pre>

<strong>Registro de facturas:</strong>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;margin:8px 0">eForm de registro de facturas. Campos: número factura, proveedor, fecha, importe (dinero), estado (desplegable: Pendiente, Aprobada, Pagada).</pre>`
        },
        {
          id: 'eform-ai-columns',
          title: 'Organizar en columnas',
          body: `Para formularios con muchos campos, puedes organizarlos en **varias columnas** para aprovechar mejor el espacio.

<strong>💡 Consejo rápido:</strong> Activa el bloque **"📊 Diseño 2 columnas"** o **"📊 Diseño 3 columnas"** en la sección "Formato y diseño" para que la IA lo aplique automáticamente. O descríbelo en el prompt.

<strong>Ejemplo — 2 columnas:</strong>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;margin:8px 0">Crear eForm de alta de proveedor organizado en 2 columnas.

Columna izquierda:
- Nombre fiscal (obligatorio)
- NIF (obligatorio)
- Email
- Teléfono

Columna derecha:
- Dirección
- Ciudad
- Código postal
- País</pre>

<strong>Ejemplo — 3 columnas:</strong>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;margin:8px 0">Formulario de datos personales en 3 columnas: nombre, apellidos y DNI en fila 1; email, teléfono y fecha nacimiento en fila 2.</pre>`
        },
        {
          id: 'eform-ai-logo',
          title: 'Logo o imagen de cabecera',
          body: `Puedes incluir un **logo o imagen** en la parte superior del formulario.

<strong>💡 Consejo rápido:</strong> Activa el bloque **"🖼️ Cabecera corporativa"** en la sección "Formato y diseño" para que la IA lo incluya automáticamente. O descríbelo en el prompt.

<strong>Con URL específica:</strong>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;margin:8px 0">Formulario de solicitud de material. Incluir logo en la parte superior con URL: https://empresa.com/logo.png

Campos: solicitante, departamento, material solicitado, cantidad, urgente (sí/no).</pre>

<strong>Con placeholder:</strong>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;margin:8px 0">eForm de registro con una imagen de cabecera centrada (placeholder para logo corporativo).

Campos: título, descripción, categoría, fecha.</pre>`
        },
        {
          id: 'eform-ai-lookup',
          title: 'Lookup — Campo desde categoría Therefore™',
          body: `Los **lookups** poblan un campo dropdown consultando otra categoría de Therefore™ (tabla maestra).

<strong>Activar el bloque predefinido:</strong>
<ol>
  <li>Marca **"🔍 Buscar en categoría maestra"** en bloques predefinidos</li>
  <li>Describe en el prompt qué campo se llena desde dónde</li>
</ol>

<strong>Ejemplo — Cliente desde maestro:</strong>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;margin:8px 0">Formulario de pedido. El campo "Cliente" debe poblarse consultando la categoría Therefore™ "Maestro_Clientes". Mostrar en el dropdown: nombre del cliente (IdxF_NombreCliente) y NIF (IdxF_NIF).

Otros campos: número pedido, fecha, importe.</pre>

<strong>Ejemplo — Proyecto activo:</strong>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;margin:8px 0">eForm de imputación de horas. Campo "Proyecto" es un dropdown que consulta la categoría "Proyectos_Activos" mostrando código proyecto (IdxF_Codigo) y nombre (IdxF_Nombre).

Al seleccionar un proyecto, rellenar automáticamente el campo "Cliente" con IdxF_Cliente de ese proyecto.

Otros campos: empleado, fecha, horas, descripción tarea.</pre>`
        },
        {
          id: 'eform-ai-qr',
          title: 'Lector QR / Códigos de barras',
          body: `Activa el bloque **"📷 Lector QR"** para incluir un botón que abre la cámara y lee códigos QR o de barras.

<strong>Ejemplo — Registro de libros:</strong>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;margin:8px 0">Formulario de registro de libros en biblioteca con lector QR.

Campo "Código" con botón QR que rellena el campo al escanear.

Otros campos: título, autor, ISBN, editorial, fecha alta.</pre>

<strong>Ejemplo — Control de activos:</strong>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;margin:8px 0">eForm de inventario con lector de código de barras en campo "Código activo".

Campos: código activo (con QR), descripción, ubicación, estado (desplegable: Operativo, Mantenimiento, Baja), responsable.</pre>`
        },
        {
          id: 'eform-ai-autofill',
          title: 'Autorrelleno con usuario conectado',
          body: `El bloque **"👤 Autorrelleno"** rellena automáticamente campos con los datos del usuario que está conectado en Therefore™.

<strong>Ejemplo — Solicitud genérica:</strong>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;margin:8px 0">Formulario de solicitud interna.

Campos "Solicitante" y "Email solicitante" deben rellenarse automáticamente con el nombre y email del usuario conectado en Therefore™.

Otros campos: tipo solicitud (desplegable), descripción, fecha necesaria, urgente (sí/no).</pre>`
        },
        {
          id: 'eform-ai-signature',
          title: 'Firma manuscrita (canvas)',
          body: `El bloque **"✍️ Firma"** añade un canvas donde el usuario puede firmar con el ratón o el dedo (en tablet/móvil).

<strong>Ejemplo — Conformidad:</strong>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;margin:8px 0">Formulario de conformidad de entrega.

Campos: número albarán, cliente, fecha entrega, conforme (sí/no), observaciones.

Campo final "Firma del receptor" como canvas de firma manuscrita (obligatorio).</pre>`
        },
        {
          id: 'eform-ai-modal',
          title: 'Modal de actualización de datos',
          body: `El bloque **"✏️ Modal"** crea un botón que abre una ventana emergente para actualizar datos de una categoría existente.

<strong>Ejemplo — Actualizar cliente:</strong>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;margin:8px 0">Formulario de pedido con botón "Actualizar datos cliente".

Al hacer clic, abre modal que permite modificar: teléfono, email y dirección del cliente seleccionado en la categoría "Maestro_Clientes".</pre>`
        },
        {
          id: 'eform-ai-category',
          title: 'Subir XML de categoría (RECOMENDADO)',
          body: `**⭐ Funcionalidad estrella:** Si subes el **XML de la categoría destino**, la IA detecta automáticamente todos los campos y genera el eForm perfectamente mapeado.

<strong>🎯 Ventajas de usar el XML:</strong>
<ul>
  <li>✅ La IA usa los **ColName exactos** de Therefore™ (no inventa nombres)</li>
  <li>✅ Detecta **campos obligatorios** automáticamente</li>
  <li>✅ Respeta **longitudes máximas** de cada campo</li>
  <li>✅ Mapea **tipos de datos** correctamente (String → textfield, Integer → number, Date → datetime, etc.)</li>
  <li>✅ Muestra tabla visual con todos los campos detectados</li>
  <li>✅ **Cero errores de mapeo** — las keys coinciden 100% con la categoría</li>
</ul>

<strong>📋 Cómo hacerlo:</strong>
<ol>
  <li>En <strong>Therefore™ Solution Designer</strong>: selecciona la categoría → <em>File → Export Configuration</em> → guarda el XML</li>
  <li>En el <strong>Generador IA</strong>: sección "Categoría destino (opcional)" → botón <em>"Subir XML de categoría"</em></li>
  <li>Aparece una **tabla con todos los campos detectados**: ColName, Caption, Tipo, Longitud máxima, Obligatorio</li>
  <li>Describe tu eForm normalmente — la IA usará automáticamente los campos de la tabla</li>
  <li>Haz clic en <strong>"Mejorar Prompt"</strong> — verás que el prompt incluye los ColName exactos</li>
</ol>

<strong>✨ Ejemplo con XML subido (categoría "Contratos - Empresas"):</strong>

<em>Campos detectados en la tabla:</em>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:6px 10px;font-size:10px;margin:8px 0">ColName           Caption              Tipo     Long.  Oblig.
CIF               CIF                  String   25     ✓
Razon_Social      Razón Social         String   50     -
Domicilio_Social  Domicilio Social     String   500    -
Nota_Legal        Aviso Legal          String   500    -
url_logo          url_logo             String   250    -</pre>

<em>Tu prompt puede ser simple:</em>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;margin:8px 0">Formulario para registrar nuevas sociedades contractuales.
Organizar en 2 secciones: identificación y datos legales.
El CIF debe validarse con patrón de CIF español.</pre>

<em>La IA generará automáticamente:</em>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;margin:8px 0">{
  "components": [
    { "key": "CIF", "type": "textfield", "validate": {
        "required": true,
        "maxLength": 25,
        "pattern": "^[A-Z][0-9]{8}$"
      }
    },
    { "key": "Razon_Social", "type": "textfield", "validate": { "maxLength": 50 } },
    { "key": "Domicilio_Social", "type": "textarea", "validate": { "maxLength": 500 } },
    { "key": "Nota_Legal", "type": "textarea", "validate": { "maxLength": 500 } },
    { "key": "url_logo", "type": "textfield", "validate": { "maxLength": 250 } }
  ]
}</pre>

<strong>💡 ¿Y si NO subo XML?</strong> Sin problema — la IA genera el eForm igual, pero inventará nombres de campos genéricos (cliente, nif, etc.). Luego deberás mapear manualmente en el perfil de indexación de Therefore™.

<strong>⚠️ Importante:</strong> El XML debe ser una **exportación completa de la categoría** desde Solution Designer, no un XML de eForm.`
        },
        {
          id: 'eform-ai-environment',
          title: 'Entorno: Online vs On-Premise',
          body: `Selecciona el **entorno destino** para que la IA genere código compatible:

<table style="width:100%;font-size:11px;border-collapse:collapse;margin:8px 0">
  <thead><tr style="border-bottom:1px solid var(--border-default)">
    <th style="text-align:left;padding:6px 8px">Entorno</th>
    <th style="text-align:left;padding:6px 8px">Cuándo usar</th>
    <th style="text-align:left;padding:6px 8px">Diferencias</th>
  </tr></thead>
  <tbody>
    <tr><td style="padding:5px 8px"><strong>Therefore Online</strong></td><td style="padding:5px 8px">Instancia cloud (*.thereforeonline.com)</td><td style="padding:5px 8px">Usa GetConnectionToken para autenticación</td></tr>
    <tr style="background:var(--bg-canvas)"><td style="padding:5px 8px"><strong>On-Premise</strong></td><td style="padding:5px 8px">Instalación local en servidor de cliente</td><td style="padding:5px 8px">Usa Basic Auth, GetConnectionToken devuelve 500</td></tr>
  </tbody>
</table>

**Importante:** Elige el correcto o el eForm no funcionará al consultar la API de Therefore™.`
        },
        {
          id: 'eform-ai-download',
          title: 'Descargar e importar el XML',
          body: `Cuando el eForm esté generado:
<ol>
  <li>Revisa la pestaña <strong>"Resumen"</strong> — tabla con todos los campos creados</li>
  <li>Revisa <strong>"Avisos"</strong> (amarillos) — son informativos, no bloquean la descarga</li>
  <li>Haz clic en <strong>"Descargar XML"</strong></li>
  <li>Se descarga <code>TheConfiguration_&lt;FormID&gt;.xml</code> en tu carpeta de descargas</li>
  <li>Abre <strong>Therefore™ Solution Designer</strong></li>
  <li>Selecciona la categoría destino → pestaña <em>eForms</em></li>
  <li>Haz clic en <strong>Import eForm</strong> y selecciona el XML</li>
  <li>Guarda los cambios en Solution Designer</li>
</ol>

<strong>⚠️ Si el eForm ya existe</strong> en Therefore™ con ese FormID, se sobreescribirá. Exporta primero como backup.`
        },
        {
          id: 'eform-ai-historial',
          title: 'Historial de generaciones',
          body: `Todas tus generaciones se guardan automáticamente. Para ver el historial:
<ol>
  <li>Haz clic en el paso <strong>"5. Historial"</strong> en la parte superior</li>
  <li>Verás una tabla con: fecha, nombre del formulario, FormID, entorno, estado</li>
  <li>Haz clic en <strong>"Ver"</strong> para cargar una generación anterior</li>
  <li>Puedes descargar de nuevo el XML o editarlo y regenerar</li>
</ol>`
        },
        {
          id: 'eform-ai-tips',
          title: 'Consejos y buenas prácticas',
          body: `<strong>✅ Buenas prácticas:</strong>
<ul>
  <li>Sé específico con los nombres de campo: "NIF del proveedor" mejor que solo "NIF"</li>
  <li>Indica qué campos son obligatorios en el prompt</li>
  <li>Para selects/dropdowns, lista todas las opciones que quieres</li>
  <li>Si hay validaciones especiales, descríbelas (ej: "NIF debe validarse con algoritmo")</li>
  <li>Usa "Mejorar Prompt" siempre — la IA añade detalles técnicos importantes</li>
</ul>

<strong>⚠️ Evita:</strong>
<ul>
  <li>Descripciones muy vagas como "formulario general de datos"</li>
  <li>Mezclar múltiples formularios en una sola petición</li>
  <li>Pedir funcionalidades que Therefore™ no soporta nativamente</li>
</ul>

<strong>💡 Truco:</strong> Si no estás seguro de cómo pedirlo, empieza simple y usa "Refinar" (próximamente) para ir añadiendo funcionalidades.`
        }
      ]
    },

    thereforeMigrator: {
      id: 'thereforeMigrator',
      title: 'Migrador de documentos',
      icon: '',
      intro: 'Copia documentos (archivos e índices) de una categoría de Therefore™ a otra, en la misma u otra instancia, o descárgalos a una carpeta de tu equipo con un Excel de índices.',
      sections: [
        {
          id: 'mg-steps',
          title: 'Cómo se hace',
          body: `<ol>
  <li><strong>Origen</strong>: elige la instancia (de las guardadas en <em>Instancias</em>) y la categoría. Debajo puedes filtrar qué documentos migrar por cualquier campo (texto con <code>*</code> como comodín, o rangos de fechas y números) y por número de documento. <em>Contar documentos</em> te dice cuántos cumplen los filtros.</li>
  <li><strong>Destino</strong>: <em>Copiar a otra categoría</em> (instancia y categoría) o <em>Descargar a una carpeta</em> (solo Chrome o Edge).</li>
  <li><strong>Campos</strong>: los campos se emparejan solos por nombre. Revisa la tabla y cambia lo que haga falta; los que dejes en <em>No copiar</em> quedan vacíos en el destino.</li>
  <li><strong>Opciones</strong>: máximo de documentos y documentos en paralelo. Pulsa <em>Ver los 3 primeros</em> para comprobar cómo quedan los índices sin escribir nada.</li>
  <li><strong>Migrar</strong>: verás el avance, los errores y el tiempo restante. Mantén la pestaña abierta.</li>
</ol>`
        },
        {
          id: 'mg-safe',
          title: 'Sin duplicados y reanudable',
          body: `Cada documento copiado queda registrado. Si repites la migración o la continúas tras detenerla, los que ya se copiaron se saltan.
<br/>Para guardar este registro en la base de datos hay que ejecutar una vez <code>supabase/migrations/20261124_migrator.sql</code> en Supabase; sin él, se guarda solo en este navegador.`
        },
        {
          id: 'mg-limits',
          title: 'Límites',
          body: `<ul>
  <li>No se copian campos de tabla ni contadores (los contadores los genera Therefore™ en el destino).</li>
  <li>Si un campo obligatorio del destino queda sin asignar, la creación de documentos fallará: asígnale un campo de origen.</li>
  <li>Para migraciones muy grandes (decenas de miles de documentos) es mejor una herramienta de escritorio que no dependa del navegador.</li>
</ul>
Al terminar puedes descargar un informe en Excel con el número de cada documento en origen y destino.`
        }
      ]
    },

    categoryBuilder: {
      id: 'categoryBuilder',
      title: 'Generador de Categorías',
      icon: '🏗️',
      intro: 'Crea la estructura de categorías de Therefore™ visualmente. Define los campos de índice, organízalos en secciones y pestañas, y exporta el XML listo para importar en Solution Designer.',
      sections: [
        {
          id: 'cat-concept',
          title: '¿Qué es una categoría en Therefore™?',
          body: `Una <strong>categoría</strong> define cómo se almacenan y clasifican los documentos de un tipo concreto. Por ejemplo: "Facturas de proveedor", "Contratos", "Expedientes de empleado".
<br/><br/>
Cada categoría tiene <strong>campos de índice</strong>: datos que se guardan junto al documento para poder buscarlo y filtrarlo. Por ejemplo, una categoría de facturas tendría campos como "Proveedor", "Número de factura", "Fecha" e "Importe".`
        },
        {
          id: 'cat-create',
          title: 'Crear una categoría paso a paso',
          body: `<ol>
  <li>Haz clic en <strong>"+ Categoría"</strong> en el panel de la izquierda</li>
  <li>Escribe el nombre de la categoría (ej: "Facturas de proveedor")</li>
  <li>Haz clic en <strong>"+ Sección"</strong> para añadir un grupo de campos (ej: "PROVEEDOR", "FACTURA")</li>
  <li>Dentro de la sección, haz clic en <strong>"+ Campo"</strong> para añadir campos</li>
  <li>Para cada campo, configura:
    <ul>
      <li><strong>Nombre</strong>: cómo se llamará en la interfaz de Therefore™</li>
      <li><strong>Tipo</strong>: String, Entero, Fecha, Dinero, Lógico, Lookup, Table…</li>
      <li><strong>Longitud</strong>: para campos String, el número máximo de caracteres</li>
      <li><strong>Obligatorio</strong>: si es requerido al crear un documento</li>
      <li><strong>Pestaña</strong>: (opcional) para organizar los campos en tabs</li>
    </ul>
  </li>
  <li>Repite hasta tener todos los campos</li>
  <li>Haz clic en <strong>"Exportar XML"</strong> para descargar el archivo de configuración</li>
</ol>`
        },
        {
          id: 'cat-fieldtypes',
          title: 'Tipos de campo y cuándo usar cada uno',
          body: `<table style="width:100%;font-size:11px;border-collapse:collapse">
  <thead><tr style="border-bottom:1px solid var(--border-default)">
    <th style="text-align:left;padding:6px 8px">Tipo</th>
    <th style="text-align:left;padding:6px 8px">Cuándo usarlo</th>
    <th style="text-align:left;padding:6px 8px">Requiere Longitud</th>
  </tr></thead>
  <tbody>
    <tr><td style="padding:5px 8px"><strong>String</strong></td><td style="padding:5px 8px">Texto libre: nombres, referencias, descripciones</td><td style="padding:5px 8px">Sí</td></tr>
    <tr style="background:var(--bg-canvas)"><td style="padding:5px 8px"><strong>Entero</strong></td><td style="padding:5px 8px">Números sin decimales: cantidad, nº de serie</td><td style="padding:5px 8px">No</td></tr>
    <tr><td style="padding:5px 8px"><strong>Fecha</strong></td><td style="padding:5px 8px">Fechas sin hora: fecha factura, fecha contrato</td><td style="padding:5px 8px">No</td></tr>
    <tr style="background:var(--bg-canvas)"><td style="padding:5px 8px"><strong>Dinero</strong></td><td style="padding:5px 8px">Importes con decimales: importe, total, IVA</td><td style="padding:5px 8px">No</td></tr>
    <tr><td style="padding:5px 8px"><strong>Lógico</strong></td><td style="padding:5px 8px">Sí/No: aprobado, pagado, urgente</td><td style="padding:5px 8px">No</td></tr>
    <tr style="background:var(--bg-canvas)"><td style="padding:5px 8px"><strong>Fecha y hora</strong></td><td style="padding:5px 8px">Marcas de tiempo: fecha de recepción, vencimiento</td><td style="padding:5px 8px">No</td></tr>
    <tr><td style="padding:5px 8px"><strong>Lookup</strong></td><td style="padding:5px 8px">Lista de valores predefinidos: estado, tipo de documento</td><td style="padding:5px 8px">No</td></tr>
    <tr style="background:var(--bg-canvas)"><td style="padding:5px 8px"><strong>Table</strong></td><td style="padding:5px 8px">Tabla de múltiples filas: líneas de factura, albaranes</td><td style="padding:5px 8px">No</td></tr>
  </tbody>
</table>`
        },
        {
          id: 'cat-csv',
          title: 'Importar campos desde CSV (la forma más rápida)',
          body: `Si tienes la definición de campos en Excel o un documento, puedes importarlos todos de golpe. Esto ahorra mucho tiempo en categorías con muchos campos.
<br/><br/>
<strong>Cómo hacerlo:</strong>
<ol>
  <li>Haz clic en <strong>"📤 Importar CSV"</strong></li>
  <li>Prepara tu tabla con estas columnas (separadas por <code>;</code>):<br/>
      <code>Categoría ; Pestaña ; Sección ; Nombre ; Tipo ; Longitud ; Obligatorio ; TablaParent</code></li>
  <li>Pega el texto en el modal y haz clic en <strong>"Analizar →"</strong></li>
  <li>Si el análisis es correcto, haz clic en <strong>"Aplicar"</strong></li>
</ol>
<strong>Ejemplo completo — categoría de facturas con tabla de líneas (copia y pega):</strong>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;overflow-x:auto;margin:8px 0;white-space:pre">Categoría;Pestaña;Sección;Nombre;Tipo;Longitud;Obligatorio;TablaParent
Facturas;General;PROVEEDOR;Nombre proveedor;string;200;si
Facturas;General;PROVEEDOR;NIF proveedor;string;20;si
Facturas;General;PROVEEDOR;Email proveedor;string;150;no
Facturas;General;FACTURA;Número factura;string;50;si
Facturas;General;FACTURA;Fecha factura;fecha;;si
Facturas;General;FACTURA;Importe total;dinero;;si
Facturas;General;FACTURA;Estado;lookup;;no
Facturas;Líneas;LÍNEAS;Líneas de factura;tabla;;no
Facturas;Líneas;LÍNEAS;Descripción artículo;string;200;si;Líneas de factura
Facturas;Líneas;LÍNEAS;Cantidad;entero;;si;Líneas de factura
Facturas;Líneas;LÍNEAS;Precio unitario;dinero;;si;Líneas de factura
Facturas;Líneas;LÍNEAS;Subtotal;dinero;;no;Líneas de factura</pre>
<strong>Cómo funcionan los campos de tabla (TablaParent):</strong>
<ul>
  <li>Primero define la fila del campo <code>tabla</code> con <em>TablaParent vacío</em> (ej: "Líneas de factura")</li>
  <li>Luego añade las columnas de esa tabla poniendo el <strong>nombre exacto</strong> del campo tabla en la columna <em>TablaParent</em></li>
  <li>El sistema asocia automáticamente las columnas al campo tabla correspondiente</li>
</ul>
<strong>Alias de tipo aceptados en el CSV:</strong><br/>
string / texto / text · entero / number / int · fecha / date · dinero / money / decimal · boolean / checkbox · datetime · lookup / lista / combo · tabla / table / grid`
        },
        {
          id: 'cat-tabs',
          title: 'Pestañas — organizar campos en vistas',
          body: `Las pestañas permiten dividir los campos de una categoría en varias <strong>vistas separadas</strong> en Therefore™. Esto es muy útil cuando una categoría tiene muchos campos y quieres agruparlos temáticamente.
<br/><br/>
<strong>Cómo asignar un campo a una pestaña:</strong>
<ol>
  <li>Selecciona el campo en el editor</li>
  <li>En el desplegable <strong>"Pestaña"</strong>, elige una existente o escribe el nombre de una nueva</li>
  <li>El campo quedará asignado a esa pestaña</li>
</ol>
<strong>Tip:</strong> Los campos sin pestaña asignada aparecen en la vista principal. En el CSV, rellena la columna <em>Pestaña</em> con el nombre de la vista (ej: "General", "Líneas", "Adjuntos").`
        },
        {
          id: 'cat-export',
          title: 'Exportar e importar en Therefore™',
          body: `<ol>
  <li>Haz clic en <strong>"Exportar XML"</strong> — se descarga el archivo de configuración</li>
  <li>Abre <strong>Therefore™ Solution Designer</strong></li>
  <li>Ve al menú <em>File → Import Configuration</em></li>
  <li>Selecciona el XML descargado y confirma</li>
  <li>La categoría aparecerá en el árbol de Solution Designer lista para configurar permisos y workflows</li>
</ol>
<strong>⚠️ Si importas sobre una categoría existente</strong> con el mismo nombre, se sobreescribirá. Haz siempre un Export previo como copia de seguridad.
<br/><br/>
<strong>Tip:</strong> Puedes generar <em>varias categorías a la vez</em> usando diferentes valores en la columna "Categoría" del CSV. El XML resultante las incluye todas en un único archivo.`
        }
      ]
    },

    thereforeReporter: {
      id: 'thereforeReporter',
      title: 'Generador de informes',
      icon: '',
      intro: 'Cuenta y analiza documentos de Therefore™ por periodo. Un informe guarda qué categorías y campos consultar; después lo abres y eliges el periodo.',
      sections: [
        {
          id: 'rep-create',
          title: 'Crear un informe',
          body: `<ol>
  <li>Pulsa <strong>Nuevo informe</strong>, ponle un nombre y elige la <strong>instancia de Therefore™</strong>. La conexión se hace sola.</li>
  <li>A la izquierda, marca una o varias <strong>categorías</strong> (puedes buscarlas por nombre).</li>
  <li>A la derecha aparecen los <strong>campos</strong> que tienen en común. Marca los que quieres ver.</li>
  <li>Incluye al menos un campo de <strong>Fecha</strong>: es el que se usa para elegir el periodo.</li>
  <li>Marca <strong>Gráfico</strong> en los campos por los que quieras agrupar (estado, proveedor…).</li>
  <li>Pulsa <strong>Guardar</strong>.</li>
</ol>
Si una instancia on-premise no está accesible desde internet, la aplicación se conecta directamente desde tu navegador (necesitarás estar en la red o VPN del cliente).`
        },
        {
          id: 'rep-run',
          title: 'Ejecutar y consultar',
          body: `<ol>
  <li>En la lista, pulsa <strong>Abrir</strong>. Si ya lo ejecutaste antes, verás el último resultado guardado sin esperar.</li>
  <li>Elige el periodo con los atajos (<em>7 días, 30 días, Este mes, Mes pasado, Este año</em>) o con las fechas.</li>
  <li>Pulsa <strong>Ejecutar</strong> o <strong>Actualizar</strong>. El informe recuerda el campo de fecha y el periodo para la próxima vez.</li>
</ol>
<ul>
  <li>Arriba verás el total de documentos y la <strong>comparación con el periodo anterior</strong> de la misma duración.</li>
  <li><strong>Pulsa una barra</strong> de cualquier gráfico para filtrar el resto. Vuelve a pulsarla, o quita el filtro, para deshacerlo.</li>
  <li>La tabla se puede ordenar por columna y tiene buscador.</li>
</ul>`
        },
        {
          id: 'rep-export',
          title: 'Exportar',
          body: `En la tabla, <strong>Exportar</strong> descarga lo que estás viendo (con filtros y búsqueda):
<ul>
  <li><strong>Excel</strong>: hoja <em>Resumen</em> (totales por categoría y por cada agrupación) y hoja <em>Datos</em>.</li>
  <li><strong>CSV</strong>: solo los datos, separados por punto y coma.</li>
</ul>
Si una categoría llega al máximo de 50.000 documentos verás un aviso: acorta el periodo para tenerlos todos.`
        }
      ]
    },

    userManager: {
      id: 'userManager',
      title: 'Gestión de Usuarios',
      icon: '👥',
      intro: 'Administra los usuarios de la plataforma. Aquí puedes activar nuevas cuentas, asignar roles, editar perfiles y revocar accesos. Solo accesible para administradores.',
      sections: [
        {
          id: 'usr-activate',
          title: 'Activar un usuario nuevo paso a paso',
          body: `Cuando alguien se registra, su cuenta queda <strong>pendiente</strong> hasta que un administrador la activa:
<ol>
  <li>Localiza al nuevo usuario en la tabla (aparece con una marca roja en el email)</li>
  <li>Haz clic en el botón <strong>"Activar y aprobar"</strong> — esta acción hace dos cosas a la vez:
    <ul>
      <li>Confirma el email en Supabase (el usuario no necesita verificar por correo)</li>
      <li>Marca el perfil como aprobado para acceder al sistema</li>
    </ul>
  </li>
  <li>El usuario puede entrar inmediatamente después de la activación</li>
</ol>
<strong>Alternativa manual:</strong> Usa los botones individuales "Activar email" y "Aprobar" por separado si lo necesitas.`
        },
        {
          id: 'usr-roles',
          title: 'Roles y qué puede hacer cada uno',
          body: `<table style="width:100%;font-size:11px;border-collapse:collapse">
  <thead><tr style="border-bottom:1px solid var(--border-default)">
    <th style="text-align:left;padding:6px 8px">Rol</th>
    <th style="text-align:left;padding:6px 8px">Acceso</th>
  </tr></thead>
  <tbody>
    <tr><td style="padding:5px 8px"><strong>Administrador</strong></td><td style="padding:5px 8px">Acceso total: gestión de usuarios, verticales, Bedrock, todos los módulos</td></tr>
    <tr style="background:var(--bg-canvas)"><td style="padding:5px 8px"><strong>Gestor</strong></td><td style="padding:5px 8px">Todas las herramientas de trabajo, sin panel de administración</td></tr>
    <tr><td style="padding:5px 8px"><strong>Usuario</strong></td><td style="padding:5px 8px">Generador, Reporter, eForms Builder, Categorías</td></tr>
    <tr style="background:var(--bg-canvas)"><td style="padding:5px 8px"><strong>Auditor</strong></td><td style="padding:5px 8px">Solo lectura — puede consultar pero no generar ni modificar</td></tr>
  </tbody>
</table>
<br/>
<strong>Cómo cambiar el rol:</strong> haz clic en ✏️ en la fila del usuario → selecciona rol → "Guardar".`
        },
        {
          id: 'usr-delete',
          title: 'Eliminar o desactivar un usuario',
          body: `<ul>
  <li>Para <strong>eliminar definitivamente</strong>: haz clic en 🗑️. Esta acción borra el perfil y elimina el acceso. <strong>No se puede deshacer.</strong></li>
  <li>Para <strong>bloquear temporalmente</strong> sin eliminar el perfil, cambia el rol a "Auditor".</li>
</ul>`
        }
      ]
    },

    verticalesManager: {
      id: 'verticalesManager',
      title: 'Gestión de Verticales',
      icon: '📦',
      intro: 'Las verticales definen los tipos de proyecto. El Generador de Documentos las usa como contexto adicional para la IA. Solo administradores.',
      sections: [
        {
          id: 'vert-what',
          title: '¿Qué es una vertical y por qué importa?',
          body: `Una <strong>vertical</strong> representa un tipo de proyecto de Therefore™, por ejemplo: NotifApp (notificaciones DGT/AEAT), HR (recursos humanos), Facturas, Inmobiliario…
<br/><br/>
Cuando el Generador de Documentos analiza un briefing, usa la vertical seleccionada como <strong>contexto adicional</strong>: sabe qué estructura suelen tener esos proyectos, cuánto tiempo requieren, y qué categorías y workflows son típicos.`
        },
        {
          id: 'vert-create',
          title: 'Crear o editar una vertical',
          body: `<ol>
  <li>Haz clic en <strong>"Nueva vertical"</strong> (o en ✏️ para editar una existente)</li>
  <li>Rellena los campos:
    <ul>
      <li><strong>Nombre interno</strong>: identificador sin espacios (ej: <code>notifapp</code>, <code>rrhh</code>)</li>
      <li><strong>Título visible</strong>: nombre en el desplegable del Generador (ej: "Notificaciones DGT")</li>
      <li><strong>Descripción intro</strong>: explica qué tipo de proyecto es — cuanto más detallado, mejor</li>
      <li><strong>Descripción implementación</strong>: detalles técnicos de cómo se implementa en Therefore™</li>
      <li><strong>Orden</strong>: posición en el desplegable (menor número = antes)</li>
    </ul>
  </li>
  <li>Haz clic en <strong>"Guardar"</strong></li>
</ol>`
        }
      ]
    },

    tenantManager: {
      id: 'tenantManager',
      title: 'Gestión de Tenants',
      icon: '☁️',
      intro: 'Un "tenant" es la conexión a una instancia de Therefore™. Puedes tener varios: producción, desarrollo, distintos clientes. Aquí configuras la URL y credenciales de cada uno.',
      sections: [
        {
          id: 'ten-create',
          title: 'Configurar un nuevo tenant paso a paso',
          body: `<ol>
  <li>Haz clic en <strong>"Nuevo Tenant"</strong></li>
  <li>Rellena el formulario:
    <ul>
      <li><strong>Nombre</strong>: cómo identificar este servidor (ej: "Cliente ABC - Producción")</li>
      <li><strong>URL base</strong>: dirección completa de la API REST de Therefore™<br/>
        — Cloud: <code>https://empresa.thereforeonline.com/theservice/v0001/restun</code><br/>
        — On-premise: <code>https://servidor.empresa.com/theservice/v0001/restun</code></li>
      <li><strong>Usuario</strong>: nombre de usuario de Therefore™ con acceso a la API</li>
      <li><strong>Contraseña</strong>: contraseña de ese usuario</li>
      <li><strong>TenantName</strong>: <em>solo para instancias cloud</em>. Es la primera parte del subdominio. Ej: si la URL es <code>acme.thereforeonline.com</code>, el TenantName es <code>acme</code>. Déjalo vacío en on-premise.</li>
    </ul>
  </li>
  <li>Haz clic en <strong>"Probar conexión"</strong> para verificar que todo está correcto</li>
  <li>Si el test dice "Conexión exitosa", haz clic en <strong>"Guardar"</strong></li>
</ol>`
        },
        {
          id: 'ten-errors',
          title: 'Errores comunes al probar la conexión',
          body: `<ul>
  <li><strong>401 Unauthorized</strong> — Usuario o contraseña incorrectos</li>
  <li><strong>404 Not Found</strong> — URL base incorrecta. Comprueba que termina en <code>/restun</code></li>
  <li><strong>Network error</strong> — El servidor no es accesible. Si es on-premise, necesitas estar en la VPN</li>
  <li><strong>TenantName requerido</strong> — Instancia cloud sin TenantName configurado</li>
  <li><strong>Timeout</strong> — El servidor tarda demasiado. Puede ser problema de red o que el servicio esté caído</li>
</ul>`
        }
      ]
    },

    webServices: {
      id: 'webServices',
      title: 'Web Services',
      icon: '🔌',
      intro: 'Gestiona las integraciones con servicios externos: DOCAI para clasificación, IVNEOS para notificaciones de la administración, e IvSign para firma digital.',
      sections: [
        {
          id: 'ws-add',
          title: 'Añadir un nuevo servicio web',
          body: `<ol>
  <li>Haz clic en <strong>"+ Crear Servicio"</strong></li>
  <li>Rellena: nombre, tenant relacionado, URL base, usuario, contraseña y observaciones</li>
  <li>Guarda y usa el botón <strong>"Probar"</strong> en la tabla para verificar que el servicio responde</li>
</ol>`
        },
        {
          id: 'ws-docai',
          title: 'DOCAI — Clasificación y extracción automática',
          body: `DOCAI clasifica documentos automáticamente y extrae sus datos (NIF, importes, fechas) sin intervención manual. Se conecta con Therefore™ a través de un preprocessor o workflow.
<br/><br/>
<strong>Casos de uso típicos:</strong>
<ul>
  <li>Clasificar facturas entrantes por proveedor o tipo</li>
  <li>Extraer NIF, número de factura, fecha e importe automáticamente</li>
  <li>Enrutar documentos al workflow correcto según su contenido</li>
  <li>Clasificar documentación de RRHH (contratos, nóminas, certificados)</li>
</ul>`
        },
        {
          id: 'ws-ivneos',
          title: 'IVNEOS — Notificaciones de la administración',
          body: `IVNEOS descarga y gestiona automáticamente las notificaciones electrónicas de organismos públicos (AEAT, Seguridad Social, DGT…).
<br/><br/>
<strong>Flujo de trabajo:</strong>
<ol>
  <li>IVNEOS consulta periódicamente los buzones de organismos configurados</li>
  <li>Descarga las notificaciones pendientes automáticamente</li>
  <li>Las archiva en la categoría Therefore™ correspondiente</li>
  <li>Dispara un workflow de revisión para el responsable</li>
  <li>El responsable recibe una notificación y puede ver la carta desde Therefore™</li>
</ol>`
        },
        {
          id: 'ws-ivsign',
          title: 'IvSign — Firma digital',
          body: `IvSign permite enviar documentos de Therefore™ a firma electrónica y recibir el documento firmado de vuelta automáticamente.
<br/><br/>
<strong>Flujo típico:</strong>
<ol>
  <li>Un documento llega a un paso de "Pendiente de firma" en el workflow de Therefore™</li>
  <li>El sistema envía el documento a IvSign automáticamente</li>
  <li>IvSign notifica al firmante por email o SMS con un enlace seguro</li>
  <li>El firmante accede y firma desde cualquier dispositivo</li>
  <li>IvSign devuelve el documento firmado con sello de tiempo</li>
  <li>El documento firmado se archiva en Therefore™ y el workflow avanza</li>
</ol>`
        }
      ]
    },

    bedrockPanel: {
      id: 'bedrockPanel',
      title: 'Panel AWS Bedrock',
      icon: '🤖',
      intro: 'Configura y monitoriza la conexión con AWS Bedrock, el motor de inteligencia artificial que usa el Generador de Documentos para analizar briefings.',
      sections: [
        {
          id: 'bed-setup',
          title: 'Configurar las credenciales AWS paso a paso',
          body: `<ol>
  <li>Accede a <strong>AWS Console</strong> con tu cuenta de administrador</li>
  <li>Ve a <strong>IAM → Usuarios → Crear usuario</strong></li>
  <li>Asigna el permiso <code>bedrock:InvokeModel</code> en la región que vayas a usar</li>
  <li>En el usuario creado, ve a <em>Credenciales de seguridad → Crear clave de acceso</em></li>
  <li>Copia el <strong>Access Key ID</strong> y el <strong>Secret Access Key</strong> (solo se muestran una vez)</li>
  <li>Vuelve a esta pantalla → pestaña <strong>"Credenciales"</strong></li>
  <li>Introduce el Access Key ID, Secret Access Key y la región (ej: <code>eu-west-1</code>)</li>
  <li>Haz clic en <strong>"Guardar credenciales"</strong> y luego en <strong>"Probar"</strong></li>
</ol>
<strong>Región recomendada para Europa:</strong> <code>eu-west-1</code> (Irlanda) — menor latencia y cumplimiento GDPR.`
        },
        {
          id: 'bed-model',
          title: 'Habilitar el modelo en AWS Bedrock',
          body: `Antes de usar los modelos de Anthropic (Claude) en AWS Bedrock, debes solicitar acceso:
<ol>
  <li>Ve a <strong>AWS Console → Amazon Bedrock → Model access</strong></li>
  <li>Haz clic en <strong>"Request model access"</strong></li>
  <li>Selecciona los modelos de <strong>Anthropic</strong> que necesitas</li>
  <li>Acepta los términos y espera la aprobación (normalmente inmediata)</li>
</ol>
Sin este paso, las llamadas a la API devolverán error de acceso aunque las credenciales sean correctas.`
        },
        {
          id: 'bed-cost',
          title: 'Consumo estimado por análisis',
          body: `El Generador usa <strong>tokens</strong> para procesar el briefing. Consumo aproximado:
<ul>
  <li>Briefing pequeño (1-2 páginas): ~5.000–10.000 tokens</li>
  <li>Briefing medio (5-10 páginas): ~15.000–25.000 tokens</li>
  <li>Briefing largo (20+ páginas): ~30.000–60.000 tokens</li>
</ul>
El coste exacto depende del modelo y región. Consulta la página de precios de AWS Bedrock.`
        }
      ]
    },

    userProfile: {
      id: 'userProfile',
      title: 'Perfil de Usuario',
      icon: '👤',
      intro: 'Gestiona tu información personal, foto de perfil, y preferencias de visualización.',
      sections: [
        {
          id: 'prof-edit',
          title: 'Actualizar tus datos personales',
          body: `<ol>
  <li>Haz clic en tu avatar (inicial de tu email) en la esquina inferior izquierda del menú</li>
  <li>Selecciona <strong>"Perfil de Usuario"</strong></li>
  <li>Edita los campos que desees: nombre, apellidos, teléfono, cargo, dirección</li>
  <li>Haz clic en <strong>"Guardar cambios"</strong></li>
</ol>`
        },
        {
          id: 'prof-photo',
          title: 'Cambiar tu foto de perfil',
          body: `<ol>
  <li>En la página de perfil, haz clic sobre el avatar circular</li>
  <li>Selecciona una imagen de tu ordenador (JPG, PNG, WebP · máx 5 MB)</li>
  <li>La imagen se sube automáticamente y aparece en el menú lateral</li>
</ol>
<strong>Recomendación:</strong> usa una foto cuadrada para que se vea bien en el recorte circular.`
        },
        {
          id: 'prof-prefs',
          title: 'Cambiar idioma y modo visual',
          body: `<ul>
  <li><strong>Idioma</strong>: haz clic en tu avatar → icono 🌐 → elige Español o English</li>
  <li><strong>Modo oscuro / claro</strong>: haz clic en tu avatar → icono ☀️/🌙. Tu preferencia se guarda y se aplica en el próximo acceso.</li>
</ul>`
        }
      ]
    }
  },

  en: {
    home: {
      id: 'home',
      title: 'Home Dashboard',
      icon: '🏠',
      intro: 'The Home Dashboard is the first screen you see after logging in. From here you can access any module and get a quick overview of the system.',
      sections: [
        {
          id: 'home-cards',
          title: 'Quick access cards',
          body: `The cards in the center are direct shortcuts to each module. Click any card to go immediately to that feature.`
        },
        {
          id: 'home-menu',
          title: 'How to use the sidebar menu',
          body: `The left sidebar is always visible. Click any item to navigate to that module.
<br/><br/>
To <strong>collapse</strong> the menu: click the arrow (←) in the menu header. The menu shrinks to icons only. To expand again, click the logo in the top-left corner.`
        },
        {
          id: 'home-user',
          title: 'Your account and preferences',
          body: `In the <strong>bottom-left</strong> of the sidebar you'll see your avatar (email initial). Click it to open the user menu, where you can:
<ul>
  <li>Go to your <strong>Profile</strong></li>
  <li>Switch the <strong>language</strong> (Spanish / English)</li>
  <li>Toggle <strong>Dark or Light mode</strong></li>
  <li>Sign out</li>
</ul>`
        },
        {
          id: 'home-help',
          title: 'How to use the help system',
          body: `Every screen has a <strong>?</strong> button in the top-right corner. Click it to open a side panel with help specific to that module. From there you can also open the full manual.`
        }
      ]
    },

    documentGenerator: {
      id: 'documentGenerator',
      title: 'Document generator',
      icon: '',
      intro: 'Turns a briefing into a Word document (EFDT, requirements, budget, offer…) in three steps: Briefing, Review and Document. The steps are at the top and each step\'s main action is in the top-right corner.',
      sections: [
        {
          id: 'dg-step1',
          title: '1. Briefing',
          body: `<ul>
  <li><strong>Which document</strong>: choose the type, the vertical (detected automatically if empty) and optional instructions for the AI.</li>
  <li><strong>Source material</strong>: upload the briefing and the customer documents (PDF, Word, TXT, HTML or .eml emails).</li>
  <li><strong>Cover</strong>: none, the default one or a custom PNG (A4, 794 × 1123 px). Uploaded covers are kept for future documents.</li>
</ul>
Click <strong>Analizar briefing</strong>. It takes 20–60 seconds. Uploaded documents are deleted from storage after the analysis.`
        },
        {
          id: 'dg-review',
          title: '2. Review',
          body: `<ul>
  <li>The <strong>index</strong> on the left jumps to each section; the <strong>summary</strong> on the right shows effort, daily rate, amount, VAT and total. The rate comes from the vertical and can be changed.</li>
  <li>In the <strong>estimate</strong> you can edit days or hours, add or remove tasks and mark a task as <em>Pending</em> (shown without amount, not added to the total).</li>
  <li><strong>Pedir cambios a la IA</strong> applies a change you describe; use <strong>Deshacer</strong> to revert it.</li>
  <li>The <strong>schedule</strong> updates with the estimate. Pick the start date and download the Gantt.</li>
</ul>
When ready, click <strong>Generar documento</strong>.`
        },
        {
          id: 'dg-done',
          title: '3. Document',
          body: `Download the Word file, the Gantt, go back to the review or start a new document. Before sending it, open it in Word and press Ctrl+A then F9 to update the table of contents.`
        }
      ]
    },

    eformBuilder: {
      id: 'eformBuilder',
      title: 'Therefore™ eForms Builder',
      icon: '📋',
      intro: 'Create electronic forms for Therefore™ without touching XML or code. Design the form here and export the XML ready to import into Solution Designer.',
      sections: [
        {
          id: 'ef-concept',
          title: 'What is an eForm?',
          body: `An <strong>eForm</strong> is the interface users see in Therefore™ to fill in data when creating or processing a document — for example: a vacation request, supplier profile, or invoice approval form.
<br/><br/>
eForms are made of <strong>panels</strong> (field groups) containing <strong>fields</strong> of different types.`
        },
        {
          id: 'ef-create',
          title: 'Create an eForm from scratch',
          body: `<ol>
  <li>Type the <strong>form name</strong> at the top</li>
  <li>Click <strong>"+ Panel"</strong> to create the first section</li>
  <li>Give it a name (e.g. "Requester Details")</li>
  <li>Click <strong>"+ Field"</strong> to add a field and configure:
    <ul>
      <li><strong>Name</strong>: label shown to the user</li>
      <li><strong>Key</strong>: technical identifier (auto-generated)</li>
      <li><strong>Type</strong>: text, email, date, number, dropdown…</li>
      <li><strong>Required</strong>: must be filled to submit the form</li>
      <li><strong>Placeholder</strong>: hint text inside the field</li>
    </ul>
  </li>
  <li>Add more panels to organize fields in sections</li>
</ol>`
        },
        {
          id: 'ef-csv',
          title: 'Import all fields from CSV (faster)',
          body: `If fields are already in Excel or a document, create them all at once with the CSV importer.
<br/><br/>
<ol>
  <li>Click <strong>"📤 Import CSV"</strong></li>
  <li>Columns (semicolon-separated): <code>Nombre ; Key ; Tipo ; Obligatorio ; Placeholder ; Default ; MaxLength ; Seccion ; Options</code></li>
  <li>Paste text in the modal and click <strong>"Analyze →"</strong></li>
  <li>Click <strong>"Replace"</strong> or <strong>"Add"</strong></li>
</ol>
<strong>Full example — copy and paste in the modal:</strong>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;overflow-x:auto;margin:8px 0;white-space:pre">Nombre;Key;Tipo;Obligatorio;Placeholder;Default;MaxLength;Seccion;Options
Full name;name;text;si;E.g. John Smith;;100;PERSONAL DATA
Email;email;email;si;email@company.com;;;PERSONAL DATA
Phone;phone;phone;no;+1 555 0000;;;PERSONAL DATA
Department;dept;select;si;;;;PERSONAL DATA;Accounting|HR|Sales|IT|Management
Request date;requestDate;date;si;;;;REQUEST
Request type;requestType;select;si;;;;REQUEST;Holiday|Leave|Remote work
Days;days;number;si;;;;REQUEST
Notes;notes;text;no;Brief description;;300;REQUEST</pre>
<strong>For select fields:</strong> put options in the <em>Options</em> column separated by <code>|</code>. For a label different from value: <code>GB=United Kingdom|US=United States</code>`
        },
        {
          id: 'ef-export',
          title: 'Export and import into Therefore™',
          body: `<ol>
  <li>Click <strong>"Export XML"</strong> — downloads an <code>.xml</code> file</li>
  <li>Open <strong>Therefore™ Solution Designer</strong></li>
  <li>Select the target category → <em>eForms</em> tab</li>
  <li>Click <strong>Import eForm</strong> and select the XML file</li>
  <li>Save changes in Solution Designer</li>
</ol>
<strong>⚠️ To modify</strong> an existing eForm: export it first from Solution Designer, make changes here, then re-import.`
        }
      ]
    },

    eformGeneratorAI: {
      id: 'eformGeneratorAI',
      title: 'AI eForm Generator',
      icon: '⚡',
      intro: 'Create Therefore™ eForms using natural language. Describe the form you need and the AI generates it automatically with advanced features: QR, lookups, modals, signatures, JavaScript validations and more.',
      sections: [
        {
          id: 'eform-ai-how',
          title: 'How it works — 3-step flow',
          body: `<ol>
  <li><strong>Describe your eForm</strong> in natural language (e.g., "Customer registration form with VAT, name, email and phone")</li>
  <li><strong>Improve Prompt</strong> — AI analyzes your description and generates a detailed prompt (editable)</li>
  <li><strong>Generate eForm</strong> — AI creates the form.io JSON and Therefore™ XML ready to import</li>
</ol>
<strong>All in one screen</strong> — no navigation needed. The prompt is shown in the same text area so you can edit it before generating.`
        },
        {
          id: 'eform-ai-basic',
          title: 'Basic examples',
          body: `<strong>Simple customer registration:</strong>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;margin:8px 0">Create eForm for customer registration. Fields: VAT number (required), full name, email, phone, billing address.</pre>

<strong>Vacation request:</strong>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;margin:8px 0">Vacation request form. Fields: employee name, department (dropdown: HR, Sales, IT, Management), start date, end date, days requested (number), reason.</pre>`
        },
        {
          id: 'eform-ai-columns',
          title: 'Multi-column layouts',
          body: `<strong>2-column example:</strong>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;margin:8px 0">Supplier registration eForm in 2 columns.

Left column: Company name (required), VAT, Email, Phone
Right column: Address, City, Postal code, Country</pre>`
        },
        {
          id: 'eform-ai-lookup',
          title: 'Lookup from Therefore™ category',
          body: `<strong>Enable the predefined block:</strong> check **"🔍 Search in master category"**

<strong>Example:</strong>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;margin:8px 0">Order form. "Customer" field should populate from Therefore™ category "Master_Customers". Show in dropdown: customer name (IdxF_CustomerName) and VAT (IdxF_VAT).</pre>`
        },
        {
          id: 'eform-ai-qr',
          title: 'QR / Barcode scanner',
          body: `Enable **"📷 QR Reader"** block.

<strong>Example:</strong>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;margin:8px 0">Asset inventory eForm with barcode scanner on "Asset code" field. Fields: asset code (with QR), description, location, status, responsible.</pre>`
        },
        {
          id: 'eform-ai-category',
          title: 'Upload category XML (RECOMMENDED)',
          body: `**⭐ Star feature:** If you upload the **target category XML**, the AI automatically detects all fields and generates a perfectly mapped eForm.

<strong>🎯 Advantages of using XML:</strong>
<ul>
  <li>✅ AI uses **exact ColNames** from Therefore™ (no invented names)</li>
  <li>✅ Detects **required fields** automatically</li>
  <li>✅ Respects **max lengths** for each field</li>
  <li>✅ Maps **data types** correctly (String → textfield, Integer → number, Date → datetime, etc.)</li>
  <li>✅ Shows visual table with all detected fields</li>
  <li>✅ **Zero mapping errors** — keys match 100% with the category</li>
</ul>

<strong>📋 How to do it:</strong>
<ol>
  <li>In <strong>Therefore™ Solution Designer</strong>: select category → <em>File → Export Configuration</em> → save XML</li>
  <li>In the <strong>AI Generator</strong>: "Target category (optional)" section → <em>"Upload category XML"</em> button</li>
  <li>A **table appears with all detected fields**: ColName, Caption, Type, Max length, Required</li>
  <li>Describe your eForm normally — AI will automatically use the fields from the table</li>
  <li>Click <strong>"Improve Prompt"</strong> — you'll see the prompt includes exact ColNames</li>
</ol>

<strong>✨ Example with uploaded XML (category "Contracts - Companies"):</strong>

<em>Fields detected in table:</em>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:6px 10px;font-size:10px;margin:8px 0">ColName           Caption              Type     Len.   Req.
CIF               Tax ID               String   25     ✓
Razon_Social      Legal Name           String   50     -
Domicilio_Social  Registered Address   String   500    -
Nota_Legal        Legal Notice         String   500    -
url_logo          url_logo             String   250    -</pre>

<em>Your prompt can be simple:</em>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;margin:8px 0">Form to register new contract companies.
Organize in 2 sections: identification and legal data.
Tax ID should be validated with Spanish CIF pattern.</pre>

<em>AI will automatically generate:</em>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;margin:8px 0">{
  "components": [
    { "key": "CIF", "type": "textfield", "validate": {
        "required": true,
        "maxLength": 25,
        "pattern": "^[A-Z][0-9]{8}$"
      }
    },
    { "key": "Razon_Social", "type": "textfield", "validate": { "maxLength": 50 } },
    { "key": "Domicilio_Social", "type": "textarea", "validate": { "maxLength": 500 } },
    ...
  ]
}</pre>

<strong>💡 What if I DON'T upload XML?</strong> No problem — AI generates the eForm anyway, but will invent generic field names (customer, vat, etc.). You'll need to manually map in Therefore™'s indexing profile.

<strong>⚠️ Important:</strong> XML must be a **complete category export** from Solution Designer, not an eForm XML.`
        },
        {
          id: 'eform-ai-download',
          title: 'Download and import XML',
          body: `<ol>
  <li>Review the <strong>"Summary"</strong> tab — table with all created fields</li>
  <li>Click <strong>"Download XML"</strong></li>
  <li>File downloads as <code>TheConfiguration_&lt;FormID&gt;.xml</code></li>
  <li>Open <strong>Therefore™ Solution Designer</strong></li>
  <li>Select target category → <em>eForms</em> tab → <strong>Import eForm</strong></li>
  <li>Save changes</li>
</ol>`
        }
      ]
    },

    thereforeMigrator: {
      id: 'thereforeMigrator',
      title: 'Document migrator',
      icon: '',
      intro: 'Copies documents (files and index data) from one Therefore™ category to another, on the same or another instance, or downloads them to a folder with an Excel file of index data.',
      sections: [
        {
          id: 'mg-steps',
          title: 'How it works',
          body: `<ol>
  <li><strong>Source</strong>: choose the instance and category, and optionally filter documents by any field or document number range (<em>Contar documentos</em> shows how many match).</li>
  <li><strong>Destination</strong>: copy to another category, or download to a folder (Chrome or Edge).</li>
  <li><strong>Fields</strong>: fields are matched by name automatically; review and adjust.</li>
  <li><strong>Options</strong>: maximum, parallel documents, and a preview of the first 3 documents (nothing is written).</li>
  <li><strong>Migrate</strong>: progress, errors and remaining time. Keep the tab open.</li>
</ol>
Copied documents are recorded, so repeating or resuming a migration skips them. Run <code>supabase/migrations/20261124_migrator.sql</code> once in Supabase to store this record in the database.`
        }
      ]
    },

    categoryBuilder: {
      id: 'categoryBuilder',
      title: 'Category Builder',
      icon: '🏗️',
      intro: 'Create Therefore™ category structures visually. Define index fields, organize them in sections and tabs, and export the XML ready to import into Solution Designer.',
      sections: [
        {
          id: 'cat-concept',
          title: 'What is a Therefore™ category?',
          body: `A <strong>category</strong> defines how documents of a specific type are stored and classified. Each category has <strong>index fields</strong> — data stored alongside each document for searching and filtering. For example, an invoice category would have Supplier, Invoice Number, Date, and Amount fields.`
        },
        {
          id: 'cat-create',
          title: 'Create a category step by step',
          body: `<ol>
  <li>Click <strong>"+ Category"</strong> in the left panel</li>
  <li>Type the category name (e.g. "Supplier Invoices")</li>
  <li>Click <strong>"+ Section"</strong> to add a field group</li>
  <li>Click <strong>"+ Field"</strong> and configure:
    <ul>
      <li><strong>Name</strong>: label in the Therefore™ interface</li>
      <li><strong>Type</strong>: String, Integer, Date, Money, Logical, Lookup, Table…</li>
      <li><strong>Length</strong>: for String fields, max characters</li>
      <li><strong>Required</strong>: mandatory when creating a document</li>
      <li><strong>Tab</strong>: (optional) to organize fields in tabs</li>
    </ul>
  </li>
  <li>Click <strong>"Export XML"</strong> to download the configuration</li>
</ol>`
        },
        {
          id: 'cat-csv',
          title: 'Import fields from CSV (fastest method)',
          body: `<ol>
  <li>Click <strong>"📤 Import CSV"</strong></li>
  <li>Columns: <code>Categoría ; Pestaña ; Sección ; Nombre ; Tipo ; Longitud ; Obligatorio ; TablaParent</code></li>
  <li>Paste text, click <strong>"Analyze →"</strong>, then <strong>"Apply"</strong></li>
</ol>
<strong>Full example — invoice category with line items (copy and paste):</strong>
<pre style="background:var(--bg-canvas);border:1px solid var(--border-default);border-radius:6px;padding:10px;font-size:11px;overflow-x:auto;margin:8px 0;white-space:pre">Categoría;Pestaña;Sección;Nombre;Tipo;Longitud;Obligatorio;TablaParent
Invoices;General;SUPPLIER;Supplier name;string;200;si
Invoices;General;SUPPLIER;VAT number;string;20;si
Invoices;General;INVOICE;Invoice number;string;50;si
Invoices;General;INVOICE;Invoice date;date;;si
Invoices;General;INVOICE;Total amount;money;;si
Invoices;Lines;LINES;Invoice lines;table;;no
Invoices;Lines;LINES;Description;string;200;si;Invoice lines
Invoices;Lines;LINES;Quantity;integer;;si;Invoice lines
Invoices;Lines;LINES;Unit price;money;;si;Invoice lines</pre>
<strong>Table columns (TablaParent):</strong> first define the <code>table</code> field (TablaParent empty), then add columns with the exact table name in the TablaParent column.`
        },
        {
          id: 'cat-export',
          title: 'Export and import into Therefore™',
          body: `<ol>
  <li>Click <strong>"Export XML"</strong></li>
  <li>In Therefore™ Solution Designer: <em>File → Import Configuration</em></li>
  <li>Select the XML and confirm</li>
</ol>
<strong>⚠️ Importing over an existing category</strong> with the same name will overwrite it. Always export first as a backup.`
        }
      ]
    },

    thereforeReporter: {
      id: 'thereforeReporter',
      title: 'Report generator',
      icon: '',
      intro: 'Count and analyse Therefore™ documents by period. A report stores which categories and fields to query; then you open it and pick the period.',
      sections: [
        {
          id: 'rep-create',
          title: 'Create a report',
          body: `<ol>
  <li>Click <strong>Nuevo informe</strong>, give it a name and choose the <strong>Therefore™ instance</strong>. It connects automatically.</li>
  <li>On the left, tick one or more <strong>categories</strong> (you can search them by name).</li>
  <li>On the right you will see the <strong>fields</strong> they share. Tick the ones you want.</li>
  <li>Include at least one <strong>date</strong> field: it is used to choose the period.</li>
  <li>Tick <strong>Gráfico</strong> on the fields you want to group by (status, supplier…).</li>
  <li>Click <strong>Guardar</strong>.</li>
</ol>
If an on-premise instance is not reachable from the internet, the app connects directly from your browser (you need to be on the customer network or VPN).`
        },
        {
          id: 'rep-run',
          title: 'Run and explore',
          body: `<ol>
  <li>In the list, click <strong>Abrir</strong>. If you ran it before, the last saved result shows up straight away.</li>
  <li>Choose the period with the shortcuts or the date fields.</li>
  <li>Click <strong>Ejecutar</strong> or <strong>Actualizar</strong>. The report remembers the date field and period for next time.</li>
</ol>
<ul>
  <li>At the top you see the total and the <strong>change versus the previous period</strong> of the same length.</li>
  <li><strong>Click a bar</strong> in any chart to filter everything else. Click it again, or remove the filter, to undo.</li>
  <li>The table can be sorted by column and searched.</li>
</ul>`
        },
        {
          id: 'rep-export',
          title: 'Export',
          body: `<strong>Exportar</strong> downloads what you are seeing (filters and search applied): <strong>Excel</strong> with a summary sheet and a data sheet, or <strong>CSV</strong>.
If a category reaches the 50,000-document limit you will see a warning: shorten the period to get them all.`
        }
      ]
    },

    userManager: {
      id: 'userManager',
      title: 'User Management',
      icon: '👥',
      intro: 'Manage platform users: activate accounts, assign roles, edit profiles, revoke access. Administrators only.',
      sections: [
        {
          id: 'usr-activate',
          title: 'Activate a new user',
          body: `<ol>
  <li>Find the user in the table (red mark on email = not activated)</li>
  <li>Click <strong>"Activate and approve"</strong> — confirms email and grants access in one step</li>
  <li>The user can sign in immediately</li>
</ol>`
        },
        {
          id: 'usr-roles',
          title: 'Roles and permissions',
          body: `<table style="width:100%;font-size:11px;border-collapse:collapse">
  <thead><tr style="border-bottom:1px solid var(--border-default)">
    <th style="text-align:left;padding:6px 8px">Role</th><th style="text-align:left;padding:6px 8px">Access</th>
  </tr></thead>
  <tbody>
    <tr><td style="padding:5px 8px"><strong>Administrator</strong></td><td style="padding:5px 8px">Full access including user management</td></tr>
    <tr style="background:var(--bg-canvas)"><td style="padding:5px 8px"><strong>Manager</strong></td><td style="padding:5px 8px">All work tools, no admin panel</td></tr>
    <tr><td style="padding:5px 8px"><strong>User</strong></td><td style="padding:5px 8px">Generator, Reporter, eForms, Categories</td></tr>
    <tr style="background:var(--bg-canvas)"><td style="padding:5px 8px"><strong>Auditor</strong></td><td style="padding:5px 8px">Read-only</td></tr>
  </tbody>
</table>`
        }
      ]
    },

    verticalesManager: {
      id: 'verticalesManager',
      title: 'Vertical Management',
      icon: '📦',
      intro: 'Verticals define project types used as AI context in the Document Generator. Administrators only.',
      sections: [
        {
          id: 'vert-what',
          title: 'What is a vertical?',
          body: `A <strong>vertical</strong> represents a type of Therefore™ project (e.g. NotifApp, HR, Invoices, Real Estate). The Document Generator uses the selected vertical as additional context to produce more accurate and relevant documents.`
        },
        {
          id: 'vert-create',
          title: 'Create or edit a vertical',
          body: `<ol>
  <li>Click <strong>"New vertical"</strong> or ✏️ to edit</li>
  <li>Fill in: internal name (no spaces), display title, intro description, implementation description, and order number</li>
  <li>Click <strong>"Save"</strong></li>
</ol>
The more detailed the descriptions, the better the AI context.`
        }
      ]
    },

    tenantManager: {
      id: 'tenantManager',
      title: 'Tenant Management',
      icon: '☁️',
      intro: 'A tenant is a connection to a Therefore™ instance. Configure URL and credentials for each server here.',
      sections: [
        {
          id: 'ten-create',
          title: 'Configure a new tenant',
          body: `<ol>
  <li>Click <strong>"New Tenant"</strong></li>
  <li>Fill in: Name, Base URL (ending in <code>/restun</code>), Username, Password, and TenantName (cloud instances only)</li>
  <li>Click <strong>"Test connection"</strong> — if successful, click <strong>"Save"</strong></li>
</ol>
<strong>TenantName:</strong> cloud only — it's the subdomain prefix. E.g. <code>acme</code> from <code>acme.thereforeonline.com</code>. Leave empty for on-premise.`
        },
        {
          id: 'ten-errors',
          title: 'Common connection errors',
          body: `<ul>
  <li><strong>401</strong> — Wrong username or password</li>
  <li><strong>404</strong> — Base URL incorrect (check it ends with <code>/restun</code>)</li>
  <li><strong>Network error</strong> — Server unreachable (check VPN for on-premise)</li>
  <li><strong>Timeout</strong> — Server too slow; may be a network or service issue</li>
</ul>`
        }
      ]
    },

    webServices: {
      id: 'webServices',
      title: 'Web Services',
      icon: '🔌',
      intro: 'Manage integrations with external services: DOCAI for document classification, IVNEOS for government notifications, and IvSign for digital signatures.',
      sections: [
        {
          id: 'ws-docai',
          title: 'DOCAI — Automatic classification',
          body: `DOCAI classifies documents automatically and extracts data (VAT numbers, amounts, dates) without manual intervention. It connects with Therefore™ via preprocessor or workflow.`
        },
        {
          id: 'ws-ivsign',
          title: 'IvSign — Digital signatures',
          body: `IvSign sends Therefore™ documents for electronic signature and receives the signed document back automatically. The full process is automated within the Therefore™ workflow.`
        }
      ]
    },

    bedrockPanel: {
      id: 'bedrockPanel',
      title: 'AWS Bedrock Panel',
      icon: '🤖',
      intro: 'Configure the AWS Bedrock AI engine used by the Document Generator.',
      sections: [
        {
          id: 'bed-setup',
          title: 'Configure AWS credentials',
          body: `<ol>
  <li>In AWS IAM, create a user with <code>bedrock:InvokeModel</code> permission</li>
  <li>Generate an Access Key for that user</li>
  <li>Enter the Access Key ID, Secret Access Key and region here (e.g. <code>eu-west-1</code>)</li>
  <li>Click <strong>"Save"</strong> then <strong>"Test"</strong> to verify</li>
</ol>
<strong>Also required:</strong> go to <em>AWS Bedrock → Model access</em> and request access to Anthropic models.`
        }
      ]
    },

    userProfile: {
      id: 'userProfile',
      title: 'User Profile',
      icon: '👤',
      intro: 'Manage your personal information, profile photo, and display preferences.',
      sections: [
        {
          id: 'prof-edit',
          title: 'Update your details',
          body: `Click your avatar at the bottom-left → <strong>"User Profile"</strong> → edit fields → <strong>"Save changes"</strong>.`
        },
        {
          id: 'prof-prefs',
          title: 'Language and display mode',
          body: `Click your avatar → 🌐 for language (Spanish/English) · ☀️/🌙 for dark/light mode. Preferences are saved automatically.`
        }
      ]
    }
  }
}

export function getHelpSections(lang = 'es') {
  return content[lang] || content.es
}

export const HELP_SECTIONS = content.es

export const MANUAL_TOC = [
  { key: 'home',                labelEs: 'Panel de inicio',           labelEn: 'Home Dashboard',          icon: '🏠' },
  { key: 'documentGenerator',  labelEs: 'Generador de Documentación', labelEn: 'Document Generator',       icon: '⚡' },
  { key: 'eformBuilder',       labelEs: 'eForms Builder',             labelEn: 'eForms Builder',            icon: '📋' },
  { key: 'eformGeneratorAI',   labelEs: 'Generador eForms IA',        labelEn: 'AI eForm Generator',        icon: '⚡' },
  { key: 'categoryBuilder',    labelEs: 'Generador de Categorías',    labelEn: 'Category Builder',          icon: '🏗️' },
  { key: 'thereforeReporter',  labelEs: 'Therefore Reporter',         labelEn: 'Therefore Reporter',        icon: '🔍' },
  { key: 'tenantManager',      labelEs: 'Gestión de Tenants',         labelEn: 'Tenant Management',         icon: '☁️' },
  { key: 'webServices',        labelEs: 'Web Services',               labelEn: 'Web Services',              icon: '🔌' },
  { key: 'userManager',        labelEs: 'Gestión de Usuarios',        labelEn: 'User Management',           icon: '👥' },
  { key: 'verticalesManager',  labelEs: 'Gestión de Verticales',      labelEn: 'Vertical Management',       icon: '📦' },
  { key: 'bedrockPanel',       labelEs: 'Panel AWS Bedrock',          labelEn: 'AWS Bedrock Panel',         icon: '🤖' },
  { key: 'userProfile',        labelEs: 'Perfil de Usuario',          labelEn: 'User Profile',              icon: '👤' },
]
