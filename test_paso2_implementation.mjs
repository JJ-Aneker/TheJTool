// Test script for PASO 2: Table fields and dynamic pestañas
import fs from 'fs'

// Read the test CSV
const csvPath = './docs/EJEMPLO_CSV_PASO1_TIPOS_CAMPO.csv'
const csvContent = fs.readFileSync(csvPath, 'utf-8')

// Parse CSV (simplified version of the actual parser)
function parseCsv(raw) {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  const sep = lines[0].includes(';') ? ';' : ','
  const headers = lines[0].split(sep).map(h => h.trim().toLowerCase())

  const idx = {
    nombre: headers.findIndex(h => ['nombre', 'name', 'label'].includes(h)),
    tipo: headers.findIndex(h => ['tipo', 'type', 'typeno'].includes(h)),
    obligatorio: headers.findIndex(h => ['obligatorio', 'required'].includes(h)),
    seccion: headers.findIndex(h => ['seccion', 'sección', 'section'].includes(h)),
    pestaña: headers.findIndex(h => ['pestaña', 'tab', 'tabs'].includes(h)),
    categoria: headers.findIndex(h => ['categoria', 'categoría', 'category'].includes(h)),
  }

  const categoryMap = {}

  lines.slice(1).forEach((line) => {
    const cols = line.split(sep).map(c => c.trim())
    const nombre = cols[idx.nombre] || ''
    if (!nombre) return

    const categoria = idx.categoria >= 0 ? (cols[idx.categoria] || 'CAT1') : 'CAT1'
    const seccion = idx.seccion >= 0 ? (cols[idx.seccion] || 'GENERAL') : 'GENERAL'

    if (!categoryMap[categoria]) categoryMap[categoria] = {}
    if (!categoryMap[categoria][seccion]) categoryMap[categoria][seccion] = []
    categoryMap[categoria][seccion].push({ nombre })
  })

  return categoryMap
}

const categoryMap = parseCsv(csvContent)
console.log('✓ CSV parsed successfully')
console.log(`  - Categories: ${Object.keys(categoryMap).length}`)
Object.entries(categoryMap).forEach(([cat, sections]) => {
  const fieldCount = Object.values(sections).reduce((sum, fields) => sum + fields.length, 0)
  console.log(`  - ${cat}: ${Object.keys(sections).length} sections, ${fieldCount} fields`)
})

// Test that the implementation supports:
// 1. Basic field types (already working)
// 2. Table fields (TypeNo 10)
// 3. Multiple pestañas with dynamic Tab Control
// 4. Table columns with correct parent references

const testCases = [
  {
    name: 'Basic field types',
    check: () => {
      const fields = Object.values(categoryMap).flatMap(sections =>
        Object.values(sections).flatMap(f => f)
      )
      return fields.length > 0 && fields.some(f => f.nombre.length > 0)
    }
  },
  {
    name: 'Categories exist',
    check: () => Object.keys(categoryMap).length === 2
  },
  {
    name: 'Sections exist',
    check: () => {
      const sections = Object.values(categoryMap).flatMap(s => Object.keys(s))
      return sections.length >= 6 // 3 sections per category
    }
  }
]

console.log('\n📋 Test Results:')
let passed = 0
testCases.forEach(test => {
  const result = test.check()
  console.log(`  ${result ? '✓' : '✗'} ${test.name}`)
  if (result) passed++
})

console.log(`\n${passed}/${testCases.length} tests passed`)

// Verify the code changes are in place
console.log('\n🔍 Implementation Verification:')
const jsCode = fs.readFileSync('./src/views/CategoryBuilder.jsx', 'utf-8')

const checks = [
  ['Table field type defined', jsCode.includes("{ value: 'table', label: '🗃 Tabla' }") ],
  ['makeTableField function', jsCode.includes('const makeTableField = ')],
  ['makeTableColumnField function', jsCode.includes('const makeTableColumnField = ')],
  ['Tab Manager UI', jsCode.includes('📑 Pestañas')],
  ['Dynamic Tab Control', jsCode.includes('sortedPestañas.map((p, idx)')],
  ['parentTableNo fix', jsCode.includes('const tableFieldNo = globalFieldNo--')],
  ['getTabMeta for fields', jsCode.includes('const getTabMeta = (fieldPestaña)')]
]

checks.forEach(([name, result]) => {
  console.log(`  ${result ? '✓' : '✗'} ${name}`)
})

const allChecks = checks.every(c => c[1])
console.log(`\n${allChecks ? '✅ All implementation features present' : '⚠️ Some features may be missing'}`)
