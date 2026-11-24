# EFDT – Guía de generación de documentos
*Versión 1.1 · Mayo 2026 — corrección crítica conversión EMU imágenes*

---

## Estado actual del generador

El kit de generación EFDT está operativo y basado en:

- **Runtime:** Node.js + paquete `docx` (CommonJS `.cjs`)
- **Scripts:** se crean en `/home/claude/` en cada sesión
- **Outputs:** `/mnt/user-data/outputs/`
- **Validación:** `python3 /mnt/skills/public/docx/scripts/office/validate.py <fichero.docx>`
- **Estilos de referencia:** `/mnt/project/EFDT_ESTILOS.md`

---

## Portada corporativa

### Modo con imagen PNG (preferido)
- La imagen `Portada_corporativa.png` **debe subirse al chat al inicio de cada sesión** — el Knowledge no admite binarios PNG, solo texto.
- Cuando se sube: se inserta como `ImageRun` flotante `behindDocument: true` con márgenes de página a cero (sección independiente sin header/footer), cubriendo la página completa.
- Dimensiones A4 completo: **794 × 1123 px** a 96 dpi.
- El texto del título, subtítulo y datos del cliente se superpone en blanco (`#FFFFFF`) en la zona inferior izquierda, con `indent: { left: 1200 }`, aprovechando el degradado oscuro de la imagen.
- Fuentes en portada: título en **Tungsten Reveal EXT 64pt blanco**, subtítulo Montserrat 22pt blanco, datos Montserrat 18pt blanco.

### Modo sin imagen (fallback)
- Si no se dispone de la imagen, se usa portada alternativa: tabla de una columna con fondo `#C00000` (altura 600 DXA) simulando barra roja Canon, con el texto del título en negro debajo.
- Indicar siempre al inicio del chat: **"adjunto portada"** o **"sin portada"**.

---

## Imágenes dentro del documento

- Cualquier captura de pantalla subida al chat se puede insertar como `ImageRun` inline en la sección correspondiente.
- Centradas (`AlignmentType.CENTER`), con `spacing: { before: 120, after: 160 }`.
- Formato: `ImageRun` con `transformation: { width: Math.round(wEmu / 9144), height: Math.round(hEmu / 9144) }`.
- Indicar en el prompt a qué sección corresponde cada imagen, o se infiere del contexto de la captura.
- Las imágenes subidas quedan disponibles en `/mnt/user-data/uploads/` durante la sesión.

### ⚠️ Conversión de unidades — regla crítica (validada Mayo 2026)

`CONTENT_W` está expresado en **DXA**, no en píxeles. Las conversiones son distintas:

| Conversión | Factor |
|---|---|
| 1 DXA → EMU | × 635 |
| 1 px → EMU | × 9144 |

**Patrón correcto obligatorio** para calcular el tamaño de imagen:

```javascript
// targetW: fracción del ancho de contenido (0.0–1.0). Usar 1.0 para ancho completo.
function imgPara(buffer, origW, origH, label, targetW = 1.0) {
  const maxEmu = Math.round(CONTENT_W * 635 * targetW);   // DXA → EMU
  const scale  = Math.min(1, maxEmu / (origW * 9144));     // escala sin superar máximo
  const wEmu   = Math.round(origW * 9144 * scale);
  const hEmu   = Math.round(origH * 9144 * scale);
  // En ImageRun:
  //   width:  Math.round(wEmu / 9144)
  //   height: Math.round(hEmu / 9144)
}
```

> ❌ **Error frecuente (no repetir):** usar `CONTENT_W * 9144` como ancho máximo sobreestima
> el espacio disponible por un factor ~14, haciendo que las imágenes escapen al margen de página.
> El factor correcto desde DXA es **635**, no 9144.

---

## Tipografía — regla de mayúsculas

### Tungsten Reveal EXT (H1, H2, títulos de portada)
- **Sentence case obligatorio:** primera letra en mayúscula, resto en minúsculas.
- Ejemplos correctos: `Estructura documental`, `Flujo de trabajo`, `Actividades previstas y estimación de esfuerzo`
- Ejemplos incorrectos: ~~`Estructura Documental`~~, ~~`FLUJO DE TRABAJO`~~
- Implementación en código: `text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()`

### Montserrat (H3, H4, cuerpo, tablas, pie)
- Sin restricción especial de casing — se aplica capitalización normal según contexto.

---

## Ancho de contenido y tablas — valores correctos

**CONTENT_W = 8504 DXA** (A4 con márgenes laterales de 1701 DXA cada lado).

> ⚠️ **Contradicción detectada en `EFDT_ESTILOS.md`:** la sección "Tablas" indica un ancho de 9360 DXA (márgenes de 1 pulgada / 1440 DXA), pero la sección "Página" especifica márgenes laterales de 1701 DXA (~3 cm). El valor correcto y en uso en todos los documentos generados es **8504 DXA**. La referencia a 9360 DXA en `EFDT_ESTILOS.md` es un error heredado del template US Letter y debe ignorarse.

### Reglas de tablas (definitivas)

| Parámetro | Valor |
|---|---|
| Ancho | Siempre `CONTENT_W` completo = **8504 DXA** |
| Texto celdas | Montserrat **7pt (sz:14)**, color `#404040` |
| Texto cabeceras | Montserrat **7pt bold (sz:14)**, color `#FFFFFF` |
| Fondo cabecera | `#C00000` |
| Filas alternas | `#FFFFFF` / `#F2F2F2` |
| Bordes | `BorderStyle.SINGLE`, size 1, color `#CCCCCC` |
| Márgenes celda | top:80, bottom:80, left:120, right:120 |
| ShadingType | Siempre `CLEAR` (nunca `SOLID`) |

> ⚠️ **Corrección respecto a `EFDT_ESTILOS.md`:** ese documento indica 8pt (sz:16) para tablas. El valor correcto y definitivo es **7pt (sz:14)**.

---

## Cabecera

- **Sin logo imagen** en la implementación actual (el `EFDT_ESTILOS.md` menciona "Logo VOX" pero no hay asset de logo Canon disponible como fichero en el proyecto).
- Texto del nombre del proyecto alineado a la derecha, Montserrat 8pt (sz:16), color `#7F7F7F`.
- Línea roja inferior: `BorderStyle.SINGLE`, size 6, color `#C00000`, space 1.
- La cabecera **no aparece en la portada** (sección separada sin headers/footers).

---

## Estructura de secciones del documento

| Sección | Header/Footer | Márgenes |
|---|---|---|
| Portada | No | 0 (bleed completo) |
| Resto del documento | Sí | Estándar (1701/1800/1417) |

Implementación: dos entradas en el array `sections` del `Document`.

---

## Checklist de inicio de sesión de generación

Antes de generar un EFDT, confirmar con JJ:

- [ ] ¿Se adjunta `Portada_corporativa.png`?
- [ ] ¿Se adjuntan capturas de pantalla para insertar en el documento? ¿A qué secciones corresponden?
- [ ] ¿Cuál es el cliente y el nombre del proyecto?
- [ ] ¿Es documento directo a cliente final o a través de partner?
- [ ] ¿Tarifa estándar (800 €/jornada) o excepción?
- [ ] ¿Hay ítems de alcance pendiente de confirmar (marcar en amarillo `#FFF2CC`)?
