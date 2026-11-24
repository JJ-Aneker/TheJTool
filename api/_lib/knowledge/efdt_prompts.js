// Guías de estilo y calidad para generación de EFDT

export const EFDT_STYLE_GUIDE = {
  tipografia: {
    h1: {
      fuente: 'Tungsten Reveal EXT',
      tamanio: '26pt (sz:52 en docx)',
      casificacion: 'sentence case (primera mayúscula, resto minúsculas)',
      color: '#404040',
      ejemplo_correcto: 'Estructura documental',
      ejemplo_incorrecto_1: 'ESTRUCTURA DOCUMENTAL',
      ejemplo_incorrecto_2: 'Estructura Documental'
    },
    h2: {
      fuente: 'Tungsten Reveal EXT',
      tamanio: '16pt (sz:32)',
      casificacion: 'sentence case',
      color: '#404040'
    },
    h3: {
      fuente: 'Montserrat',
      tamanio: '11pt (sz:22)',
      negrita: true,
      color: '#404040'
    },
    body: {
      fuente: 'Montserrat',
      tamanio: '9pt (sz:18)',
      alineacion: 'justificado',
      color: '#404040',
      espaciado_despues: '120 twips (~0.2cm)'
    }
  },

  tablas: {
    ancho_contenido_dxa: 8504,
    nota_critica: 'SIEMPRE 8504 DXA (margen A4: 1701 DXA cada lado). NO usar 9360 DXA (error US Letter).',
    cabecera: {
      fuente: 'Montserrat 7pt (sz:14)',
      negrita: true,
      fondo: '#C00000',
      texto: '#FFFFFF'
    },
    cuerpo: {
      fuente: 'Montserrat 7pt (sz:14)',
      color: '#404040'
    },
    filas_alternas: '#FFFFFF / #F2F2F2',
    bordes: 'SINGLE, tamaño 1, color #CCCCCC',
    margenes_celda: 'top:80, bottom:80, left:120, right:120',
    shading_type: 'CLEAR (nunca SOLID)'
  },

  colores_corporativos: {
    rojo_canon: '#C00000',
    texto_oscuro: '#404040',
    gris_medio: '#7F7F7F',
    gris_claro: '#F2F2F2',
    blanco: '#FFFFFF',
    borde_tabla: '#CCCCCC',
    amarillo_pendiente: '#FFF2CC'
  },

  portada: {
    tipo: 'PNG (preferido) o tabla roja fallback',
    dimensiones_png: '794 × 1123 px (A4 a 96 dpi)',
    insercion: 'FloatingImage con behindDocument:true, márgenes página = 0',
    texto_overlay: 'Blanco (#FFFFFF) en zona inferior izquierda, indent left:1200',
    titulo_portada: 'Tungsten Reveal EXT 64pt, blanco, sentence case',
    subtitulo_portada: 'Montserrat 22pt, blanco',
    datos_portada: 'Montserrat 18pt, blanco (cliente, versión)',
    fallback: 'Tabla 1 columna, altura 600 DXA, fondo #C00000, texto "CANON" centrado'
  },

  listas: {
    nivel_1: {
      simbolo: '●',
      color: '#C00000',
      sangria_izquierda: '720 twips (1.27cm)',
      colgante: '360 twips'
    },
    nivel_2: {
      simbolo: '○',
      color: '#C00000',
      sangria_izquierda: '1080 twips (1.9cm)',
      colgante: '360 twips'
    }
  },

  pagina: {
    tamanio: 'A4 (11906 × 16838 DXA)',
    margen_superior: '1800 DXA (~3.2cm)',
    margen_inferior: '1417 DXA (~2.5cm)',
    margen_lateral: '1701 DXA (~3cm cada lado)',
    cabecera_distancia: '708 DXA desde borde',
    pie_distancia: '708 DXA desde borde'
  }
}

