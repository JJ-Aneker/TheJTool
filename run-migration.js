#!/usr/bin/env node

/**
 * Script para ejecutar la migración de reporter_profiles
 * Uso: node run-migration.js
 */

import fetch from 'node-fetch'

async function runMigration() {
  const SUPABASE_URL = 'https://osudezxnludhewdxeaks.supabase.co'
  const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdWRlenhubHVkaGV3ZHhlYWtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQ5NDExOSwiZXhwIjoyMDgwMDcwMTE5fQ.-nuqEnI-CeqwVx_SNUsMnZH0mIOXdCy-31YdstguC1o'

  console.log('🔄 Ejecutando migración de reporter_profiles...\n')

  try {
    // SQL a ejecutar
    const sqlStatements = [
      'ALTER TABLE reporter_profiles ADD COLUMN IF NOT EXISTS saved_cat_nos integer[] DEFAULT \'{}\'::integer[]',
      'ALTER TABLE reporter_profiles ADD COLUMN IF NOT EXISTS saved_fields text[] DEFAULT \'{}\'::text[]',
      'ALTER TABLE reporter_profiles ADD COLUMN IF NOT EXISTS group_fields text[] DEFAULT \'{}\'::text[]',
      'ALTER TABLE reporter_profiles ADD COLUMN IF NOT EXISTS caption_map jsonb DEFAULT \'{}\'::jsonb',
      'ALTER TABLE reporter_profiles ADD COLUMN IF NOT EXISTS cat_field_order jsonb DEFAULT \'{}\'::jsonb',
      'ALTER TABLE reporter_profiles ADD COLUMN IF NOT EXISTS cat_names jsonb DEFAULT \'{}\'::jsonb'
    ]

    for (const sql of sqlStatements) {
      console.log(`📝 Ejecutando: ${sql.substring(0, 70)}...`)

      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql })
      })

      if (!response.ok) {
        const error = await response.text()
        console.error(`❌ Error: ${error}`)
      }
    }

    console.log('\n✅ Migración completada con éxito!\n')
    console.log('📋 Columnas añadidas a reporter_profiles:')
    console.log('  • saved_cat_nos (integer[]) - Categorías seleccionadas')
    console.log('  • saved_fields (text[]) - Campos seleccionados')
    console.log('  • group_fields (text[]) - Campos para agrupación')
    console.log('  • caption_map (jsonb) - Mapeo de nombres amigables')
    console.log('  • cat_field_order (jsonb) - Orden de campos por categoría')
    console.log('  • cat_names (jsonb) - Nombres de categorías\n')

    console.log('🎯 Próximos pasos:')
    console.log('  1. Verifica en Supabase que las columnas fueron añadidas')
    console.log('  2. Inicia la aplicación con npm run dev')
    console.log('  3. Navega a "Therefore Reporter"')
    console.log('  4. Crea un nuevo perfil para probar la funcionalidad\n')

  } catch (err) {
    console.error('❌ Error fatal:', err.message)
    process.exit(1)
  }
}

runMigration()
