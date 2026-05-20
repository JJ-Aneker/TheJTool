import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/admin/anthropic/usage?days=30
 * Returns usage summary (total tokens, cost, by module, by user)
 *
 * GET /api/admin/anthropic/usage/history?days=30
 * Returns daily cost history
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    )

    const days = parseInt(req.query.days || '30')
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)

    const isHistory = req.url.includes('/history')

    if (isHistory) {
      // Historical: GROUP BY DATE
      const { data, error } = await supabase.rpc('get_anthropic_usage_by_day', {
        p_days: days
      }).select()

      if (error && error.code !== 'PGRST204') {
        // If RPC doesn't exist, fall back to manual query
        const { data: rawData, error: rawError } = await supabase
          .from('anthropic_usage')
          .select('timestamp, cost_usd')
          .gte('timestamp', fromDate.toISOString())
          .order('timestamp', { ascending: true })

        if (rawError) throw rawError

        // Group by date
        const byDate = {}
        rawData.forEach(row => {
          const dateKey = row.timestamp.split('T')[0]
          byDate[dateKey] = (byDate[dateKey] || 0) + (parseFloat(row.cost_usd) || 0)
        })

        const history = Object.entries(byDate).map(([date, cost]) => ({
          date,
          cost: parseFloat(cost.toFixed(6)),
          calls: 0 // Would need separate count query
        }))

        return res.status(200).json({ history })
      }

      return res.status(200).json({ history: data || [] })
    }

    // Summary: aggregate totals
    const { data: summaryData, error: summaryError } = await supabase
      .from('anthropic_usage')
      .select('*')
      .gte('timestamp', fromDate.toISOString())

    if (summaryError) throw summaryError

    // Calculate totals
    let totalInputTokens = 0
    let totalOutputTokens = 0
    let totalCost = 0
    let totalCalls = summaryData?.length || 0

    const byModule = {}
    const byUserId = {}

    summaryData.forEach(row => {
      totalInputTokens += row.input_tokens || 0
      totalOutputTokens += row.output_tokens || 0
      totalCost += parseFloat(row.cost_usd) || 0

      // By module
      const mod = row.module || 'unknown'
      byModule[mod] = byModule[mod] || { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 }
      byModule[mod].calls += 1
      byModule[mod].inputTokens += row.input_tokens || 0
      byModule[mod].outputTokens += row.output_tokens || 0
      byModule[mod].cost += parseFloat(row.cost_usd) || 0

      // By user
      const uid = row.user_id || 'unknown'
      byUserId[uid] = byUserId[uid] || { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 }
      byUserId[uid].calls += 1
      byUserId[uid].inputTokens += row.input_tokens || 0
      byUserId[uid].outputTokens += row.output_tokens || 0
      byUserId[uid].cost += parseFloat(row.cost_usd) || 0
    })

    // Format by module
    const modules = Object.entries(byModule).map(([name, stats]) => ({
      module: name,
      calls: stats.calls,
      inputTokens: stats.inputTokens,
      outputTokens: stats.outputTokens,
      totalTokens: stats.inputTokens + stats.outputTokens,
      cost: parseFloat(stats.cost.toFixed(6))
    })).sort((a, b) => b.cost - a.cost)

    // Format by user (convert UUID to shorter display)
    const users = Object.entries(byUserId)
      .filter(([uid]) => uid !== 'unknown')
      .map(([userId, stats]) => ({
        userId,
        calls: stats.calls,
        inputTokens: stats.inputTokens,
        outputTokens: stats.outputTokens,
        totalTokens: stats.inputTokens + stats.outputTokens,
        cost: parseFloat(stats.cost.toFixed(6))
      }))
      .sort((a, b) => b.cost - a.cost)

    return res.status(200).json({
      period: {
        days,
        from: fromDate.toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
      },
      summary: {
        totalCalls,
        totalInputTokens,
        totalOutputTokens,
        totalTokens: totalInputTokens + totalOutputTokens,
        totalCost: parseFloat(totalCost.toFixed(6))
      },
      byModule: modules,
      byUser: users
    })
  } catch (err) {
    console.error('Anthropic usage error:', err)
    return res.status(500).json({ error: err.message })
  }
}
