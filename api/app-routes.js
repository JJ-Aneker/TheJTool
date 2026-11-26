// Admin routes - User management with Supabase Admin API
import express from 'express'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()

// Helper to get Supabase Admin client (bypasses RLS)
const getSupabaseAdmin = () => {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

/**
 * POST /api/admin/activate-user
 * Manually confirm user's email (activate account in Supabase Auth)
 */
router.post('/activate-user', async (req, res) => {
  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Update user's email_confirmed_at using Admin API
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        email_confirm: true
      }
    )

    if (error) {
      console.error('Error activating user:', error)
      return res.status(500).json({ success: false, error: error.message })
    }

    res.json({ success: true, message: 'Usuario activado exitosamente', user: data.user })
  } catch (error) {
    console.error('Activate user error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/admin/approve-user
 * Approve user in profiles table (set approved=true)
 */
router.post('/approve-user', async (req, res) => {
  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Update profile approved status
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ approved: true })
      .eq('user_id', userId)
      .select()

    if (error) {
      console.error('Error approving user:', error)
      return res.status(500).json({ success: false, error: error.message })
    }

    res.json({ success: true, message: 'Usuario aprobado exitosamente', profile: data[0] })
  } catch (error) {
    console.error('Approve user error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/admin/activate-and-approve-user
 * Both activate email AND approve user (most common action)
 */
router.post('/activate-and-approve-user', async (req, res) => {
  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // 1. Activate email in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        email_confirm: true
      }
    )

    if (authError) {
      console.error('Error activating user:', authError)
      return res.status(500).json({ success: false, error: authError.message })
    }

    // 2. Approve in profiles
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ approved: true })
      .eq('user_id', userId)
      .select()

    if (profileError) {
      console.error('Error approving user:', profileError)
      return res.status(500).json({ success: false, error: profileError.message })
    }

    res.json({
      success: true,
      message: 'Usuario activado y aprobado exitosamente',
      user: authData.user,
      profile: profileData[0]
    })
  } catch (error) {
    console.error('Activate and approve user error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/admin/user-status/:userId
 * Get complete user status (auth + profile)
 */
router.get('/user-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    const supabaseAdmin = getSupabaseAdmin()

    // Get auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (authError) {
      return res.status(500).json({ success: false, error: authError.message })
    }

    // Get profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (profileError) {
      return res.status(500).json({ success: false, error: profileError.message })
    }

    res.json({
      success: true,
      status: {
        email: authUser.user.email,
        emailConfirmed: !!authUser.user.email_confirmed_at,
        emailConfirmedAt: authUser.user.email_confirmed_at,
        approved: profile.approved,
        role: profile.role,
        createdAt: authUser.user.created_at
      }
    })
  } catch (error) {
    console.error('Get user status error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/admin/storage/signed-upload-url
 * Returns a signed upload URL so the frontend can upload directly to Storage
 * without needing RLS INSERT policy
 */
router.post('/storage/signed-upload-url', async (req, res) => {
  try {
    const { userId, fileName } = req.body
    if (!userId || !fileName) {
      return res.status(400).json({ success: false, error: 'userId and fileName are required' })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const timestamp = Date.now()
    const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${userId}/${timestamp}-${sanitized}`

    const { data, error } = await supabaseAdmin.storage
      .from('document-uploads')
      .createSignedUploadUrl(filePath)

    if (error) {
      return res.status(500).json({ success: false, error: error.message })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('document-uploads')
      .getPublicUrl(filePath)

    res.json({ success: true, signedUrl: data.signedUrl, token: data.token, path: filePath, publicUrl })
  } catch (error) {
    console.error('[Admin] signed-upload-url error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/admin/storage/covers
 * List ALL saved cover images (public to all users) — uses service key to bypass RLS
 */
router.get('/storage/covers', async (req, res) => {
  try {
    console.log('[Admin] SUPABASE_URL:', process.env.VITE_SUPABASE_URL)
    console.log('[Admin] SERVICE_KEY defined:', !!process.env.SUPABASE_SERVICE_KEY)

    const supabaseAdmin = getSupabaseAdmin()

    // List all folders (user directories) in the bucket
    const { data: folders, error: foldersError } = await supabaseAdmin.storage
      .from('document-uploads')
      .list('', { limit: 1000 })

    if (foldersError) {
      console.error('[Admin] Error listing folders:', foldersError)
      return res.status(500).json({ success: false, error: foldersError.message })
    }

    // For each folder, list PNG files
    const allCovers = []
    for (const folder of folders || []) {
      if (!folder.id) continue // Skip files, only process folders

      const { data: files, error: filesError } = await supabaseAdmin.storage
        .from('document-uploads')
        .list(folder.name, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })

      if (filesError) {
        console.error(`[Admin] Error listing files in ${folder.name}:`, filesError)
        continue
      }

      const covers = (files || [])
        .filter(f => f.name.toLowerCase().endsWith('.png'))
        .map(f => {
          const path = `${folder.name}/${f.name}`
          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('document-uploads')
            .getPublicUrl(path)
          return {
            name: f.name,
            path,
            url: publicUrl,
            created_at: f.created_at,
            size: f.metadata?.size || 0,
            owner: folder.name // user ID que subió la portada
          }
        })

      allCovers.push(...covers)
    }

    // Sort all covers by created_at desc
    allCovers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    res.json({ success: true, covers: allCovers })
  } catch (error) {
    console.error('[Admin] List all covers error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/admin/storage/covers/:userId
 * List user's saved cover images — uses service key to bypass RLS on storage.list()
 */
router.get('/storage/covers/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data, error } = await supabaseAdmin.storage
      .from('document-uploads')
      .list(userId, { limit: 100, offset: 0, sortBy: { column: 'created_at', order: 'desc' } })

    if (error) {
      console.error('[Admin] Error listing covers:', error)
      return res.status(500).json({ success: false, error: error.message })
    }

    const covers = (data || [])
      .filter(f => f.name.toLowerCase().endsWith('.png'))
      .map(f => {
        const path = `${userId}/${f.name}`
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('document-uploads')
          .getPublicUrl(path)
        return {
          name: f.name,
          path,
          url: publicUrl,
          created_at: f.created_at,
          size: f.metadata?.size || 0
        }
      })

    res.json({ success: true, covers })
  } catch (error) {
    console.error('[Admin] List covers error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
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

/**
 * GET /api/dashboard/stats-history
 * Returns activity stats for the last 7 days (for charts)
 */
router.get('/stats-history', async (req, res) => {
  try {
    const supabase = getSupabaseClient()

    // Get date range (last 7 days)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)

    // Get reports by day
    const { data: reports } = await supabase
      .from('report_executions')
      .select('executed_at, result_count')
      .gte('executed_at', startDate.toISOString())
      .order('executed_at', { ascending: true })

    // Get documents by day
    const { data: documents } = await supabase
      .from('generated_documents')
      .select('generated_at, pages')
      .gte('generated_at', startDate.toISOString())
      .order('generated_at', { ascending: true })

    // Aggregate by day
    const dailyStats = {}

    // Initialize all 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      dailyStats[dateKey] = {
        date: dateKey,
        reports: 0,
        documents: 0,
        totalDocs: 0
      }
    }

    // Aggregate reports
    reports?.forEach(report => {
      const dateKey = report.executed_at.split('T')[0]
      if (dailyStats[dateKey]) {
        dailyStats[dateKey].reports++
        dailyStats[dateKey].totalDocs += report.result_count || 0
      }
    })

    // Aggregate documents
    documents?.forEach(doc => {
      const dateKey = doc.generated_at.split('T')[0]
      if (dailyStats[dateKey]) {
        dailyStats[dateKey].documents++
      }
    })

    const history = Object.values(dailyStats)

    res.json({ success: true, data: history })
  } catch (error) {
    console.error('Error fetching stats history:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/dashboard/performance-metrics
 * Returns performance metrics (execution times, top users, etc.)
 */
router.get('/performance-metrics', async (req, res) => {
  try {
    const supabase = getSupabaseClient()

    // Average execution time
    const { data: reportMetrics } = await supabase
      .from('report_executions')
      .select('execution_time_ms, result_count, status')
      .eq('status', 'success')
      .order('executed_at', { ascending: false })
      .limit(100)

    const avgExecutionTime = reportMetrics?.length > 0
      ? Math.round(reportMetrics.reduce((sum, r) => sum + (r.execution_time_ms || 0), 0) / reportMetrics.length)
      : 0

    const totalDocsProcessed = reportMetrics?.reduce((sum, r) => sum + (r.result_count || 0), 0) || 0

    // Top users by activity
    const { data: activityByUser } = await supabase
      .from('activity_log')
      .select('user_name')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    const userCounts = {}
    activityByUser?.forEach(a => {
      const user = a.user_name || 'Unknown'
      userCounts[user] = (userCounts[user] || 0) + 1
    })

    const topUsers = Object.entries(userCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    res.json({
      success: true,
      data: {
        avgExecutionTime,
        totalDocsProcessed,
        topUsers
      }
    })
  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
