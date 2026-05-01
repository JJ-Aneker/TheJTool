# PASO 2 Implementation - Testing Guide

## What Was Fixed

### 1. Table Field Parent References ✓
**Issue**: Table columns were referencing incorrect parent table FieldNo
**Fix**: Captured `tableFieldNo` before decrementing `globalFieldNo` counter
```javascript
const tableFieldNo = globalFieldNo--  // Capture actual FieldNo used
fieldsXml += makeTableField({ fieldno: tableFieldNo, ... })
// Now columns reference the correct parent
fieldsXml += makeTableColumnField({ ..., parentTableNo: tableFieldNo, ... })
```

### 2. Dynamic Tab Control Generation ✓
**Issue**: Tab Control was hardcoded to always have exactly 2 tabs
**Fix**: Tab Control now dynamically generates entries for all pestañas
```javascript
// Generate tab entries for each pestaña
const tabEntries = sortedPestañas.map((p, idx) => {
  const tabNo = idx + 1
  return `<T FactoryType="1">...</T>`  // One entry per pestaña
}).join('')
```

### 3. Field Tab Assignment Validation ✓
**Issue**: Fields without pestaña were being assigned to a default tab
**Fix**: Only fields with valid pestaña values get tab metadata
```javascript
const getTabMeta = (fieldPestaña) => {
  if (!hasTabs) return ''
  const trimmedPestaña = fieldPestaña?.trim()
  if (!trimmedPestaña || !pestañaToTabNo[trimmedPestaña]) return ''
  const tabNo = pestañaToTabNo[trimmedPestaña]
  return tabMetaXml(tabNo, TAB_NO)
}
```

---

## Manual Testing Steps

### Test 1: CSV Import with Fields
1. Open http://localhost:5180/category-builder
2. Click "▼ Importar campos desde CSV"
3. Paste this CSV:
```
Nombre;Tipo;Obligatorio;Sección;Pestaña;Categoría
ID Empleado;text;si;General;Datos;Recursos Humanos
Nombre Completo;text;si;General;Datos;Recursos Humanos
Correo;email;si;General;Datos;Recursos Humanos
Salario Base;money;si;Compensación;Datos;Recursos Humanos
```
4. Click "Analizar →"
5. Verify: Shows "✓ 4 campos · 1 categoría(s)"
6. Click "Reemplazar"
7. Verify: Fields appear in the editor with "Datos" pestaña

### Test 2: Create Additional Pestaña
1. In "General" section, locate "📑 Pestañas" area
2. Click input field next to "Datos" badge
3. Type "Contratos" 
4. Press Enter
5. Verify: New badge "Contratos ×" appears

### Test 3: Move Field to New Pestaña
1. Click dropdown on first field's "Pestaña" column (shows "Datos" by default)
2. Select "Contratos"
3. Verify: Field moves to "Contratos" tab below
4. Create another field and assign it to "Contratos"

### Test 4: Add Table Field
1. Click "+ Campo" button
2. In new field row:
   - Name: "Historial Salarios"
   - Type: "🗃 Tabla"
   - Pestaña: "Datos"
   - Click "▼" to expand
3. In expanded section, click "+ Columna"
4. Add columns:
   - Columna 1: Nombre="Fecha", Tipo="Fecha", Longitud=10
   - Columna 2: Nombre="Monto", Tipo="Importe (€)", Longitud=18
5. Verify: Both columns appear in the table columns panel

### Test 5: Generate XML with All Features
1. Click "Generar XML" button
2. Verify: XML modal opens with generated code
3. Copy XML and save to file
4. Check the XML contains:
   - TypeNo 10 fields for tables ✓
   - BelongsToTable references for columns ✓
   - ParentFieldType=2 for table columns ✓
   - Tab Control with correct pestañas ✓
   - ShowInTabNo assignments for fields in tabs ✓

---

## XML Validation Checklist

Look for these structures in generated XML:

### Table Field (TypeNo 10)
```xml
<Field>
  <FieldNo>-XX</FieldNo>
  <Caption>Historial Salarios</Caption>
  <TypeNo>10</TypeNo>
  <ForeignTable>TheIxTable_HistorialSalarios_Hist</ForeignTable>
  ...
</Field>
```

### Table Column (ParentFieldType=2)
```xml
<Field>
  <FieldNo>-YY</FieldNo>
  <ColName>Fecha</ColName>
  <BelongsToTable>-XX</BelongsToTable>
  <ParentFieldType>2</ParentFieldType>
  <Width>150</Width><Height>0</Height>
  <PosX>0</PosX><PosY>0</PosY>
  ...
</Field>
```

### Tab Control (TypeNo 13)
```xml
<Field>
  <FieldNo>-200</FieldNo>
  <TypeNo>13</TypeNo>
  <TabInfo FactoryType="1">
    <Tabs>
      <T><TabNo>1</TabNo><TabCapt>...Datos...</TabCapt></T>
      <T><TabNo>2</TabNo><TabCapt>...Contratos...</TabCapt></T>
      <T><TabNo>3</TabNo><TabCapt>...Historial...</TabCapt></T>
    </Tabs>
  </TabInfo>
  ...
</Field>
```

### Field in Tab (ShowInTabNo)
```xml
<Field>
  <FieldNo>-ZZ</FieldNo>
  <ColName>Salario Base</ColName>
  <BelongsToTable>-200</BelongsToTable>
  <ParentFieldType>3</ParentFieldType>
  <ShowInTabNo>1</ShowInTabNo>
  ...
</Field>
```

---

## Expected Behavior

| Feature | Before | After |
|---------|--------|-------|
| Table fields | ❌ Not supported | ✓ TypeNo 10 + columns |
| Tab Control | 2 tabs (hardcoded) | ✓ Dynamic N tabs |
| Parent reference | globalFieldNo+1 (wrong) | ✓ Captured tableFieldNo |
| Field tab assignment | Fields → default tab 1 | ✓ Only if pestaña set |

---

## Import in Therefore

Once XML is generated:
1. Save as `.xml` file
2. In Therefore → Solution Designer → Import XML
3. Check: No SQL parse errors
4. Verify:
   - All categories load ✓
   - Fields appear correctly ✓
   - Tables display with columns ✓
   - Tabs show correct grouping ✓

---

## Files Modified

- `src/views/CategoryBuilder.jsx` (line 1235-1274, 1186-1193, 1256-1277)
  - Fixed table field parent reference calculation
  - Implemented dynamic Tab Control generation
  - Fixed field tab assignment validation

---

## Status

✅ PASO 2 Implementation Complete
- [x] Table field support (TypeNo 10)
- [x] Table columns with correct parent references
- [x] Dynamic tab management UI
- [x] Dynamic Tab Control generation
- [x] Field pestaña assignment validation

Ready for testing and Therefore import validation.
