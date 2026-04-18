# Bug Analysis: category_replicator.html

## El Problema

El replicator genera 3 categorías clonadas, pero **Therefore las rechaza silenciosamente** (sin error).

---

## Root Cause Identificado

### Estructura de XML en Therefore

Una exportación de categoría tiene esta estructura:

```xml
<Configuration>
  <Version>...</Version>
  <NewImportExport>1</NewImportExport>
  <Categories>
    <Category>...</Category>    ← UNA categoría con 116 campos
  </Categories>
  <Counters>
    <Counter>...</Counter>      ← 14 CONTADORES globales
    <Counter>...</Counter>
    ...
  </Counters>
  <Templates>
    <Template>...</Template>    ← 2 PLANTILLAS globales
  </Templates>
  ... (resto de secciones)
</Configuration>
```

**Punto clave**: Los `<Counters>` y `<Templates>` son **GLOBALES**, no locales a cada categoría.

---

## El Bug en category_replicator.html

El HTML clona correctamente las 3 `<Category>` dentro de `<Categories>`:

```javascript
const newCategoriesBlock = `<Categories>${categoryBlocks.join('')}</Categories>`;
resultXml = resultXml.replace(categoriesMatch[0], newCategoriesBlock);
```

Pero **NO clona** los bloques `<Counters>` y `<Templates>`:

```
❌ XML Generado (INVÁLIDO):
  <Categories>
    <Category>...</Category>    ← Clon 1 con 116 campos
    <Category>...</Category>    ← Clon 2 con 116 campos
    <Category>...</Category>    ← Clon 3 con 116 campos
  </Categories>
  <Counters>
    <Counter>...</Counter>      ← Solo 14 contadores (debería ser 14×3=42)
    ...
  </Counters>
  <Templates>
    <Template>...</Template>    ← Solo 2 plantillas (debería ser 2×3=6)
  </Templates>
```

**Therefore ve un desequilibrio**: 3 categorías × 14 contadores cada una = 42 contadores esperados, pero solo hay 14. Rechaza el XML silenciosamente.

---

## Solución Requerida

El HTML debe:

1. **Clonar `<Counters>` globales**: Por cada clon de categoría, duplicar los 14 contadores
   - Regenerar el GUID de cada contador clonado
   - Resetear `<Next>` a 1 en cada clon
   
2. **Clonar `<Templates>` globales**: Por cada clon de categoría, duplicar las 2 plantillas
   - Regenerar el GUID de cada plantilla clonada

3. **Mantener relaciones**: Los contadores y plantillas de un clon deben estar asociados correctamente con su categoría padre

---

## Cambios Necesarios en category_replicator.html

### Antes (línea 399-406):
```javascript
const categoriesMatch = resultXml.match(/<Categories>[\s\S]*?<\/Categories>/);
if (categoriesMatch) {
  const newCategoriesBlock = `<Categories>${categoryBlocks.join('')}</Categories>`;
  resultXml = resultXml.replace(categoriesMatch[0], newCategoriesBlock);
}
```

### Después (debe incluir):
```javascript
// 1. Reemplazar <Categories> ✅ (ya está bien)
// 2. Clonar <Counters> globales ❌ (falta)
// 3. Clonar <Templates> globales ❌ (falta)
```

Cada clon debe tener asociados:
- Sus campos (ya están dentro de `<Category>`)
- Sus 14 contadores nuevos (en `<Counters>`)
- Sus 2 plantillas nuevas (en `<Templates>`)

---

## Verificación

Para verificar si el XML es correcto, contar:

```bash
# Debe haber 3 categorías
grep -o '<Category>' | wc -l        # Debe ser 3
grep -o '</Category>' | wc -l       # Debe ser 3

# Debe haber 42 contadores (14 × 3)
grep -o '<Counter>' | wc -l         # Debe ser 42
grep -o '</Counter>' | wc -l        # Debe ser 42

# Debe haber 6 plantillas (2 × 3)
grep -o '<Template>' | wc -l        # Debe ser 6
grep -o '</Template>' | wc -l       # Debe ser 6
```

---

## Impacto

- **Sin esta fix**: El XML siempre generará un desequilibrio
- **Con esta fix**: El XML será válido para importar en Therefore
