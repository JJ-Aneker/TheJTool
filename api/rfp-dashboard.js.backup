import '../config/env.js'
import express from 'express'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET /api/rfp-dashboard - Obtener estadísticas para el dashboard
router.get('/rfp-dashboard', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    // Obtener estadísticas usando la vista
    const { data: stats, error: statsError } = await supabase
      .from('rfp_dashboard_stats')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (statsError && statsError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error obteniendo stats:', statsError)
      return res.status(500).json({ error: statsError.message })
    }

    // Si no hay datos, devolver valores en 0
    const defaultStats = {
      total_rfps: 0,
      viability_alta: 0,
      viability_media: 0,
      viability_baja: 0,
      status_nueva: 0,
      status_analizada: 0,
      status_revisada: 0,
      status_en_decision: 0,
      status_archivada: 0,
      decision_go: 0,
      decision_no_go: 0
    }

    // Obtener RFPs con deadlines próximos (próximos 30 días)
    const { data: upcomingDeadlines, error: deadlinesError } = await supabase
      .from('rfp_analyses')
      .select('id, name, deadlines, viability, status')
      .eq('user_id', user.id)
      .not('deadlines', 'is', null)
      .order('created_at', { ascending: false })

    // Filtrar y ordenar por deadline
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const upcoming = (upcomingDeadlines || [])
      .filter(rfp => {
        const deadline = rfp.deadlines?.deadline
        if (!deadline) return false
        const deadlineDate = new Date(deadline)
        return deadlineDate >= now && deadlineDate <= thirtyDaysFromNow
      })
      .map(rfp => ({
        id: rfp.id,
        name: rfp.name,
        deadline: rfp.deadlines.deadline,
        viability: rfp.viability,
        status: rfp.status,
        daysUntil: Math.ceil((new Date(rfp.deadlines.deadline) - now) / (1000 * 60 * 60 * 24))
      }))
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 5) // Top 5 próximos

    res.json({
      stats: stats || defaultStats,
      upcomingDeadlines: upcoming
    })

  } catch (error) {
    console.error('Error en rfp-dashboard:', error)
    res.status(500).json({ error: error.message })
  }
})

// PATCH /api/rfp-status/:id - Actualizar estado de RFP
router.patch('/rfp-status/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { status, decision, decision_reason } = req.body

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
      .eq('id', id)
      .single()

    if (rfpError || !rfp || rfp.user_id !== user.id) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta RFP' })
    }

    // Actualizar
    const updateData = {}
    if (status) updateData.status = status
    if (decision) {
      updateData.decision = decision
      updateData.decision_date = new Date().toISOString()
    }
    if (decision_reason) updateData.decision_reason = decision_reason

    const { data, error } = await supabase
      .from('rfp_analyses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json(data)
  } catch (error) {
    console.error('Error actualizando estado:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/rfp-comments - Crear comentario
router.post('/rfp-comments', async (req, res) => {
  try {
    const { rfp_id, section_id, comment } = req.body

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
      return res.status(403).json({ error: 'No tienes permiso para comentar en esta RFP' })
    }

    const { data, error } = await supabase
      .from('rfp_comments')
      .insert({
        rfp_id,
        section_id: section_id || null,
        user_id: user.id,
        comment
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json(data)
  } catch (error) {
    console.error('Error creando comentario:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/rfp-comments/:rfpId - Obtener comentarios de una RFP
router.get('/rfp-comments/:rfpId', async (req, res) => {
  try {
    const { rfpId } = req.params

    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    const { data, error } = await supabase
      .from('rfp_comments')
      .select(`
        *,
        section:rfp_sections(section_name)
      `)
      .eq('rfp_id', rfpId)
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json(data)
  } catch (error) {
    console.error('Error obteniendo comentarios:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
