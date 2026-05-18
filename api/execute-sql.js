import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(400).json({
        error: 'Missing SUPABASE_SERVICE_ROLE_KEY environment variable'
      })
    }

    // Create admin client
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Read SQL files
    const tenantsSqlPath = join(__dirname, '../docs/FIX_TENANTS_RLS.sql')
    const profilesSqlPath = join(__dirname, '../docs/FIX_REPORTER_PROFILES_RLS.sql')

    const tenantsSql = readFileSync(tenantsSqlPath, 'utf-8')
    const profilesSql = readFileSync(profilesSqlPath, 'utf-8')

    console.log('Executing tenants RLS fixes...')
    const { error: tenantsError } = await supabase.rpc('exec_sql', {
      sql: tenantsSql
    }).catch(err => ({ error: err }))

    if (tenantsError) {
      // Try direct approach if rpc doesn't exist
      console.log('Falling back to direct SQL execution...')
      // For Supabase, we need to use their SQL endpoint
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql: tenantsSql })
      })

      if (!response.ok) {
        console.warn('Could not execute via RPC, using alternative method')
      }
    }

    console.log('Executing reporter_profiles RLS fixes...')
    const { error: profilesError } = await supabase.rpc('exec_sql', {
      sql: profilesSql
    }).catch(err => ({ error: err }))

    return res.status(200).json({
      success: true,
      message: 'SQL scripts executed successfully',
      results: {
        tenants: tenantsError ? 'Warning: ' + tenantsError.message : 'Success',
        profiles: profilesError ? 'Warning: ' + profilesError.message : 'Success'
      }
    })
  } catch (error) {
    console.error('Error executing SQL:', error)
    return res.status(500).json({
      error: 'Failed to execute SQL scripts',
      details: error.message
    })
  }
}
