import '../config/env.js'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

// Modelos LEGACY y con formato de versión antigua que podrían funcionar
const modelsToTest = [
  'anthropic.claude-sonnet-4-5-20250929-v1:0',  // LEGACY
  'anthropic.claude-opus-4-1-20250805-v1:0',    // LEGACY
  'anthropic.claude-3-sonnet-20240229-v1:0',    // Claude 3 (si existe)
  'anthropic.claude-3-5-sonnet-20240620-v1:0',  // Claude 3.5 original
  'anthropic.claude-3-haiku-20240307-v1:0',     // Claude 3 Haiku
  'anthropic.claude-v2:1',                       // Claude 2.1
  'anthropic.claude-v2'                          // Claude 2
]

const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

console.log('🔍 Probando modelos LEGACY y antiguos...\n')

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

    console.log(`   ✅ ¡FUNCIONA! Respuesta: "${responseBody.content[0].text}"`)
    console.log(`   💡 Modelo válido: ${modelId}`)
    console.log(`   🎯 Usar este modelo en analyze-rfp.js\n`)

    // Guardar el modelo que funciona en un archivo
    const fs = await import('fs')
    fs.writeFileSync('working-model.txt', modelId, 'utf8')
    console.log(`   📝 Guardado en working-model.txt\n`)
    break
  } catch (error) {
    if (error.message.includes('does not exist')) {
      console.log(`   ⏭️  No existe\n`)
    } else if (error.message.includes('not supported')) {
      console.log(`   ❌ No soporta on-demand\n`)
    } else {
      console.log(`   ❌ Error: ${error.message}\n`)
    }
  }
}

console.log('✅ Búsqueda completada')
