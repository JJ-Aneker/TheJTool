import { supabase } from '../config/supabaseClient'

export const authService = {
  // Sign up new user
  async signUp(email, password, userData) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })

      if (error) throw error

      // Profile is automatically created by Supabase trigger
      // Upsert to ensure data consistency (handles case where trigger might not have fired yet)
      if (data.user) {
        const [name, surname] = (userData.fullName || '').split(' ', 2)

        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            user_id: data.user.id,
            email: data.user.email,
            name: name || '',
            surname: surname || '',
            phone: userData.phone || '',
            approved: false,
            created_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })

        if (upsertError) {
          console.error('Error creating profile:', upsertError)
          throw new Error(`Error al crear perfil: ${upsertError.message}`)
        }
      }

      return { success: true, user: data.user }
    } catch (error) {
      console.error('SignUp error:', error)
      return { success: false, error: error.message }
    }
  },

  // Sign in user
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Check if user is approved using RPC function (bypasses RLS)
      if (data.user) {
        const { data: isApproved, error: rpcError } = await supabase
          .rpc('is_user_approved', { user_id: data.user.id })

        if (rpcError) {
          console.error('Error checking user approval:', rpcError)
          throw new Error('Error al verificar estado de usuario')
        }

        if (!isApproved) {
          // Sign out user if not approved
          await supabase.auth.signOut()
          throw new Error('Tu cuenta no ha sido aprobada aún. Contacta con un administrador.')
        }
      }

      return { success: true, session: data.session }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Sign out user
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Get current session
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      return { success: true, session: data.session }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser()
      if (error) throw error
      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Update user profile
  async updateProfile(userId, userData) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(userData)
        .eq('user_id', userId)
        .select()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Get all users (admin only)
  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return { success: true, users: data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Delete user (admin only)
  async deleteUser(userId) {
    try {
      // Delete from profiles table
      const { error: dbError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId)

      if (dbError) throw dbError

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Reset password
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Update password
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      if (error) throw error
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Listen to auth changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session)
    })
  }
}
