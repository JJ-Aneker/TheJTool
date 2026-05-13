// api/_lib/knowledge/textos_estandar.js
// Literatura fija reutilizable en todos los EFDTs

export const TEXTOS = {

  // ── CONFIDENCIALIDAD ───────────────────────────────────────────────────────
  confidencialidad: {
    parrafo1: (cliente) =>
      `La información contenida en este documento es confidencial, y se proporciona sólo para propósitos internos. ${cliente} está de acuerdo en que sólo revelará esta información a aquellos de sus empleados que sea necesario.`,
    parrafo2: (cliente) =>
      `Además, ${cliente} se compromete a no revelar esta información, o cualquier parte de esta, a terceros sin el consentimiento expreso y por escrito de Canon España, S.A.U., de ahora en adelante Canon.`,
    clausulas_adicionales_1:
      `Esta disposición no se aplicará a la información que sea pública, o se conozca legítimamente de otra fuente, que no sean Canon o cualquiera de sus filiales.`,
    clausulas_adicionales_2: (cliente) =>
      `Por otra parte, Canon se compromete a mantener la confidencialidad de los datos contenidos en el futuro informe y a no publicarlos parcial o totalmente, o su cesión a terceros, sin el permiso previo por escrito de ${cliente}.`,
  },

  // ── INTRODUCCIÓN GENÉRICA ─────────────────────────────────────────────────
  introduccion_generica:
    `El objetivo de este documento es facilitar una descripción funcional aproximada de la solución Therefore™ que servirá como base del proyecto a desarrollar. Los desarrollos tienen como base la plataforma Therefore™ Online, proporcionada por Therefore™ Corporation (SaaS), considerada adecuada, sólida y escalable para garantizar la calidad de servicio requerida. Este documento no sustituye a un análisis funcional detallado. Las estimaciones de esfuerzo aquí reflejadas son aproximaciones realizadas en fase de preventa, sujetas a revisión durante la fase de análisis del proyecto.`,

  // ── DISCLAIMER ESTIMACIÓN ─────────────────────────────────────────────────
  disclaimer_estimacion:
    `Las estimaciones de esfuerzo que se presentan a continuación son aproximaciones realizadas en fase de preventa, basadas en la experiencia de Canon España en proyectos similares. El alcance definitivo quedará determinado durante la fase de análisis funcional del proyecto.`,

  disclaimer_pendiente:
    `(*) Las partidas marcadas como "Pendiente" requieren información adicional del cliente para su cuantificación. Se incorporarán al presupuesto definitivo una vez completada la fase de análisis.`,

  // ── FIRMAS ────────────────────────────────────────────────────────────────
  firmas_intro:
    `La firma de este documento implica la aceptación de las especificaciones y el alcance descritos. Cualquier modificación posterior al alcance deberá ser acordada mediante un documento de Change Request.`,

  // ── LICENCIAS ─────────────────────────────────────────────────────────────
  licencias_intro:
    `Las licencias Therefore™ necesarias para la operación de la solución son las siguientes. Cases y Workflow Designer están incluidos en la licencia base del servidor y no se facturan como módulos adicionales.`,

  tipos_licencia: {
    concurrente:   `Licencia de uso compartido en pool. En cada momento solo un usuario puede utilizarla simultáneamente. Recomendada para usuarios de uso esporádico.`,
    nominativa:    `Asignada a un único usuario identificado. Permite acceso simultáneo sin restricción de concurrencia. Recomendada para usuarios de uso intensivo.`,
    read_only:     `Acceso de solo lectura en pool. Para usuarios que únicamente consultan documentos sin tramitar.`,
    portal:        `Acceso ilimitado de solo lectura para usuarios externos. Se integra en sitio web existente y se personaliza con la imagen corporativa del cliente.`,
    smart_capture: `Servicio de captura en la nube basado en inteligencia artificial que automatiza la extracción de datos de facturas sin necesidad de configuración previa.`,
    content_connector: `Herramienta multifuncional para capturar información electrónica desde carpetas vigiladas, correos electrónicos, archivos XML/CSV y otros formatos.`,
    universal_connector: `Conector universal para integraciones bidireccionales con sistemas externos mediante llamadas REST/SOAP.`,
  },

  // ── SEGURIDAD ─────────────────────────────────────────────────────────────
  seguridad_intro:
    `La seguridad en Therefore™ es altamente configurable a nivel de expediente, categoría, workflow e incluso campo individual, con la posibilidad de establecer condiciones sobre valores de campos. Para este proyecto se definen los siguientes perfiles estándar de seguridad, asignados a grupos de usuarios:`,

  roles_seguridad: [
    { rol: 'Administrador', descripcion: 'Acceso total al sistema. Gestión de configuración, usuarios y estructura documental.' },
    { rol: 'Power User',    descripcion: 'Gestión operativa completa. Puede crear, editar y gestionar workflows sin acceso a la configuración del sistema.' },
    { rol: 'Escritor',      descripcion: 'Creación y edición de documentos en las categorías asignadas. Sin acceso a configuración.' },
    { rol: 'Lector',        descripcion: 'Solo consulta. No puede modificar ni gestionar documentos.' },
  ],

  // ── CONTRAPORTADA ─────────────────────────────────────────────────────────
  contraportada: {
    empresa:    'Canon España, S.A.U.',
    direccion:  'Parque Empresarial La Moraleja · Avda de Europa, 6 · 28108 Alcobendas (Madrid)',
    web:        'canon-europe.com  ·  canon.es',
  },

  // ── PIE EMAIL ESTÁNDAR ────────────────────────────────────────────────────
  pie_email:
    `Este correo electrónico se ha generado automáticamente desde nuestro gestor documental Therefore™. Por favor, no responda a esta dirección de correo electrónico. Todas las respuestas se dirigen a un buzón desatendido y no recibirán respuesta.`,
};
