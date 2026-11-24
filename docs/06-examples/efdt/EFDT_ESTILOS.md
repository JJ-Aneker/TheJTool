# EFDT – Guía de estilos de documento
*Versión 1.2 · Mayo 2026 — corregido ancho tablas, tamaño texto tablas, portada, cabecera, conversión EMU imágenes*

---

## Fuentes

| Elemento        | Fuente              | Tamaño (pt) | sz (half-pt) | Color   | Negrita |
|-----------------|---------------------|-------------|--------------|---------|---------|
| Cuerpo (Normal) | Montserrat          | 9           | 18           | #404040 | No      |
| Heading 1       | Tungsten Reveal EXT | 26          | 52           | #404040 | No      |
| Heading 2       | Tungsten Reveal EXT | 16          | 32           | #404040 | No      |
| Heading 3       | Montserrat          | 11          | 22           | #404040 | Sí      |
| Heading 4       | Montserrat          | 10          | 20           | #7F7F7F | Sí      |
| Lista N1        | Montserrat          | 9           | 18           | #404040 | No      |
| Lista N2        | Montserrat          | 9           | 18           | #404040 | No      |
| Tabla cuerpo    | Montserrat          | **7**       | **14**       | #404040 | No      |
| Tabla cabecera  | Montserrat          | **7**       | **14**       | #FFFFFF | Sí      |
| Pie de página   | Montserrat          | 7           | 14           | #7F7F7F | No      |

> **Nota sz:** el campo `sz` del paquete `docx` de Node.js usa half-points (1 pt = sz 2). Ejemplo: 7pt → sz:14, 9pt → sz:18.

---

## Regla de mayúsculas — Tungsten Reveal EXT

Todos los textos con fuente Tungsten Reveal EXT (H1, H2, títulos de portada) usan **sentence case**:
- Primera letra en mayúscula, resto en minúsculas.
- Correcto: `Estructura documental`, `Flujo de trabajo`
- Incorrecto: ~~`Estructura Documental`~~, ~~`FLUJO DE TRABAJO`~~
- Implementación: `text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()`

---

## Párrafos

- **Alineación:** Justificado (`AlignmentType.BOTH`)
- **Espaciado después:** 120 twips (~0.2 cm)
- **Espaciado antes:** 0 (salvo headings)

---

## Colores corporativos

| Nombre         | Hex     | Uso                                       |
|----------------|---------|-------------------------------------------|
| Rojo Canon     | #C00000 | Cabeceras tabla, líneas H1, barra portada |
| Texto oscuro   | #404040 | Cuerpo y headings                         |
| Gris medio     | #7F7F7F | H4, pie de página, subtítulo portada      |
| Gris claro     | #F2F2F2 | Filas alternas tabla, notas               |
| Blanco         | #FFFFFF | Fondo tabla, texto en cabeceras           |
| Borde tabla    | #CCCCCC | Bordes de todas las tablas                |
| Amarillo       | #FFF2CC | Celdas / texto pendiente de confirmar     |
| Punto lista N1 | #C00000 | Viñeta rellena nivel 1                    |
| Punto lista N2 | #C00000 | Viñeta hueca nivel 2                      |

---

## Listas

### Nivel 1 — Viñeta rellena roja
- **Símbolo:** `●` (U+25CF, relleno)
- **Color:** #C00000
- **Fuente viñeta:** Arial
- **Sangría izquierda:** 720 twips (1.27 cm)
- **Colgante (hanging):** 360 twips
- **Referencia numbering:** `"bullet-l1"`

### Nivel 2 — Viñeta hueca roja
- **Símbolo:** `○` (U+25CB, hueco)
- **Color:** #C00000
- **Fuente viñeta:** Arial
- **Sangría izquierda:** 1080 twips (1.9 cm)
- **Colgante (hanging):** 360 twips
- **Referencia numbering:** `"bullet-l2"`

---

## Tablas

- **Ancho total:** `CONTENT_W` = **8504 DXA** — siempre ancho completo de la ventana de contenido
- **Cabecera:** fondo #C00000, texto #FFFFFF, Montserrat **7pt (sz:14)** bold
- **Cuerpo:** Montserrat **7pt (sz:14)**, color #404040
- **Filas alternas:** #FFFFFF / #F2F2F2
- **Bordes:** `BorderStyle.SINGLE`, size 1, color #CCCCCC
- **Márgenes de celda:** top:80, bottom:80, left:120, right:120
- **ShadingType:** siempre `CLEAR` (nunca `SOLID`)
- **Columnas:** definir siempre `columnWidths` en el `Table` Y `width` en cada `TableCell` — ambos deben sumar exactamente 8504 DXA

