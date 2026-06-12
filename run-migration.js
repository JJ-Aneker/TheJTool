// Execute Supabase migration using REST API
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

async function executeSQL(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify({ query: sql })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`SQL execution failed: ${error}`)
  }

  return await response.json()
}

async function runMigration() {
  console.log('🚀 Executing migration via Supabase SQL...\n')

  const sql = fs.readFileSync('./supabase/migrations/20260612_dashboard_data_tables.sql', 'utf8')

  try {
    // Execute entire SQL file
    const result = await executeSQL(sql)

    console.log('✅ Migration completed successfully!\n')
    console.log('📊 Created tables:')
    console.log('   - generated_documents')
    console.log('   - report_executions')
    console.log('   - activity_log')
    console.log('\n🔒 RLS policies enabled')
    console.log('📈 Helper views created')
    console.log('🧹 Cleanup function: cleanup_old_logs()')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('\n📋 Please copy and paste the SQL manually in Supabase SQL Editor')
    console.log('   File: supabase/migrations/20260612_dashboard_data_tables.sql')
    process.exit(1)
  }
}

runMigration()
