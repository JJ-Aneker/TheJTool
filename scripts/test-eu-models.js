import '../config/env.js'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

// Los modelos que YA usa tu aplicación en bedrockClient.js
const euModels = [
  'eu.anthropic.claude-sonnet-4-5-20250929-v1:0',
  'eu.anthropic.claude-haiku-4-5-20251001-v1:0',
  'eu.anthropic.claude-opus-4-7',
  'eu.anthropic.claude-opus-4-6-v1'
]

const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

console.log('🌍 Probando modelos EU que YA usa tu app...\n')

for (const modelId of euModels) {
  console.log(`📡 Probando: ${modelId}`)

  try {
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: 'Di solo "OK"'
        }
      ]
    }

    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload)
    })

    const response = await bedrock.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))

    console.log(`   ✅ ¡FUNCIONA! Respuesta: "${responseBody.content[0].text}"`)
    console.log(`   💡 Modelo válido para RFP Analyzer: ${modelId}\n`)

    const fs = await import('fs')
    fs.writeFileSync('working-model.txt', modelId, 'utf8')
    break
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`)
  }
}