> ⚠️ **Corrección v1.2:** versiones anteriores indicaban 9360 DXA (error de template US Letter) y 8pt/sz:16 para el texto. Los valores correctos son **8504 DXA** y **7pt/sz:14**.

---

## Tabla de contenidos (TOC)

- **Niveles:** 3 (H1, H2, H3)
- **Posición:** después de Historial de documento, antes del contenido
- **Título de sección:** "Contenido" (H1)
- **Estilo:** TOC estándar de Word (se actualiza al abrir el documento)
- **TOC de imágenes:** campo `TOC \h \t "Pie de Foto;1"` (nombre de visualización, no styleId)

---

## Página

| Parámetro   | Valor                   |
|-------------|-------------------------|
| Tamaño      | A4 (11906 × 16838 DXA) |
| Margen sup. | 1800 DXA (~3.2 cm)     |
| Margen inf. | 1417 DXA (~2.5 cm)     |
| Margen lat. | 1701 DXA (~3 cm)       |
| Cabecera    | 708 DXA desde borde    |
| Pie         | 708 DXA desde borde    |

**Ancho de contenido:** 11906 − (1701 × 2) = **8504 DXA**

---

## Cabecera

- Sin logo imagen en la implementación actual (no hay asset PNG de logo Canon disponible en el proyecto).
- Nombre del proyecto alineado a la **derecha**, Montserrat 8pt (sz:16), color #7F7F7F.
- Línea roja inferior: `BorderStyle.SINGLE`, size 6, color #C00000, space 1.
- **La cabecera no aparece en la portada** (sección separada sin headers/footers).

---

## Pie de página

- Izquierda: "Confidencial · Canon España, S.A.U." — Montserrat 7pt (sz:14), #7F7F7F
- Derecha: "Página {N}" — Montserrat 7pt (sz:14), #7F7F7F, vía `SimpleField("PAGE")`
- Línea roja superior: `BorderStyle.SINGLE`, size 4, color #C00000, space 1
- Implementación con tab stop derecho en posición `CONTENT_W` (no usar tabla en pie — genera altura mínima no deseada)

---

## Caja de nota / aviso

- Barra izquierda: 200 DXA, fondo #C00000, sin bordes
- Cuerpo nota: fondo #F2F2F2, borde #CCCCCC (top/bottom/right), texto Montserrat 8.5pt (sz:17) itálica, #404040
- Ancho total: 8504 DXA (200 + 8304)

---

---

## Imágenes — referencia de conversión

> ⚠️ Para el cálculo correcto del tamaño de imágenes (`ImageRun`) ver **`EFDT_GENERACION.md` § Imágenes dentro del documento**.
> Resumen: `maxEmu = CONTENT_W × 635 × targetW` (factor DXA→EMU = 635, NO 9144).

## Portada

### Modo con imagen PNG (preferido)
- Imagen `Portada_corporativa.png` insertada como `ImageRun` flotante `behindDocument: true`.
- Sección independiente con **márgenes a cero** (top/bottom/left/right: 0) y sin header/footer.
- Dimensiones de render: **794 × 1123 px** (A4 a 96 dpi).
- Texto superpuesto en blanco (`#FFFFFF`) en zona inferior izquierda con `indent: { left: 1200 }`:
  - Título: Tungsten Reveal EXT 48pt blanco (sentence case)
  - Subtítulo: Montserrat 22pt blanco
  - Datos cliente/versión: Montserrat 18pt blanco
- La imagen **debe subirse al chat en cada sesión** — no se puede almacenar en el Knowledge como binario PNG.

### Modo sin imagen (fallback)
- Tabla de una columna, altura 600 DXA, fondo #C00000 — simula barra roja Canon.
- Texto "CANON" en Tungsten Reveal EXT 48pt blanco centrado dentro de la barra.
- Título, subtítulo y datos en negro debajo de la barra.
- Usar cuando no se disponga de la imagen corporativa.

### Instrucción de inicio de sesión
Indicar siempre al inicio del chat: **"adjunto portada"** o **"sin portada"**.

---

## Ítems pendientes de confirmar

- Celdas o filas con información por confirmar se marcan con fondo amarillo `#FFF2CC` (`ShadingType.CLEAR`).
- El disclaimer de aproximación de esfuerzo es **global** al documento, nunca por proceso individual.
