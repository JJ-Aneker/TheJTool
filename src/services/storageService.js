import { supabase } from '../config/supabaseClient'
import { logger } from '../utils/logger'

const DOCUMENT_BUCKET = 'document-uploads'

export const storageService = {
  // ═══════════════════════════════════════════════════════════════════════════
  // DOCUMENT UPLOADS (para generador de documentos)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Sube un archivo temporal para análisis
   * @param {File} file - Archivo a subir
   * @param {string} userId - ID del usuario
   * @returns {Promise<{path: string, url: string, name: string, type: string, size: number}>}
   */
  async uploadDocument(file, userId) {
    try {
      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `${userId}/${timestamp}-${sanitizedName}`

      console.log('[Storage] Subiendo documento:', filePath)

      const { data, error } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from(DOCUMENT_BUCKET)
        .getPublicUrl(filePath)

      console.log('[Storage] Documento subido:', publicUrl)

      return {
        path: data.path,
        url: publicUrl,
        name: file.name,
        type: file.type,
        size: file.size
      }
    } catch (error) {
      logger.error('Error uploading document:', error)
      throw new Error(`Error al subir archivo: ${error.message}`)
    }
  },

  /**
   * Lista portadas guardadas del usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} Lista de portadas
   */
  async listUserCovers(userId) {
    try {
      console.log('[Storage] Listando portadas de usuario:', userId)

      const { data, error } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .list(userId, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) throw error

      // Filtrar solo PNG (portadas)
      const covers = data
        .filter(file => file.name.toLowerCase().endsWith('.png'))
        .map(file => ({
          name: file.name,
          path: `${userId}/${file.name}`,
          url: supabase.storage.from(DOCUMENT_BUCKET).getPublicUrl(`${userId}/${file.name}`).data.publicUrl,
          created_at: file.created_at,
          size: file.metadata?.size || 0
        }))

      console.log('[Storage] Portadas encontradas:', covers.length)
      return covers
    } catch (error) {
      logger.error('Error listing covers:', error)
      return []
    }
  },

  /**
   * Elimina documentos temporales
   * @param {string[]} paths - Array de paths a eliminar
   */
  async deleteDocuments(paths) {
    try {
      if (!paths || paths.length === 0) return

      console.log('[Storage] Eliminando documentos:', paths.length)

      const { error } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .remove(paths)

      if (error) {
        logger.error('Error deleting documents:', error)
      } else {
        console.log('[Storage] Documentos eliminados')
      }
    } catch (error) {
      logger.error('Error deleting documents:', error)
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AVATARS (funcionalidad existente)
  // ═══════════════════════════════════════════════════════════════════════════

  async uploadAvatar(file, userId) {
    try {
      // Crear nombre único para el archivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Subir archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Obtener URL pública
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return { success: true, url: data.publicUrl }
    } catch (error) {
      logger.error('Error uploading avatar:', error)
      return { success: false, error: error.message }
    }
  },

  async deleteAvatar(avatarUrl) {
    try {
      // Extraer el path del URL
      if (!avatarUrl) return { success: true }

      const urlPath = avatarUrl.split('/avatars/')[1]
      if (!urlPath) return { success: true }

      const { error } = await supabase.storage
        .from('avatars')
        .remove([`avatars/${urlPath}`])

      if (error) throw error
      return { success: true }
    } catch (error) {
      logger.error('Error deleting avatar:', error)
      return { success: false, error: error.message }
    }
  }
}
