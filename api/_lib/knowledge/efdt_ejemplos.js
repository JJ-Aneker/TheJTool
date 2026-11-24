// Ejemplos reales de EFDT para guiar la generación de Claude

export const EFDT_EJEMPLOS = {
  // Ejemplo de Workflow típico
  WORKFLOW_EJEMPLO: {
    nombre: 'Tramitación de notificaciones',
    descripcion: 'Flujo completo de tramitación de notificaciones administrativas con revisión y escalado',
    etapas: [
      {
        numero: 1,
        nombre: 'Creación/Registro',
        descripcion: 'Usuario registra la notificación en el expediente. Se valida automaticamente que los campos obligatorios estén completos. Si hay errores, se muestra mensaje de validación.'
      },
      {
        numero: 2,
        nombre: 'Revisión inicial',
        descripcion: 'Responsable Power User revisa los datos. Puede: (a) Validar y pasar a aprobación, (b) Devolver para correcciones con comentarios'
      },
      {
        numero: 3,
        nombre: 'Aprobación',
        descripcion: 'Administrador aprueba. La notificación pasa a estado "Publicada".'
      },
      {
        numero: 4,
        nombre: 'Notificación email',
        descripcion: 'Sistema envía email automático al destinatario con los datos de la notificación. Se guarda copia de email en expediente.'
      },
      {
        numero: 5,
        nombre: 'Archivo',
        descripcion: 'Cuando expira la vigencia (90 días), la notificación se archiva automáticamente.'
      }
    ]
  },

  // Ejemplo de Categoría Principal
  CATEGORIA_EJEMPLO: {
    nombre: 'Expediente de notificación',
    descripcion: 'Contenedor principal para notificaciones administrativas. Almacena datos de identificación, clasificación, y estado.',
    numCampos: 18,
    campos: [
      { nombre: 'ID_Notificacion', tipo: 'NumericCounter', obligatorio: true, desc: 'Identificador único' },
      { nombre: 'Fecha_Creacion', tipo: 'Date', obligatorio: true, desc: 'Fecha de registro' },
      { nombre: 'Solicitante', tipo: 'String', longitud: 200, obligatorio: true, desc: 'Nombre completo del solicitante' },
      { nombre: 'Organismo', tipo: 'String', longitud: 100, obligatorio: true, desc: 'Organismo público emisor' },
      { nombre: 'Tipo_Notificacion', tipo: 'Keyword', obligatorio: true, desc: 'Clasificación: Administrativa, Fiscal, Laboral, etc.' },
      { nombre: 'Asunto', tipo: 'String', longitud: 500, obligatorio: true, desc: 'Tema de la notificación' },
      { nombre: 'Descripcion_Completa', tipo: 'String', longitud: 2000, obligatorio: false, desc: 'Cuerpo completo del contenido' },
      { nombre: 'Destinatario_Email', tipo: 'String', longitud: 150, obligatorio: true, desc: 'Email del receptor' },
      { nombre: 'Fecha_Vencimiento', tipo: 'Date', obligatorio: true, desc: 'Fecha límite de respuesta' },
      { nombre: 'Prioridad', tipo: 'Keyword', obligatorio: false, desc: 'Alta, Media, Baja' },
      { nombre: 'Estado', tipo: 'Keyword', obligatorio: true, desc: 'Borrador, En revisión, Aprobada, Publicada, Archivada' },
      { nombre: 'Responsable_Revision', tipo: 'String', longitud: 150, obligatorio: false, desc: 'Usuario que revisa' },
      { nombre: 'Comentarios_Revision', tipo: 'String', longitud: 1000, obligatorio: false, desc: 'Feedback del revisor' },
      { nombre: 'Fecha_Envio_Email', tipo: 'Date', obligatorio: false, desc: 'Cuándo se envió la notificación' },
      { nombre: 'Confirmacion_Lectura', tipo: 'Logical', obligatorio: false, desc: 'Ha sido leído por destinatario' },
      { nombre: 'Documento_Adjunto', tipo: 'String', longitud: 255, obligatorio: false, desc: 'Referencia a archivo adjunto' },
      { nombre: 'Tags', tipo: 'String', longitud: 500, obligatorio: false, desc: 'Etiquetas para búsqueda' },
      { nombre: 'Notas_Internas', tipo: 'String', longitud: 1000, obligatorio: false, desc: 'Anotaciones del equipo' }
    ]
  },

  // Ejemplo de Tabla Maestra
  TABLA_MAESTRA_EJEMPLO: {
    nombre: 'Organismos Emisores',
    descripcion: 'Catálogo de administraciones públicas que pueden emitir notificaciones',
    campos: ['Codigo', 'Denominacion', 'Email_Contacto', 'Telefono'],
    filas_ejemplo: [
      { codigo: 'AGE001', denominacion: 'Agencia Estatal de la Administración Tributaria', email: 'info@aeat.es', telefono: '91 555 1111' },
      { codigo: 'SS001', denominacion: 'Seguridad Social - Dirección General', email: 'info@seg-social.es', telefono: '91 333 3333' },
      { codigo: 'MIN001', denominacion: 'Ministerio del Interior', email: 'tramites@interior.gob.es', telefono: '91 222 2222' },
      { codigo: 'AUTO001', denominacion: 'Comunidad Autónoma de X', email: 'notificaciones@ccaa.es', telefono: '9X XXX XXXX' },
    ]
  },

  // Ejemplo de Estimación de esfuerzo
  ESTIMACION_EJEMPLO: [
    { tarea: 'Análisis funcional y toma de requisitos', dias: 1.0, notas: 'Reunión inicial, definición de alcance' },
    { tarea: 'Diseño de estructura: Expediente principal', dias: 0.25, notas: '18 campos, 2 tablas maestras' },
    { tarea: 'Diseño de tabla maestra: Organismos emisores', dias: 0.19, notas: '4 campos, ~50 registros previstos' },
    { tarea: 'Workflow principal: Tramitación',dias: 0.5, notas: '5 etapas, integraciones email, validaciones' },
    { tarea: 'Plantilla Word: Notificación',  dias: 0.25, notas: 'Template estandarizada' },
    { tarea: 'Configuración Content Connector', dias: 1.0, notas: 'Integración con correo' },
    { tarea: 'Pruebas funcionales y ajustes', dias: 1.0, notas: 'Validación en QA' },
    { tarea: 'Formación de usuarios', dias: 0.5, notas: '1 sesión de 4 horas' }
  ],

  // Resumen de estimación (se calcula automáticamente)
  ESTIMACION_RESUMEN: {
    totalDias: 5.19,
    totalHoras: 41.5,
    tarifa: 800,
    iva: 21,
    totalImporte: 4152,
    totalConIva: 5024.92
  }
}

export default EFDT_EJEMPLOS
