import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )
}

export default async function bedrockUsageHandler(req, res) {
  try {
    const sb = getSupabaseClient()
    const days = parseInt(req.query.days) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: usageData, error: usageError } = await sb
      .from('anthropic_usage')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (usageError) throw usageError

    const isByModule = req.path.includes('usage') && !req.path.includes('history')

    if (isByModule) {
      const byModule = {}
      const byUser = {}
      let totalInputTokens = 0
      let totalOutputTokens = 0
      let totalCost = 0
      let totalCalls = 0

      usageData.forEach(row => {
        const module = row.module || 'unknown'
        if (!byModule[module]) {
          byModule[module] = { module, calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 }
        }
        byModule[module].calls += 1
        byModule[module].inputTokens += row.input_tokens || 0
        byModule[module].outputTokens += row.output_tokens || 0
        byModule[module].cost += row.cost_usd || 0

        if (row.user_id) {
          if (!byUser[row.user_id]) {
            byUser[row.user_id] = { userId: row.user_id, calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 }
          }
          byUser[row.user_id].calls += 1
          byUser[row.user_id].inputTokens += row.input_tokens || 0
          byUser[row.user_id].outputTokens += row.output_tokens || 0
          byUser[row.user_id].cost += row.cost_usd || 0
        }

        totalInputTokens += row.input_tokens || 0
        totalOutputTokens += row.output_tokens || 0
        totalCost += row.cost_usd || 0
        totalCalls += 1
      })

      return res.json({
        summary: {
          totalInputTokens,
          totalOutputTokens,
          totalCost,
          totalCalls
        },
        byModule: Object.values(byModule),
        byUser: Object.values(byUser),
        period: { days, startDate }
      })
    } else {
      const dailyData = {}

      usageData.forEach(row => {
        const dateKey = row.created_at.split('T')[0]
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { date: dateKey, cost: 0 }
        }
        dailyData[dateKey].cost += row.cost_usd || 0
      })

      const history = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date))

      return res.json({ history })
    }
  } catch (err) {
    console.error('Error in bedrock-usage:', err)
    res.status(500).json({ error: err.message })
  }
}
