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

export default router
