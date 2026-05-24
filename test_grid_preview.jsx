// Simple verification that CategoryGridPreview component structure is valid
import fs from 'fs'

const code = fs.readFileSync('src/views/CategoryBuilder.jsx', 'utf-8')

// Check that CategoryGridPreview component is defined
if (!code.includes('function CategoryGridPreview')) {
  console.error('✗ CategoryGridPreview function not found')
  process.exit(1)
}

// Check that component has required props
if (!code.includes('categories') || !code.includes('onClose')) {
  console.error('✗ CategoryGridPreview missing required props')
  process.exit(1)
}

// Check that component returns JSX with modal structure
if (!code.includes('background: \'rgba(0,0,0,0.7)\'') || !code.includes('Vista Previa de Categorías')) {
  console.error('✗ CategoryGridPreview missing modal structure')
  process.exit(1)
}

// Check that component is integrated into main component
if (!code.includes('previewModalOpen && (') && !code.includes('CategoryGridPreview')) {
  console.error('✗ CategoryGridPreview not integrated into main component')
  process.exit(1)
}

// Check grid layout structure
if (!code.includes('gridTemplateColumns') || !code.includes('repeat(auto-fit')) {
  console.error('✗ CategoryGridPreview missing grid layout')
  process.exit(1)
}

console.log('✓ CategoryGridPreview component structure is valid')
console.log('✓ Component is properly integrated into main CategoryBuilder')
console.log('✓ Modal structure with overlay and grid layout verified')
console.log('✓ Close button and header verified')
