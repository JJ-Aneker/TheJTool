/**
 * Script para importar los items de licencias Therefore a Supabase
 *
 * Uso:
 * 1. Asegúrate de tener las variables de entorno SUPABASE_URL y SUPABASE_SERVICE_KEY
 * 2. npm install @supabase/supabase-js
 * 3. node import_items_to_supabase.js
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configuración Supabase (usar service key para bypass RLS)
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_KEY'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function importItems() {
  console.log('📦 Importando items de licencias Therefore...\n')

  // Leer el JSON generado por extract_items.py
  const jsonPath = join(__dirname, '../../license_items.json')

  let data
  try {
    const fileContent = readFileSync(jsonPath, 'utf-8')
    data = JSON.parse(fileContent)
  } catch (err) {
    console.error('❌ Error leyendo license_items.json:', err.message)
    console.error('   Asegúrate de que existe en la raíz del proyecto')
    process.exit(1)
  }

  const items = data.items || []

  console.log(`📊 Total items a importar: ${items.length}`)
  console.log(`   - OnPremise: ${items.filter(i => i.edicion === 'onpremise').length}`)
  console.log(`   - Online: ${items.filter(i => i.edicion === 'online').length}`)
  console.log(`   - Suscripción: ${items.filter(i => i.edicion === 'suscripcion').length}\n`)

  // 1. Limpiar tabla existente (opcional - comentar si quieres mantener datos)
  console.log('🧹 Limpiando tabla therefore_license_items...')
  const { error: deleteError } = await supabase
    .from('therefore_license_items')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Eliminar todos

  if (deleteError) {
    console.warn('⚠️  Error limpiando tabla:', deleteError.message)
  } else {
    console.log('✓ Tabla limpiada\n')
  }

  // 2. Transformar datos para Supabase
  const itemsForSupabase = items.map(item => ({
    codigo: item.codigo,
    descripcion: item.descripcion,
    clase: item.clase,
    categoria: getCategoryFromClase(item.clase),
    pvp: item.pvp,
    css_pvp: item.css_pvp,
    puntos: item.puntos,
    edicion: item.edicion,
    activo: true
  }))

  // 3. Insertar en lotes de 100
  const BATCH_SIZE = 100
  let imported = 0
  let errors = 0

  for (let i = 0; i < itemsForSupabase.length; i += BATCH_SIZE) {
    const batch = itemsForSupabase.slice(i, i + BATCH_SIZE)

    const { data: inserted, error } = await supabase
      .from('therefore_license_items')
      .insert(batch)
      .select()

    if (error) {
      console.error(`❌ Error en lote ${Math.floor(i/BATCH_SIZE) + 1}:`, error.message)
      errors += batch.length
    } else {
      imported += inserted.length
      console.log(`✓ Lote ${Math.floor(i/BATCH_SIZE) + 1}: ${inserted.length} items importados`)
    }
  }

  console.log('\n📊 Resumen de importación:')
  console.log(`   ✓ Importados: ${imported}`)
  console.log(`   ✗ Errores: ${errors}`)
  console.log(`   📦 Total: ${itemsForSupabase.length}\n`)

  // 4. Verificar importación
  const { count, error: countError } = await supabase
    .from('therefore_license_items')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('❌ Error verificando:', countError.message)
  } else {
    console.log(`✓ Verificación: ${count} items en la base de datos`)
  }
}

/**
 * Asigna categoría basándose en la clase
 */
function getCategoryFromClase(clase) {
  if (!clase) return 'Sin categoría'

  const upper = clase.toUpperCase()

  if (upper.includes('THE.EA')) return 'Licencias'
  if (upper.includes('THE.ON')) return 'Licencias Online'
  if (upper.includes('THE.SU')) return 'Suscripciones'
  if (upper.includes('CSS')) return 'CSS'
  if (upper.includes('SERV')) return 'Servicios'

  return 'Otros'
}

// Ejecutar
importItems()
  .then(() => {
    console.log('\n✅ Importación completada')
    process.exit(0)
  })
  .catch(err => {
    console.error('\n❌ Error fatal:', err)
    process.exit(1)
  })
