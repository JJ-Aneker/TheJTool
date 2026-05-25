import fs from 'fs';

// Simulate the key functions from CategoryBuilder.jsx
function sanitizeName(str) {
  return String(str || '')
    .replace(/[^A-Za-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toUpperCase()
    .slice(0, 30);
}

function toCamelKey(s) {
  return String(s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('') || 'campo';
}

// Read CSV
const csvContent = fs.readFileSync('./PRL_Examenes_Preguntas_CSV_TablaParent.csv', 'utf-8');
const lines = csvContent.split('\n').map(l => l.trim()).filter(Boolean);

// Parse CSV fields
const fields = [];
lines.slice(1).forEach(line => {
  const cols = line.split(';').map(c => c.trim());
  const nombre = cols[3];
  const tipo = cols[4];

  if (!nombre) return;

  // Simulate CSV parsing: fieldKey defaults to toCamelKey(nombre)
  const fieldKey = toCamelKey(nombre);

  fields.push({ nombre, fieldKey, tipo });
});

console.log('=== FIELD KEY MISMATCH TEST ===\n');

// Simulate tableMap building (uses NOMBRE)
console.log('Table Fields in tableMap (keyed by NOMBRE):');
const tableFields = fields.filter(f => f.tipo === 'Table');
const tableMap = {};

tableFields.forEach(f => {
  const tableName_key = sanitizeName(f.nombre);
  tableMap[tableName_key] = { fieldNo: -1, columns: [] };
  console.log(`  ${f.nombre} → key: ${tableName_key}`);
});

console.log('\n=== BEFORE FIX (using fieldKey) ===');
// OLD approach: using fieldKey
tableFields.forEach(f => {
  const colname = sanitizeName(f.fieldKey || f.nombre);
  const tableFieldNo = tableMap[colname]?.fieldNo;
  console.log(`  ${f.nombre} (fieldKey=${f.fieldKey})`);
  console.log(`    → Lookup key: ${colname}`);
  console.log(`    → Found in map: ${tableFieldNo !== undefined ? '✓' : '✗ UNDEFINED'}`);
});

console.log('\n=== AFTER FIX (using NOMBRE) ===');
// NEW approach: using NOMBRE directly
tableFields.forEach(f => {
  const tableFieldKey = sanitizeName(f.nombre);
  const tableFieldNo = tableMap[tableFieldKey]?.fieldNo;
  console.log(`  ${f.nombre}`);
  console.log(`    → Lookup key: ${tableFieldKey}`);
  console.log(`    → Found in map: ${tableFieldNo !== undefined ? '✓' : '✗ UNDEFINED'}`);
});

console.log('\n=== KEY MISMATCH ANALYSIS ===');
tableFields.forEach(f => {
  const keyWithFieldKey = sanitizeName(f.fieldKey || f.nombre);
  const keyWithNome = sanitizeName(f.nombre);
  const matches = keyWithFieldKey === keyWithNome;
  console.log(`${f.nombre}:`);
  console.log(`  fieldKey: ${f.fieldKey} → ${keyWithFieldKey}`);
  console.log(`  nombre:   ${f.nombre} → ${keyWithNome}`);
  console.log(`  Match: ${matches ? '✓' : '✗'}`);
});
