import '../config/env.js'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

// Modelos a probar (en orden de preferencia)
const modelsToTest = [
  'us.anthropic.claude-sonnet-4-5-v2:0',
  'us.anthropic.claude-sonnet-4-6-v1:0',
  'us.anthropic.claude-haiku-4-5-v1:0',
  'anthropic.claude-opus-4-1-20250805-v1:0'
]

const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

console.log('🔍 Probando modelos directamente...\n')

for (const modelId of modelsToTest) {
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

    console.log(`   ✅ FUNCIONA! Respuesta:`, responseBody.content[0].text)
    console.log(`   💡 Usar este modelo: ${modelId}\n`)
    break
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`)
  }
}
