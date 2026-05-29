import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env')

export default async function bedrockCredentialsHandler(req, res) {
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
    console.error('Error in bedrock-credentials:', err)
    res.status(500).json({ error: err.message })
  }
}
