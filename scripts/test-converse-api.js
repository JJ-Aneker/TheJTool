import '../config/env.js'
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime'

const euModels = [
  'eu.anthropic.claude-sonnet-4-5-20250929-v1:0',
  'eu.anthropic.claude-haiku-4-5-20251001-v1:0',
  'eu.anthropic.claude-opus-4-7',
  'eu.anthropic.claude-sonnet-4-6-v1'
]

const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

console.log('🔄 Probando con ConverseCommand (API que usa tu app)...\n')

for (const modelId of euModels) {
  console.log(`📡 Probando: ${modelId}`)

  try {
    const command = new ConverseCommand({
      modelId,
      messages: [
        {
          role: 'user',
          content: [{ text: 'Di solo "OK"' }]
        }
      ],
      inferenceConfig: {
        maxTokens: 50
      }
    })

    const response = await bedrock.send(command)
    const outputText = response.output?.message?.content?.[0]?.text ?? ''

    console.log(`   ✅ ¡FUNCIONA! Respuesta: "${outputText}"`)
    console.log(`   💡 Modelo válido: ${modelId}`)
    console.log(`   🎯 Usar ConverseCommand en analyze-rfp.js\n`)

    const fs = await import('fs')
    fs.writeFileSync('working-model.txt', modelId, 'utf8')
    break
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`)
  }
}
