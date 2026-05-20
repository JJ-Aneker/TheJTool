import { callAnthropic } from './anthropicClient.js'

/**
 * POST /api/admin/anthropic/test
 * Tests the current API key by making a minimal API call
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'No ANTHROPIC_API_KEY configured'
      })
    }

    // Make a minimal test call
    const startTime = Date.now()

    const data = await callAnthropic({
      model: 'claude-opus-4-7',
      max_tokens: 50,
      messages: [
        { role: 'user', content: 'Respond with just "OK"' }
      ]
    }, {
      userId: null,
      module: 'test'
    })

    const duration = Date.now() - startTime

    return res.status(200).json({
      success: true,
      model: 'claude-opus-4-7',
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
      durationMs: duration,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('Test API key error:', err)
    return res.status(400).json({
      success: false,
      error: err.message || 'Failed to test API key'
    })
  }
}
