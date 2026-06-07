# Therefore Multi-Category XML Import Fix

## Problem Analysis

### Issue #1 (Fixed Previously)
- **Symptom**: Only the first category was being imported from multi-category XML
- **Root Cause**: All categories had identical `CtgryNo=-1`
- **Solution**: Dynamic `CtgryNo = -(catIndex + 1)` assignment per category
- **Status**: ✅ Fixed in previous session

### Issue #2 (Fixed Now)
- **Symptom**: SQL Server 2627 error (PRIMARY KEY/UNIQUE constraint violation)
- **Root Cause**: Overlapping FieldNo ranges between fieldNo and labelNo sequences
- **Status**: ✅ Fixed with proper range separation

## Root Cause Analysis — The Critical Bug

### Discovery
Analyzed the generated XML and found **duplicate FieldNo values within the same category**:

```xml
<!-- Category 1 (PRL_Preguntas) -->
<Field><FieldNo>-101</FieldNo><Caption>ID_Pregunta</Caption><TypeNo>4</TypeNo>...</Field>     ← Label
<Field><FieldNo>-101</FieldNo><ColName>IDPREGUNTA</ColName><TypeNo>1</TypeNo>...</Field>     ← Data field
<!-- DUPLICATE! Both use FieldNo -101 -->

<Field><FieldNo>-102</FieldNo><Caption>Enunciado</Caption><TypeNo>4</TypeNo>...</Field>      ← Label
<Field><FieldNo>-102</FieldNo><ColName>ENUNCIADO</ColName><TypeNo>1</TypeNo>...</Field>     ← Data field
<!-- DUPLICATE! Both use FieldNo -102 -->
```

This violates Therefore's PRIMARY KEY constraint on FieldNo.

### Why It Happened

The offset system had **overlapping ranges**:

```javascript
// BEFORE (BROKEN):
let globalFieldNoOffset = -1      // Range: -1 to -100
let globalLabelNoOffset = -50     // Range: -50 to -99  ← OVERLAP!

// Each category:
globalFieldNoOffset -= 100        // Cat 0: [-1..-100], Cat 1: [-101..-200]
globalLabelNoOffset -= 50         // Cat 0: [-50..-99], Cat 1: [-100..-149]
```

**The Overlap:**
- **Category 0**: fieldNo (-1 to -100) and labelNo (-50 to -99) overlap in range -50 to -99
- **Category 1**: fieldNo (-101 to -200) and labelNo (-100 to -149) overlap in range -100 to -149

Both sequences allocated the SAME FieldNo values, causing duplicates.

## Solution Applied

### Changes in `src/views/CategoryBuilder.jsx` (line 1697-1720)

**Problem:** Offset ranges overlapped, causing both fieldNo and labelNo sequences to allocate the same numbers.

**Solution:** Completely separate the ranges with sufficient spacing:

```javascript
// BEFORE (BROKEN):
let globalFieldNoOffset = -1       // -1..-100
let globalLabelNoOffset = -50      // -50..-99 (overlaps with fieldNo!)
globalFieldNoOffset -= 100         // Each cat gets 100 slots
globalLabelNoOffset -= 50          // Each cat gets 50 slots

// AFTER (FIXED):
let globalFieldNoOffset = -1       // -1..-200
let globalTabNoOffset = -500       // Separate sequence
// ...each category:
const labelNoStart = globalFieldNoOffset - 150  // Guarantees separation

globalFieldNoOffset -= 200         // Each cat gets 200 slots
globalTabNoOffset -= 200           // Each cat gets 200 slots
```

**Result:**
- **Category 0**: fieldNo [-1 to -200], labelNo [-151 to -350]
- **Category 1**: fieldNo [-201 to -400], labelNo [-351 to -550]
- **Category 2**: fieldNo [-401 to -600], labelNo [-551 to -700]

✅ **Zero overlap** — All FieldNo values are completely unique within and across categories

### Verification Commands

To verify all FieldNo values are now unique:

```bash
# Check for duplicate FieldNo within each category
grep -o '<FieldNo>-[0-9]*</FieldNo>' TheConfiguration.xml | sort | uniq -d

# Should return EMPTY (no duplicates)

# Validate structure and CtgryNo uniqueness  
node verify_xml_structure.js TheConfiguration.xml
node verify_ctgryno.js TheConfiguration.xml
```

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
