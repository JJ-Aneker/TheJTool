import '../config/env.js'
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock'

const bedrock = new BedrockClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

console.log('🔍 Listando modelos disponibles en', process.env.AWS_REGION || 'us-east-1')
console.log()

try {
  const command = new ListFoundationModelsCommand({
    byProvider: 'Anthropic'
  })

  const response = await bedrock.send(command)

  if (response.modelSummaries && response.modelSummaries.length > 0) {
    console.log('📋 Modelos de Anthropic disponibles:')
    console.log()

    response.modelSummaries
      .filter(model => model.modelId.includes('claude'))
      .sort((a, b) => a.modelId.localeCompare(b.modelId))
      .forEach(model => {
        console.log('  -', model.modelId)
        if (model.modelLifecycle?.status) {
          console.log('    Status:', model.modelLifecycle.status)
        }
      })
  } else {
    console.log('❌ No se encontraron modelos de Anthropic')
  }
} catch (error) {
  console.error('❌ Error:', error.message)
}
