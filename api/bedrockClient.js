import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime'
import { createClient } from '@supabase/supabase-js'

let bedrockClient = null
let supabase = null

function getBedrockClient() {
  if (!bedrockClient) {
    bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'eu-south-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    })
  }
  return bedrockClient
}

function getSupabaseClient() {
  if (!supabase) {
    supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    )
  }
  return supabase
}

const MODEL_ID_MAP = {
  'claude-opus-4-7': 'eu.anthropic.claude-opus-4-7',
  'claude-opus-4-6': 'eu.anthropic.claude-opus-4-6-v1',
  'claude-opus-4-5': 'eu.anthropic.claude-opus-4-5-20251101-v1:0',
  'claude-haiku-4-5-20251001': 'eu.anthropic.claude-haiku-4-5-20251001-v1:0',
  'claude-sonnet-4-20250514': 'eu.anthropic.claude-sonnet-4-20250514-v1:0',
  'claude-sonnet-4-5': 'eu.anthropic.claude-sonnet-4-5-20250929-v1:0'
}

const PRICING_BEDROCK = {
  'eu.anthropic.claude-opus-4-7': { input: 15.00, output: 75.00 },
  'eu.anthropic.claude-opus-4-6-v1': { input: 15.00, output: 75.00 },
  'eu.anthropic.claude-opus-4-5-20251101-v1:0': { input: 15.00, output: 75.00 },
  'eu.anthropic.claude-haiku-4-5-20251001-v1:0': { input: 0.80, output: 4.00 },
  'eu.anthropic.claude-sonnet-4-20250514-v1:0': { input: 3.00, output: 15.00 },
  'eu.anthropic.claude-sonnet-4-5-20250929-v1:0': { input: 3.00, output: 15.00 }
}

function calcCostBedrock(modelId, inputTokens, outputTokens) {
  const pricing = PRICING_BEDROCK[modelId] || PRICING_BEDROCK['eu.anthropic.claude-opus-4-7']
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000
}

function convertContentToBedrockFormat(anthropicContent) {
  return anthropicContent.map(item => {
    if (typeof item === 'string') {
      return { text: item }
    }

    if (item.type === 'text') {
      return { text: item.text }
    }

    if (item.type === 'document') {
      const bytes = Buffer.from(item.source.data, 'base64')
      return {
        document: {
          format: 'pdf',
          name: 'document',
          source: { bytes }
        }
      }
    }

    if (item.type === 'image') {
      const bytes = Buffer.from(item.source.data, 'base64')
      const format = item.source.media_type?.split('/')[1] || 'jpeg'
      return {
        image: {
          format,
          source: { bytes }
        }
      }
    }

    if (item.text) return { text: item.text }
    return null
  }).filter(Boolean)
}

export async function callBedrock(params, options = {}) {
  const { userId = null, module = 'unknown' } = options
  const client = getBedrockClient()

  const modelId = MODEL_ID_MAP[params.model] || params.model

  const converseInput = {
    modelId,
    messages: params.messages.map(msg => ({
      role: msg.role,
      content: convertContentToBedrockFormat(
        Array.isArray(msg.content) ? msg.content : [{ type: 'text', text: msg.content }]
      )
    })),
    inferenceConfig: {
      maxTokens: params.max_tokens
    }
  }

  if (params.system) {
    converseInput.system = [{ text: params.system }]
  }

  const command = new ConverseCommand(converseInput)
  const response = await client.send(command)

  const outputText = response.output?.message?.content?.[0]?.text ?? ''
  const inputTokens = response.usage?.inputTokens ?? 0
  const outputTokens = response.usage?.outputTokens ?? 0
  const cost = calcCostBedrock(modelId, inputTokens, outputTokens)

  ;(async () => {
    try {
      const sb = getSupabaseClient()
      await sb.from('anthropic_usage').insert({
        user_id: userId,
        module,
        model: modelId,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: cost
      })
    } catch (err) {
      console.warn('Failed to log Bedrock usage:', err.message)
    }
  })()

  return {
    content: [{ type: 'text', text: outputText }],
    usage: {
      input_tokens: inputTokens,
      output_tokens: outputTokens
    },
    model: modelId
  }
}
