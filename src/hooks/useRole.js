import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../config/supabaseClient'

/**
 * useRole Hook
 *
 * SECURITY: All authorization (roles/permissions) are read from the 'profiles' table.
 * Supabase Auth is used ONLY for authentication (login/password).
 *
 * This hook fetches the user's role from the database, making it the single source of truth.
 */
export function useRole() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user?.id) {
      setProfile(null)
      setLoading(false)
      return
    }

    // ALWAYS read from profiles table - this is the source of truth for authorization
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const { data, error: err } = await supabase
          .from('profiles')
          .select('role, approved, user_id')
          .eq('user_id', user.id)
          .single()

        if (err) {
          console.error('useRole: Error fetching profile:', err)
          console.error('useRole: user.id =', user.id)
          console.error('useRole: error details:', { code: err.code, message: err.message })
          setError(err)
          setProfile(null)
        } else if (data) {
          console.log('useRole: Profile loaded successfully:', data)
          setProfile(data)
          setError(null)
        } else {
          console.warn('useRole: No data returned from query')
          setProfile(null)
        }
      } catch (err) {
        console.error('useRole: Unexpected error fetching profile:', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user?.id])

  const getRole = () => {
    return profile?.role || 'user'
  }

  const isAdmin = () => {
    return profile?.role === 'admin'
  }

  const isApproved = () => {
    return profile?.approved === true
  }

  return {
    isAdmin: isAdmin(),
    role: getRole(),
    approved: isApproved(),
    loading,
    error,
    profile,
    user
  }
}
