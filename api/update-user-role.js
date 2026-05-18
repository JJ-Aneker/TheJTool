import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, role } = req.body

    if (!userId || !role) {
      return res.status(400).json({ error: 'userId and role are required' })
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({
        error: 'Missing Supabase credentials'
      })
    }

    // Create admin client with service role key
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Update user metadata with role
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      {
        user_metadata: { role }
      }
    )

    if (error) {
      console.error('Error updating user role:', error)
      return res.status(400).json({
        error: 'Failed to update user role',
        details: error.message
      })
    }

    // Also update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (profileError) {
      console.warn('Warning: Failed to update profiles table:', profileError.message)
      // Don't fail if profiles update fails - the JWT metadata is what matters
    }

    return res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      user: data?.user
    })
  } catch (error) {
    console.error('Error in update-user-role:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    })
  }
}
