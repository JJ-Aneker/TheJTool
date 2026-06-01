import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import { callBedrock } from './bedrockClient.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env')

function getSupabaseClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )
}

// Handler for credentials (PUT)
async function handleCredentials(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { accessKeyId, secretAccessKey, region } = req.body

    if (!accessKeyId || !secretAccessKey || !region) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (!accessKeyId.startsWith('AKIA')) {
      return res.status(400).json({ error: 'Access Key ID must start with AKIA' })
    }

    let envContent = fs.readFileSync(envPath, 'utf-8')

    envContent = envContent.replace(/AWS_ACCESS_KEY_ID=.*/g, `AWS_ACCESS_KEY_ID=${accessKeyId}`)
    envContent = envContent.replace(/AWS_SECRET_ACCESS_KEY=.*/g, `AWS_SECRET_ACCESS_KEY=${secretAccessKey}`)
    envContent = envContent.replace(/AWS_REGION=.*/g, `AWS_REGION=${region}`)

    if (!envContent.includes('AWS_ACCESS_KEY_ID=')) {
      envContent += `\nAWS_ACCESS_KEY_ID=${accessKeyId}`
    }
    if (!envContent.includes('AWS_SECRET_ACCESS_KEY=')) {
      envContent += `\nAWS_SECRET_ACCESS_KEY=${secretAccessKey}`
    }
    if (!envContent.includes('AWS_REGION=')) {
      envContent += `\nAWS_REGION=${region}`
    }

    fs.writeFileSync(envPath, envContent)

    process.env.AWS_ACCESS_KEY_ID = accessKeyId
    process.env.AWS_SECRET_ACCESS_KEY = secretAccessKey
    process.env.AWS_REGION = region

    res.json({ success: true, message: 'AWS Bedrock credentials updated successfully' })
  } catch (err) {
    console.error('Error in bedrock credentials:', err)
    res.status(500).json({ error: err.message })
  }
}

// Handler for status (GET)
async function handleStatus(req, res) {
  try {
    const hasCredentials = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID

    res.json({
      hasCredentials,
      accessKeyId: hasCredentials ? 'AKIA' + '*'.repeat(16) : null,
      region: process.env.AWS_REGION || 'eu-south-2',
      timestamp: new Date().toISOString(),
      inferenceProfiles: [
        {
          name: 'EU Anthropic Claude Haiku 4.5',
          id: 'eu.anthropic.claude-haiku-4-5-20251001-v1:0',
          regions: ['eu-north-1', 'eu-west-3', 'eu-south-1', 'eu-south-2', 'eu-west-1', 'eu-central-1'],
          models: ['Claude Haiku 4.5']
        },
        {
          name: 'EU Anthropic Claude Opus 4.7',
          id: 'eu.anthropic.claude-opus-4-7',
          regions: ['eu-central-1', 'eu-north-1', 'eu-south-1', 'eu-south-2', 'eu-west-1', 'eu-west-3'],
          models: ['Claude Opus 4.7']
        },
        {
          name: 'EU Anthropic Claude Sonnet 4.5',
          id: 'eu.anthropic.claude-sonnet-4-5-20250929-v1:0',
          regions: ['eu-north-1', 'eu-west-3', 'eu-south-1', 'eu-south-2', 'eu-west-1', 'eu-central-1'],
          models: ['Claude Sonnet 4.5']
        }
      ]
    })
  } catch (err) {
    console.error('Error in bedrock status:', err)
    res.status(500).json({ error: err.message })
  }
}

// Handler for test (POST)
async function handleTest(req, res) {
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
    console.error('Error in bedrock test:', err)
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}

// Handler for usage (GET)
async function handleUsage(req, res) {
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

    if (usageError && usageError.code !== 'PGRST116') {
      // PGRST116 = "The result contains no rows" - this is fine
      throw usageError
    }

    const isHistory = req.query.history === 'true'
    const data = usageData || []

    if (isHistory) {
      // Daily history
      const dailyData = {}

      data.forEach(row => {
        const dateKey = row.created_at.split('T')[0]
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { date: dateKey, cost: 0 }
        }
        dailyData[dateKey].cost += row.cost_usd || 0
      })

      const history = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date))

      return res.json({ history })
    }

    // Summary aggregation
    const byModule = {}
    const byUser = {}
    let totalInputTokens = 0
    let totalOutputTokens = 0
    let totalCost = 0
    let totalCalls = 0

    data.forEach(row => {
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

    res.json({
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
  } catch (err) {
    console.error('Error in bedrock usage:', err)
    res.status(500).json({ error: err.message })
  }
}

// Main router
export default async function handler(req, res) {
  const action = req.query.action || ''

  switch (action) {
    case 'credentials':
      return handleCredentials(req, res)
    case 'status':
      return handleStatus(req, res)
    case 'test':
      return handleTest(req, res)
    case 'usage':
      return handleUsage(req, res)
    default:
      return res.status(400).json({ error: `Unknown action: ${action}` })
  }
}
