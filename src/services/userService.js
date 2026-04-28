import { supabase } from '../config/supabaseClient'

export const userService = {
  // Get user by ID
  async getUserById(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return { success: true, user: data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Get all users
  async getAllUsers(filter = {}) {
    try {
      let query = supabase.from('profiles').select('*')

      if (filter.role) {
        query = query.eq('role', filter.role)
      }
      if (filter.status) {
        query = query.eq('status', filter.status)
      }
      if (filter.department) {
        query = query.eq('department', filter.department)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return { success: true, users: data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Create new user
  async createUser(email, userData) {
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: generateTemporaryPassword(),
        email_confirm: true
      })

      if (authError) throw authError

      // Create user profile in profiles table
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            email,
            full_name: userData.fullName,
            role: userData.role,
            department: userData.department,
            phone: userData.phone,
            status: userData.status || 'active',
            updated_at: new Date().toISOString()
          }
        ])
        .select()

      if (error) throw error
      return { success: true, user: data[0] }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Update user
  async updateUser(userId, userData) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...userData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()

      if (error) throw error
      return { success: true, user: data[0] }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Delete user
  async deleteUser(userId) {
    try {
      // Delete from profiles table
      const { error: dbError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (dbError) throw dbError
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Assign role to user
  async assignRole(userId, role) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select()

      if (error) throw error
      return { success: true, user: data[0] }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Deactivate user
  async deactivateUser(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ status: 'inactive' })
        .eq('id', userId)
        .select()

      if (error) throw error
      return { success: true, user: data[0] }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Activate user
  async activateUser(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', userId)
        .select()

      if (error) throw error
      return { success: true, user: data[0] }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Get user activity log
  async getUserActivityLog(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { success: true, logs: data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Log user action
  async logAction(userId, action, description) {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert([
          {
            user_id: userId,
            action,
            description,
            created_at: new Date().toISOString()
          }
        ])

      if (error) throw error
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Search users
  async searchUsers(searchTerm) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(
          `full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        )
        .order('created_at', { ascending: false })

      if (error) throw error
      return { success: true, users: data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

// Helper function to generate temporary password
function generateTemporaryPassword() {
  const length = 12
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}
