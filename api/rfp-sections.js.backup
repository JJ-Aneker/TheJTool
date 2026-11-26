import '../config/env.js' // Cargar variables de entorno PRIMERO
import express from 'express'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// PUT /api/rfp-sections/:id (actualizar una sección)
router.put('/rfp-sections/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { area, responsible_user_id, priority, status, order_index } = req.body

    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    // Verificar que la sección pertenece a una RFP del usuario
    const { data: section, error: sectionError } = await supabase
      .from('rfp_sections')
      .select('rfp_id')
      .eq('id', id)
      .single()

    if (sectionError || !section) {
      return res.status(404).json({ error: 'Sección no encontrada' })
    }

    const { data: rfp, error: rfpError } = await supabase
      .from('rfp_analyses')
      .select('user_id')
      .eq('id', section.rfp_id)
      .single()

    if (rfpError || !rfp || rfp.user_id !== user.id) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta sección' })
    }

    // Actualizar sección
    const updateData = {}
    if (area !== undefined) updateData.area = area
    if (responsible_user_id !== undefined) updateData.responsible_user_id = responsible_user_id
    if (priority !== undefined) updateData.priority = priority
    if (status !== undefined) updateData.status = status
    if (order_index !== undefined) updateData.order_index = order_index

    const { data, error } = await supabase
      .from('rfp_sections')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json(data)
  } catch (error) {
    console.error('Error updating section:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/rfp-sections (crear nueva sección)
router.post('/rfp-sections', async (req, res) => {
  try {
    const { rfp_id, section_name, area, priority } = req.body

    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    // Verificar que la RFP pertenece al usuario
    const { data: rfp, error: rfpError } = await supabase
      .from('rfp_analyses')
      .select('user_id')
      .eq('id', rfp_id)
      .single()

    if (rfpError || !rfp || rfp.user_id !== user.id) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta RFP' })
    }

    // Obtener el último order_index
    const { data: lastSection } = await supabase
      .from('rfp_sections')
      .select('order_index')
      .eq('rfp_id', rfp_id)
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    const nextOrderIndex = lastSection ? lastSection.order_index + 1 : 0

    const { data, error } = await supabase
      .from('rfp_sections')
      .insert({
        rfp_id,
        section_name,
        area,
        priority: priority || 'optional',
        status: 'pending',
        order_index: nextOrderIndex
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json(data)
  } catch (error) {
    console.error('Error creating section:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/rfp-sections/:id (eliminar sección)
router.delete('/rfp-sections/:id', async (req, res) => {
  try {
    const { id } = req.params

    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    // Verificar permisos
    const { data: section, error: sectionError } = await supabase
      .from('rfp_sections')
      .select('rfp_id')
      .eq('id', id)
      .single()

    if (sectionError || !section) {
      return res.status(404).json({ error: 'Sección no encontrada' })
    }

    const { data: rfp, error: rfpError } = await supabase
      .from('rfp_analyses')
      .select('user_id')
      .eq('id', section.rfp_id)
      .single()

    if (rfpError || !rfp || rfp.user_id !== user.id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta sección' })
    }

    const { error } = await supabase
      .from('rfp_sections')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting section:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
