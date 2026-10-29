// Prompts y guías para generación de documentos de licenciamiento Therefore™

export const LICENSING_STYLE_GUIDE = `
# GUÍA DE ESTILO PARA DOCUMENTOS DE LICENCIAMIENTO THEREFORE™

## Tono y Voz
- **Profesional pero accesible**: Evitar jerga excesiva, explicar términos técnicos cuando sea necesario
- **Consultivo y orientado a soluciones**: Presentar las licencias como respuesta a necesidades específicas
- **Confiable y experimentado**: Demostrar conocimiento profundo del producto y del sector
- **Orientado al valor de negocio**: Siempre vincular características técnicas con beneficios empresariales

## Estructura Narrativa
1. **Contexto del cliente**: Entender la situación actual y necesidades
2. **Solución propuesta**: Presentar la configuración de licencias como respuesta directa
3. **Justificación técnica**: Explicar POR QUÉ cada componente es relevante
4. **Valor de negocio**: Cuantificar o cualificar el impacto esperado
5. **Próximos pasos**: Guiar hacia la acción

## Principios de Redacción

### DO (Hacer)
- Usar párrafos concisos (3-4 líneas máximo)
- Vincular cada licencia/módulo con una necesidad específica del cliente
- Cuantificar cuando sea posible (usuarios, documentos, procesos)
- Usar listas para enumeraciones y comparaciones
- Incluir ejemplos concretos de uso
- Explicar el "por qué" antes del "qué"

### DON'T (Evitar)
- Párrafos extensos sin estructura
- Listados de características sin contexto
- Tecnicismos sin explicación
- Generalidades sin especificidad al cliente
- Lenguaje de venta agresivo
- Comparaciones con competencia

## Lenguaje Específico

### Términos Preferidos
- "Solución de gestión documental" > "Software"
- "Automatización de procesos" > "Características automáticas"
- "Usuarios clave" > "Usuarios importantes"
- "Eficiencia operativa" > "Ahorro de tiempo"
- "Trazabilidad y cumplimiento" > "Control de documentos"

### Frases Clave
- "Diseñado específicamente para..."
- "En respuesta a la necesidad de..."
- "Esto permite a [cliente] poder..."
- "Con el objetivo de optimizar..."
- "Garantizando [beneficio] a través de [característica]"

## Estructura de Secciones

### 1. Contexto del Cliente
**Objetivo**: Demostrar comprensión de su situación
**Elementos**: Sector, tamaño, necesidades identificadas, desafíos actuales
**Longitud**: 2-3 párrafos

### 2. Solución Propuesta
**Objetivo**: Presentar la configuración global
**Elementos**: Modelo de licenciamiento, número de usuarios por tipo, módulos incluidos
**Longitud**: 3-4 párrafos

### 3. Detalle de Componentes
**Objetivo**: Justificar cada elemento de la propuesta
**Elementos**: Por cada componente → qué es + por qué se incluye + qué valor aporta
**Longitud**: 1-2 párrafos por componente principal

### 4. Beneficios Esperados
**Objetivo**: Cuantificar/cualificar el impacto
**Elementos**: Lista de beneficios concretos vinculados a la solución
**Longitud**: Lista de 5-7 items

### 5. Módulos Adicionales Disponibles
**Objetivo**: Mostrar escalabilidad y opciones futuras
**Elementos**: Descripción breve de capacidades no incluidas pero relevantes
**Longitud**: 1 párrafo por módulo

## Ejemplos de Buena Redacción

### Malo ❌
"Therefore™ Content Connector es un módulo que automatiza la captura de documentos desde emails y carpetas."

### Bueno ✅
"Para automatizar la ingesta de albaranes que actualmente llegan por email, la solución incluye Therefore™ Content Connector. Este módulo monitorizará de forma desatendida los buzones designados, extrayendo automáticamente los documentos adjuntos y procediendo a su indexación sin intervención manual. Esto eliminará la tarea actual de descarga y archivo manual, liberando aproximadamente 2 horas diarias del equipo administrativo."

### Malo ❌
"La solución incluye 5 licencias nominales y 10 concurrentes."

### Bueno ✅
"La configuración de licenciamiento responde al modelo de trabajo identificado: 5 licencias nominales dedicadas para el equipo de RRHH y Contabilidad que requieren acceso permanente al sistema, y 10 licencias concurrentes compartidas para los 25 usuarios del departamento comercial que acceden de forma rotatoria para consultas puntuales. Esta distribución optimiza el coste total mientras garantiza disponibilidad para todos los usuarios."
`

