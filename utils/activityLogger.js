// Activity Logger - Centralized logging for user actions
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

/**
 * Log user activity to activity_log table
 * @param {string} userId - User UUID
 * @param {string} userName - User display name
 * @param {string} actionType - report_executed, eform_created, category_created, document_generated
 * @param {string} actionDescription - Human readable description
 * @param {string} entityType - report, eform, category, document
 * @param {string} entityId - Entity identifier
 * @param {object} metadata - Additional context data
 */
export async function logActivity({
  userId,
  userName,
  actionType,
  actionDescription,
  entityType = null,
  entityId = null,
  metadata = null
}) {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .insert({
        user_id: userId,
        user_name: userName,
        action_type: actionType,
        action_description: actionDescription,
        entity_type: entityType,
        entity_id: entityId,
        metadata: metadata
      })

    if (error) {
      console.error('Failed to log activity:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Activity logging error:', error)
    return { success: false, error }
  }
}

/**
 * Log report execution
 */
export async function logReportExecution({
  userId,
  tenantName,
  reportName,
  categoryNo,
  categoryName,
  condition,
  resultCount,
  status = 'success',
  errorMessage = null,
  executionTimeMs = null
}) {
  try {
    const { data, error } = await supabase
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

    if (error) {
      console.error('Failed to log report execution:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Report execution logging error:', error)
    return { success: false, error }
  }
}

/**
 * Log generated document
 */
export async function logGeneratedDocument({
  userId,
  documentType,
  title,
  pages = 0,
  status = 'completed',
  filePath = null,
  metadata = null
}) {
  try {
    const { data, error } = await supabase
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

    if (error) {
      console.error('Failed to log generated document:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Document generation logging error:', error)
    return { success: false, error }
  }
}

/**
 * Quick logging helpers
 */
export const ActivityTypes = {
  REPORT_EXECUTED: 'report_executed',
  EFORM_CREATED: 'eform_created',
  EFORM_UPDATED: 'eform_updated',
  CATEGORY_CREATED: 'category_created',
  CATEGORY_UPDATED: 'category_updated',
  DOCUMENT_GENERATED: 'document_generated',
  LOGIN: 'login',
  LOGOUT: 'logout'
}

export const EntityTypes = {
  REPORT: 'report',
  EFORM: 'eform',
  CATEGORY: 'category',
  DOCUMENT: 'document',
  TENANT: 'tenant'
}
