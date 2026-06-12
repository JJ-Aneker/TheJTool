// Dashboard Service - Fetch real data for Home view
import { supabase } from '../config/supabaseClient'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'

/**
 * Get dashboard statistics for hero section
 */
export async function getDashboardStats(userId) {
  try {
    const response = await fetch(`${API_URL}/api/dashboard/stats`, {
      headers: {
        'x-user-id': userId
      }
    })
    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return null
  }
}

/**
 * Get recent report executions
 */
export async function getRecentReports(userId) {
  try {
    const response = await fetch(`${API_URL}/api/dashboard/recent-reports`, {
      headers: {
        'x-user-id': userId
      }
    })
    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error fetching recent reports:', error)
    return []
  }
}

/**
 * Get recent generated documents
 */
export async function getRecentDocuments(userId) {
  try {
    const response = await fetch(`${API_URL}/api/dashboard/recent-documents`, {
      headers: {
        'x-user-id': userId
      }
    })
    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error fetching recent documents:', error)
    return []
  }
}

/**
 * Get recent activity timeline
 */
export async function getRecentActivity() {
  try {
    const response = await fetch(`${API_URL}/api/dashboard/recent-activity`)
    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return []
  }
}

/**
 * Get system status
 */
export async function getSystemStatus() {
  try {
    const response = await fetch(`${API_URL}/api/dashboard/system-status`)
    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error fetching system status:', error)
    return []
  }
}

/**
 * Get stats history (last 7 days) for charts
 */
export async function getStatsHistory() {
  try {
    const response = await fetch(`${API_URL}/api/dashboard/stats-history`)
    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error fetching stats history:', error)
    return []
  }
}

/**
 * Get performance metrics
 */
export async function getPerformanceMetrics() {
  try {
    const response = await fetch(`${API_URL}/api/dashboard/performance-metrics`)
    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    return null
  }
}

/**
 * Helper to format time ago (seconds to human readable)
 */
export function formatTimeAgo(secondsAgo) {
  if (secondsAgo < 60) return 'Hace un momento'
  if (secondsAgo < 3600) return `Hace ${Math.floor(secondsAgo / 60)} min`
  if (secondsAgo < 86400) return `Hace ${Math.floor(secondsAgo / 3600)}h`
  return `Hace ${Math.floor(secondsAgo / 86400)} días`
}

/**
 * Document type icons mapping
 */
export const documentTypeIcons = {
  'EFDT': '📋',
  'Budget': '📊',
  'Requirements': '📝',
  'Commercial': '💼',
  'CR': '🔄'
}

/**
 * Log report execution
 */
export async function logReportExecution({
  userId,
  userName,
  tenantName,
  reportName,
  categoryNo,
  categoryName,
  condition,
  resultCount,
  executionTimeMs,
  status = 'success',
  errorMessage = null
}) {
  try {
    // Log to report_executions table
    const { error: reportError } = await supabase
      .from('report_executions')
      .insert({
        user_id: userId,
        tenant_name: tenantName,
        report_name: reportName,
        category_no: categoryNo,
        category_name: categoryName,
        condition: condition,
        result_count: resultCount,
        status: status,
        error_message: errorMessage,
        execution_time_ms: executionTimeMs
      })

    if (reportError) console.error('Failed to log report:', reportError)

    // Log to activity_log table
    const actionDescription = status === 'success'
      ? `ejecutó report "${reportName}" (${resultCount} documentos)`
      : `intentó ejecutar report "${reportName}" (error)`

    const { error: activityError } = await supabase
      .from('activity_log')
      .insert({
        user_id: userId,
        user_name: userName,
        action_type: 'report_executed',
        action_description: actionDescription,
        entity_type: 'report',
        entity_id: reportName,
        metadata: {
          tenant: tenantName,
          category: categoryName,
          result_count: resultCount,
          status: status
        }
      })

    if (activityError) console.error('Failed to log activity:', activityError)

    return { success: true }
  } catch (error) {
    console.error('Error logging report execution:', error)
    return { success: false, error }
  }
}

/**
 * Log document generation
 */
export async function logDocumentGeneration({
  userId,
  userName,
  documentType,
  title,
  pages,
  status = 'completed',
  filePath = null,
  metadata = null
}) {
  try {
    // Log to generated_documents table
    const { error: docError } = await supabase
      .from('generated_documents')
      .insert({
        user_id: userId,
        document_type: documentType,
        title: title,
        pages: pages,
        status: status,
        file_path: filePath,
        metadata: metadata
      })

    if (docError) console.error('Failed to log document:', docError)

    // Log to activity_log table
    const actionDescription = `generó documento ${documentType}: "${title}"`

    const { error: activityError } = await supabase
      .from('activity_log')
      .insert({
        user_id: userId,
        user_name: userName,
        action_type: 'document_generated',
        action_description: actionDescription,
        entity_type: 'document',
        entity_id: title,
        metadata: {
          document_type: documentType,
          pages: pages,
          status: status
        }
      })

    if (activityError) console.error('Failed to log activity:', activityError)

    return { success: true }
  } catch (error) {
    console.error('Error logging document generation:', error)
    return { success: false, error }
  }
}
