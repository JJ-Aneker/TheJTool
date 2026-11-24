// Quick verification that CategoryBuilder.jsx compiles without syntax errors
import { parse } from 'acorn'
import fs from 'fs'

try {
  const code = fs.readFileSync('src/views/CategoryBuilder.jsx', 'utf-8')
  // Just parse to check for syntax errors
  parse(code, { ecmaVersion: 2020, sourceType: 'module' })
  console.log('✓ CategoryBuilder.jsx syntax is valid')
} catch (err) {
  console.error('✗ Syntax error:', err.message)
  process.exit(1)
}
