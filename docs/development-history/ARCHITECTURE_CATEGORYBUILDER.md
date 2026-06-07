# CategoryBuilder Architecture — Critical Knowledge Base

> **Last Updated**: 2026-05-24  
> **Status**: ✅ TESTED AND WORKING  
> **Multi-Category Support**: 3+ categories with separate tabs and fields

---

## Overview

CategoryBuilder is a React component that converts CSV definitions into Therefore™ DMS XML category configurations. It supports multiple categories, tabs (pestañas), sections, and various field types.

**Critical Rule**: This architecture is fragile. Small changes to ID allocation can break everything. Always test multi-category import after modifications.

---

## XML Generation Pipeline

```
CSV Input
  ↓
Parse CSV (parseCsv)
  ├─ Group by Category (Categoría column)
  ├─ Group by Tab (Pestaña column)
  ├─ Group by Section (Sección column)
  └─ Create field objects
  ↓
Generate XML (generateXml)
  ├─ Create offset system for 3+ categories
  ├─ For each category:
  │  ├─ Generate section headers (TypeNo 4 = labels)
  │  ├─ Generate data fields (TypeNo 1,2,3,5,6,7)
  │  ├─ Generate tab control (TypeNo 13)
  │  └─ Assign BelongsToTable, ShowInTabNo metadata
  ├─ Build complete <Configuration>
  └─ Output valid Therefore XML
  ↓
Import into Therefore Solution Designer
  ├─ Parse XML structure
  ├─ Verify all FieldNo are unique (PRIMARY KEY)
  ├─ Create categories with fields
  ├─ Assign real CtgryNo/FieldNo automatically
  └─ Categories appear in Solution Designer
```

---

## Critical: ID Allocation System (Offset Model)

### The Problem It Solves

Therefore requires **globally unique FieldNo** across all categories in a single XML file. Without proper separation, different categories step on each other's IDs.

### The Solution: Per-Category Slots

Each category gets its own **completely separate range** of numbers:

```
Category 0 (index 0):
  fieldNoStart:  -1      (allocates: -1, -2, -3, ..., -200)
  labelNoStart: -151     (allocates: -151, -152, ..., -350)
  tabNo:        -500     (allocates: -500)

Category 1 (index 1):
  fieldNoStart: -201     (allocates: -201, -202, ..., -400)
  labelNoStart: -351     (allocates: -351, -352, ..., -550)
  tabNo:        -700     (allocates: -700)

Category 2 (index 2):
  fieldNoStart: -401     (allocates: -401, -402, ..., -600)
  labelNoStart: -551     (allocates: -551, -552, ..., -700)
  tabNo:        -900     (allocates: -900)
```

### Implementation (src/views/CategoryBuilder.jsx, line 1697-1720)

```javascript
let globalFieldNoOffset = -1      // Starting point for Category 0
let globalTabNoOffset = -500      // Separate sequence for tabs

const categoryXmlBlocks = categories
  .filter(cat => cat.name.trim())
  .map((cat, idx) => {
    // For each category: compute its own starting points
    const labelNoStart = globalFieldNoOffset - 150  // Guarantees separation
    
    const catXml = generateCategoryXml(cat, idx, {
      fieldNoStart: globalFieldNoOffset,
      labelNoStart: labelNoStart,
      tabNo: globalTabNoOffset
    })

    // Move to next category's range (200 slots per category)
    globalFieldNoOffset -= 200
    globalTabNoOffset -= 200

    return catXml
  })
```

### Why 200 Slots Per Category?

- Worst case: 1 section header (label) per section + 2 fields per row + 1 tab control
- Safety margin to accommodate complex structures
- Better to overprovision than to collide

### ⚠️ CRITICAL RULE: Never Change Without Testing

If you modify the offset system:
1. Run `node verify_xml_structure.js` on generated XML
2. Run `node verify_ctgryno.js` to check uniqueness
3. Actually import into Therefore (not just visual check)
4. Verify all 3+ categories appear in Solution Designer
5. Check each category has correct fields and tabs

