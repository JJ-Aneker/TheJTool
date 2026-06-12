// Admin Service - User management functions
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'

/**
 * Activate user's email manually (confirm in Supabase Auth)
 */
export async function activateUserEmail(userId) {
  try {
    const response = await fetch(`${API_URL}/api/admin/activate-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })
    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error activating user email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Approve user in profiles table
 */
export async function approveUser(userId) {
  try {
    const response = await fetch(`${API_URL}/api/admin/approve-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })
    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error approving user:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Activate AND approve user (most common action)
 */
export async function activateAndApproveUser(userId) {
  try {
    const response = await fetch(`${API_URL}/api/admin/activate-and-approve-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })
    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error activating and approving user:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get complete user status (auth + profile)
 */
export async function getUserStatus(userId) {
  try {
    const response = await fetch(`${API_URL}/api/admin/user-status/${userId}`)
    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error getting user status:', error)
    return { success: false, error: error.message }
  }
}
