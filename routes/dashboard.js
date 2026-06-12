// Dashboard API endpoints - Real data for Home view
import express from 'express'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()

// Helper to get Supabase client
const getSupabaseClient = () => {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )
}

/**
 * GET /api/dashboard/stats
 * Returns hero section statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const supabase = getSupabaseClient()
    const userId = req.headers['x-user-id']

    // Get tenants count
    const { count: tenantsCount } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('active', true)

    // Get categories count (from category_templates if exists, or use 0)
    let categoriesCount = 0
    try {
      const result = await supabase
        .from('category_templates')
        .select('*', { count: 'exact', head: true })
      categoriesCount = result.count || 0
    } catch (err) {
      // Table might not exist yet
      categoriesCount = 0
    }

    // Get eForms count
    const { count: eformsCount } = await supabase
      .from('eforms')
      .select('*', { count: 'exact', head: true })

    // Get documents this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: docsThisMonth } = await supabase
      .from('generated_documents')
      .select('*', { count: 'exact', head: true })
      .gte('generated_at', startOfMonth.toISOString())

    res.json({
      success: true,
      data: {
        activeTenantsCount: tenantsCount || 0,
        categoriesCount: categoriesCount || 0,
        eformsCount: eformsCount || 0,
        docsThisMonth: docsThisMonth || 0
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/dashboard/recent-reports
 * Returns recent report executions (last 10)
 */
router.get('/recent-reports', async (req, res) => {
  try {
    const supabase = getSupabaseClient()
    const userId = req.headers['x-user-id']

    const { data, error } = await supabase
      .from('report_executions')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(10)

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Error fetching recent reports:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/dashboard/recent-documents
 * Returns recent generated documents (last 10)
 */
router.get('/recent-documents', async (req, res) => {
  try {
    const supabase = getSupabaseClient()
    const userId = req.headers['x-user-id']

    const { data, error } = await supabase
      .from('generated_documents')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(10)

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Error fetching recent documents:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/dashboard/recent-activity
 * Returns recent activity timeline (last 20)
 */
router.get('/recent-activity', async (req, res) => {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/dashboard/system-status
 * Returns real-time system health status
 */
router.get('/system-status', async (req, res) => {
  try {
    const supabase = getSupabaseClient()
    const status = []

    // Check Therefore tenants
    const { data: tenants } = await supabase
      .from('tenants')
      .select('name, url, active')
      .eq('active', true)
      .limit(5)

    const thereforeStatus = tenants && tenants.length > 0 ? 'online' : 'warning'
    status.push({
      label: 'Therefore Tenants',
      status: thereforeStatus,
      value: `${tenants?.length || 0} activos`
    })

    // Check AWS Bedrock (if credentials exist)
    const hasAWSCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    status.push({
      label: 'AWS Bedrock',
      status: hasAWSCredentials ? 'online' : 'warning',
      value: hasAWSCredentials ? 'Configurado' : 'Sin config'
    })

    // Database status (if we're here, it's online)
    status.push({
      label: 'Database',
      status: 'online',
      value: 'Conectada'
    })

    // Storage usage (placeholder - you can add real storage check)
    status.push({
      label: 'Storage',
      status: 'online',
      value: 'Disponible'
    })

    res.json({ success: true, data: status })
  } catch (error) {
    console.error('Error checking system status:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