export const QUALITY_CHECKLIST = [
  '✓ Las descripciones funcionales tienen el mismo nivel de detalle que el documento de referencia proporcionado',
  '✓ Los workflows tienen mínimo 4-5 etapas (inicio, revisión, aprobación, ejecución, archivo)',
  '✓ Las tablas maestras incluyen al menos 3 ejemplos realistas de datos',
  '✓ Los nombres de campos siguen convención Spanish CamelCase (ID_Campo, Fecha_Creacion, etc.)',
  '✓ Las estimaciones usan ratios validados (análisis: 1 día, case: 2h, categoría: 1.5h, WF: 4h)',
  '✓ La estimación total nunca supera 20 días para proyectos estándar',
  '✓ Las premisas son realistas y documentadas (p.ej: "Máximo 50 usuarios concurrentes")',
  '✓ El alcance es coherente: si hay 3 categorías principales, hay mínimo 3 tablas maestras',
  '✓ Los nombres de elementos son en español coherente (notación consistente)',
  '✓ La estructura del documento sigue el orden: Cliente, Proyecto, Alcance, Estructura, Licencias, Estimación, Riesgos'
]

export const PROMPTS_ENHANCEMENT = `

## INSTRUCCIÓN DE ESTILO PARA TODAS LAS RESPUESTAS

### Sentence Case Obligatorio (solo Tungsten Reveal EXT)
Todos los títulos (H1, H2) y títulos de portada DEBEN estar en sentence case:
- Correcto: "Estructura documental", "Flujo de trabajo del expediente"
- Incorrecto: "ESTRUCTURA DOCUMENTAL", "Flujo De Trabajo Del Expediente"
Implementa: text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()

### Tablas — Reglas de Proporciones
- CONTENT_W = 8504 DXA (NUNCA 9360, es error heredado)
- Texto tablas: Montserrat 7pt (sz:14), color #404040
- Cabeceras: Fondo #C00000, texto #FFFFFF, Montserrat 7pt bold
- Filas alternas: #FFFFFF / #F2F2F2 sin solapamientos
- Márgenes celda: top 80, bottom 80, left 120, right 120 (no variar)

### Descripciones — Nivel de Detalle
Cada descripción de workflow, campo, o proceso debe tener:
1. Propósito principal (1-2 frases)
2. Entradas/precondiciones (si aplica)
3. Proceso paso a paso (3-5 pasos)
4. Salidas/resultado
5. Restricciones o validaciones especiales

Usa el documento de referencia como modelo exacto de profundidad.

### Estimaciones — Coherencia Obligatoria
Las horas estimadas deben respetar estos ratios validados:
- Análisis funcional: 1 día (8h) máximo
- Case/Expediente principal (15-20 campos): 0,25 días (2h)
- Categoría dependiente: 0,19 días (1,5h)
- Workflow simple (4-5 etapas): 0,5 días (4h)
- Plantilla Word: 0,25 días (2h)
- Content Connector: 1 día (8h)
- Pruebas: 1 día (8h)
- Formación: 0,5 días (4h)

Si el total supera 20 días, revisa a la baja. NO generes estimaciones infladas.

### Nombres de Campos — Convención Consistente
- ID_Expediente, Fecha_Creacion, Email_Contacto (CamelCase con guiones bajos)
- Evita abreviaturas opacas (NO: "Fec_Crea", usar "Fecha_Creacion")
- Evita acrónimos sin contexto (NO: "ATPE", usar "Asunto_Tramitacion_Principal")
- Usa español coherente en todo el documento

### Portada — Información Obligatoria
Si se proporciona PNG de portada:
- Dimensiones: 794 × 1123 px (A4 a 96 dpi)
- Texto overlay en blanco (#FFFFFF), zona inferior izquierda
- Título en Tungsten 64pt sentence case
- Subtítulo Montserrat 22pt
- Datos cliente/versión Montserrat 18pt
`

export default {
  EFDT_STYLE_GUIDE,
  QUALITY_CHECKLIST,
  PROMPTS_ENHANCEMENT
}
