import dotenv from 'dotenv';
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';

dotenv.config();

const client = new BedrockRuntimeClient({
  region: 'eu-south-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testBedrock() {
  try {
    console.log('🔄 Conectando a Amazon Bedrock...');
    console.log('📌 Inference Profile: EU Anthropic Claude Haiku 4.5');
    console.log('📌 Model ID: eu.anthropic.claude-haiku-4-5-20251001-v1:0');
    console.log('🌍 Región: eu-south-2');
    console.log('🔌 API: bedrock:Converse\n');

    const startTime = Date.now();

    const command = new ConverseCommand({
      modelId: 'eu.anthropic.claude-haiku-4-5-20251001-v1:0',
      messages: [
        {
          role: 'user',
          content: [
            {
              text: 'Di hola en español en una frase',
            },
          ],
        },
      ],
      inferenceConfig: {
        maxTokens: 100,
      },
    });

    const response = await client.send(command);
    const duration = Date.now() - startTime;

    console.log('✅ ¡¡¡CONEXIÓN EXITOSA CON BEDROCK!!!\n');
    console.log('📝 Respuesta del modelo:');
    console.log(response.output.message.content[0].text);

    // Token consumption tracking
    console.log('\n📊 Token Usage & Performance Metrics:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const usage = response.usage;
    if (usage) {
      console.log(`📥 Input Tokens:  ${usage.inputTokens}`);
      console.log(`📤 Output Tokens: ${usage.outputTokens}`);
      console.log(`📊 Total Tokens:  ${usage.inputTokens + usage.outputTokens}`);
    }

    console.log(`⏱️  Duration:      ${duration}ms`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n✨ AWS Bedrock Usage Certification:');
    console.log('✓ API Calls: bedrock:Converse');
    console.log('✓ Provider: Amazon Web Services (AWS)');
    console.log('✓ Tokens: Billed to AWS Account');
    console.log('✓ Region: eu-south-2 (Milan)');
    console.log('✓ Model: Claude Haiku 4.5');
    console.log('✓ Authentication: AWS IAM Credentials');

    console.log('\n🎉 ¡El script está funcionando correctamente!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testBedrock();
