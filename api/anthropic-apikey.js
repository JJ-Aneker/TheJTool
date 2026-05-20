import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

/**
 * PUT /api/admin/anthropic/apikey
 * Updates the Anthropic API key in .env file and reloads in memory
 * Body: { apiKey: "sk-ant-..." }
 */
export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { apiKey } = req.body

    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ error: 'Invalid apiKey in request body' })
    }

    if (!apiKey.startsWith('sk-ant-')) {
      return res.status(400).json({ error: 'Invalid API key format. Must start with sk-ant-' })
    }

    // Get .env path (works in Node.js ES modules and Vercel)
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const envPath = path.resolve(__dirname, '..', '.env')

    // Read current .env
    let envContent = fs.readFileSync(envPath, 'utf8')

    // Replace ANTHROPIC_API_KEY line
    const envRegex = /^ANTHROPIC_API_KEY=.*/m
    if (envRegex.test(envContent)) {
      envContent = envContent.replace(envRegex, `ANTHROPIC_API_KEY=${apiKey}`)
    } else {
      // Append if not present
      envContent += `\nANTHROPIC_API_KEY=${apiKey}\n`
    }

    // Write back
    fs.writeFileSync(envPath, envContent, 'utf8')

    // Update in-memory process.env (required for immediate effect without server restart)
    process.env.ANTHROPIC_API_KEY = apiKey

    return res.status(200).json({
      success: true,
      message: 'API key updated successfully',
      masked: apiKey.substring(0, 10) + '****' + apiKey.slice(-4),
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('Update API key error:', err)
    return res.status(500).json({ error: err.message })
  }
}
