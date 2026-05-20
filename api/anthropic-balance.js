/**
 * GET /api/admin/anthropic/balance
 * Attempts to fetch account balance from Anthropic API
 *
 * Note: Anthropic doesn't have a public billing API endpoint,
 * but we try common endpoints that might work
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'No ANTHROPIC_API_KEY configured',
        balance: null
      })
    }

    // Try different possible endpoints for balance/billing info
    const endpoints = [
      'https://api.anthropic.com/v1/account/balance',
      'https://api.anthropic.com/v1/billing/balance',
      'https://api.anthropic.com/v1/account',
      'https://api.anthropic.com/v1/me'
    ]

    let lastError = null

    for (const endpoint of endpoints) {
      try {
        const resp = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: 5000
        })

        if (resp.ok) {
          const data = await resp.json()
          return res.status(200).json({
            success: true,
            balance: data.balance || data.available_balance || data,
            endpoint,
            raw: data
          })
        }

        if (resp.status !== 404) {
          lastError = `${endpoint}: HTTP ${resp.status}`
        }
      } catch (err) {
        lastError = err.message
        continue
      }
    }

    // If no endpoint worked, return helpful message
    return res.status(200).json({
      success: false,
      balance: null,
      message: 'Anthropic API does not expose a public balance endpoint',
      note: 'You can check your balance at https://console.anthropic.com/account/billing/overview',
      lastError
    })
  } catch (err) {
    console.error('Balance check error:', err)
    return res.status(500).json({
      success: false,
      error: err.message,
      balance: null
    })
  }
}
