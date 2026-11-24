import { createContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const result = await authService.getSession()
        if (result.success && result.session) {
          setSession(result.session)
          // Get user details
          const userResult = await authService.getCurrentUser()
          if (userResult.success) {
            setUser(userResult.user)
          }
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen to auth changes
    const unsubscribe = authService.onAuthStateChange((event, session) => {
      setSession(session)
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
    })

    return () => {
      unsubscribe?.data?.subscription?.unsubscribe()
    }
  }, [])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const result = await authService.signIn(email, password)
      if (result.success) {
        setSession(result.session)
        return { success: true }
      } else {
        setError(result.error)
        return { success: false, error: result.error }
      }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await authService.signOut()
      if (result.success) {
        setUser(null)
        setSession(null)
        return { success: true }
      } else {
        setError(result.error)
        return { success: false, error: result.error }
      }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const signup = useCallback(async (email, password, userData) => {
    setLoading(true)
    setError(null)
    try {
      const result = await authService.signUp(email, password, userData)
      if (result.success) {
        return { success: true, user: result.user }
      } else {
        setError(result.error)
        return { success: false, error: result.error }
      }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const resetPassword = useCallback(async (email) => {
    setLoading(true)
    setError(null)
    try {
      const result = await authService.resetPassword(email)
      if (result.success) {
        return { success: true }
      } else {
        setError(result.error)
        return { success: false, error: result.error }
      }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const updatePassword = useCallback(async (newPassword) => {
    setLoading(true)
    setError(null)
    try {
      const result = await authService.updatePassword(newPassword)
      if (result.success) {
        return { success: true }
      } else {
        setError(result.error)
        return { success: false, error: result.error }
      }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const value = {
    user,
    session,
    loading,
    error,
    login,
    logout,
    signup,
    resetPassword,
    updatePassword,
    isAuthenticated: !!session
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