---

## Field Type Mapping

Map CSV "Tipo" column → Therefore TypeNo:

| CSV Type | TypeNo | Therefore Type | Length Tag? | ColName? |
|----------|--------|---|---|---|
| `String` | 1 | StringField | ✅ | ✅ |
| `Integer` | 2 | IntField | ✅ | ✅ |
| `Date` | 3 | DateField | ❌ | ✅ |
| `Money` | 5 | MoneyField | ✅ (always 18) | ✅ |
| `Boolean` | 6 | LogicalField | ❌ | ✅ |
| `DateTime` | 7 | DateTimeField | ❌ | ✅ |
| Section/Label | 4 | LabelField | ❌ | ❌ |
| Tab Control | 13 | TabControl | ❌ | ❌ |

---

## Tab/Pestaña System

### How It Works

1. **CSV defines pestaña in "Pestaña" column** (required for tab support)
2. **CategoryBuilder detects all unique pestaña values** (sorted alphabetically)
3. **For each pestaña**, assigns a TabNo (1, 2, 3, ...)
4. **Each field marked with pestaña gets metadata**:
   ```xml
   <BelongsToTable>-200</BelongsToTable>
   <ParentFieldType>3</ParentFieldType>
   <ShowInTabNo>1</ShowInTabNo>
   ```

### Critical: Section Header Visibility

Section headers (TypeNo 4) only appear in tabs where their fields exist.

**Implementation** (line 1575-1609):
```javascript
if (hasPestañas) {
  sortedPestañas.forEach((pestaña) => {
    sections.forEach((sec, si) => {
      // Only render section if it has fields for THIS pestaña
      const fieldsInTab = sec.fields.filter(f => f.pestaña?.trim() === pestaña)
      if (fieldsInTab.length === 0) return  // Skip empty sections
      
      // Render section header ONLY for this pestaña
      fieldsXml += makeLabelField({ 
        fieldno: labelNo--,
        caption: sec.name,
        tabMeta: getTabMeta(pestaña)  // Assigns to correct tab
      })
    })
  })
}
```

---

## CSV Column Specification

**Required columns:**
- `Categoría` — Category name (groups rows into separate categories)
- `Pestaña` — Tab name (optional; if empty, all fields in one view)
- `Sección` — Section header name (groups fields visually)
- `Nombre` — Field display name
- `Tipo` — Field type (String, Integer, Date, Money, Boolean, DateTime)
- `Longitud` — Max characters (for StringField only; ignored for others)
- `Obligatorio` — Si/No (for future validation; not currently enforced)

**Example:**
```csv
Categoría,Pestaña,Sección,Nombre,Tipo,Longitud,Obligatorio
PRL_Examenes,Datos Básicos,Examen,Código,String,50,Si
PRL_Examenes,Datos Básicos,Examen,Fecha,Date,,Si
PRL_Preguntas,General,Pregunta,Enunciado,String,500,Si
```

---

## Category XML Structure (Must Match Therefore)

### Correct Order of Elements

```xml
<Category>
  <CtgryNo>-1</CtgryNo>                          ← Unique per category
  <Name UPT="1"><TStr>...</Name>                 ← Multilingual name
  <Version>0</Version>
  <Fields>...</Fields>                           ← All field definitions
  <DataTypes></DataTypes>
  <Title>...</Title>                             ← Display title
  <Width>530</Width><Height>314</Height>
  <Watermark><DocNo>0</DocNo></Watermark>
  <FulltextMode>1</FulltextMode>
  <FulltextDate>18991230</FulltextDate>
  <CheckInMode>1</CheckInMode>
  <Description UPT="1"><TStr></TStr></Description>
  <Header><Font></Font></Header>
  <Id>GUID-HERE</Id>                            ← Category GUID
  <DlgBgColor>15790320</DlgBgColor>
  <EmptyDocMode>1</EmptyDocMode>
  <CoverMode>1</CoverMode>
  <DocTitles>...</DocTitles>
  <CtgryID>PRL_EXAMENES</CtgryID>               ← Sanitized ID
</Category>
```

