import '../config/env.js'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

// Cross-region inference profiles (formato: region.provider.model-version)
const crossRegionProfiles = [
  'us.anthropic.claude-sonnet-5-v2:0',
  'us.anthropic.claude-sonnet-4-v2:0',
  'us.anthropic.claude-haiku-5-v2:0',
  'us.anthropic.claude-haiku-4-v2:0',
  'eu.anthropic.claude-sonnet-5-v2:0',
  'eu.anthropic.claude-sonnet-4-v2:0'
]

const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

console.log('🌍 Probando Cross-Region Inference Profiles...\n')

for (const profileId of crossRegionProfiles) {
  console.log(`📡 Probando: ${profileId}`)

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
      modelId: profileId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload)
    })

    const response = await bedrock.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))

    console.log(`   ✅ ¡FUNCIONA! Respuesta: "${responseBody.content[0].text}"`)
    console.log(`   💡 Cross-region profile válido: ${profileId}`)
    console.log(`   🎯 Usar este ID en analyze-rfp.js\n`)

    // Guardar el profile que funciona
    const fs = await import('fs')
    fs.writeFileSync('working-model.txt', profileId, 'utf8')
    console.log(`   📝 Guardado en working-model.txt\n`)
    break
  } catch (error) {
    if (error.message.includes('does not exist') || error.message.includes('invalid')) {
      console.log(`   ⏭️  No existe o inválido\n`)
    } else {
      console.log(`   ❌ Error: ${error.message}\n`)
    }
  }
}

console.log('✅ Búsqueda completada')
