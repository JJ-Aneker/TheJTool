import '../config/env.js'
import { BedrockClient, ListInferenceProfilesCommand } from '@aws-sdk/client-bedrock'

const bedrock = new BedrockClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

console.log('🔍 Listando Inference Profiles en', process.env.AWS_REGION || 'us-east-1')
console.log()

try {
  const command = new ListInferenceProfilesCommand({})
  const response = await bedrock.send(command)

  if (response.inferenceProfileSummaries && response.inferenceProfileSummaries.length > 0) {
    console.log('📋 Inference Profiles disponibles:')
    console.log()

    response.inferenceProfileSummaries
      .filter(profile => profile.inferenceProfileName?.includes('claude'))
      .forEach(profile => {
        console.log('  -', profile.inferenceProfileName)
        console.log('    ID:', profile.inferenceProfileId)
        console.log('    ARN:', profile.inferenceProfileArn)
        console.log('    Status:', profile.status)
        console.log()
      })
  } else {
    console.log('❌ No se encontraron inference profiles')
  }
} catch (error) {
  console.error('❌ Error:', error.message)
  console.log('\n💡 Intentando con ARN directo del foundation model...')

  // Intentar con ARN de foundation model
  const modelArn = `arn:aws:bedrock:${process.env.AWS_REGION || 'us-east-1'}::foundation-model/anthropic.claude-sonnet-5`
  console.log('   ARN sugerido:', modelArn)
}