### Element NOT to Include

**❌ DO NOT ADD `<TableName>`** — It doesn't exist in Therefore's native format and breaks the parser.

---

## Testing Checklist

After any changes to CategoryBuilder, run:

```bash
# 1. Generate XML from test_multi_category.csv
#    (UI or export button in CategoryBuilder)

# 2. Verify structure compliance
node verify_xml_structure.js TheConfiguration.xml
# Expected: All checks pass ✅

# 3. Verify CtgryNo uniqueness
node verify_ctgryno.js TheConfiguration.xml
# Expected: All 3 categories have UNIQUE CtgryNo ✅

# 4. Import in Therefore Solution Designer
#    File → Import Configuration → Select XML
# Expected: All 3 categories import without SQL errors ✅

# 5. Verify in Solution Designer
#    Categories panel should show:
#    - PRL_Examenes (with "General" and "Preguntas" tabs)
#    - PRL_Preguntas (with "General" and "Opciones" tabs)
#    - PRL_Resultados (with "Detalle", "General", and "Resultado" tabs)
# Expected: All tabs present, fields correctly assigned ✅
```

---

## Known Limitations

1. **No validation** of field values (Obligatorio column ignored)
2. **No keyword dictionaries** — all fields are free-text
3. **No counters** — auto-increment fields not supported
4. **No table fields** — TypeNo 10 not implemented
5. **Dialog sizing** is automatic, not customizable

---

## Future Modifications: Safety Rules

### Before Touching generateCategoryXml()

- [ ] Read this document entirely
- [ ] Understand the offset model
- [ ] Write a test case (add a 4th category to test_multi_category.csv)
- [ ] Verify XML before Therefore import
- [ ] Import into Therefore and check categories appear
- [ ] Document the change with **why** not just what

### If Changing Field Allocation

- [ ] Ensure labelNo range is completely below/above fieldNo range
- [ ] Ensure each category has completely separate ranges
- [ ] Test with 3+ categories (not just 1)
- [ ] Verify all FieldNo values are unique:
  ```bash
  grep '<FieldNo>' TheConfiguration.xml | sort | uniq -d
  # Must return EMPTY (no duplicates)
  ```

### If Adding New Field Types

- [ ] Add TypeNo mapping to `typeToTypeNo` object
- [ ] Update `normalizeFieldType()` function
- [ ] Add length rules to `normalizeFieldLength()`
- [ ] Test with all other field types in same category
- [ ] Verify Therefore recognizes the new type

---

## Debugging: Common Issues

### "Only first category imports"
**Cause**: Duplicate or missing CtgryNo  
**Solution**: Check `ctgryNo = -(catIndex + 1)` assignment

### "SQL Server 2627 error"
**Cause**: Duplicate FieldNo within category  
**Solution**: Check offset ranges don't overlap. Run `grep '<FieldNo>'`

### "Sections appear in wrong tabs"
**Cause**: getTabMeta() not returning correct ShowInTabNo  
**Solution**: Check pestaña filtering logic in field generation loop

### "Tab doesn't appear in Therefore"
**Cause**: No fields assigned to that tab  
**Solution**: Check CSV has pestaña value and matching fields

---

## References

- Therefore Solution Designer Guide: `docs/therefore/solution-designer-guide.md`
- Web API Endpoints: `docs/therefore/web-api-endpoints.md`
- Test data: `test_multi_category.csv`
- Verification scripts: `verify_ctgryno.js`, `verify_xml_structure.js`
- Main component: `src/views/CategoryBuilder.jsx`

---

**Last Known Good State**: Commit `fb985c2` — All 3 categories import successfully without SQL errors.
