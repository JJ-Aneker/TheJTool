import { callBedrock } from './bedrockClient.js'

export default async function bedrockTestHandler(req, res) {
  try {
    const startTime = Date.now()

    const data = await callBedrock({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Respond with just "OK"' }]
    }, { userId: null, module: 'test' })

    const durationMs = Date.now() - startTime

    res.json({
      success: true,
      model: data.model,
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
      durationMs,
      message: data.content[0].text
    })
  } catch (err) {
    console.error('Error in bedrock-test:', err)
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}
