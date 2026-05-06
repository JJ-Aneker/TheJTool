# Análisis - Qué traer de la versión anterior

Basado en `therefore_builder.html` (89KB) del proyecto antiguo.

## 1. CAMPOS TIPO TABLA ✓

**Ubicación en old code:** Líneas 455-525 en `therefore_builder.html`

**Estructura:**
```javascript
tableColumns: [
  { name: "ID", colname: "id_col", typeno: "1", length: "10", width: 150 },
  { name: "Descripción", colname: "desc_col", typeno: "1", length: "200", width: 200 },
  { name: "Cantidad", colname: "qty_col", typeno: "2", length: "", width: 100 }
]
```

**Qué hacer:**
- Editor permite agregar/editar columnas dentro de un campo tipo tabla
- TypeNo 10 = tabla
- ForeignTable = `TheIxTable_${camelCaseName}_Hist`
- Cada columna es un Field con `BelongsToTable` = TableNo

## 2. GENERACIÓN XML ✓

**Ubicación en old code:** Función `buildCategoryBlock()` línea 455+

**Key functions:**
- `buildCategoryBlock()` - Genera todo el XML de la categoría
- `makeDataField()` - Crea un DataField (campo de datos)
- `makeLabelField()` - Crea un LabelField (etiqueta/título)
- `xmlCaption()` - Escapa y formatea captions
- Manejo de colores con `bgr()` (Blue-Green-Red format Therefore)

## 3. PALETA + COLORES ✓

**Ubicación en old code:** Líneas 74-82

**Paletas predefinidas:**
- Corporativa
- Therefore Azul
- Verde Corporativo
- Rojo Institucional
- Gris Neutro
- Morado

**Color mapping:**
- `secBg`, `secText` - Sección
- `hdrBg`, `hdrText` - Header
- `dlgBg` - Dialog background
- `tabBg` - Tab background
- `fieldBg`, `fieldText` - Field background

## 4. eFORM GENERACIÓN ✓

**Ubicación en old code:** Función `fieldToEFormComponent()` línea 544+

**Mapeo de tipos Therefore → eForm JSON:**
- TypeNo 1 → text input
- TypeNo 2 → number input
- TypeNo 3 → date picker
- TypeNo 5 → money input
- TypeNo 6 → checkbox
- TypeNo 7 → datetime picker
- TypeNo 15 → select dropdown

**Usa:** `generar_eform.py` con template XML para generar eForm completo

## 5. PREVIEW ✓

**Ubicación en old code:** Componentes de preview que renderizan la estructura

**Muestra:**
- Vista previa de la forma con colores aplicados
- Validación de estructura en tiempo real

## TypeNo Mapping

```
1  = String (Text)
2  = Integer (Number)
3  = Date
5  = Money
6  = Logical (Boolean)
7  = DateTime
10 = Table
15 = Lookup
```

## Para implementar en el proyecto actual:

1. **Campos tipo Tabla:**
   - Agregar UI para definir columnas
   - Guardar estructura en campo `columnas: []`
   - Al generar XML, generar ForeignTable y campos de columna

2. **XML Generation:**
   - Implementar `buildCategoryBlock()` equivalente
   - Soporte para colores en campos

3. **Paleta y Preview:**
   - Mantener actualidad
   - Integrar colores en preview

4. **eForm:**
   - Botón superior "Generar eForm"
   - Usar `generar_eform.py` como backend

5. **TypeNo correcto:**
   - Cambiar de valores generados a TypeNo auténticos de Therefore
