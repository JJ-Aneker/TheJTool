import '../config/env.js'
import { createClient } from '@supabase/supabase-js'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

console.log('🔍 Diagnóstico RFP Analyzer\n')

// 1. Verificar variables de entorno
console.log('1️⃣ Variables de entorno:')
console.log('   VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅' : '❌')
console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌')
console.log('   AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '✅' : '❌')
console.log('   AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '✅' : '❌')
console.log('   AWS_REGION:', process.env.AWS_REGION || 'NOT SET')
console.log()

// 2. Verificar conexión Supabase
console.log('2️⃣ Conexión Supabase:')
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

try {
  // Verificar tablas
  const { data: rfpAnalyses, error: rfpError } = await supabase
    .from('rfp_analyses')
    .select('count')
    .limit(1)

  if (rfpError) {
    console.log('   ❌ Tabla rfp_analyses:', rfpError.message)
  } else {
    console.log('   ✅ Tabla rfp_analyses existe')
  }

  const { data: rfpSections, error: sectionsError } = await supabase
    .from('rfp_sections')
    .select('count')
    .limit(1)

  if (sectionsError) {
    console.log('   ❌ Tabla rfp_sections:', sectionsError.message)
  } else {
    console.log('   ✅ Tabla rfp_sections existe')
  }

  // Verificar bucket
  const { data: buckets, error: bucketsError } = await supabase
    .storage
    .listBuckets()

  if (bucketsError) {
    console.log('   ❌ Error listando buckets:', bucketsError.message)
  } else {
    const rfpBucket = buckets.find(b => b.name === 'rfp-documents')
    if (rfpBucket) {
      console.log('   ✅ Bucket rfp-documents existe')
    } else {
      console.log('   ❌ Bucket rfp-documents NO existe')
      console.log('   📋 Buckets disponibles:', buckets.map(b => b.name).join(', '))
    }
  }
} catch (error) {
  console.log('   ❌ Error en Supabase:', error.message)
}
console.log()

// 3. Verificar AWS Bedrock
console.log('3️⃣ AWS Bedrock:')
try {
  const bedrock = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || 'eu-west-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  })

  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 100,
    messages: [
      {
        role: 'user',
        content: 'Responde solo con la palabra "OK"'
      }
    ]
  }

  const command = new InvokeModelCommand({
    modelId: 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-sonnet-5',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload)
  })

  console.log('   ⏳ Probando conexión con Bedrock...')
  const response = await bedrock.send(command)
  const responseBody = JSON.parse(new TextDecoder().decode(response.body))

  console.log('   ✅ Bedrock funciona correctamente')
  console.log('   📋 Respuesta:', responseBody.content[0].text)
} catch (error) {
  console.log('   ❌ Error en Bedrock:', error.message)
  if (error.name === 'ResourceNotFoundException') {
    console.log('   📋 El modelo no está disponible en', process.env.AWS_REGION)
    console.log('   💡 Prueba cambiar AWS_REGION a us-east-1')
  }
}
console.log()

console.log('✅ Diagnóstico completado')