export const LICENSING_PROMPT_TEMPLATE = `
Eres un consultor senior de soluciones de gestión documental Therefore™ con más de 10 años de experiencia.

Tu tarea es generar el contenido narrativo para un documento de propuesta de licenciamiento Therefore™.

## INFORMACIÓN DEL CLIENTE
Cliente: {cliente}
Sector: {sector}
Contexto: {contexto}

## CONFIGURACIÓN PROPUESTA
Modelo de licenciamiento: {modelo}
Edición: {edicion}

### Licencias de Usuario
{licencias_detalle}

### Módulos y Conectores Incluidos
{modulos_incluidos}

### Años de Contrato
{anos_contrato}

## INSTRUCCIONES DE GENERACIÓN

Genera el contenido para las siguientes secciones del documento siguiendo la GUÍA DE ESTILO adjunta:

### 1. CONTEXTO DEL CLIENTE (2-3 párrafos)
- Describir la situación actual del cliente en gestión documental
- Identificar los desafíos o necesidades que motivan esta propuesta
- Establecer el contexto de negocio relevante

### 2. SOLUCIÓN PROPUESTA - VISIÓN GENERAL (3-4 párrafos)
- Presentar el modelo de licenciamiento elegido y JUSTIFICAR por qué es el más adecuado
- Explicar la estrategia de distribución de licencias (nominales vs concurrentes vs readonly)
- Describir cómo la solución responde a las necesidades identificadas
- Destacar los módulos/conectores clave incluidos y su propósito

### 3. DETALLE DE COMPONENTES CLAVE
Para CADA módulo/conector importante incluido, genera un párrafo que explique:
- Qué es y qué hace
- Por qué se ha incluido en esta propuesta específica
- Qué valor de negocio aporta al cliente
- Ejemplo concreto de uso en su contexto

### 4. BENEFICIOS ESPERADOS
Lista de 5-7 beneficios concretos y cuantificables cuando sea posible que el cliente obtendrá.

### 5. MÓDULOS ADICIONALES DISPONIBLES (si aplica)
{modulos_disponibles}

Para cada módulo NO incluido pero relevante, explicar brevemente:
- Qué capacidad adicional aportaría
- En qué escenario futuro podría ser útil

## FORMATO DE SALIDA

Devuelve SOLO un objeto JSON con esta estructura exacta:

{
  "contexto_cliente": "...",
  "solucion_propuesta": "...",
  "componentes": {
    "nombre_componente_1": "descripción detallada...",
    "nombre_componente_2": "descripción detallada...",
    ...
  },
  "beneficios": [
    "beneficio 1",
    "beneficio 2",
    ...
  ],
  "modulos_adicionales": {
    "nombre_modulo_1": "descripción...",
    "nombre_modulo_2": "descripción...",
    ...
  }
}

IMPORTANTE:
- Escribe en español de España
- Usa un tono profesional pero cercano
- Vincula SIEMPRE características técnicas con valor de negocio
- Sé específico al cliente, evita generalidades
- Los párrafos deben ser concisos (3-4 líneas máximo)
- Devuelve SOLO el JSON, sin markdown ni explicaciones adicionales
`

export const LICENSING_QUALITY_CHECKLIST = `
# CHECKLIST DE CALIDAD - DOCUMENTO DE LICENCIAMIENTO

## Contenido
- [ ] El contexto del cliente es específico y demuestra comprensión de su negocio
- [ ] Cada licencia/módulo tiene una justificación clara vinculada a una necesidad
- [ ] Los beneficios son concretos y cuantificables cuando es posible
- [ ] No hay jerga técnica sin explicación
- [ ] Los ejemplos de uso son relevantes al sector del cliente

## Estructura
- [ ] El documento fluye de general a específico
- [ ] Cada sección tiene un propósito claro
- [ ] Los párrafos son concisos (3-4 líneas máximo)
- [ ] Las listas son paralelas en estructura gramatical
- [ ] La tabla de cotización es clara y completa

## Tono y Estilo
- [ ] El tono es consultivo, no de venta agresiva
- [ ] Se explica el "por qué" antes del "qué"
- [ ] El lenguaje es profesional pero accesible
- [ ] No hay redundancias ni repeticiones
- [ ] Las transiciones entre secciones son fluidas

## Formato
- [ ] Portada profesional con logo y datos correctos
- [ ] Índice funcional con enlaces
- [ ] Tablas con formato consistente
- [ ] Tipografía consistente (fuentes, tamaños, colores)
- [ ] Espaciado y márgenes adecuados

## Valor de Negocio
- [ ] Cada componente técnico tiene su beneficio de negocio asociado
- [ ] Los costes están justificados por el valor aportado
- [ ] Se identifican eficiencias, ahorros o mejoras medibles
- [ ] La solución se presenta como inversión, no como gasto
- [ ] Los próximos pasos son claros y accionables
`

export const ENHANCEMENT_PROMPTS = {
  improve_context: `
Revisa y mejora el siguiente contexto del cliente para el documento de licenciamiento.
El contexto debe ser específico, demostrar comprensión profunda de su negocio y establecer
claramente las necesidades que motivan esta propuesta.

Contexto actual:
{current_context}

Información adicional del cliente:
{client_info}

Devuelve el contexto mejorado manteniendo 2-3 párrafos concisos.
`,

  justify_component: `
Genera una justificación detallada para incluir el siguiente componente en la propuesta
de licenciamiento para {cliente}.

Componente: {component_name}
Descripción técnica: {component_description}
Contexto del cliente: {client_context}

La justificación debe:
1. Explicar qué hace el componente en términos de negocio
2. Vincular directamente con una necesidad específica del cliente
3. Cuantificar o cualificar el valor que aporta
4. Incluir un ejemplo concreto de uso en su contexto

Devuelve 1-2 párrafos concisos.
`,

  quantify_benefits: `
Convierte los siguientes beneficios genéricos en beneficios específicos y cuantificables
para {cliente} en el sector {sector}.

Beneficios genéricos:
{generic_benefits}

Contexto del cliente:
{client_context}

Devuelve una lista de 5-7 beneficios concretos, cuantificados cuando sea posible.
`
}
