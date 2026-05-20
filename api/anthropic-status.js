/**
 * GET /api/admin/anthropic/status
 * Returns API key status (valid/invalid) and masking
 */
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY || ''
  const hasKey = !!apiKey && apiKey.startsWith('sk-ant-')

  // Mask: show first 10 chars + last 4 chars
  let masked = ''
  if (hasKey) {
    masked = apiKey.substring(0, 10) + '****' + apiKey.slice(-4)
  }

  return res.status(200).json({
    hasKey,
    masked,
    model: 'claude-sonnet-4-20250514',
    timestamp: new Date().toISOString()
  })
}
