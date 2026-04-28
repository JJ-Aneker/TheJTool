import { supabase } from '../config/supabaseClient'

export const storageService = {
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
      console.error('Error uploading avatar:', error)
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
      console.error('Error deleting avatar:', error)
      return { success: false, error: error.message }
    }
  }
}
