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

      // Create user profile in profiles table
      if (data.user) {
        const [name, surname] = (userData.fullName || '').split(' ', 2)
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              user_id: data.user.id,
              email: data.user.email,
              name: name || '',
              surname: surname || '',
              phone: userData.phone || '',
              role: userData.role || 'user',
              approved: false,
              created_at: new Date().toISOString()
            }
          ])

        if (profileError) {
          console.error('Error creating profile:', profileError)
          throw new Error(`Error al crear perfil: ${profileError.message}`)
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

      // Check if user is approved in profiles table
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('approved')
          .eq('user_id', data.user.id)
          .single()

        if (profileError || !profile?.approved) {
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
