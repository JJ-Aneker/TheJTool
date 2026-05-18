import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../config/supabaseClient'

export function useRole() {
  const { user } = useAuth()
  const [dbRole, setDbRole] = useState(null)

  useEffect(() => {
    if (!user?.id) return

    // Read role from profiles table (most up-to-date source)
    const fetchRole = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single()

        if (!error && data) {
          setDbRole(data.role)
        }
      } catch (err) {
        console.error('Error fetching role:', err)
      }
    }

    fetchRole()
  }, [user?.id])

  const getRole = () => {
    if (!user) return null

    // Priority: Database (most reliable) > JWT metadata
    if (dbRole) return dbRole

    // Fallback to JWT metadata
    return user.user_metadata?.role || user.raw_user_meta_data?.role || 'user'
  }

  const isAdmin = () => {
    if (!user) return false

    // Check database first
    if (dbRole === 'admin') return true

    // Fallback to JWT metadata
    const role = user.user_metadata?.role || user.raw_user_meta_data?.role
    return role === 'admin'
  }

  return {
    isAdmin: isAdmin(),
    role: getRole(),
    user
  }
}
