import '../config/env.js'
import { BedrockClient, CreateInferenceProfileCommand } from '@aws-sdk/client-bedrock'

const bedrock = new BedrockClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

console.log('🔧 Creando Inference Profile para Claude Sonnet 5...\n')

try {
  const command = new CreateInferenceProfileCommand({
    inferenceProfileName: 'rfp-analyzer-claude-sonnet-5',
    description: 'Inference profile for RFP Analyzer using Claude Sonnet 5',
    modelSource: {
      copyFrom: 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-sonnet-5'
    }
  })

  const response = await bedrock.send(command)

  console.log('✅ Inference Profile creado:')
  console.log('   ARN:', response.inferenceProfileArn)
  console.log('   Usar este ARN en el código')
} catch (error) {
  console.error('❌ Error:', error.message)

  if (error.name === 'UnauthorizedException' || error.message.includes('authorized')) {
    console.log('\n💡 Tu usuario de AWS no tiene permisos para crear inference profiles.')
    console.log('   Opciones:')
    console.log('   1. Pedir al admin de AWS que cree el profile')
    console.log('   2. Usar la API de Anthropic directamente (sin Bedrock)')
    console.log('   3. Añadir permisos bedrock:CreateInferenceProfile al usuario')
  }
}
