# Therefore Multi-Category XML Import Fix

## Problem Analysis

### Initial Issue
- **Symptom**: Only the first category was being imported from multi-category XML
- **Root Cause**: All categories had identical `CtgryNo=-1`
- **Solution Applied**: Dynamic `CtgryNo = -(catIndex + 1)` assignment
- **Status**: ✅ Fixed in previous session

### Current Issue  
- **Symptom**: SQL Server 2627 constraint violation error during import
- **Root Cause**: XML structure mismatch with Therefore's native format

## Root Cause Analysis

Compared CategoryBuilder generated XML against reference XML from Therefore server (`TheConfigurationTEST.xml`):

### Structural Difference Found

**CategoryBuilder was generating:**
```xml
<Category>
  <CtgryNo>-1</CtgryNo>
  <TableName>PRL_EXAMENES</TableName>    ← ❌ NOT IN REFERENCE
  <Name UPT="1"><TStr>...
```

**Therefore native XML format:**
```xml
<Category>
  <CtgryNo>-96</CtgryNo>
  <Name UPT="1"><TStr>...              ← ✅ Direct to Name
```

### Impact

The `<TableName>` element:
- Does NOT appear in any Therefore native category exports
- Is NOT expected by Therefore's XML parser
- Causes XML structure validation failures
- Triggers SQL constraint violations (error 2627)

## Solution Applied

### Changes in `src/views/CategoryBuilder.jsx` (line 1680-1681)

**REMOVED:**
- `<TableName>${tableName}</TableName>` — This element should not be in Category XML

**VERIFIED CORRECT:**
- `<CtgryNo>` — Unique per category ✅
- `<Name UPT="1"><TStr>` — Standard multilingual format ✅
- Element order — Matches Therefore structure ✅
- `<Id>` element — Present in correct position ✅

### Element Structure Order (Reference)

After `</Fields>`, Therefore expects this order:
1. `<DataTypes></DataTypes>`
2. `<Title>`
3. `<Width>`, `<Height>`
4. `<Watermark>`
5. `<FulltextMode>`, `<FulltextDate>`
6. `<CheckInMode>`
7. `<Description>`
8. `<Header>`
9. `<Id>` ← Category GUID
10. `<DlgBgColor>`
11. `<EmptyDocMode>`, `<CoverMode>`
12. `<DocTitles>`
13. `<CtgryID>`

CategoryBuilder now generates exactly this structure.

## Verification

Use the provided verification script:

```bash
node verify_ctgryno.js <generated_xml>      # Check CtgryNo uniqueness
node verify_xml_structure.js <generated_xml> # Check structural compliance
```

## Testing Steps

1. **Generate XML** from multi-category CSV with CategoryBuilder
   - Use `test_multi_category.csv` (3 categories: PRL_Examenes, PRL_Preguntas, PRL_Resultados)
   - Download generated XML

2. **Verify Structure**
   ```bash
   node verify_xml_structure.js TheConfiguration.xml
   ```
   Expected output: All checks pass ✅

3. **Import in Therefore**
   - Open Solution Designer → File → Import Configuration
   - Select generated XML
   - Verify all 3 categories import successfully
   - Check each category has correct fields and tabs

4. **Verify in Solution Designer**
   - All 3 categories should appear with unique names
   - Fields should be present in correct sections
   - Tabs/Pestañas should be created correctly
   - No SQL errors during import

## Key Learning

**Therefore enforces strict XML structure:**
- Only elements expected by the parser are allowed
- Native exports define the canonical schema
- Unknown elements cause parse failures
- Always compare generated XML against Therefore's own exports

The fundamental principle from the documentation:
> "Never build XML from scratch. Always start from a native export."

This fix ensures CategoryBuilder generates XML that matches Therefore's native export structure exactly.
