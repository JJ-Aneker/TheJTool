import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Pricing per million tokens (as of 2025-05)
const PRICING = {
  'claude-sonnet-4-20250514': { input: 3.00, output: 15.00 },
  'claude-haiku-4-5-20251001': { input: 0.80, output: 4.00 },
  'claude-opus-4-7': { input: 15.00, output: 75.00 }
}

function calcCost(model, inputTokens, outputTokens) {
  const pricing = PRICING[model] || PRICING['claude-sonnet-4-20250514']
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000
}

/**
 * Wrapper for Anthropic API calls with automatic usage logging
 * @param {Object} params - Message parameters for Anthropic API
 * @param {string} params.model - Model name
 * @param {number} params.max_tokens - Max tokens in response
 * @param {string} [params.system] - System prompt
 * @param {Array} params.messages - Messages array
 * @param {Object} options - Logging options
 * @param {string} [options.userId] - User ID for logging
 * @param {string} [options.module] - Module name (e.g., 'analyze', 'reporter')
 * @returns {Promise<Object>} Anthropic response
 */
export async function callAnthropic(params, options = {}) {
  const { userId = null, module = 'unknown' } = options

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(params)
  })

  const data = await response.json()

  // Throw on HTTP error
  if (!response.ok) {
    throw new Error(data.error?.message || `Anthropic HTTP ${response.status}`)
  }

  // Extract usage from response
  const inputTokens = data.usage?.input_tokens ?? 0
  const outputTokens = data.usage?.output_tokens ?? 0
  const cost = calcCost(params.model, inputTokens, outputTokens)

  // Log usage asynchronously (fire-and-forget)
  // This doesn't block the response
  ;(async () => {
    try {
      await supabase.from('anthropic_usage').insert({
        user_id: userId,
        module,
        model: params.model,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: cost
      })
    } catch (err) {
      // Silent fail - don't break the API call if logging fails
      console.warn('Failed to log Anthropic usage:', err.message)
    }
  })()

  return data
}
