import { useAuth } from './useAuth'

export function useRole() {
  const { user } = useAuth()

  const isAdmin = () => {
    if (!user) return false
    const role = user.user_metadata?.role || user.raw_user_meta_data?.role
    return role === 'admin'
  }

  const getRole = () => {
    if (!user) return null
    return user.user_metadata?.role || user.raw_user_meta_data?.role || 'user'
  }

  return {
    isAdmin: isAdmin(),
    role: getRole(),
    user
  }
}
