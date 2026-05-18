import { useAuth } from './useAuth'

export function useRole() {
  const { user } = useAuth()

  const getRole = () => {
    if (!user) return null

    // First, try to read from JWT claims (most up-to-date)
    // @ts-ignore
    if (user.role === 'admin') return 'admin'

    // Fallback to user_metadata
    return user.user_metadata?.role || user.raw_user_meta_data?.role || 'user'
  }

  const isAdmin = () => {
    if (!user) return false

    // Check JWT claims first (is_admin claim set by server)
    // @ts-ignore
    if (user.app_metadata?.is_admin === true) return true

    // Fallback to role in metadata
    const role = getRole()
    return role === 'admin'
  }

  return {
    isAdmin: isAdmin(),
    role: getRole(),
    user
  }
}
